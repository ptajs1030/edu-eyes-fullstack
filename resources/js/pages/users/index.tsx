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
        { key: 'username', label: 'Username', sortable: true },
        { key: 'role_id', label: 'Role', sortable: true },
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
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white transition hover:cursor-pointer hover:bg-green-700"
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
                    rowRender={(user) => (
                        <tr key={user.id} className="border-b">
                            <td className="p-3 text-sm">{user.full_name}</td>
                            <td className="p-3 text-sm">{user.username}</td>
                            <td className="p-3 text-sm">{user.role?.name || '-'}</td>
                            <td className="p-3 text-sm">{user.status}</td>
                            <td className="flex justify-center gap-2 p-3 text-sm">
                                <button onClick={() => openForm(user)} className="rounded bg-blue-500 px-3 py-1 text-white hover:cursor-pointer">
                                    Edit
                                </button>
                                <button
                                    onClick={() => setUserToDelete(user)}
                                    className="rounded bg-red-500 px-3 py-1 text-white hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={users.links} />

                <UserFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} user={selectedUser} roles={roles} statuses={statuses} />

                <ActionModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete "${userToDelete?.full_name}"?`}
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
