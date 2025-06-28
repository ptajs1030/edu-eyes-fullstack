import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import StudentFormModal from './form';

type Student = {
    id: number;
    full_name: string;
    entry_year: number;
    gender: string;
    religion: string;
    status: string;
    code: string;
    birth_place: string;
    date_of_birth: string;
    address: string;
    classroom?: {
        name: string;
    };
};

type Classroom = {
    id: number;
    name: string;
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
        title: 'Students',
        href: '/students',
    },
];

export default function StudentIndex() {
    const { students, classrooms, sexes, statuses, religions, filters } = usePage<{
        students: PaginatedResponse<Student, Link>;
        classrooms: Classroom[];
        sexes: { value: string; label: string }[];
        statuses: { value: string; label: string }[];
        religions: { value: string; label: string }[];
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
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    const openForm = (student: Student | null = null) => {
        setSelectedStudent(student);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/students/${id}`, {
            onSuccess: () => {
                // Do nothing here – let the flash message logic handle it
                router.reload();
            }
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = students.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Full name,Classroom,Entry year,Gender,Religion,Status\n`;
        const csv = selectedData.map((a) => `${a.full_name},${a.classroom?.name},${a.entry_year},${a.gender},${a.religion},${a.status}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'students.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(route('students.index'), { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' }, { preserveState: true });
    };

    const tableHeaders = [
        { key: 'full_name', label: 'Name', sortable: true },
        { key: 'classroom.name', label: 'Classroom', sortable: false },
        { key: 'entry_year', label: 'Entry year', sortable: true },
        { key: 'gender', label: 'Gender', sortable: true },
        { key: 'religion', label: 'Religion', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search students..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('students.index'), { search: e.target.value }, { preserveState: true })}
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
                        Add Student
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={students.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === "asc" || filters.direction === "desc" ? filters.direction : "asc"}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? students.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(student) => (
                        <tr key={student.id} className="border-b">
                            <td className="p-3">
                                <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} />
                            </td>
                            <td className="p-3">{student.full_name}</td>
                            <td className="p-3">{student.classroom?.name || '-'}</td>
                            <td className="p-3">{student.entry_year}</td>
                            <td className="p-3">{student.gender}</td>
                            <td className="p-3">{student.religion}</td>
                            <td className="p-3">{student.status}</td>
                            <td className="flex justify-center gap-2 p-3">
                                <button
                                    onClick={() => openForm(student)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setStudentToDelete(student)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={students.links} />

                {/* Modals */}
                <StudentFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    student={selectedStudent}
                    classrooms={classrooms}
                    sexes={sexes}
                    statuses={statuses}
                    religions={religions}
                />

                <ActionModal
                    isOpen={!!studentToDelete}
                    onClose={() => setStudentToDelete(null)}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete ${studentToDelete?.full_name}?`}
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setStudentToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (studentToDelete) {
                                    handleDelete(studentToDelete.id);
                                    setStudentToDelete(null);
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
