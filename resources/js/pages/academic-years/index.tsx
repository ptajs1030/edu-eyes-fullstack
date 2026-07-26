import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import AcademicYearFormModal from './form';

type AcademicYear = {
    id: number;
    start_year: number;
    title: string;
    status: string;
    attendance_mode: string;
    note?: string;
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
        title: 'Tahun Akademik',
        href: '/academic-years',
    },
];

export default function AcademicYearIndex() {
    const { academicYears, attendanceModes, filters } = usePage<{
        academicYears: PaginatedResponse<AcademicYear, Link>;
        attendanceModes: { value: string; label: string }[];
        filters: { search?: string; sort?: string; direction?: string };
    }>().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const openModal = (academicYear: AcademicYear | null = null) => {
        setSelectedAcademicYear(academicYear);
        setIsModalOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.get(
            '/academic-years',
            { ...(filters || {}), search: e.target.value },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSortChange = (column: string) => {
        router.get(
            '/academic-years',
            { ...filters, sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const activeCount = academicYears.data.filter((a) => a.status === 'active').length;
    const completeCount = academicYears.data.filter((a) => a.status === 'complete').length;

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Aktif
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/30">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Selesai
            </span>
        );
    };

    const getAttendanceLabel = (mode: string): string => {
        const labels: Record<string, string> = {
            daily: 'Harian',
            weekly: 'Mingguan',
            monthly: 'Bulanan',
            semester: 'Semester',
        };
        return labels[mode] || mode;
    };

    const tableHeaders = [
        { key: 'title', label: 'Judul', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'attendance_mode', label: 'Mode Kehadiran', sortable: true },
        { key: 'note', label: 'Catatan', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tahun Akademik" />
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
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Tahun Akademik</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola tahun akademik dan mode kehadiran sekolah
                            </p>
                        </div>
                        <button
                            disabled={academicYears.data.length !== 0}
                            onClick={() => openModal(null)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Tahun Akademik
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{academicYears.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{academicYears.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Tahun Akademik</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{academicYears.total > 0 ? Math.round((activeCount / academicYears.total) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sedang Berjalan</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{completeCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completeCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Selesai</p>
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
                                placeholder="Cari tahun akademik..."
                                defaultValue={filters.search || ''}
                                onChange={handleSearchChange}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={academicYears.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? academicYears.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            emptyMessage="Belum ada tahun akademik."
                            rowRender={(academicYear) => (
                                <tr key={academicYear.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(academicYear.id)}
                                            onChange={() => toggleSelect(academicYear.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white">{academicYear.title}</p>
                                        <p className="text-xs text-muted-foreground">{academicYear.start_year}</p>
                                    </td>
                                    <td className="px-5 py-4">{getStatusBadge(academicYear.status)}</td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                            {getAttendanceLabel(academicYear.attendance_mode)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground text-xs max-w-[200px]">
                                        <p className="truncate" title={academicYear.note || ''}>
                                            {academicYear.note || '-'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openModal(academicYear)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        <Pagination links={academicYears.links} />
                    </div>

                </div>
            </div>

            <AcademicYearFormModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                academicYear={selectedAcademicYear as any}
                attendanceModes={attendanceModes}
            />
        </AppLayout>
    );
}
