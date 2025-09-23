import ActionModal from '@/components/action-modal';
import ImportModal from '@/components/import-modal';
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
    filters: { search?: string; sort?: string; direction?: string; show?: string; status?: string };
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [isResetErrorOpen, setIsResetErrorOpen] = useState(false);
    const [show, setShow] = useState<string>(filters.show || '10');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status || '');

    // Reset selectedIds when filter/search/show changes
    useEffect(() => {
        setSelectedIds([]);
    }, [show, statusFilter, filters.search, filters.sort, filters.direction]);

    // Reset password handler
    const handleResetPassword = async (user: User) => {
        if (!user.phone) {
            setUserToReset(user);
            setIsResetErrorOpen(true);
            return;
        }
        // Call backend to reset password (new endpoint)
        router.put(
            route(`${routePrefix}.reset-password`, user.id),
            {},
            {
                onSuccess: () => {
                    // WhatsApp link
                    const waMsg = encodeURIComponent(`Password akun EduEyes Anda telah direset. Password baru: eduEyes123`);
                    let phone = user.phone?.replace(/[^0-9]/g, '') || '';
                    if (phone.startsWith('08')) {
                        phone = '628' + phone.slice(2);
                    }
                    const waLink = `https://wa.me/${phone}?text=${waMsg}`;
                    window.open(waLink, '_blank');
                },
                onError: (error) => {
                    console.log(error);
                },
            },
        );
    };

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
                router.reload();
            }
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = users.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Name,Username,Role,Phone,Email,Status\n`;
        const toDash = (v: any) => (v === null || v === undefined || v === '' ? '-' : v);
        const csv = selectedData
            .map((a) => [
                toDash(a.full_name),
                toDash(a.username),
                toDash(a.role?.name),
                toDash(a.phone),
                toDash(a.email),
                toDash(a.status)
            ].join(','))
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${role.value}-users.csv`;
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data ${translateRoleName(role.name)}`, {
            description: 'File CSV telah didownload otomatis',
        });
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

    const handleShowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setShow(value);
        setSelectedIds([]);
        router.get(
            route(`${routePrefix}.index`),
            {
                ...filters,
                show: value,
                status: statusFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setStatusFilter(value);
        setSelectedIds([]);
        router.get(
            route(`${routePrefix}.index`),
            {
                ...filters,
                status: value || undefined,
                show,
            },
            { preserveState: true, replace: true },
        );
    };

    const tableHeaders = [
        ...(role.value === 'admin' || role.value === 'teacher' ? [{ key: 'profile_picture', label: 'Foto', sortable: false }] : []),
        { key: 'full_name', label: 'Nama', sortable: true },
        ...(role.value === 'admin' || role.value === 'teacher' ? [{ key: 'nip', label: 'NIP', sortable: true }] : []),
        { key: 'username', label: 'Username', sortable: true },
        ...(role.value === 'admin' || role.value === 'teacher'
            ? [{ key: 'position', label: 'Jabatan', sortable: true }]
            : [{ key: 'job', label: 'Pekerjaan', sortable: true }]),
        { key: 'phone', label: 'Nomor Telepon', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'address', label: 'Alamat', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'inactive':
                return 'Inactive';
            default:
                return status;
        }
    };

    const translateRoleName = (roleName: string): string => {
        const roleMap: Record<string, string> = {
            Admin: 'Admin',
            Teacher: 'Guru',
            Parent: 'Orang Tua',
        };

        return roleMap[roleName] || roleName;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Toaster position="top-right" richColors />
            {/* Filter & Show Controls - styled and ordered like student, aligned with table */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-1">
                {/* Search box */}
                <input
                    type="text"
                    placeholder="Cari pengguna..."
                    defaultValue={filters.search || ''}
                    onChange={e => {
                        setSelectedIds([]);
                        router.get(route(`${routePrefix}.index`), { ...filters, search: e.target.value, show, status: statusFilter }, { preserveState: true });
                    }}
                    className="w-64 rounded border px-3 py-1 text-sm bg-white"
                />
                {/* Show per page */}
                <select
                    value={show}
                    onChange={handleShowChange}
                    className="rounded border px-2 py-1 text-sm min-w-[100px] bg-white"
                >
                    <option value="10">Show 10 data</option>
                    <option value="20">Show 20 data</option>
                    <option value="all">Show All</option>
                </select>
                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="rounded border px-2 py-1 text-sm min-w-[120px] bg-white"
                >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                </select>
                {/* Export & Import Buttons - moved to left after status filter */}
                <button
                    disabled={selectedIds.length === 0}
                    onClick={exportSelected}
                    className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'
                        }`}
                >
                    Ekspor Data
                </button>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-indigo-700"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v14"
                        />
                    </svg>
                    Impor Data
                </button>
                {/* Add Button stays at right */}
                <div className="flex-1" />
                <button
                    onClick={() => openForm(null)}
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700 ml-2"
                >
                    Tambah {translateRoleName(role.name)}
                </button>
            </div>

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
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
                            {(role.value === 'admin' || role.value === 'teacher') && (
                                <td className="w-[50px] p-3 text-sm">
                                    <div className="h-10 w-10 overflow-hidden rounded-full border shadow-sm">
                                        <img
                                            src={
                                                user.profile_picture
                                                    ? `/storage/${user.profile_picture}`
                                                    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`
                                            }
                                            alt={user.full_name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </td>
                            )}
                            <td className="p-3 text-sm">{user.full_name}</td>
                            {(role.value === 'admin' || role.value === 'teacher') && <td className="p-3 text-sm">{user.nip || '-'}</td>}
                            <td className="p-3 text-sm">{user.username}</td>
                            {(role.value === 'admin' || role.value === 'teacher') && <td className="p-3 text-sm">{user.position || '-'}</td>}
                            {role.value === 'parent' && <td className="p-3 text-sm">{user.job || '-'}</td>}
                            <td className="p-3 text-sm">{user.phone || '-'}</td>
                            <td className="p-3 text-sm">{user.email || '-'}</td>
                            <td className="p-3 text-sm">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(user.status)}`}
                                >
                                    {getStatusLabel(user.status)}
                                </span>
                            </td>
                            <td className="p-3 text-sm">
                                {user.address ? (user.address.length > 70 ? user.address.substring(0, 70) + '...' : user.address) : '-'}
                            </td>
                            <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
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
                                    <button
                                        onClick={() => handleResetPassword(user)}
                                        className="rounded bg-yellow-500 px-5 py-1 font-medium whitespace-nowrap text-white hover:cursor-pointer"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={users.links} />

                <BaseForm
                    key={selectedUser?.id || 'new'}
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
                    title="Konfirmasi Penghapusan"
                    message={
                        <span>
                            Apakah Anda yakin ingin menghapus user <strong>{userToDelete?.full_name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setUserToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Ya, Hapus',
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

                <ActionModal
                    isOpen={isResetErrorOpen}
                    onClose={() => setIsResetErrorOpen(false)}
                    title="Reset Password Error"
                    message={<span>Phone is not set for this user</span>}
                    buttons={[
                        {
                            label: 'OK',
                            onClick: () => setIsResetErrorOpen(false),
                            variant: 'neutral',
                        },
                    ]}
                />

                {/* Modal import muncul saat showImportModal = true */}
                {showImportModal && (
                    <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} role={role} routePrefix={routePrefix} />
                )}
            </div>
        </AppLayout>
    );
}
