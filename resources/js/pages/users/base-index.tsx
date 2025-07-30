import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import BaseForm from './base-form';

interface User {
    id: number;
    full_name: string;
    username: string;
    phone?: string;
    email?: string;
    nip?: string;
    job?: string;
    position?: string;
    status: string;
    role: {
        id: number;
        name: string;
    };
}

interface PaginatedResponse {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface BaseIndexProps {
    users: PaginatedResponse;
    statuses: Array<{ value: string; label: string }>;
    filters: { search?: string; sort?: string; direction?: string };
    breadcrumbs: BreadcrumbItem[];
    title: string;
    role: {
        id: number;
        name: string;
        value: string;
    };
    routePrefix: string;
}

export default function BaseIndex({ users, statuses, filters, breadcrumbs, title, role, routePrefix }: BaseIndexProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const openForm = (user: User | null = null) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        router.delete(route(`${routePrefix}.destroy`, id), {
            onSuccess: () => {
                toast.success('User deleted successfully');
                router.reload();
            },
            onError: () => {
                toast.error('Failed to delete user');
            },
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
        link.download = `${role.value}-users.csv`;
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(
            route(`${routePrefix}.index`),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'profile_picture', label: 'Foto', sortable: false },
        { key: 'full_name', label: 'Nama', sortable: true },
        ...(role.value === 'admin' || role.value === 'teacher' ? [{ key: 'nip', label: 'NIP', sortable: true }] : []),
        { key: 'username', label: 'Username', sortable: true },
        { key: 'role.name', label: 'Role', sortable: true },
        ...(role.value === 'admin' || role.value === 'teacher'
            ? [{ key: 'position', label: 'Jabatan', sortable: true }]
            : [{ key: 'job', label: 'Pekerjaan', sortable: true }]),
        { key: 'phone', label: 'Nomor Telepon', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'address', label: 'Alamat', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari pengguna..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route(`${routePrefix}.index`), { search: e.target.value }, { preserveState: true })}
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
                        Tambah {role.name}
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
                            <td className="w-[50px] p-3 text-sm">
                                <div className="h-10 w-10 overflow-hidden rounded-full border shadow-sm">
                                    <img
                                        src={
                                            user.profile_picture
                                                ? `/storage/${user.profile_picture}`
                                                : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`
                                        }
                                        alt={user.full_name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </td>
                            <td className="p-3 text-sm">{user.full_name}</td>
                            {(role.value === 'admin' || role.value === 'teacher') && <td className="p-3 text-sm">{user.nip || '-'}</td>}
                            <td className="p-3 text-sm">{user.username}</td>
                            <td className="p-3 text-sm">{user.role.name}</td>
                            {(role.value === 'admin' || role.value === 'teacher') && <td className="p-3 text-sm">{user.position || '-'}</td>}
                            {role.value === 'parent' && <td className="p-3 text-sm">{user.job || '-'}</td>}
                            <td className="p-3 text-sm">{user.phone || '-'}</td>
                            <td className="p-3 text-sm">{user.email || '-'}</td>
                            <td className="p-3 text-sm">{user.status}</td>
                            <td className="p-3 text-sm">{user.address || '-'}</td>
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
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={users.links} />

                <BaseForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    user={selectedUser}
                    statuses={statuses}
                    role={role}
                    routePrefix={routePrefix}
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
