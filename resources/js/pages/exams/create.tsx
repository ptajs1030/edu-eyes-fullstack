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
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ujian', href: '/exams' },
    { title: 'Buat Ujian Baru', href: '' },
];

export default function ExamCreate({ subjects, academicYears, classrooms }: Props) {
    const activeAcademicYear = Array.isArray(academicYears)
        ? academicYears.find(year => year.status === 'active')
        : undefined;

    const { data, setData, post, processing } = useForm<{
        academic_year_id: string | number;
        subject_id: string;
        name: string;
        type: string;
        date: string;
        student_assignments: any[];
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
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }

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

        const loadingToast = toast.loading('Menyimpan exam...');

        post('/exams', {
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
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">Akademik</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Buat Ujian Baru</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tambahkan ujian baru untuk siswa</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Ujian</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Lengkapi data ujian</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tahun Ajaran</label>
                                    <input
                                        type="text"
                                        value={activeAcademicYear?.title || ''}
                                        disabled
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none cursor-not-allowed opacity-60"
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Diambil dari tahun akademik aktif</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Mata Pelajaran <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={typeof data.subject_id === 'string' || typeof data.subject_id === 'number' ? data.subject_id : ''}
                                        onChange={(e) => setData('subject_id', e.target.value)}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                                        required
                                    >
                                        <option value="">Pilih mata pelajaran</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.subject_id && <p className="text-[11px] text-rose-500 mt-1.5">{errors.subject_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Nama Ujian <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={typeof data.name === 'string' || typeof data.name === 'number' ? data.name : ''}
                                        onChange={handleNameChange}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                        placeholder="Masukkan nama ujian"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{nameLength}/70 karakter</p>
                                    {errors.name && <p className="text-[11px] text-rose-500 mt-1.5">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipe (opsional)</label>
                                    <input
                                        type="text"
                                        value={typeof data.type === 'string' || typeof data.type === 'number' ? data.type : ''}
                                        onChange={handleTypeChange}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                        placeholder="Contoh: Ulangan Harian, Quiz, UTS, UAS"
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{typeLength}/70 karakter (opsional)</p>
                                    {errors.type && <p className="text-[11px] text-rose-500 mt-1.5">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={typeof data.date === 'string' ? data.date : ''}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                                        required
                                    />
                                    {errors.date && <p className="text-[11px] text-rose-500 mt-1.5">{errors.date}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Penugasan Siswa</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Pilih siswa yang akan mengikuti ujian</p>
                                </div>
                            </div>

                            {data.student_assignments.length > 0 ? (
                                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nama</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">NIS</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kelas</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.student_assignments.map((student, index) => (
                                                <tr key={student.student_id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{student.student_name}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">{student.nis || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">{student.class_name}</td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStudent(student.student_id)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="mb-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
                                    <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada siswa yang di-assign ke exam ini</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowStudentModal(true)}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-dashed border-emerald-300 dark:border-emerald-700"
                            >
                                + Tambah Siswa
                            </button>
                        </div>

                        <div className="sticky bottom-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/40 animate-fade-in-up stagger-3">
                            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs">Pastikan semua data sudah benar sebelum menyimpan.</span>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => router.get('/exams')}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 text-center"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 sm:flex-none px-6 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {processing ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Menyimpan...</span></>
                                        ) : (
                                            <span>Simpan Ujian</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

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
