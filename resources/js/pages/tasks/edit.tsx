import ConfirmationModal from '@/components/confirmation-modal';
import StudentAssignmentModal from '@/components/student-assignment-modal';
import AppLayout from '@/layouts/app-layout';
import RichTextEditor from '@/components/rich-text-editor';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Subject {
    id: number;
    name: string;
    curriculum_year: string;
}

interface Attachment {
    url: string;
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
    attachments?: Attachment[];
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
        title: task.title,
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
        attachments: (task.attachments || []).map(a => ({ url: a.url })),
    });

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [titleLength, setTitleLength] = useState(task.title.length);

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

    const handleAddAttachment = () => {
        setData('attachments', [...data.attachments, { url: '' }]);
    };

    const handleRemoveAttachment = (index: number) => {
        const newAttachments = [...data.attachments];
        newAttachments.splice(index, 1);
        setData('attachments', newAttachments);
    };

    const handleAttachmentChange = (index: number, value: string) => {
        const newAttachments = [...data.attachments];
        newAttachments[index].url = value;
        setData('attachments', newAttachments);
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

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingStudentId, setPendingStudentId] = useState<number | null>(null);

    const handleRemoveStudent = (studentId: number, isScored: boolean) => {
        if (isScored) {
            setPendingStudentId(studentId);
            setShowConfirm(true);
            return;
        }

        setData(
            'student_assignments',
            data.student_assignments.filter((s) => s.student_id !== studentId),
        );
        toast.success('Siswa berhasil dihapus dari Tugas');
    };

    const confirmRemove = () => {
        if (pendingStudentId !== null) {
            setData(
                'student_assignments',
                data.student_assignments.filter((s) => s.student_id !== pendingStudentId),
            );
            toast.success('Siswa berhasil dihapus dari Tugas');
        }
        setShowConfirm(false);
        setPendingStudentId(null);
    };

    const cancelRemove = () => {
        setShowConfirm(false);
        setPendingStudentId(null);
    };

    const academicYear = academicYears.find((year) => year.id === task.academic_year_id) || task.academic_year;

    const scoredStudents = data.student_assignments.filter((s) => s.is_scored).length;
    const totalStudents = data.student_assignments.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tugas - ${task.title}`} />
            <Toaster position="top-right" richColors />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider">Tugas</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Tugas</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{task.title}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Tugas</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Informasi utama tugas</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tahun Ajaran</label>
                                    <input
                                        type="text"
                                        value={academicYear?.title || 'Loading...'}
                                        disabled
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white cursor-not-allowed opacity-60 outline-none"
                                        readOnly
                                    />
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.46 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        Tahun ajaran tidak dapat diperbarui setelah tugas ditambahkan
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Mata Pelajaran <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.subject_id}
                                        onChange={(e) => setData('subject_id', parseInt(e.target.value))}
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
                                        Nama Tugas <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={handleTitleChange}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                        placeholder="Masukkan nama tugas"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{titleLength}/70 karakter</p>
                                    {errors.title && <p className="text-[11px] text-rose-500 mt-1.5">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi</label>
                                    <div className="[&_.ql-editor]:text-sm sm:[&_.ql-editor]:text-sm">
                                        <RichTextEditor
                                            value={data.description}
                                            onChange={(value) => setData('description', value)}
                                            placeholder="Deskripsi tugas..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Lampiran</label>
                                    <div className="space-y-3">
                                        {data.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="url"
                                                    value={attachment.url}
                                                    onChange={(e) => handleAttachmentChange(index, e.target.value)}
                                                    placeholder="https://example.com/file.pdf"
                                                    className="form-input flex-1 px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttachment(index)}
                                                    className="px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleAddAttachment}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-dashed border-primary-300 dark:border-primary-700"
                                        >
                                            + Tambah Lampiran
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Batas Pengumpulan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                                            required
                                        />
                                        {errors.due_date && <p className="text-[11px] text-rose-500 mt-1.5">{errors.due_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Batas Pengumpulan (Jam) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={data.due_time}
                                            onChange={(e) => setData('due_time', e.target.value)}
                                            className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                                            required
                                        />
                                        {errors.due_time && <p className="text-[11px] text-rose-500 mt-1.5">{errors.due_time}</p>}
                                    </div>
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
                                    <p className="text-xs text-slate-400 dark:text-slate-500">{scoredStudents} dari {totalStudents} siswa sudah dinilai</p>
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-end">
                                <p className="text-xs text-rose-600 dark:text-rose-400">
                                    ⚠️ Menghapus siswa yang sudah dinilai akan menghilangkan data skor mereka!
                                </p>
                            </div>

                            {data.student_assignments.length > 0 ? (
                                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nama</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kelas</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status Nilai</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.student_assignments.map((student) => (
                                                <tr key={student.student_id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                                                        <div className="flex items-center gap-2">
                                                            {student.student_name}
                                                            {student.is_scored && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Sudah Dinilai
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">{student.class_name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {student.is_scored ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-800 dark:text-green-400">
                                                                    Sudah Dinilai
                                                                </span>
                                                                <span className="mt-1 text-[11px] text-slate-500">Nilai: {student.score}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                Belum Dinilai
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStudent(student.student_id, student.is_scored)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700"
                                                            title={student.is_scored ? 'Hati-hati: Siswa ini sudah memiliki nilai!' : 'Hapus siswa dari tasks'}
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
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada siswa yang di-assign ke tugas ini</p>
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
                                        onClick={() => router.get('/tasks')}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 text-center"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 sm:flex-none px-6 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {processing ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Memperbarui...</span></>
                                        ) : (
                                            <span>Simpan Perubahan</span>
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
                assignedStudentIds={data.student_assignments.map((s) => s.student_id)}
            />
            <ConfirmationModal
                isOpen={showConfirm}
                title="Konfirmasi Hapus"
                message="Siswa ini sudah memiliki nilai. Menghapus siswa akan menghilangkan data nilai tersebut. Apakah Anda yakin ingin melanjutkan?"
                onConfirm={confirmRemove}
                onCancel={cancelRemove}
            />
        </AppLayout>
    );
}
