import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Payment {
    id: number;
    academic_year: {
        title: string;
    };
    title: string;
    description?: string;
    nominal: number;
    due_date: string;
}

interface PaginatedResponse<T, L> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: L[];
}

interface Link {
    url: string | null;
    label: string;
    active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tagihan',
        href: '/payments',
    },
];

export default function PaymentIndex() {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [paymentToNotifySync, setPaymentToNotifySync] = useState<Payment | null>(null);
    const [paymentToNotifyAsync, setPaymentToNotifyAsync] = useState<Payment | null>(null);
    const { payments, filters, academicYears } = usePage<{
        payments: PaginatedResponse<Payment, Link>;
        filters: { search?: string; sort?: string; direction?: string; academic_year?: string };
        academicYears: { id: number; title: string }[];
    }>().props;

    const academicYearOptions = Array.isArray(academicYears) ? academicYears : [];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = (id: number) => {
        router.delete(`payments/${id}`, {
            onSuccess: () => {
                setPaymentToDelete(null);
                router.reload();
            },
        });
    };

    const handleAcademicYearChange = (academicYearId: string) => {
        router.get(
            route('payments.index'),
            {
                ...filters,
                academic_year: academicYearId || null,
            },
            { preserveState: true },
        );
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = payments.data.filter((a) => selectedIds.includes(a.id));
        const headers = ['Judul', 'Nominal', 'Batas Waktu'];

        const escapeCSV = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

        const rows = selectedData.map((a) => [escapeCSV(a.title), escapeCSV(a.nominal), escapeCSV(a.due_date)]);
        const csvContent = headers.map(escapeCSV).join(',') + '\r\n' + rows.map((row) => row.join(',')).join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'payments.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Berhasil mengekspor ${selectedData.length} data tagihan`, {
            description: 'File CSV telah didownload otomatis',
        });
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('payments.index'),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    const isPaymentExpired = (payment: Payment) => {
        const now = new Date();
        const dueDate = new Date(payment.due_date);
        dueDate.setHours(23, 59, 59, 999);
        return now > dueDate;
    };

    const totalNominal = payments.data.reduce((sum, p) => sum + p.nominal, 0);
    const expiredCount = payments.data.filter((p) => isPaymentExpired(p)).length;

    const tableHeaders = [
        { key: 'title', label: 'Tagihan', sortable: true },
        { key: 'academic_year.title', label: 'Tahun Ajaran', sortable: false },
        { key: 'nominal', label: 'Nominal', sortable: true },
        { key: 'due_date', label: 'Batas Waktu', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tagihan" />
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Keuangan
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Tagihan</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola tagihan pembayaran sekolah
                            </p>
                        </div>
                        <Link
                            href={route('payments.create')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Buat Tagihan
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{payments.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{payments.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Tagihan</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                {totalNominal > 0 && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                        </svg>
                                        +{Math.round((totalNominal / (totalNominal || 1)) * 100)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {totalNominal.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Nominal</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{expiredCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{expiredCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kadaluwarsa</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-5">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari tagihan..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => router.get(route('payments.index'), { search: e.target.value }, { preserveState: true })}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={filters.academic_year || ''}
                                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                                    className="appearance-none input-glow px-4 py-2.5 pr-10 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white outline-none transition-all cursor-pointer"
                                >
                                    <option value="">Tahun Ajaran</option>
                                    {academicYearOptions.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            {selectedIds.length > 0 && (
                                <button
                                    onClick={exportSelected}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-sm font-semibold rounded-xl hover:bg-primary/20 dark:hover:bg-primary/30 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Ekspor
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={payments.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? payments.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(payment) => (
                                <tr key={payment.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(payment.id)}
                                            onChange={() => toggleSelect(payment.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{payment.title}</p>
                                        {payment.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{payment.description}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                            {payment.academic_year.title}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground">Rp {payment.nominal.toLocaleString('id-ID')}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isPaymentExpired(payment)
                                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isPaymentExpired(payment) ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                            {format(parseISO(payment.due_date), 'dd MMM yyyy', { locale: id })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <Link
                                                    href={route('payments.edit', payment.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Detail</span>
                                                <Link
                                                    href={route('payments.show', payment.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Notif Sync</span>
                                                <button
                                                    onClick={() => setPaymentToNotifySync(payment)}
                                                    disabled={isPaymentExpired(payment)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                        isPaymentExpired(payment)
                                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Notif Async</span>
                                                <button
                                                    onClick={() => setPaymentToNotifyAsync(payment)}
                                                    disabled={isPaymentExpired(payment)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                        isPaymentExpired(payment)
                                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M12 6v.01M12 9v.01M12 12v.01M12 15v.01M12 18v.01" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setPaymentToDelete(payment)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            emptyMessage="Tidak ada tagihan yang ditemukan"
                        />
                        <Pagination links={payments.links} />
                    </div>

                </div>
            </div>

            <ActionModal
                isOpen={!!paymentToDelete}
                onClose={() => setPaymentToDelete(null)}
                title="Konfirmasi Penghapusan"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus tagihan <strong>{paymentToDelete?.title}</strong>?
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setPaymentToDelete(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Hapus',
                        onClick: () => {
                            if (paymentToDelete) {
                                handleDelete(paymentToDelete.id);
                                setPaymentToDelete(null);
                            }
                        },
                        variant: 'danger',
                    },
                ]}
            />

            <ActionModal
                isOpen={!!paymentToNotifySync}
                onClose={() => setPaymentToNotifySync(null)}
                title="Konfirmasi Notifikasi Sync"
                message={
                    <span>
                        Apakah Anda yakin ingin mengirim notifikasi <strong>SYNC</strong> untuk tagihan <strong>{paymentToNotifySync?.title}</strong>?
                        <br />
                        <small className="text-gray-500">
                            Notifikasi akan dikirim secara langsung dan mungkin membutuhkan waktu lebih lama.
                        </small>
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setPaymentToNotifySync(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Kirim Sync',
                        onClick: () => {
                            if (paymentToNotifySync) {
                                router.post(route('payments.sync-resend-notification', paymentToNotifySync.id));
                                setPaymentToNotifySync(null);
                            }
                        },
                        variant: 'primary',
                    },
                ]}
            />

            <ActionModal
                isOpen={!!paymentToNotifyAsync}
                onClose={() => setPaymentToNotifyAsync(null)}
                title="Konfirmasi Notifikasi Async"
                message={
                    <span>
                        Apakah Anda yakin ingin mengirim notifikasi <strong>ASYNC</strong> untuk tagihan <strong>{paymentToNotifyAsync?.title}</strong>?
                        <br />
                        <small className="text-gray-500">
                            Notifikasi akan dikirim melalui queue job dan lebih cepat untuk proses yang banyak.
                        </small>
                    </span>
                }
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setPaymentToNotifyAsync(null),
                        variant: 'neutral',
                    },
                    {
                        label: 'Kirim Async',
                        onClick: () => {
                            if (paymentToNotifyAsync) {
                                router.post(route('payments.async-resend-notification', paymentToNotifyAsync.id));
                                setPaymentToNotifyAsync(null);
                            }
                        },
                        variant: 'primary',
                    },
                ]}
            />
        </AppLayout>
    );
}
