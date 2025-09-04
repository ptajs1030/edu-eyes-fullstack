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
        $academic_year = $request->input('academic_year');

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
            ->when($academic_year, function ($query) use ($academic_year) {
                $query->where('academic_year_id', $academic_year);
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

        $academicYears = AcademicYear::orderBy('start_year')->get();

        return Inertia::render('exams/index', [
            'exams' => $exams,
            'academicYears' => $academicYears,
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

    public function edit($id): Response
    {
        try {
            $exam = Exam::with(['subject', 'academicYear', 'assignments.student', 'assignments.class'])
                ->findOrFail($id);

            // Transform assignments to match frontend structure
            $studentAssignments = $exam->assignments->map(function ($assignment) {
                return [
                    'student_id' => $assignment->student_id,
                    'student_name' => $assignment->student->full_name,
                    'nis' => $assignment->student->nis,
                    'class_name' => $assignment->class_name,
                    'class_id' => $assignment->class_id,
                    'score' => $assignment->score,
                    'is_scored' => $assignment->score !== null
                ];
            });

            $subjects = Subject::all();
            $classrooms = Classroom::orderBy('name')->get();
            $academicYears = AcademicYear::all();

            return Inertia::render('exams/edit', [
                'exam' => [
                    'id' => $exam->id,
                    'academic_year_id' => $exam->academic_year_id,
                    'subject_id' => $exam->subject_id,
                    'name' => $exam->name,
                    'type' => $exam->type,
                    'date' => $exam->date->format('Y-m-d'),
                    'student_assignments' => $studentAssignments,
                    'academic_year' => $exam->academicYear, // Include academic year data
                ],
                'subjects' => $subjects,
                'academicYears' => $academicYears,
                'classrooms' => $classrooms,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading exam for edit', [
                'exam_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('exams.index')
                ->with('error', 'Exam tidak ditemukan atau terjadi kesalahan.');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Remove academic_year_id from validation since it's not updatable
            $validated = $request->validate([
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

            $exam = Exam::findOrFail($id);

            // Check for duplicate exam name (exclude current exam and use the existing academic_year_id)
            $existingExam = Exam::where('name', $validated['name'])
                ->where('subject_id', $validated['subject_id'])
                ->where('academic_year_id', $exam->academic_year_id) // Use existing academic_year_id
                ->where('id', '!=', $id)
                ->first();

            if ($existingExam) {
                throw new \Exception('Exam dengan nama "' . $validated['name'] . '" sudah ada untuk mata pelajaran dan tahun ajaran yang sama.');
            }

            // Update exam (without academic_year_id)
            $exam->update([
                'subject_id' => $validated['subject_id'],
                'name' => $validated['name'],
                'type' => $validated['type'],
                'date' => $validated['date'],
                // academic_year_id is NOT updated
            ]);

            // Get current assignments to preserve scores
            $currentAssignments = $exam->assignments()->get()->keyBy('student_id');

            // Delete all existing assignments
            $exam->assignments()->delete();

            // Check for duplicate student assignments
            $studentIds = collect($validated['student_assignments'])->pluck('student_id')->toArray();
            $duplicateStudentIds = array_diff_assoc($studentIds, array_unique($studentIds));

            if (!empty($duplicateStudentIds)) {
                throw new \Exception('Terdapat siswa yang dipilih lebih dari sekali dalam exam ini.');
            }

            // Create new assignments (preserve existing scores if student was already assigned)
            $assignmentData = [];
            foreach ($validated['student_assignments'] as $assignment) {
                $existingAssignment = $currentAssignments->get($assignment['student_id']);

                $assignmentData[] = [
                    'exam_id' => $exam->id,
                    'student_id' => $assignment['student_id'],
                    'class_id' => $assignment['class_id'],
                    'class_name' => $assignment['class_name'],
                    'score' => $existingAssignment ? $existingAssignment->score : null, // Preserve existing score
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Bulk insert new assignments
            ExamAssignment::insert($assignmentData);

            DB::commit();

            return redirect()->route('exams.index')
                ->with('success', 'Exam berhasil diperbarui dengan ' . count($validated['student_assignments']) . ' siswa');
        } catch (ValidationException $e) {
            DB::rollback();

            Log::warning('Validation failed when updating exam', [
                'exam_id' => $id,
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

            Log::error('Database error when updating exam', [
                'exam_id' => $id,
                'error_code' => $e->getCode(),
                'error_message' => $e->getMessage(),
                'request_data' => $request->except(['_token']),
                'user_id' => auth()->id() ?? 'Guest',
            ]);

            return redirect()->back()
                ->with('error', 'Terjadi kesalahan database. Silakan coba lagi atau hubungi administrator.')
                ->withInput();
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Unexpected error when updating exam', [
                'exam_id' => $id,
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

            return redirect()->back()
                ->with('error', 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.')
                ->withInput();
        }
    }


    public function scoring($id): Response
    {
        try {
            $exam = Exam::with(['subject', 'academicYear', 'assignments.student', 'assignments.class'])
                ->findOrFail($id);

            // Transform assignments for frontend
            $studentAssignments = $exam->assignments->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'student_id' => $assignment->student_id,
                    'student_name' => $assignment->student->full_name,
                    'nis' => $assignment->student->nis,
                    'class_name' => $assignment->class_name,
                    'class_id' => $assignment->class_id,
                    'score' => $assignment->score,
                ];
            });

            return Inertia::render('exams/scoring', [
                'exam' => [
                    'id' => $exam->id,
                    'academic_year_id' => $exam->academic_year_id,
                    'subject_id' => $exam->subject_id,
                    'name' => $exam->name,
                    'type' => $exam->type,
                    'date' => $exam->date->format('Y-m-d'),
                    'academic_year' => $exam->academicYear,
                    'subject' => $exam->subject,
                    'student_assignments' => $studentAssignments,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading exam for scoring', [
                'exam_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('exams.index')
                ->with('error', 'Exam tidak ditemukan atau terjadi kesalahan.');
        }
    }

    public function updateScore(Request $request, $examId, $assignmentId)
    {
        try {
            $validated = $request->validate([
                'score' => 'required|numeric|min:0|max:100',
            ], [
                'score.required' => 'Nilai harus diisi',
                'score.numeric' => 'Nilai harus berupa angka',
                'score.min' => 'Nilai minimal adalah 0',
                'score.max' => 'Nilai maksimal adalah 100',
            ]);

            $assignment = ExamAssignment::where('id', $assignmentId)
                ->where('exam_id', $examId)
                ->firstOrFail();

            $assignment->update(['score' => $validated['score']]);

            // Untuk Inertia, return redirect dengan flash message
            return redirect()->back()->with('success', 'Nilai berhasil disimpan');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Data tidak valid');
        } catch (\Exception $e) {
            Log::error('Error updating exam score', [
                'exam_id' => $examId,
                'assignment_id' => $assignmentId,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan nilai');
        }
    }

    public function updateBulkScores(Request $request, $examId)
    {
        try {
            $validated = $request->validate([
                'scores' => 'required|array|min:1',
                'scores.*.assignment_id' => 'required|exists:exam_assignments,id',
                'scores.*.score' => 'required|numeric|min:0|max:100',
            ], [
                'scores.required' => 'Data nilai harus ada',
                'scores.array' => 'Format data nilai tidak valid',
                'scores.min' => 'Minimal harus ada 1 nilai',
                'scores.*.assignment_id.required' => 'ID assignment harus ada',
                'scores.*.assignment_id.exists' => 'Assignment tidak ditemukan',
                'scores.*.score.required' => 'Nilai harus diisi',
                'scores.*.score.numeric' => 'Nilai harus berupa angka',
                'scores.*.score.min' => 'Nilai minimal adalah 0',
                'scores.*.score.max' => 'Nilai maksimal adalah 100',
            ]);

            DB::beginTransaction();

            $exam = Exam::findOrFail($examId);
            $updatedCount = 0;

            foreach ($validated['scores'] as $scoreData) {
                $assignment = ExamAssignment::where('id', $scoreData['assignment_id'])
                    ->where('exam_id', $examId)
                    ->first();

                if ($assignment) {
                    $assignment->update(['score' => $scoreData['score']]);
                    $updatedCount++;
                }
            }

            DB::commit();

            // Untuk Inertia, return redirect dengan flash message
            return redirect()->back()->with('success', "Berhasil menyimpan {$updatedCount} nilai");
        } catch (ValidationException $e) {
            DB::rollback();

            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Data tidak valid');
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error updating bulk exam scores', [
                'exam_id' => $examId,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan nilai');
        }
    }
}
