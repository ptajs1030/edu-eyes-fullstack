import ActionModal from '@/components/action-modal';
import ImportModal from '@/components/import-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Upload, Download, Search, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
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

const avatarGradients = ['avatar-grad-1', 'avatar-grad-2', 'avatar-grad-3', 'avatar-grad-4', 'avatar-grad-5', 'avatar-grad-6'];

export default function BaseIndex({ users, statuses, filters, breadcrumbs, title, role, routePrefix }: BaseIndexProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isResetErrorOpen, setIsResetErrorOpen] = useState(false);
    const [show, setShow] = useState<string>(filters.show || '10');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status || '');

    useEffect(() => {
        setSelectedIds([]);
    }, [show, statusFilter, filters.search, filters.sort, filters.direction]);

    const handleResetPassword = async (user: User) => {
        if (!user.phone) {
            setIsResetErrorOpen(true);
            return;
        }
        router.put(
            route(`${routePrefix}.reset-password`, user.id),
            {},
            {
                onSuccess: () => {
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
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = users.data.filter((a) => selectedIds.includes(a.id));

        const statusMap: Record<string, string> = {
            active: 'Aktif',
            inactive: 'Tidak Aktif'
        };

        const getExportConfig = (roleValue: string) => {
            switch (roleValue) {
                case 'parent':
                    return {
                        headers: ['Nama Lengkap', 'Username', 'Pekerjaan', 'Nomor Telepon', 'Email', 'Alamat', 'Status'],
                        baseFilename: 'data-orang-tua',
                        getRow: (user: any) => ({
                            'Nama Lengkap': user.full_name || '-',
                            Username: user.username || '-',
                            Pekerjaan: user.job || '-',
                            'Nomor Telepon': { v: user.phone || '-', t: 's' },
                            Email: user.email || '-',
                            Alamat: user.address || '-',
                            Status: (statusMap as any)[user.status] || (user.status || '-'),
                        }),
                    };
                case 'teacher':
                    return {
                        headers: ['Nama Lengkap', 'Username', 'NIP', 'Posisi/Jabatan', 'Nomor Telepon', 'Email', 'Alamat', 'Status'],
                        baseFilename: 'data-guru',
                        getRow: (user: any) => ({
                            'Nama Lengkap': user.full_name || '-',
                            Username: user.username || '-',
                            NIP: { v: user.nip || '-', t: 's' },
                            'Posisi/Jabatan': user.position || '-',
                            'Nomor Telepon': { v: user.phone || '-', t: 's' },
                            Email: user.email || '-',
                            Alamat: user.address || '-',
                            Status: (statusMap as any)[user.status] || (user.status || '-'),
                        }),
                    };
                case 'admin':
                    return {
                        headers: ['Nama Lengkap', 'Username', 'NIP', 'Posisi/Jabatan', 'Nomor Telepon', 'Email', 'Alamat', 'Status'],
                        baseFilename: 'data-admin',
                        getRow: (user: any) => ({
                            'Nama Lengkap': user.full_name || '-',
                            Username: user.username || '-',
                            NIP: { v: user.nip || '-', t: 's' },
                            'Posisi/Jabatan': user.position || '-',
                            'Nomor Telepon': { v: user.phone || '-', t: 's' },
                            Email: user.email || '-',
                            Alamat: user.address || '-',
                            Status: (statusMap as any)[user.status] || (user.status || '-'),
                        }),
                    };
                default:
                    return {
                        headers: ['Nama Lengkap', 'Username', 'Nomor Telepon', 'Email', 'Alamat', 'Role', 'Status'],
                        baseFilename: 'data-user',
                        getRow: (user: any) => ({
                            'Nama Lengkap': user.full_name || '-',
                            Username: user.username || '-',
                            'Nomor Telepon': { v: user.phone || '-', t: 's' },
                            Email: user.email || '-',
                            Alamat: user.address || '-',
                            Role: user.role?.name || '-',
                            Status: (statusMap as any)[user.status] || (user.status || '-'),
                        }),
                    };
            }
        };

        const config = getExportConfig(role.value);
        const filename = `${config.baseFilename}.xlsx`;
        const worksheetData = selectedData.map((user) => config.getRow(user));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const colWidths = config.headers.map(() => ({ width: 20 }));
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, filename);

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

    const handleSegmentClick = (status: string) => {
        const value = status === 'all' ? '' : status;
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
        { key: 'phone', label: 'Telepon', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'active':
                return 'Aktif';
            case 'inactive':
                return 'Nonaktif';
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

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarGradientClass = (id: number): string => {
        return avatarGradients[id % avatarGradients.length];
    };

    const activeCount = users.data.filter((u) => u.status === 'active').length;
    const inactiveCount = users.data.filter((u) => u.status === 'inactive').length;

    const cardLabel = {
        admin: { total: 'Total Admin', active: 'Admin Aktif', inactive: 'Nonaktif', new: 'Baru Bulan Ini' },
        teacher: { total: 'Total Guru', active: 'Guru Aktif', inactive: 'Nonaktif', new: 'Baru Bulan Ini' },
        parent: { total: 'Total Orang Tua', active: 'Orang Tua Aktif', inactive: 'Nonaktif', new: 'Baru Bulan Ini' },
    }[role.value] || { total: 'Total', active: 'Aktif', inactive: 'Nonaktif', new: 'Baru Bulan Ini' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Toaster position="top-right" richColors />

<div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Data Pengguna
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">{title}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola akun {translateRoleName(role.name).toLowerCase()} sekolah
                            </p>
                        </div>
                        <button
                            onClick={() => openForm(null)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah {translateRoleName(role.name)}
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{users.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{cardLabel.total}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{activeCount > 0 ? Math.round((activeCount / users.total) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{cardLabel.active}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{inactiveCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Nonaktif</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{users.total > 0 ? 1 : 0}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.total > 0 ? 1 : 0}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{cardLabel.new}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-5">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau NIP..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => {
                                    setSelectedIds([]);
                                    router.get(
                                        route(`${routePrefix}.index`),
                                        { ...filters, search: e.target.value, show, status: statusFilter },
                                        { preserveState: true },
                                    );
                                }}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                                {[
                                    { value: '', label: 'Semua' },
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'inactive', label: 'Nonaktif' },
                                ].map((seg) => (
                                    <button
                                        key={seg.value}
                                        onClick={() => handleSegmentClick(seg.value || 'all')}
                                        className={`segment-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            statusFilter === seg.value
                                                ? 'active'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {seg.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <select
                                    value={show}
                                    onChange={handleShowChange}
                                    className="appearance-none pl-3.5 pr-9 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                                >
                                    <option value="10">10 data</option>
                                    <option value="25">25 data</option>
                                    <option value="50">50 data</option>
                                    <option value="all">Semua</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                disabled={selectedIds.length === 0}
                                onClick={exportSelected}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all ${
                                    selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            >
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Ekspor
                            </button>

                            {role.value !== 'admin' && (
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                                >
                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                    Impor
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={users.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? users.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(user) => (
                                <tr key={user.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(user.id)}
                                            onChange={() => toggleSelect(user.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    {(role.value === 'admin' || role.value === 'teacher') && (
                                        <td className="px-5 py-4">
                                            <div className="relative">
                                                <div className={`w-10 h-10 rounded-full ${getAvatarGradientClass(user.id)} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform`}>
                                                    {getInitials(user.full_name)}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${user.status === 'active' ? 'bg-emerald-500 status-pulse' : 'bg-slate-400'}`}></div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {(role.value !== 'admin' && role.value !== 'teacher') && (
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-full ${getAvatarGradientClass(user.id)} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform`}>
                                                        {getInitials(user.full_name)}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${user.status === 'active' ? 'bg-emerald-500 status-pulse' : 'bg-slate-400'}`}></div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {(role.value === 'admin' || role.value === 'teacher') && (
                                        <td className="px-5 py-4 text-muted-foreground font-mono text-xs tracking-wide">{user.nip || '-'}</td>
                                    )}
                                    <td className="px-5 py-4">
                                        {(role.value === 'admin' || role.value === 'teacher') && user.position ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                                {user.position}
                                            </span>
                                        ) : role.value === 'parent' ? (
                                            <span className="text-foreground">{user.job || '-'}</span>
                                        ) : null}
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground">{user.email || '-'}</td>
                                    <td className="px-5 py-4 text-muted-foreground">{user.phone || '-'}</td>
                                    <td className="px-5 py-4">
                                        {user.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openForm(user)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Reset Password</span>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setUserToDelete(user)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        <Pagination links={users.links} />
                    </div>

                </div>
            </div>

            <BaseForm
                key={selectedUser?.id || 'new'}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                user={selectedUser as any}
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
                message={<span>Nomor telepon belum ditentukan untuk pengguna ini</span>}
                buttons={[
                    {
                        label: 'OK',
                        onClick: () => setIsResetErrorOpen(false),
                        variant: 'neutral',
                    },
                ]}
            />

            {showImportModal && (
                <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} role={role} routePrefix={routePrefix} />
            )}
        </AppLayout>
    );
}
