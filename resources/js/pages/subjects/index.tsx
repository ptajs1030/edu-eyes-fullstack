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

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = subjects.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Nama,Nama Kurikulum,Status Arsip\n`;
        const csv = selectedData.map((a) => `${a.name},${a.curriculum_year},${a.is_archived ? 'Archived' : 'Active'}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'subjects.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data mata pelajaran`, {
            description: 'File CSV telah didownload otomatis'
        });
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

    const tableHeaders = [
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'curriculum_year', label: 'Nama Kurikulum', sortable: true },
        { key: 'is_archived', label: 'Status Arsip', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mata Pelajaran" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari mata pelajaran..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('subjects.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        {/* <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${
                                selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer'
                            }`}
                        >
                            Ekspor Data
                        </button> */}
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Mata Pelajaran
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={subjects.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? subjects.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(subject) => (
                        <tr key={subject.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(subject.id)} onChange={() => toggleSelect(subject.id)} />
                            </td>
                            <td className="p-3 text-sm">{subject.name}</td>
                            <td className="p-3 text-sm">{subject.curriculum_year}</td>
                            <td className="p-3 text-sm">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${subject.is_archived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}
                                >
                                    {subject.is_archived ? 'Archived' : 'Active'}
                                </span>
                            </td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openForm(subject)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setSubjectToDelete(subject)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={subjects.links} />

                {/* Modals */}
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
            </div>
        </AppLayout>
    );
}
