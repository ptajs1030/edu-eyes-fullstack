import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import StudentAssignmentModal from '@/components/student-assignment-modal';

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

interface Student {
    id: number;
    full_name: string;
    nis: string;
    classroom: {
        id: number;
        name: string;
    };
}

interface AssignedStudent {
    student_id: number;
    student_name: string;
    nis: string;
    class_name: string;
    class_id: number;
}

interface Props {
    subjects: Subject[];
    academicYears: AcademicYear[];
    classrooms: Classroom[];
}

interface FormData {
    [key: string]: any;
    academic_year_id: string | number;
    subject_id: string;
    name: string;
    type: string;
    date: string;
    student_assignments: {
        student_id: number;
        // Add other simple properties that are form-compatible
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ujian', href: '/exams' },
    { title: 'Buat Ujian', href: '' },
];

export default function ExamCreate({ subjects, academicYears, classrooms }: Props) {
    const activeAcademicYear = academicYears.find(year => year.status === 'active');

    const { data, setData, post, processing } = useForm<{
        academic_year_id: string | number;
        subject_id: string;
        name: string;
        type: string;
        date: string;
        student_assignments: any[]; // Use any[] to satisfy FormDataConvertible[]
    }>({
        academic_year_id: activeAcademicYear?.id || '',
        subject_id: '',
        name: '',
        type: '',
        date: '',
        student_assignments: []
    });

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [nameLength, setNameLength] = useState(0);
    const [typeLength, setTypeLength] = useState(0);

    const { errors, flash } = usePage<{
        errors?: Record<string, string>;
        flash?: { success?: string; error?: string }
    }>().props;

    useEffect(() => {
        if (flash?.success) {
            console.log('Showing success toast:', flash.success);
            toast.success(flash.success);
        }
        if (flash?.error) {
            console.log('Showing error toast:', flash.error);
            toast.error(flash.error);
        }

        // Show validation errors
        if (errors && Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            errorMessages.forEach(message => {
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

        // Show loading state
        const loadingToast = toast.loading('Menyimpan exam...');

        post('/exams', {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                // Success will be handled by flash message and redirect
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);

                // Handle specific field errors
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
            }
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
        const currentStudentIds = data.student_assignments.map(s => s.student_id);
        const newStudents = students.filter(s => !currentStudentIds.includes(s.student_id));

        setData('student_assignments', [...data.student_assignments, ...newStudents]);
        setShowStudentModal(false);
        toast.success(`${newStudents.length} siswa berhasil ditambahkan`);
    };

    const handleRemoveStudent = (studentId: number) => {
        setData('student_assignments', data.student_assignments.filter(s => s.student_id !== studentId));
        toast.success('Siswa berhasil dihapus dari exam');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Ujian" />
            <Toaster position="top-right" richColors />
            <div className="rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">Buat Ujian</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tahun Ajaran */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tahun Ajaran
                        </label>
                        <input
                            type="text"
                            value={activeAcademicYear?.title || ''}
                            disabled
                            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">Auto fill disabled, taken from active academic_year</p>
                    </div>

                    {/* Mata Pelajaran */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mata Pelajaran *
                        </label>
                        <select
                            value={typeof data.subject_id === 'string' || typeof data.subject_id === 'number' ? data.subject_id : ''}
                            onChange={(e) => setData('subject_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    </div>

                    {/* Nama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Ujian *
                        </label>
                        <input
                            type="text"
                            value={typeof data.name === 'string' || typeof data.name === 'number' ? data.name : ''}
                            onChange={handleNameChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Masukkan nama ujian"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char ({nameLength}/70)</p>
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Tipe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipe (optional)
                        </label>
                        <input
                            type="text"
                            value={typeof data.type === 'string' || typeof data.type === 'number' ? data.type : ''}
                            onChange={handleTypeChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Contoh: Ulangan Harian, Quiz, UTS, UAS"
                        />
                        <p className="mt-1 text-xs text-gray-500">String, max 70 char (optional) ({typeLength}/70)</p>
                        {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
                    </div>

                    {/* Tanggal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Pelaksanaan*
                        </label>
                        <input
                            type="date"
                            value={typeof data.date === 'string' ? data.date : ''}
                            onChange={(e) => setData('date', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Select date (dateonly) in calendar</p>
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>

                    {/* Student Assignments */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
                        </div>

                        {data.student_assignments.length > 0 ? (
                            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">NIS</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Kelas</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.student_assignments.map((student, index) => (
                                            <tr key={student.student_id} className="border-t">
                                                <td className="px-4 py-3 text-sm">{student.student_name}</td>
                                                <td className="px-4 py-3 text-sm">{student.nis || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{student.class_name}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveStudent(student.student_id)}
                                                        className="flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => router.get('/exams')}
                            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Student Assignment Modal */}
            <StudentAssignmentModal
                isOpen={showStudentModal}
                onClose={() => setShowStudentModal(false)}
                onSubmit={handleAddStudents}
                classrooms={classrooms}
                assignedStudentIds={data.student_assignments.map(s => s.student_id)}
            />
        </AppLayout>
    );
}