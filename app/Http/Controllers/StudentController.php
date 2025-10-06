<?php

namespace App\Http\Controllers;

use App\Enums\Religion;
use App\Enums\Sex;
use App\Enums\StudentStatus;
use App\Imports\StudentsImport;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{
    private function handleProfilePicture(Request $request, ?Student $student = null)
    {
        $filename = null;
        $directory = 'uploads/profile_pictures';

        // Jika ada permintaan hapus gambar
        if ($request->input('remove_profile_picture')) {
            if ($student && $student->profile_picture && Storage::disk('public')->exists($student->profile_picture)) {
                Storage::disk('public')->delete($student->profile_picture);
            }
            return null;
        }

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = time() . '-' . uniqid() . '.jpg';
            $path = $directory . '/' . $filename;

            // crop square, 300 x 300
            $image = imagecreatefromstring(file_get_contents($file->path()));
            $width = imagesx($image);
            $height = imagesy($image);
            $size = min($width, $height);

            $cropped = imagecreatetruecolor(300, 300);

            // Fill background with white color for transparent images
            $white = imagecolorallocate($cropped, 255, 255, 255);
            imagefill($cropped, 0, 0, $white);

            imagecopyresampled(
                $cropped,
                $image,
                0,
                0,
                ($width - $size) / 2,
                ($height - $size) / 2,
                300,
                300,
                $size,
                $size
            );

            // Simpan hasil crop
            ob_start();
            imagejpeg($cropped, null, 80);
            $imageData = ob_get_clean();
            Storage::disk('public')->put($path, $imageData);

            // Hapus resource
            imagedestroy($image);
            imagedestroy($cropped);

            // Hapus file lama jika ada
            if ($student && $student->profile_picture && Storage::disk('public')->exists($student->profile_picture)) {
                Storage::disk('public')->delete($student->profile_picture);
            }

            return $path;
        }

        // Jika tidak ada file baru, kembalikan path lama (jika update dan tidak hapus)
        return $student->profile_picture ?? null;
    }

    public function index(Request $request): Response
    {
        // Get enum
        $sexes = collect(Sex::cases())->map(fn($sex) => [
            'value' => $sex->value,
            'label' => $sex->label(),
        ]);
        $statuses = collect(StudentStatus::cases())->map(fn($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);
        $religions = collect(Religion::cases())->map(fn($religion) => [
            'value' => $religion->value,
            'label' => $religion->label(),
        ]);

        $query = Student::with(['classroom', 'parent'])
            ->leftJoin('classrooms', 'students.class_id', '=', 'classrooms.id')
            ->select('students.*');

        if ($request->has('classrooms') && !empty($request->classrooms)) {
            $query->whereIn('students.class_id', $request->classrooms);
        }

        if ($request->search) {
            $query->where('students.full_name', 'like', "%{$request->search}%");
        }

        // Filter by status
        if ($request->has('status') && $request->status !== null && $request->status !== '') {
            $query->where('students.status', $request->status);
        }

        if ($request->sort) {
            $direction = $request->direction === 'asc' ? 'asc' : 'desc';

            switch ($request->sort) {
                case 'class_name':
                    $query->orderBy('classrooms.name', $direction);
                    break;
                case 'class_level':
                    $query->orderBy('classrooms.level', $direction);
                    break;
                default:
                    // Untuk sorting kolom lain di tabel students
                    $query->orderBy('students.' . $request->sort, $direction);
            }
        } else {
            $query->orderBy('classrooms.name', 'asc')
                ->orderBy('students.full_name', 'asc');
        }

        // Show data (pagination size)
        $perPage = 10;
        if ($request->has('show') && in_array($request->show, ['5', '10', '20', 'all'])) {
            $perPage = $request->show === 'all' ? $query->count() : (int)$request->show;
        }

        $students = $query->paginate($perPage)->withQueryString();

        return Inertia::render('students/index', [
            'students' => $students,
            'classrooms' => Classroom::orderBy('level', 'asc')->get(),
            'sexes' => $sexes,
            'statuses' => $statuses,
            'religions' => $religions,
            'filters' => $request->only(['search', 'sort', 'direction', 'classrooms', 'status', 'show']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'class_id' => 'nullable|exists:classrooms,id',
                'full_name' => 'required|string|max:70',
                'nis' => 'nullable|numeric|digits_between:4,20|unique:students,nis',
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:70',
                'birth_place' => 'required|string|max:70',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'remove_profile_picture' => 'nullable|boolean',
            ], [
                'full_name.max' => 'Nama lengkap tidak boleh lebih dari 70 karakter',
                'nis.digits_between' => 'NIS harus terdiri dari 4 hingga 20 digit',
                'nis.unique' => 'NIS sudah digunakan',
                'entry_year.min' => 'Tahun masuk tidak boleh kurang dari 1900',
                'entry_year.max' => 'Tahun masuk tidak boleh lebih dari ' . (date('Y') + 1),
                'gender.in' => 'Jenis kelamin tidak valid',
                'status.in' => 'Status tidak valid',
                'religion.max' => 'Agama tidak boleh lebih dari 70 karakter',
                'birth_place.max' => 'Tempat lahir tidak boleh lebih dari 70 karakter',
                'date_of_birth.date' => 'Tanggal lahir tidak valid',
                'address.required' => 'Alamat harus diisi',
                'profile_picture.image' => 'Foto profil harus berupa gambar',
                'profile_picture.mimes' => 'Foto profil harus berformat jpeg, png, atau jpg',
                'profile_picture.max' => 'Foto profil tidak boleh lebih dari 2MB',
            ]);

            // Handle profile picture
            $profilePicturePath = $this->handleProfilePicture($request);

            // Default status active jika tidak diset
            $validated['status'] = $validated['status'] ?? StudentStatus::Active->value;
            $validated['profile_picture'] = $profilePicturePath;

            Student::create($validated);

            return redirect()->back()
                ->with('success', 'Siswa baru berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan siswa: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, Student $student)
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'class_id' => 'nullable|exists:classrooms,id',
                'full_name' => 'required|string|max:70',
                'nis' => 'nullable|numeric|digits_between:4,20|unique:students,nis,' . $student->id,
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:70',
                'birth_place' => 'required|string|max:70',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'remove_profile_picture' => 'nullable|boolean',
            ], [
                'full_name.max' => 'Nama lengkap tidak boleh lebih dari 70 karakter',
                'nis.digits_between' => 'NIS harus terdiri dari 4 hingga 20 digit',
                'nis.unique' => 'NIS sudah digunakan',
                'entry_year.min' => 'Tahun masuk tidak boleh kurang dari 1900',
                'entry_year.max' => 'Tahun masuk tidak boleh lebih dari ' . (date('Y') + 1),
                'gender.in' => 'Jenis kelamin tidak valid',
                'status.in' => 'Status tidak valid',
                'religion.max' => 'Agama tidak boleh lebih dari 70 karakter',
                'birth_place.max' => 'Tempat lahir tidak boleh lebih dari 70 karakter',
                'date_of_birth.date' => 'Tanggal lahir tidak valid',
                'address.required' => 'Alamat harus diisi',
                'profile_picture.image' => 'Foto profil harus berupa gambar',
                'profile_picture.mimes' => 'Foto profil harus berformat jpeg, png, atau jpg',
                'profile_picture.max' => 'Foto profil tidak boleh lebih dari 2MB',
            ]);

            // Handle profile picture
            $profilePicturePath = $this->handleProfilePicture($request, $student);
            if ($profilePicturePath !== null) {
                $validated['profile_picture'] = $profilePicturePath;
            }

            $student->update($validated);

            return redirect()->back()
                ->with('success', 'Siswa berhasil diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui siswa: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $student = Student::findOrFail($id);
            $student->delete();

            return redirect()->back()
                ->with('success', 'Siswa berhasil dihapus');
        } catch (\Exception $e) {
            $errorMessage = 'Gagal menghapus siswa';

            // Check if it's a foreign key constraint violation
            if (
                str_contains($e->getMessage(), 'Integrity constraint violation') &&
                str_contains($e->getMessage(), 'foreign key constraint')
            ) {

                $errorMessage = 'Siswa tidak dapat dihapus karena masih dipakai di data lain';
            } else if (!app()->environment('production')) {
                $errorMessage .= ': ' . $e->getMessage();
            }

            return redirect()->back()
                ->with('error', $errorMessage);
        }
    }

    /**
     * Get students by classroom ID
     */
    public function getStudentsByClass(Classroom $classroom)
    {
        $students = Student::where('class_id', $classroom->id)
            ->where('status', 'active') // Hanya siswa aktif
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'nis', 'class_id']);

        return response()->json($students);
    }

    /**
     * Get students by multiple IDs
     */
    public function getStudentsByIds(Request $request)
    {
        $request->validate([
            'ids' => 'required|string'
        ]);

        $ids = explode(',', $request->ids);

        $students = Student::whereIn('id', $ids)
            ->with(['classroom:id,name'])
            ->get(['id', 'full_name', 'nis', 'class_id']);

        return response()->json($students);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048'
        ]);

        try {
            Excel::import(new StudentsImport, $request->file('file'));
            return redirect()->back()->with('success', 'Data siswa berhasil diimpor');
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage() === 'data kelas tidak ditemukan'
                ? 'Gagal impor siswa: data kelas tidak ditemukan'
                : 'Gagal impor siswa: ' . $e->getMessage();
            return redirect()->back()->with('error', $errorMsg);
        }
    }

    public function downloadTemplate()
    {
        $filename = "template-import-siswa.xlsx";
        $path = storage_path("app/templates/{$filename}");

        if (!file_exists($path)) {
            return response()->json(['message' => 'Template tidak ditemukan'], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
