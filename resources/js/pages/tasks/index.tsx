import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Task {
    id: number;
    title: string;
    description: string;
    due_date: string;
    due_time: string;
    attachments: { url: string }[];
    students_count: number;
}

interface Props {
    tasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search: string;
        sort: string;
        direction: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tugas', href: '' }];

export default function TaskIndex({ tasks, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [taskToNotifySync, setTaskToNotifySync] = useState<Task | null>(null);
    const [taskToNotifyAsync, setTaskToNotifyAsync] = useState<Task | null>(null);

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = tasks.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Title,Description,Due Date,Due Time,Attachments\n`;
        const csv = selectedData
            .map((a) => {
                const attachments = a.attachments.map((att) => att.url).join('; ');
                return `"${a.title}","${a.description}","${a.due_date}","${a.due_time}","${attachments}"`;
            })
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data tugas`, {
            description: 'File CSV telah didownload otomatis',
        });
    };

    const formatDateOnly = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatTimeOnly = (timeString: string) => {
        if (!timeString) return '-';
        return timeString.length === 5 ? timeString : timeString.substring(0, 5);
    };

    const tableHeaders = [
        { key: 'title', label: 'Judul', sortable: true },
        { key: 'description', label: 'Deskripsi', sortable: false },
        { key: 'due_date', label: 'Tanggal Tenggat', sortable: true },
        { key: 'due_time', label: 'Waktu Tenggat', sortable: true },
        { key: 'students_count', label: 'Siswa', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const handleSortChange = (column: string) => {
        router.get(route('tasks.index'), {
            sort: column,
            direction: filters.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route('tasks.destroy', id), {
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const isTaskExpired = (task: Task) => {
        const now = new Date();
        const dueDate = new Date(task.due_date);
        if (isNaN(dueDate.getTime())) {
            console.error('Invalid base date:', task.due_date);
            return true;
        }

        if (task.due_time) {
            const [hours, minutes] = task.due_time.split(':');
            dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            dueDate.setHours(23, 59, 59, 999);
        }

        return now > dueDate;
    };

    const totalStudents = tasks.data.reduce((sum, t) => sum + t.students_count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Tugas" />
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Akademik
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Tugas</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola tugas dan tenggat waktu pengerjaan
                            </p>
                        </div>
                        <Link
                            href={route('tasks.create')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Buat Tugas
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{tasks.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Tugas</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{totalStudents}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Siswa</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{tasks.data.filter((t) => isTaskExpired(t)).length}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.data.filter((t) => isTaskExpired(t)).length}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tugas Terlewat</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-5">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari tugas..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => router.get(route('tasks.index'), { search: e.target.value })}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={tasks.data}
                            sortColumn={filters.sort || ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? tasks.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            emptyMessage="Tugas Tidak Ditemukan."
                            rowRender={(task: Task) => (
                                <tr key={task.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(task.id)}
                                            onChange={() => toggleSelect(task.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">{task.description || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                            isTaskExpired(task)
                                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/30'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                isTaskExpired(task) ? 'bg-rose-500' : 'bg-emerald-500'
                                            }`}></span>
                                            {formatDateOnly(task.due_date)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatTimeOnly(task.due_time)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
                                            {task.students_count} Siswa
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <Link
                                                    href={route('tasks.edit', task.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Detail</span>
                                                <Link
                                                    href={route('tasks.show', task.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">
                                                    {isTaskExpired(task) ? 'Tugas sudah melewati deadline' : 'Kirim notifikasi sync'}
                                                </span>
                                                <button
                                                    onClick={() => setTaskToNotifySync(task)}
                                                    disabled={isTaskExpired(task)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                        isTaskExpired(task)
                                                            ? 'text-orange-300 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">
                                                    {isTaskExpired(task) ? 'Tugas sudah melewati deadline' : 'Kirim notifikasi async'}
                                                </span>
                                                <button
                                                    onClick={() => setTaskToNotifyAsync(task)}
                                                    disabled={isTaskExpired(task)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                        isTaskExpired(task)
                                                            ? 'text-purple-300 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setTaskToDelete(task)}
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
                        <Pagination links={tasks.links} />
                    </div>

                </div>
            </div>

            <ActionModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                title="Konfirmasi Penghapusan"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus tugas <strong>{taskToDelete?.title}</strong>?
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setTaskToDelete(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Hapus',
                        onClick: () => {
                            if (taskToDelete) {
                                handleDelete(taskToDelete.id);
                                setTaskToDelete(null);
                            }
                        },
                        variant: 'danger',
                    },
                ]}
            />

            <ActionModal
                isOpen={!!taskToNotifySync}
                onClose={() => setTaskToNotifySync(null)}
                title="Konfirmasi Notifikasi Sync"
                message={
                    <span>
                        Apakah Anda yakin ingin mengirim notifikasi <strong>SYNC</strong> untuk tugas <strong>{taskToNotifySync?.title}</strong>?
                        <br />
                        <small className="text-gray-500">
                            Notifikasi akan dikirim secara langsung dan mungkin membutuhkan waktu lebih lama.
                        </small>
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setTaskToNotifySync(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Kirim Sync',
                        onClick: () => {
                            if (taskToNotifySync) {
                                router.post(route('tasks.sync-resend-notification', taskToNotifySync.id));
                                setTaskToNotifySync(null);
                            }
                        },
                        variant: 'primary',
                    },
                ]}
            />

            <ActionModal
                isOpen={!!taskToNotifyAsync}
                onClose={() => setTaskToNotifyAsync(null)}
                title="Konfirmasi Notifikasi Async"
                message={
                    <span>
                        Apakah Anda yakin ingin mengirim notifikasi <strong>ASYNC</strong> untuk tugas <strong>{taskToNotifyAsync?.title}</strong>?
                        <br />
                        <small className="text-gray-500">
                            Notifikasi akan dikirim melalui queue job dan lebih cepat untuk proses yang banyak.
                        </small>
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setTaskToNotifyAsync(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Kirim Async',
                        onClick: () => {
                            if (taskToNotifyAsync) {
                                router.post(route('tasks.async-resend-notification', taskToNotifyAsync.id));
                                setTaskToNotifyAsync(null);
                            }
                        },
                        variant: 'primary',
                    },
                ]}
            />
        </AppLayout>
    );
}
