import StudentAssignmentModal from '@/components/student-assignment-modal';
import AppLayout from '@/layouts/app-layout';
import { getActiveAcademicYear, isAcademicYearPassed } from '@/lib/academic-year-utils';
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
    nis: string;
    class_name: string;
    class_id: number;
    score?: number | null; // Add score field
    is_scored?: boolean; // Add scoring status
}

interface ExamData {
    id: number;
    academic_year_id: number;
    subject_id: number;
    name: string;
    type: string;
    date: string;
    student_assignments: AssignedStudent[];
    academic_year?: AcademicYear; // Add academic year data
}

interface Props {
    exam: ExamData;
    subjects: Subject[];
    academicYears: AcademicYear[];
    classrooms: Classroom[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ujian', href: '/exams' },
    { title: 'Edit Ujian', href: '' },
];

export default function ExamEdit({ exam, subjects, academicYears, classrooms }: Props) {
    const { data, setData, put, processing } = useForm({
        subject_id: exam.subject_id,
        name: exam.name,
        type: exam.type || '',
        date: exam.date,
        student_assignments: (exam.student_assignments || []).map((s) => ({
            student_id: s.student_id,
            student_name: s.student_name,
            nis: s.nis,
            class_name: s.class_name,
            class_id: s.class_id,
            score: s.score,
            is_scored: s.is_scored,
        })),
    });

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [nameLength, setNameLength] = useState(exam.name.length);
    const [typeLength, setTypeLength] = useState((exam.type || '').length);

    const isExamEditable = (examAcademicYear: AcademicYear | undefined, academicYears: AcademicYear[]): boolean => {
        const activeAcademicYear = getActiveAcademicYear(academicYears);
        return !isAcademicYearPassed(examAcademicYear, activeAcademicYear);
    };
    const examAcademicYear = academicYears.find((year) => year.id === exam.academic_year_id);
    const isEditable = isExamEditable(examAcademicYear, academicYears);
    const activeAcademicYear = getActiveAcademicYear(academicYears);

    const { errors, flash } = usePage<{
        errors?: Record<string, string>;
        flash?: { success?: string; error?: string };
    }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }

        if (errors && Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            errorMessages.forEach((message) => {
                toast.error(message);
            });
        }
    }, [flash, errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!Array.isArray(data.student_assignments) || data.student_assignments.length === 0) {
            toast.error('Minimal harus memilih 1 siswa untuk exam ini');
            return;
        }

        const loadingToast = toast.loading('Memperbarui exam...');

        put(`/exams/${exam.id}`, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);

                if (errors.student_assignments) {
                    toast.error('Terjadi kesalahan pada data siswa yang dipilih');
                } else if (errors.name) {
                    toast.error('Nama ujian tidak valid');
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

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= 70) {
            setData('name', value);
            setNameLength(value.length);
        }
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= 70) {
            setData('type', value);
            setTypeLength(value.length);
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
                nis: s.nis,
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
            // Show confirmation dialog for scored students
            const confirmed = window.confirm(
                'Siswa ini sudah memiliki nilai. Menghapus siswa akan menghilangkan data nilai tersebut. Apakah Anda yakin ingin melanjutkan?',
            );

            if (!confirmed) {
                return;
            }
        }
        setData(
            'student_assignments',
            data.student_assignments.filter((s) => s.student_id !== studentId),
        );
        toast.success('Siswa berhasil dihapus dari exam');
    };

    // Get academic year info for display
    const academicYear = academicYears.find((year) => year.id === exam.academic_year_id) || exam.academic_year;

    const scoredStudents = data.student_assignments.filter((s) => s.is_scored).length;
    const totalStudents = data.student_assignments.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Ujian - ${exam.name}`} />
            <Toaster position="top-right" richColors />

            {/* Warning banner jika tidak bisa edit */}
            {!isEditable && (
                <div className="m-6 mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center">
                        <svg className="mr-2 h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.46 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                        <div>
                            <span className="font-medium text-yellow-800">
                                Tahun ajaran {examAcademicYear?.title} sudah lewat dari tahun ajaran aktif ({activeAcademicYear?.title}).
                            </span>
                            <p className="mt-1 text-sm text-yellow-700">Data hanya dapat dilihat dan tidak dapat diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">Edit Ujian: {exam.name}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tahun Ajaran */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={academicYear?.title || 'Loading...'}
                                disabled
                                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
                                readOnly
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.46 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                            Tahun ajaran tidak dapat diperbarui setelah ujian ditambahkan
                        </p>
                    </div>

                    {/* Mata Pelajaran */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                        {!isEditable ? (
                            <div className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600">
                                {subjects.find((s) => s.id === data.subject_id)?.name || 'Tidak diketahui'}
                            </div>
                        ) : (
                            <>
                                <select
                                    value={data.subject_id}
                                    onChange={(e) => setData('subject_id', parseInt(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Pilih mata pelajaran</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Dropdown, taken from table subjects</p>
                                {errors.subject_id && <p className="mt-1 text-xs text-red-500">{errors.subject_id}</p>}
                            </>
                        )}
                    </div>

                    {/* Nama */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Nama Ujian *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={handleNameChange}
                            className={`w-full rounded-lg border border-gray-300 px-4 py-2 ${isEditable ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none' : 'cursor-not-allowed bg-gray-100 text-gray-600'}`}
                            placeholder="Masukkan nama ujian"
                            required
                            disabled={!isEditable}
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char ({nameLength}/70)</p>
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Tipe */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tipe (optional)</label>
                        <input
                            type="text"
                            value={data.type}
                            onChange={handleTypeChange}
                            className={`w-full rounded-lg border border-gray-300 px-4 py-2 ${isEditable ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none' : 'cursor-not-allowed bg-gray-100 text-gray-600'}`}
                            placeholder="Contoh: Ulangan Harian, Quiz, UTS, UAS"
                            disabled={!isEditable}
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char (optional) ({typeLength}/70)</p>
                        {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
                    </div>

                    {/* Tanggal */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tanggal Pelaksanaan *</label>
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            className={`w-full rounded-lg border border-gray-300 px-4 py-2 ${isEditable ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none' : 'cursor-not-allowed bg-gray-100 text-gray-600'}`}
                            required
                            disabled={!isEditable}
                        />
                        <p className="mt-1 text-xs text-gray-500">Select date (dateonly) in calendar</p>
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>

                    {/* Student Assignments */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {scoredStudents} dari {totalStudents} siswa sudah dinilai
                                </p>
                            </div>
                            {!isEditable ? (
                                <p className="max-w-md text-right text-sm text-red-600">
                                    ⚠️ Tahun ajaran sudah lewat, tidak dapat memperbarui data siswa
                                </p>
                            ) : (
                                <p className="max-w-md text-right text-sm text-red-600">
                                    ⚠️ Warning: Menghapus siswa yang sudah dinilai akan menghilangkan data skor mereka!
                                </p>
                            )}
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
                                                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs text-white ${isEditable ? 'bg-red-500 hover:bg-red-600 hover:opacity-90' : 'cursor-not-allowed bg-red-300'}`}
                                                        title={
                                                            student.is_scored ? 'Hati-hati: Siswa ini sudah memiliki nilai!' : 'Hapus siswa dari exam'
                                                        }
                                                        disabled={!isEditable}
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

                        {isEditable && (
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
                        )}
                    </div>

                    {/* Submit Button */}
                    {isEditable && (
                        <div className="flex justify-end gap-4 border-t pt-6">
                            <button
                                type="button"
                                onClick={() => router.get('/exams')}
                                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isEditable}
                                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Memperbarui...' : 'Ubah'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Student Assignment Modal */}
            {isEditable && (
                <StudentAssignmentModal
                    isOpen={showStudentModal}
                    onClose={() => setShowStudentModal(false)}
                    onSubmit={handleAddStudents}
                    classrooms={classrooms}
                    assignedStudentIds={data.student_assignments.map((s) => s.student_id)}
                />
            )}
        </AppLayout>
    );
}
