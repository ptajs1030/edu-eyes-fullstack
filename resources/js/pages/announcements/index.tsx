import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Announcement {
    id: number;
    title: string;
    short_content: string;
    content: string;
    updated_at: string;
    attachments: { url: string }[];
}

interface Props {
    announcements: {
        data: Announcement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        sort?: string;
        direction?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pengumuman', href: '' }];

export default function AnnouncementIndex({ announcements, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
        const selectedData = announcements.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Title,Short Content,Content,Attachments\n`;
        const csv = selectedData
            .map((a) => {
                const content = a.content.replace(/<[^>]*>/g, '').replace(/"/g, '""');
                const attachments = a.attachments.map((att) => att.url).join('; ');
                return `"${a.title}","${a.short_content}","${content}","${attachments}"`;
            })
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'announcements.csv';
        link.click();
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

    console.log(announcements);

    const tableHeaders = [
        { key: 'title', label: 'Judul', sortable: true },
        { key: 'short_content', label: 'Ringkasan', sortable: false },
        { key: 'content', label: 'Konten', sortable: false },
        { key: 'attachments.url', label: 'Lampiran', sortable: false },
        { key: 'updated_at', label: 'Terakhir Diupdate', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const handleSortChange = (column: string) => {
        router.get(route('announcements.index'), {
            sort: column,
            direction: filters.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            router.delete(route('announcements.destroy', id), {
                onSuccess: () => {
                    toast.success('Pengumuman berhasil dihapus');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Pengumuman" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari pengumuman..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('announcements.index'), { search: e.target.value })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button
                            onClick={exportSelected}
                            className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                        >
                            Ekspor data yang dipilih
                        </button>
                    </div>
                    <Link
                        href={route('announcements.create')}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Buat Pengumuman
                    </Link>
                </div>

                <Table
                    headers={tableHeaders}
                    data={announcements.data}
                    sortColumn={filters.sort || ''}
                    sortDirection={filters.direction || 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? announcements.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    emptyMessage="No announcements found."
                    rowRender={(announcement: Announcement) => (
                        <tr key={announcement.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(announcement.id)}
                                    onChange={() => toggleSelect(announcement.id)}
                                />
                            </td>
                            <td className="p-3 text-sm">{announcement.title}</td>
                            <td className="p-3 text-sm">
                                {announcement.short_content && announcement.short_content.length > 70
                                    ? `${announcement.short_content.substring(0, 70)}...`
                                    : announcement.short_content || '-'}
                            </td>
                            <td className="p-3 text-sm">{announcement.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</td>
                            <td className="p-3 text-sm">
                                {announcement.attachments && announcement.attachments.length > 0 ? (
                                    announcement.attachments.map((a, idx) => (
                                        <div key={idx}>
                                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                Attachment {idx + 1}
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <span>-</span>
                                )}
                            </td>
                            <td className="p-3 text-sm">{formatDate(announcement.updated_at)}</td>
                            <td className="flex gap-2 p-3">
                                <Link
                                    href={route('announcements.edit', announcement.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={route('announcements.show', announcement.id)}
                                    className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Detail
                                </Link>
                                <button
                                    onClick={() => handleDelete(announcement.id)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={announcements.links} />
            </div>
        </AppLayout>
    );
}
