// resources/js/Pages/Tasks/TaskEdit.tsx
import StudentAssignmentModal from '@/components/student-assignment-modal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Subject {
    id: number;
    name: string;
    curriculum_year: string;
}

interface AcademicYear {
    id: number;
    title: string;
    start_year: number;
    status: 'active' | 'inactive';
}

interface Classroom {
    id: number;
    name: string;
    level: string;
}

interface AssignedStudent {
    student_id: number;
    student_name: string;
    class_name: string;
    class_id: number;
    score?: number | null;
    is_scored?: boolean;
}

interface TaskData {
    id: number;
    academic_year_id: number;
    subject_id: number;
    title: string;
    description: string;
    due_date: string;
    due_time: string;
    student_assignments: AssignedStudent[];
    academic_year?: AcademicYear;
}

interface Props {
    task: TaskData;
    subjects: Subject[];
    academicYears: AcademicYear[];
    classrooms: Classroom[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tugas', href: '/tasks' },
    { title: 'Edit Tugas', href: '' },
];

export default function TaskEdit({ task, subjects, academicYears, classrooms }: Props) {
    const { data, setData, put, processing } = useForm({
        subject_id: task.subject_id,
        title: task.title, // ✅ konsisten pakai title
        description: task.description || '',
        due_date: task.due_date,
        due_time: task.due_time,
        student_assignments: (task.student_assignments || []).map((s) => ({
            student_id: s.student_id,
            student_name: s.student_name,
            class_name: s.class_name,
            class_id: s.class_id,
            score: s.score,
            is_scored: s.is_scored,
        })),
    });

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [titleLength, setTitleLength] = useState(task.title.length);
    const [descLength, setDescLength] = useState((task.description || '').length);

    const { errors, flash } = usePage<{
        errors?: Record<string, string>;
        flash?: { success?: string; error?: string };
    }>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);

        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((message) => {
                toast.error(message);
            });
        }
    }, [flash, errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!Array.isArray(data.student_assignments) || data.student_assignments.length === 0) {
            toast.error('Minimal harus memilih 1 siswa untuk tugas ini');
            return;
        }

        const loadingToast = toast.loading('Memperbarui tugas...');

        put(`/tasks/${task.id}`, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);

                if (errors.student_assignments) {
                    toast.error('Terjadi kesalahan pada data siswa yang dipilih');
                } else if (errors.title) {
                    toast.error('Nama tugas tidak valid');
                } else if (errors.subject_id) {
                    toast.error('Mata pelajaran harus dipilih');
                } else {
                    toast.error('Terjadi kesalahan validasi data');
                }
            },
            onFinish: () => {
                toast.dismiss(loadingToast);
            },
        });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= 70) {
            setData('title', value);
            setTitleLength(value.length);
        }
    };

    const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= 70) {
            setData('description', value);
            setDescLength(value.length);
        }
    };

    const handleAddStudents = (students: AssignedStudent[]) => {
        const currentStudentIds = data.student_assignments.map((s) => s.student_id);
        const newStudents = students.filter((s) => !currentStudentIds.includes(s.student_id));

        setData('student_assignments', [
            ...data.student_assignments,
            ...newStudents.map((s) => ({
                student_id: s.student_id,
                student_name: s.student_name,
                class_name: s.class_name,
                class_id: s.class_id,
                score: s.score ?? null,
                is_scored: s.is_scored ?? false,
            })),
        ]);
        setShowStudentModal(false);
        toast.success(`${newStudents.length} siswa berhasil ditambahkan`);
    };

    const handleRemoveStudent = (studentId: number, isScored: boolean = false) => {
        if (isScored) {
            const confirmed = window.confirm(
                'Siswa ini sudah memiliki nilai. Menghapus siswa akan menghilangkan data nilai tersebut. Apakah Anda yakin ingin melanjutkan?',
            );
            if (!confirmed) return;
        }
        setData(
            'student_assignments',
            data.student_assignments.filter((s) => s.student_id !== studentId),
        );
        toast.success('Siswa berhasil dihapus dari Tugas');
    };

    const academicYear = academicYears.find((year) => year.id === task.academic_year_id) || task.academic_year;

    const scoredStudents = data.student_assignments.filter((s) => s.is_scored).length;
    const totalStudents = data.student_assignments.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tugas - ${task.title}`} />
            <Toaster position="top-right" richColors />

            <div className="rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">Edit Exam: {task.title}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tahun Ajaran */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                        <input
                            type="text"
                            value={academicYear?.title || 'Loading...'}
                            disabled
                            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
                            readOnly
                        />
                        <p className="mt-1 text-xs text-amber-600">Tahun ajaran tidak dapat diubah setelah exam dibuat</p>
                    </div>

                    {/* Mata Pelajaran */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                        <select
                            value={data.subject_id}
                            onChange={(e) => setData('subject_id', parseInt(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        >
                            <option value="">Pilih mata pelajaran</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                        {errors.subject_id && <p className="mt-1 text-xs text-red-500">{errors.subject_id}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Nama *</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={handleTitleChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Masukkan nama exam"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char ({titleLength}/70)</p>
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Deskripsi</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={handleDescChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Deskripsi tugas..."
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char (optional) ({descLength}/70)</p>
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Batas Pengumpulan *</label>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                        {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date}</p>}
                    </div>

                    {/* Due Time */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Batas Pengumpulan (Jam)*</label>
                        <input
                            type="time"
                            value={data.due_time}
                            onChange={(e) => setData('due_time', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                        {errors.due_time && <p className="mt-1 text-xs text-red-500">{errors.due_time}</p>}
                    </div>

                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {scoredStudents} dari {totalStudents} siswa sudah dinilai
                                </p>
                            </div>
                            <p className="max-w-md text-right text-sm text-red-600">
                                ⚠️ Warning: Menghapus siswa yang sudah dinilai akan menghilangkan data skor mereka!
                            </p>
                        </div>

                        {data.student_assignments.length > 0 ? (
                            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">NIS</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Kelas</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status Nilai</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.student_assignments.map((student) => (
                                            <tr key={student.student_id} className="border-t">
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {student.student_name}
                                                        {student.is_scored && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                                Sudah Dinilai
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{student.nis || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{student.class_name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {student.is_scored ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                                Sudah Dinilai
                                                            </span>
                                                            <span className="mt-1 text-xs text-gray-600">Nilai: {student.score}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                                            Belum Dinilai
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveStudent(student.student_id, student.is_scored)}
                                                        className={`flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 hover:opacity-90`}
                                                        title={
                                                            student.is_scored ? 'Hati-hati: Siswa ini sudah memiliki nilai!' : 'Hapus siswa dari exam'
                                                        }
                                                    >
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                <p className="text-gray-500">Belum ada siswa yang di-assign ke exam ini</p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowStudentModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Tambah Siswa
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 border-t pt-6">
                        <button
                            type="button"
                            onClick={() => router.get('/tasks')}
                            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Memperbarui...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>

            <StudentAssignmentModal
                isOpen={showStudentModal}
                onClose={() => setShowStudentModal(false)}
                onSubmit={handleAddStudents}
                classrooms={classrooms}
                assignedStudentIds={data.student_assignments.map((s) => s.student_id)}
            />
        </AppLayout>
    );
}
