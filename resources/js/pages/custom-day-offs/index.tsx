import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import CustomDayOffFormModal from './form';

type CustomDayOff = {
    id: number;
    date: string;
    description: string;
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
        title: 'Hari Libur',
        href: '/custom-day-offs',
    },
];

export default function CustomDayOffIndex() {
    const { customDayOffs, filters } = usePage<{
        customDayOffs: PaginatedResponse<CustomDayOff, Link>;
        filters: { search?: string; sort?: string; direction?: string };
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
    const [selectedDayOff, setSelectedDayOff] = useState<CustomDayOff | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [dayOffToDelete, setDayOffToDelete] = useState<CustomDayOff | null>(null);

    const openForm = (dayOff: CustomDayOff | null = null) => {
        setSelectedDayOff(dayOff);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/custom-day-offs/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = customDayOffs.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Tanggal,Nama Hari Libur\n`;
        const csv = selectedData.map((a) => `${a.date},${a.description}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'custom-day-offs.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data hari libur`, {
            description: 'File CSV telah didownload otomatis',
        });
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('custom-day-offs.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'date', label: 'Tanggal', sortable: true },
        { key: 'description', label: 'Nama Hari Libur', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hari Libur" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and horizontally scrollable action buttons */}
                    <div
                        className="flex items-center gap-2 md:gap-2 gap-1 overflow-x-auto pb-2"
                        style={{ minWidth: 600, maxWidth: '100%', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}
                    >
                        <input
                            type="text"
                            placeholder="Cari hari libur..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('custom-day-offs.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        {/* <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'
                                }`}
                        >
                            Ekspor Data
                        </button> */}
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700 whitespace-nowrap"
                    >
                        Tambah Hari Libur
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={customDayOffs.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? customDayOffs.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(dayOff) => (
                        <tr key={dayOff.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(dayOff.id)} onChange={() => toggleSelect(dayOff.id)} />
                            </td>
                            <td className="p-3 text-sm">{new Date(dayOff.date).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 text-sm">{dayOff.description}</td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openForm(dayOff)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setDayOffToDelete(dayOff)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={customDayOffs.links} />

                {/* Modals */}
                <CustomDayOffFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} dayOff={selectedDayOff} />

                <ActionModal
                    isOpen={!!dayOffToDelete}
                    onClose={() => setDayOffToDelete(null)}
                    title="Konfirmasi Penghapusan"
                    message={
                        <span>
                            Apakah Anda yakin ingin menghapus hari libur pada tanggal{' '}
                            <strong>{dayOffToDelete ? new Date(dayOffToDelete.date).toLocaleDateString('id-ID') : ''}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setDayOffToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Ya, Hapus',
                            onClick: () => {
                                if (dayOffToDelete) {
                                    handleDelete(dayOffToDelete.id);
                                    setDayOffToDelete(null);
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
