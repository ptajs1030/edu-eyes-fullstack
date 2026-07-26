import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import SubjectFormModal from './form';

type Subject = {
    id: number;
    name: string;
    curriculum_year?: string;
    is_archived: boolean;
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
        title: 'Mata Pelajaran',
        href: '/subjects',
    },
];

export default function SubjectIndex() {
    const { subjects, filters } = usePage<{
        subjects: PaginatedResponse<Subject, Link>;
        filters: { search?: string; sort?: string; direction?: string; is_archived?: string };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

    const openForm = (subject: Subject | null = null) => {
        setSelectedSubject(subject);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/subjects/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('subjects.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const activeCount = subjects.data.filter((s) => !s.is_archived).length;
    const archivedCount = subjects.data.filter((s) => s.is_archived).length;

    const tableHeaders = [
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'curriculum_year', label: 'Kurikulum', sortable: true },
        { key: 'is_archived', label: 'Status', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mata Pelajaran" />
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
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Mata Pelajaran</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola daftar mata pelajaran sekolah
                            </p>
                        </div>
                        <button
                            onClick={() => openForm(null)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Mata Pelajaran
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{subjects.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{subjects.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Mata Pelajaran</p>
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
                                    +{subjects.total > 0 ? Math.round((activeCount / subjects.total) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Aktif</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{archivedCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{archivedCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Diarsipkan</p>
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
                                placeholder="Cari mata pelajaran..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => router.get(route('subjects.index'), { search: e.target.value }, { preserveState: true })}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                                {[
                                    { value: 'all', label: 'Semua' },
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'archived', label: 'Diarsipkan' },
                                ].map((seg) => (
                                    <button
                                        key={seg.value}
                                        onClick={() => {
                                            router.get(
                                                route('subjects.index'),
                                                { ...filters, is_archived: seg.value === 'all' ? undefined : seg.value === 'archived' ? '1' : '0' },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                        className={`segment-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            // Determine active state based on filters
                                            (seg.value === 'all' && !filters.is_archived) ||
                                            (seg.value === 'active' && filters.is_archived === '0') ||
                                            (seg.value === 'archived' && filters.is_archived === '1')
                                                ? 'active'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {seg.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={subjects.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? subjects.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(subject) => (
                                <tr key={subject.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(subject.id)}
                                            onChange={() => toggleSelect(subject.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{subject.name}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                            {subject.curriculum_year || '-'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {subject.is_archived ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                Diarsipkan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openForm(subject)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setSubjectToDelete(subject)}
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
                        <Pagination links={subjects.links} />
                    </div>

                </div>
            </div>

            <SubjectFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} subject={selectedSubject} />

            <ActionModal
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                title="Konfirmasi Penghapusan"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus mata pelajaran <strong>{subjectToDelete?.name}</strong>?
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setSubjectToDelete(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Hapus',
                        onClick: () => {
                            if (subjectToDelete) {
                                handleDelete(subjectToDelete.id);
                                setSubjectToDelete(null);
                            }
                        },
                        variant: 'danger',
                    },
                ]}
            />
        </AppLayout>
    );
}
