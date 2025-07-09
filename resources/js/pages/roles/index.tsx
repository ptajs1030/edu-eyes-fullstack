import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import RoleFormModal from './form';

type Role = {
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
        title: 'Roles',
        href: '/roles',
    },
];

export default function RoleIndex() {
    const { roles, filters } = usePage<{
        roles: PaginatedResponse<Role, Link>;
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
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const openForm = (role: Role | null = null) => {
        setSelectedRole(role);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/roles/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = roles.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name\n`;
        const csv = selectedData.map((a) => `${a.name}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'roles.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('roles.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search roles..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('roles.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button
                            onClick={exportSelected}
                            className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                        >
                            Export Selected
                        </button>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Add Role
                    </button>
                </div>

                <Table
                    headers={tableHeaders}
                    data={roles.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? roles.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(role) => (
                        <tr key={role.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(role.id)} onChange={() => toggleSelect(role.id)} />
                            </td>
                            <td className="p-3 text-sm">{role.name}</td>
                            <td className="flex justify-center gap-2 p-3 text-sm">
                                <button onClick={() => openForm(role)} className="rounded bg-blue-500 px-3 py-1 text-white hover:cursor-pointer">
                                    Edit
                                </button>
                                <button
                                    onClick={() => setRoleToDelete(role)}
                                    className="rounded bg-red-500 px-3 py-1 text-white hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={roles.links} />

                <RoleFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} role={selectedRole} />

                <ActionModal
                    isOpen={!!roleToDelete}
                    onClose={() => setRoleToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete role <strong>{roleToDelete?.name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setRoleToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (roleToDelete) {
                                    handleDelete(roleToDelete.id);
                                    setRoleToDelete(null);
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
