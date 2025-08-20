import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    start_hour: string;
    end_hour: string;
    event_pics: { user: { full_name: string } }[];
    participants_count: number;
}

interface PaginatedResponse<T, L> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: L[];
}

interface Link {
    url: string | null;
    label: string;
    active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Events',
        href: '/events',
    },
];

export default function EventIndex() {
    const { events, filters } = usePage<{
        events: PaginatedResponse<Event, Link>;
        filters: { search?: string; sort?: string; direction?: string };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = (id: number) => {
        router.delete(route('events.destroy', id), {
            onSuccess: () => {
                setEventToDelete(null);
                router.reload();
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = events.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name,PIC,Date,Time\n`;
        const csv = selectedData
            .map((a) => {
                const picNames = a.event_pics.map((pic) => pic.user.full_name).join(', ');
                const dateRange = `${a.start_date} - ${a.end_date}`;
                const timeRange = `${a.start_hour} - ${a.end_hour}`;
                return `${a.name},"${picNames}",${dateRange},${timeRange}`;
            })
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'events.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data events`, {
            description: 'File CSV telah didownload otomatis',
        });
    };

    const isEventEditable = (event: Event) => {
        const now = new Date();
        const eventDate = new Date(`${event.start_date}T${event.start_hour}`);
        return eventDate > now;
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('events.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'name', label: 'Nama Event', sortable: true },
        { key: 'event_pics.user.full_name', label: 'PIC', sortable: false },
        { key: 'start_date', label: 'Tanggal', sortable: true },
        { key: 'start_hour', label: 'Waktu', sortable: true },
        { key: 'participants_count', label: 'Peserta', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari event..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('events.index'), { search: e.target.value }, { preserveState: true })}
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
                        href={route('events.create')}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Buat Event
                    </Link>
                </div>

                <Table
                    headers={tableHeaders}
                    data={events.data}
                    sortColumn={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? events.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(event) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(event.id)} onChange={() => toggleSelect(event.id)} />
                            </td>
                            <td className="p-3 text-sm">{event.name}</td>
                            <td className="p-3 text-sm">{event.event_pics.map((pic) => pic.user.full_name).join(', ')}</td>
                            <td className="p-3 text-sm">
                                {format(parseISO(event.start_date), 'dd MMM yyyy', { locale: id })} -{' '}
                                {format(parseISO(event.end_date), 'dd MMM yyyy', { locale: id })}
                            </td>
                            <td className="p-3 text-sm">
                                {event.start_hour} - {event.end_hour}
                            </td>
                            <td className="p-3 text-sm">{event.participants_count} Siswa</td>
                            <td className="flex gap-2 p-3">
                                {/* Edit Button */}
                                {isEventEditable(event) ? (
                                    <Link
                                        href={route('events.edit', event.id)}
                                        className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-600"
                                    >
                                        Edit
                                    </Link>
                                ) : (
                                    <button
                                        className="cursor-not-allowed rounded bg-blue-300 px-3 py-1 text-sm font-medium text-white"
                                        disabled
                                        title="Event tidak dapat diedit"
                                    >
                                        Edit
                                    </button>
                                )}

                                {/* Detail Button (selalu aktif) */}
                                <Link
                                    href={route('events.show', event.id)}
                                    className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-sky-600"
                                >
                                    Detail
                                </Link>

                                {/* Delete Button */}
                                <button
                                    onClick={() => isEventEditable(event) && setEventToDelete(event)}
                                    className={`rounded px-3 py-1 text-sm font-medium text-white ${
                                        isEventEditable(event)
                                            ? 'bg-red-500 hover:cursor-pointer hover:bg-red-600'
                                            : 'cursor-not-allowed bg-red-300 opacity-60'
                                    }`}
                                    disabled={!isEventEditable(event)}
                                    title={!isEventEditable(event) ? 'Event tidak dapat dihapus' : ''}
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                    emptyMessage="Tidak ada event yang ditemukan"
                />

                <Pagination links={events.links} />

                <ActionModal
                    isOpen={!!eventToDelete}
                    onClose={() => setEventToDelete(null)}
                    title="Konfirmasi Hapus"
                    message={`Apakah Anda yakin ingin menghapus event "${eventToDelete?.name}"?`}
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setEventToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Hapus',
                            onClick: () => eventToDelete && handleDelete(eventToDelete.id),
                            variant: 'danger',
                        },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
