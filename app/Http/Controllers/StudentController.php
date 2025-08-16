<?php

namespace App\Http\Controllers;

use App\Enums\Religion;
use App\Enums\Sex;
use App\Enums\StudentStatus;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

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

        $students = Student::with(['classroom', 'parent'])
            ->when($request->search, fn($q) => $q->where('full_name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('students/index', [
            'students' => $students,
            'classrooms' => Classroom::orderBy('level', 'asc')->get(),
            'sexes' => $sexes,
            'statuses' => $statuses,
            'religions' => $religions,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'class_id' => 'nullable|exists:classrooms,id',
                'full_name' => 'required|string|max:70',
                'nis' => 'nullable|string|unique:students,nis',
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:70',
                'birth_place' => 'required|string|max:70',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'remove_profile_picture' => 'nullable|boolean',
            ]);

            // Handle profile picture
            $profilePicturePath = $this->handleProfilePicture($request);

            // Default status active jika tidak diset
            $validated['status'] = $validated['status'] ?? StudentStatus::Active->value;
            $validated['profile_picture'] = $profilePicturePath;

            Student::create($validated);

            return redirect()->back()
                ->with('success', 'New student successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create student: ' . $e->getMessage())
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
                'nis' => 'nullable|string|unique:students,nis,' . $student->id,
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:70',
                'birth_place' => 'required|string|max:70',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
                'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'remove_profile_picture' => 'nullable|boolean',
            ]);

            // Handle profile picture
            $profilePicturePath = $this->handleProfilePicture($request, $student);
            if ($profilePicturePath !== null) {
                $validated['profile_picture'] = $profilePicturePath;
            }

            $student->update($validated);

            return redirect()->back()
                ->with('success', 'Student updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update student: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $student = Student::findOrFail($id);
            $student->delete();

            return redirect()->back()
                ->with('success', 'Student deleted successfully');
        } catch (\Exception $e) {
            // if it's production environment, don't show detailed error
            return redirect()->back()
                ->with('error', app()->environment('production') ? 'Failed to delete student' : 'Failed to delete student: ' . $e->getMessage());
        }
    }
}
