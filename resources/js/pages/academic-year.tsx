import AcademicYearFormModal from '@/components/academic-year-form-modal';
import SortDropdown from '@/components/ui/sort-drop-down';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Toaster } from 'sonner';

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
        title: 'Academic Years',
        href: '/academic-years',
    },
];

export default function AcademicYear() {
    const sortOptions = [
        { label: 'Academic Year (A-Z)', value: { sort: 'start_year', direction: 'asc' } },
        { label: 'Academic Year (Z-A)', value: { sort: 'start_year', direction: 'desc' } },
        { label: 'Created At (Newest)', value: { sort: 'created_at', direction: 'desc' } },
        { label: 'Created At (Oldest)', value: { sort: 'created_at', direction: 'asc' } },
    ];

    // const { academicYears, attendanceModes, filters } = usePage<{
    const { academicYears, filters } = usePage<{
        academicYears: PaginatedResponse<AcademicYear, Link>;
        // attendanceModes: string[];
        // attendanceModes: [{ value: 'per-shift'; label: 'Per-shift' }, { value: 'per-subject'; label: 'Per-subject' }];
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

    const handleSortChange = (sort: string, direction: string) => {
        router.get(
            '/academic-years',
            { ...filters, sort, direction },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Years" />
            <Toaster position="top-right" richColors />
            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            defaultValue={filters.search || ''}
                            onChange={handleSearchChange}
                            placeholder="Search by title..."
                            className="w-64 rounded border px-3 py-1"
                        />
                        <SortDropdown options={sortOptions} onSortChange={handleSortChange} />
                        <button onClick={exportSelected} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:cursor-pointer">
                            Export Selected
                        </button>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Add Accademic Year
                    </button>
                </div>

                <table className="w-full border-collapse rounded-lg bg-white text-black shadow-sm">
                    <thead>
                        <tr className="border-b bg-gray-100 text-gray-800">
                            <th className="p-4">
                                <input
                                    type="checkbox"
                                    onChange={(e) => setSelectedIds(e.target.checked ? academicYears.data.map((a) => a.id) : [])}
                                />
                            </th>
                            <th className="p-4 text-sm font-semibold">Title</th>
                            <th className="p-4 text-sm font-semibold">Status</th>
                            <th className="p-4 text-sm font-semibold">Attendance Mode</th>
                            <th className="p-4 text-sm font-semibold">Notes</th>
                            <th className="p-4 text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {academicYears.data.length > 0 ? (
                            academicYears.data.map((academicYear) => (
                                <tr key={academicYear.id} className="border-b">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(academicYear.id)}
                                            onChange={() => toggleSelect(academicYear.id)}
                                        />
                                    </td>
                                    <td className="p-3">{academicYear.title}</td>
                                    <td className="p-3">{academicYear.status}</td>
                                    <td className="p-3">{academicYear.attendance_mode}</td>
                                    <td className="p-3">{academicYear.note}</td>
                                    <td className="flex gap-2 p-3">
                                        <button
                                            onClick={() => openModal(academicYear)}
                                            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        {/* <button
                                            onClick={() => {
                                                setAcademicYearToDelete(academicYear);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                        >
                                            Delete
                                        </button> */}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-600">
                                    No academicYears found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="mt-4 flex justify-center gap-2">
                    {academicYears.links.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => link.url && router.visit(link.url)}
                            disabled={!link.url}
                            className={`rounded px-3 py-1 text-sm hover:cursor-pointer ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
            <AcademicYearFormModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                academicYear={selectedAcademicYear}
                // attendanceModes={attendanceModes}
            />
        </AppLayout>
    );
}
