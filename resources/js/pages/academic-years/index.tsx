import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Toaster } from 'sonner';
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
    const [sortColumn, setSortColumn] = useState<string>('start_year');
    const [sortDirection, setSortDirection] = useState<string>('desc');

    const openModal = (academicYear: AcademicYear | null = null) => {
        setSelectedAcademicYear(academicYear);
        setIsModalOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = academicYears.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Title,Status\n`;
        const csv = selectedData.map((a) => `${a.title},${a.status}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'academic-years.csv';
        link.click();
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
        if (column === sortColumn) {
            setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }

        router.get(
            '/academic-years',
            { ...filters, sort: column, direction: sortDirection },
            {
                preserveState: true,
                replace: true,
            },
        );
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

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            defaultValue={filters.search || ''}
                            onChange={handleSearchChange}
                            placeholder="Cari berdasarkan tahun..."
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
                        onClick={() => openModal()}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Tahun Akademik
                    </button>
                </div>

                <Table
                    headers={tableHeaders}
                    data={academicYears.data}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection as 'asc' | 'desc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? academicYears.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    emptyMessage="No academic years found."
                    rowRender={(academicYear) => (
                        <tr key={academicYear.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(academicYear.id)}
                                    onChange={() => toggleSelect(academicYear.id)}
                                />
                            </td>
                            <td className="p-3 text-sm">{academicYear.title}</td>
                            <td className="p-3 text-sm">{academicYear.status}</td>
                            <td className="p-3 text-sm">{academicYear.attendance_mode}</td>
                            <td className="p-3 text-sm">{academicYear.note}</td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openModal(academicYear)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={academicYears.links} />

                <AcademicYearFormModal
                    isOpen={isModalOpen}
                    closeModal={() => setIsModalOpen(false)}
                    academicYear={selectedAcademicYear}
                    attendanceModes={attendanceModes}
                />
            </div>
        </AppLayout>
    );
}
