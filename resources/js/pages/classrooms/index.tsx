import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import ClassroomFormModal from './form';

type Classroom = {
    id: number;
    name: string;
    level: number;
    main_teacher_id: number;
    main_teacher?: {
        id: number;
        full_name: string;
    };
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
        title: 'Classrooms',
        href: '/classrooms',
    },
];

export default function ClassroomIndex() {
    const { classrooms, filters } = usePage<{
        classrooms: PaginatedResponse<Classroom, Link>;
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
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);

    const openForm = (classroom: Classroom | null = null) => {
        setSelectedClassroom(classroom);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/classrooms/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = classrooms.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name,level,Main teacher\n`;
        const csv = selectedData.map((a) => `${a.name},${a.level},${a.main_teacher?.full_name}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'classrooms.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('classrooms.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'name', label: 'Class Name', sortable: true },
        { key: 'level', label: 'Level', sortable: true },
        { key: 'main_teacher', label: 'Main Teacher', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classrooms" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search classrooms..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('classrooms.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button onClick={exportSelected} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:cursor-pointer">
                            Export Selected
                        </button>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Add Classroom
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={classrooms.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? classrooms.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(classroom) => (
                        <tr key={classroom.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(classroom.id)} onChange={() => toggleSelect(classroom.id)} />
                            </td>
                            <td className="p-3 text-sm">{classroom.name}</td>
                            <td className="p-3 text-sm">Level {classroom.level}</td>
                            <td className="p-3 text-sm">{classroom.main_teacher ? classroom.main_teacher.full_name : '-- Not assigned --'}</td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openForm(classroom)}
                                    className="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <Link
                                    href={route('classrooms.show', classroom.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Detail
                                </Link>
                                <Link
                                    href={route('classrooms.schedule', classroom.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Schedule
                                </Link>
                                <button
                                    onClick={() => setClassroomToDelete(classroom)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={classrooms.links} />

                {/* Modals */}
                <ClassroomFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} classroom={selectedClassroom} />

                <ActionModal
                    isOpen={!!classroomToDelete}
                    onClose={() => setClassroomToDelete(null)}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete "${classroomToDelete?.name}"?`}
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setClassroomToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (classroomToDelete) {
                                    handleDelete(classroomToDelete.id);
                                    setClassroomToDelete(null);
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
