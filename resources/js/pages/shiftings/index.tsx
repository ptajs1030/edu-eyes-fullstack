import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import ShiftingFormModal from './form';

type Shifting = {
    id: number;
    name: string;
    start_hour: string;
    end_hour: string;
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
        title: 'Shiftings',
        href: '/shiftings',
    },
];

export default function ShiftingIndex() {
    const { shiftings, filters } = usePage<{
        shiftings: PaginatedResponse<Shifting, Link>;
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
    const [selectedShifting, setSelectedShifting] = useState<Shifting | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [shiftingToDelete, setShiftingToDelete] = useState<Shifting | null>(null);

    const openForm = (shifting: Shifting | null = null) => {
        setSelectedShifting(shifting);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/shiftings/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = shiftings.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name,Start hour,End hour\n`;
        const csv = selectedData.map((a) => `${a.name},${a.start_hour},${a.end_hour}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'shiftings.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('shiftings.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'start_hour', label: 'Waktu', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shiftings" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari shift..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('shiftings.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button
                            onClick={exportSelected}
                            className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                        >
                            Ekspor data yang dipilih
                        </button>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Shifting
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={shiftings.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? shiftings.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(shifting) => (
                        <tr key={shifting.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(shifting.id)} onChange={() => toggleSelect(shifting.id)} />
                            </td>
                            <td className="p-3 text-sm">{shifting.name}</td>
                            <td className="p-3 text-sm">
                                {shifting.start_hour} - {shifting.end_hour}
                            </td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openForm(shifting)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShiftingToDelete(shifting)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={shiftings.links} />

                {/* Modals */}
                <ShiftingFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} shifting={selectedShifting} />

                <ActionModal
                    isOpen={!!shiftingToDelete}
                    onClose={() => setShiftingToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete shifting <strong>{shiftingToDelete?.name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setShiftingToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (shiftingToDelete) {
                                    handleDelete(shiftingToDelete.id);
                                    setShiftingToDelete(null);
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
