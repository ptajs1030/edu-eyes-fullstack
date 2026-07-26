import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

type Subject = {
    id: number;
    name: string;
    curriculum_year: string;
};

type AcademicYear = {
    id: number;
    title: string;
    status: 'active' | 'inactive';
};

type ExamAssignment = {
    id: number;
    student_id: number;
    score?: number;
    student: {
        id: number;
        full_name: string;
        nis: string;
    };
    classroom: {
        id: number;
        name: string;
    };
};

type Exam = {
    id: number;
    name: string;
    type?: string;
    date: string;
    subject_id: number;
    academic_year_id: number;
    student_count: number;
    created_at: string;
    updated_at: string;
    subject: Subject;
    academicYear: AcademicYear;
    assignments: ExamAssignment[];
};

type PaginatedResponse<T, L> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: L[];
};

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ujian',
        href: '/exams',
    },
];

export default function ExamIndex() {
    const { exams, filters, academicYears } = usePage<{
        exams: PaginatedResponse<Exam, Link>;
        subjects: Subject[];
        academicYears: AcademicYear[];
        filters: {
            search?: string;
            sort?: string;
            direction?: string;
            academic_year?: string;
        };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const academicYearOptions = academicYears || [];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

    const openForm = (exam: Exam | null = null) => {
        if (exam) {
            router.get(`/exams/${exam.id}/edit`);
        } else {
            router.get('/exams/create');
        }
    };

    const handleDelete = async (id: number) => {
        router.delete(`/exams/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = exams.data.filter((exam) => selectedIds.includes(exam.id));
        const headers = `Tahun Ajaran,Mata Pelajaran,Nama Ujian,Tipe,Tanggal,Jumlah Siswa\n`;
        const csv = selectedData
            .map((exam) => {
                const formattedDate = exam.date ? new Date(exam.date).toISOString().slice(0, 10) : '';
                return `${exam.academicYear?.title},${exam.subject?.name},${exam?.name},${exam.type || ''},${formattedDate},${exam.student_count}`;
            })
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'exams.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data ujian`, {
            description: 'File CSV telah didownload otomatis',
        });
    };

    const handleSortChange = (column: string) => {
        router.get(route('exams.index'), { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' }, { preserveState: true });
    };

    const handleAcademicYearChange = (academicYearId: string) => {
        router.get(
            route('exams.index'),
            {
                ...filters,
                academic_year: academicYearId || null,
            },
            { preserveState: true },
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const totalStudents = exams.data.reduce((sum, exam) => sum + (exam.student_count || 0), 0);

    const tableHeaders = [
        { key: 'academic_year', label: 'Tahun Ajaran', sortable: true },
        { key: 'subject_name', label: 'Mata Pelajaran', sortable: true },
        { key: 'name', label: 'Nama Ujian', sortable: true },
        { key: 'type', label: 'Tipe', sortable: true },
        { key: 'date', label: 'Tanggal Pelaksanaan', sortable: true },
        { key: 'student_count', label: 'Jumlah Siswa', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ujian" />
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Akademik
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Ujian</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola ujian dan penilaian siswa
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={exportSelected}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-foreground dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Ekspor ({selectedIds.length})
                                </button>
                            )}
                            <button
                                onClick={() => openForm(null)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah Ujian
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{exams.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{exams.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Ujian</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{exams.total > 0 ? Math.round(totalStudents / exams.total) : 0}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Siswa</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{exams.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pertemuan Ujian</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-5">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari ujian dengan nama atau tipe..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => router.get(route('exams.index'), { search: e.target.value }, { preserveState: true })}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>

                        <div className="relative min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                            </div>
                            <select
                                value={filters.academic_year || ''}
                                onChange={(e) => handleAcademicYearChange(e.target.value)}
                                className="input-glow w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Semua Tahun Ajaran</option>
                                {academicYearOptions.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={exams.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? exams.data.map((exam) => exam.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(exam) => (
                                <tr key={exam.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(exam.id)}
                                            onChange={() => toggleSelect(exam.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                            {exam.academicYear?.title || '-'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {exam.subject?.name || '-'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white">{exam.name || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        {exam.type ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                                {exam.type}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-foreground">{formatDate(exam.date)}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                            {exam.student_count} Siswa
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openForm(exam)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Penilaian</span>
                                                <Link
                                                    href={route('exams.scoring', exam.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setExamToDelete(exam)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        <Pagination links={exams.links} />
                    </div>

                </div>
            </div>

            <ActionModal
                isOpen={!!examToDelete}
                onClose={() => setExamToDelete(null)}
                title="Konfirmasi Penghapusan"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus ujian <strong>{examToDelete?.name}</strong>? Aksi ini akan menghapus semua data penilaian siswa dan tidak dapat dikembalikan.
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setExamToDelete(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Hapus',
                        onClick: () => {
                            if (examToDelete) {
                                handleDelete(examToDelete.id);
                                setExamToDelete(null);
                            }
                        },
                        variant: 'danger',
                    },
                ]}
            />
        </AppLayout>
    );
}
