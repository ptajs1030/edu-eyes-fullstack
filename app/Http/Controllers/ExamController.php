<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ExamAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');

        $exams = Exam::with(['subject', 'academicYear', 'assignments.student', 'assignments.class'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhereHas('subject', function ($subQuery) use ($search) {
                            $subQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($sort, function ($query) use ($sort, $direction) {
                if ($sort === 'subject_name') {
                    $query->join('subjects', 'exams.subject_id', '=', 'subjects.id')
                            ->orderBy('subjects.name', $direction)
                            ->select('exams.*');
                } elseif ($sort === 'academic_year') {
                    $query->join('academic_years', 'exams.academic_year_id', '=', 'academic_years.id')
                            ->orderBy('academic_years.title', $direction)
                            ->select('exams.*');
                } elseif ($sort === 'student_count') {
                    // Sort by student count using subquery
                    $query->withCount('assignments as student_count')
                        ->orderBy('student_count', $direction);
                } else {
                    $query->orderBy($sort, $direction);
                }
            })
            ->paginate(10)
            ->withQueryString();

        // Add student count to each exam
        $exams->getCollection()->transform(function ($exam) {
             // Only add student_count if it wasn't added by withCount
            if (!isset($exam->student_count)) {
                $exam->student_count = $exam->assignments->count();
            }
            return $exam;
        });

        return Inertia::render('exams/index', [
            'exams' => $exams,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function destroy($id)
    {
        try {
            $exam = Exam::findOrFail($id);
            
            // Delete related exam assignments first
            $exam->assignments()->delete();
            
            // Delete the exam
            $exam->delete();

            return redirect()->back()
                ->with('success', 'Exam berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menghapus exam: ' . $e->getMessage());
        }
    }

    public function create(): Response
    {
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
        $subjects = Subject::all();
        $classrooms = Classroom::orderBy('name')->get();

        return Inertia::render('exams/create', [
            'subjects' => $subjects,
            'academicYears' => [$activeAcademicYear], // Hanya active year
            'classrooms' => $classrooms,
        ]);
    }

    public function store(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'academic_year_id' => 'required|exists:academic_years,id',
                'subject_id' => 'required|exists:subjects,id',
                'name' => 'required|string|max:70',
                'type' => 'nullable|string|max:70',
                'date' => 'required|date',
                'student_assignments' => 'required|array|min:1',
                'student_assignments.*.student_id' => 'required|exists:students,id',
                'student_assignments.*.student_name' => 'required|string',
                'student_assignments.*.class_name' => 'required|string',
                'student_assignments.*.class_id' => 'required|exists:classrooms,id',
            ], [
                'academic_year_id.required' => 'Tahun ajaran harus dipilih',
                'academic_year_id.exists' => 'Tahun ajaran tidak valid',
                'subject_id.required' => 'Mata pelajaran harus dipilih',
                'subject_id.exists' => 'Mata pelajaran tidak valid',
                'name.required' => 'Nama exam harus diisi',
                'name.max' => 'Nama exam maksimal 70 karakter',
                'type.max' => 'Tipe exam maksimal 70 karakter',
                'date.required' => 'Tanggal harus dipilih',
                'date.date' => 'Format tanggal tidak valid',
                'student_assignments.required' => 'Minimal harus memilih 1 siswa',
                'student_assignments.min' => 'Minimal harus memilih 1 siswa',
                'student_assignments.*.student_id.required' => 'ID siswa harus ada',
                'student_assignments.*.student_id.exists' => 'Siswa tidak ditemukan',
            ]);

            DB::beginTransaction();

            // Check for duplicate exam name for same subject and academic year
            $existingExam = Exam::where('name', $validated['name'])
                ->where('subject_id', $validated['subject_id'])
                ->where('academic_year_id', $validated['academic_year_id'])
                ->first();

            if ($existingExam) {
                throw new \Exception('Exam dengan nama "' . $validated['name'] . '" sudah ada untuk mata pelajaran dan tahun ajaran yang sama.');
            }

            // Create exam
            $exam = Exam::create([
                'academic_year_id' => $validated['academic_year_id'],
                'subject_id' => $validated['subject_id'],
                'name' => $validated['name'],
                'type' => $validated['type'],
                'date' => $validated['date'],
            ]);

            // Check for duplicate student assignments
            $studentIds = collect($validated['student_assignments'])->pluck('student_id')->toArray();
            $duplicateStudentIds = array_diff_assoc($studentIds, array_unique($studentIds));
            
            if (!empty($duplicateStudentIds)) {
                throw new \Exception('Terdapat siswa yang dipilih lebih dari sekali dalam exam ini.');
            }

            // Create exam assignments
            $assignmentData = [];
            foreach ($validated['student_assignments'] as $assignment) {
                $assignmentData[] = [
                    'exam_id' => $exam->id,
                    'student_id' => $assignment['student_id'],
                    'class_id' => $assignment['class_id'],
                    'class_name' => $assignment['class_name'],
                    'score' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Bulk insert for better performance
            ExamAssignment::insert($assignmentData);

            DB::commit();

            return redirect()->route('exams.index')
                ->with('success', 'Exam berhasil dibuat dengan ' . count($validated['student_assignments']) . ' siswa');

        } catch (ValidationException $e) {
            DB::rollback();
            
            Log::warning('Validation failed when creating exam', [
                'errors' => $e->errors(),
                'request_data' => $request->except(['_token']),
                'user_id' => auth()->id() ?? 'Guest',
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Data yang dimasukkan tidak valid. Silakan periksa kembali.');

        } catch (QueryException $e) {
            DB::rollback();
            
            Log::error('Database error when creating exam', [
                'error_code' => $e->getCode(),
                'error_message' => $e->getMessage(),
                'request_data' => $request->except(['_token']),
                'user_id' => auth()->id() ?? 'Guest',
            ]);

            // Handle specific database errors
            if ($e->getCode() === '23000') { // Integrity constraint violation
                if (str_contains($e->getMessage(), 'exam_assignments_exam_id_student_id_unique')) {
                    return redirect()->back()
                        ->with('error', 'Terdapat siswa yang sudah terdaftar dalam exam ini.')
                        ->withInput();
                }
                
                return redirect()->back()
                    ->with('error', 'Terjadi kesalahan database. Silakan coba lagi atau hubungi administrator.')
                    ->withInput();
            }

            return redirect()->back()
                ->with('error', 'Terjadi kesalahan database. Silakan coba lagi atau hubungi administrator.')
                ->withInput();

        } catch (\InvalidArgumentException $e) {
            DB::rollback();
            
            Log::warning('Invalid argument when creating exam', [
                'error_message' => $e->getMessage(),
                'request_data' => $request->except(['_token']),
                'user_id' => auth()->id() ?? 'Guest',
            ]);

            return redirect()->back()
                ->with('error', 'Data yang diberikan tidak valid: ' . $e->getMessage())
                ->withInput();

        } catch (\OutOfMemoryException $e) {
            DB::rollback();
            
            Log::critical('Memory limit exceeded when creating exam', [
                'error_message' => $e->getMessage(),
                'request_data_size' => strlen(json_encode($request->all())),
                'user_id' => auth()->id() ?? 'Guest',
            ]);

            return redirect()->back()
                ->with('error', 'Data terlalu besar untuk diproses. Silakan kurangi jumlah siswa atau coba lagi nanti.')
                ->withInput();

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Unexpected error when creating exam', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['_token']),
                'user_id' => auth()->id() ?? 'Guest',
                'timestamp' => now()->toISOString(),
            ]);

            // Check if error message is user-friendly
            $userFriendlyMessages = [
                'sudah ada untuk mata pelajaran',
                'dipilih lebih dari sekali',
                'tidak ditemukan',
                'tidak valid',
            ];

            $isUserFriendly = false;
            foreach ($userFriendlyMessages as $pattern) {
                if (str_contains($e->getMessage(), $pattern)) {
                    $isUserFriendly = true;
                    break;
                }
            }

            if ($isUserFriendly) {
                return redirect()->back()
                    ->with('error', $e->getMessage())
                    ->withInput();
            }

            // Generic error message for unexpected errors
            return redirect()->back()
                ->with('error', 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.')
                ->withInput();
        }
    }
}
