import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { set } from 'date-fns';
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const tableHeaders = [
        { key: 'title', label: 'Judul', sortable: true },
        { key: 'description', label: 'Deskripsi', sortable: false },
        { key: 'due_date', label: 'Tanggal Tenggat', sortable: true },
        { key: 'due_time', label: 'Waktu Tenggat ', sortable: true },
        { key: 'attachments.url', label: 'Lampiran', sortable: false },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Tugas" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari Tugas..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('tasks.index'), { search: e.target.value })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${
                                selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'
                            }`}
                        >
                            Ekspor data yang dipilih
                        </button>
                    </div>
                    <Link
                        href={route('tasks.create')}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Buat Tugas
                    </Link>
                </div>

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
                        <tr key={task.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => toggleSelect(task.id)} />
                            </td>
                            <td className="p-3 text-sm">{task.title}</td>
                            <td className="p-3 text-sm">
                                {task.description && task.description.length > 70
                                    ? `${task.description.substring(0, 70)}...`
                                    : task.description || '-'}
                            </td>
                            <td className="p-3 text-sm">{formatDate(task.due_date)}</td>
                            <td className="p-3 text-sm">{formatDate(task.due_time)}</td>
                            <td className="p-3 text-sm">
                                {task.attachments && task.attachments.length > 0 ? (
                                    task.attachments.map((a, idx) => (
                                        <div key={idx}>
                                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                lampiran {idx + 1}
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <span>-</span>
                                )}
                            </td>
                            <td className="flex gap-2 p-3">
                                <Link
                                    href={route('tasks.edit', task.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={route('tasks.show', task.id)}
                                    className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Detail
                                </Link>
                                <button
                                    onClick={() => setTaskToDelete(task)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={tasks.links} />

                <ActionModal
                    isOpen={!!taskToDelete}
                    onClose={() => setTaskToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete task <strong>{taskToDelete?.title}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setTaskToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
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
            </div>
        </AppLayout>
    );
}
