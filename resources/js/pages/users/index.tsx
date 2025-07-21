import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import UserFormModal from './form';

type User = {
    id: number;
    full_name: string;
    username: string;
    phone?: string;
    email?: string;
    nip?: string;
    job?: string;
    position?: string;
    profile_picture?: string;
    address?: string;
    status: string;
    role: {
        id: number;
        name: string;
    };
};

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
        title: 'Users',
        href: '/users',
    },
];

export default function UserIndex() {
    const { users, roles, statuses, filters } = usePage<{
        users: PaginatedResponse<User, Link>;
        roles: Role[];
        statuses: { value: string; label: string }[];
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
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const openForm = (user: User | null = null) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/users/${id}`, {
            onSuccess: () => router.reload(),
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = users.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name,Username,Role,Phone,Email,Status\n`;
        const csv = selectedData.map((a) => `${a.full_name},${a.username},${a.role.name},${a.phone},${a.email},${a.status}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'users.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('users.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'full_name', label: 'Full Name', sortable: true },
        { key: 'nip', label: 'NIP', sortable: true },
        { key: 'username', label: 'Username', sortable: true },
        { key: 'role_id', label: 'Role', sortable: true },
        { key: 'phone', label: 'Phone', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search users..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('users.index'), { search: e.target.value }, { preserveState: true })}
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
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Add User
                    </button>
                </div>

                <Table
                    headers={tableHeaders}
                    data={users.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? users.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(user) => (
                        <tr key={user.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} />
                            </td>
                            <td className="p-3 text-sm">{user.full_name}</td>
                            <td className="p-3 text-sm">{user.nip}</td>
                            <td className="p-3 text-sm">{user.username}</td>
                            <td className="p-3 text-sm">{user.role?.name || '-'}</td>
                            <td className="p-3 text-sm">{user.phone || '-'}</td>
                            <td className="p-3 text-sm">{user.email || '-'}</td>
                            <td className="p-3 text-sm">{user.status}</td>
                            <td className="flex gap-2 p-3 text-sm">
                                <button
                                    onClick={() => openForm(user)}
                                    className="rounded bg-blue-500 px-3 py-1 font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setUserToDelete(user)}
                                    className="rounded bg-red-500 px-3 py-1 font-medium text-white hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={users.links} />

                <UserFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    user={
                        selectedUser
                            ? {
                                ...selectedUser,
                                role_id: selectedUser.role?.id ?? null,
                            }
                            : null
                    }
                    roles={roles}
                    statuses={statuses}
                />

                <ActionModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete user <strong>{userToDelete?.full_name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setUserToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (userToDelete) {
                                    handleDelete(userToDelete.id);
                                    setUserToDelete(null);
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
