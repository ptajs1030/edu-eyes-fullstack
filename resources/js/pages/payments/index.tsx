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
    const { payments, filters } = usePage<{
        payments: PaginatedResponse<Payment, Link>;
        filters: { search?: string; sort?: string; direction?: string };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [paymentToNotify, setPaymentToNotify] = useState<Payment | null>(null);

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

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = payments.data.filter((a) => selectedIds.includes(a.id));
        const headers = ['Judul', 'Nominal', 'Batas Waktu'];

        // Helper untuk escape nilai CSV
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
            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari tagihan..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('payments.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1 text-sm"
                        />
                        {/* <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${
                                selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'
                            }`}
                        >
                            Ekspor Data
                        </button> */}
                    </div>
                    <Link
                        href={route('payments.create')}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Buat Tagihan
                    </Link>
                </div>

                <Table
                    headers={tableHeaders}
                    data={payments.data}
                    sortColumn={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? payments.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(payment) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(payment.id)} onChange={() => toggleSelect(payment.id)} />
                            </td>
                            <td className="p-3 text-sm">{payment.title}</td>
                            <td className="p-3 text-sm">{payment.academic_year.title}</td>
                            <td className="p-3 text-sm">Rp {payment.nominal.toLocaleString('id-ID')}</td>
                            <td className="p-3 text-sm"> {format(parseISO(payment.due_date), 'dd MMM yyyy', { locale: id })}</td>
                            <td className="flex gap-2 p-3">
                                {/* Edit Button */}

                                <Link
                                    href={route('payments.edit', payment.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-600"
                                >
                                    Edit
                                </Link>

                                {/* Detail Button (selalu aktif) */}
                                <Link
                                    href={route('payments.show', payment.id)}
                                    className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-sky-600"
                                >
                                    Detail
                                </Link>

                                <button
                                    onClick={() => setPaymentToNotify(payment)}
                                    disabled={isPaymentExpired(payment)}
                                    className={`rounded px-3 py-1 text-sm font-medium text-white ${
                                        isPaymentExpired(payment) ? 'cursor-not-allowed bg-sky-300' : 'bg-sky-500 hover:cursor-pointer'
                                    }`}
                                    title={isPaymentExpired(payment) ? 'Tagihan sudah melewati deadline' : 'Kirim notifikasi'}
                                >
                                    Kirim Notif
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={() => setPaymentToDelete(payment)}
                                    className={`rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-red-600`}
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                    emptyMessage="Tidak ada event yang ditemukan"
                />

                <Pagination links={payments.links} />

                <ActionModal
                    isOpen={!!paymentToDelete}
                    onClose={() => setPaymentToDelete(null)}
                    title="Konfirmasi Hapus"
                    message={`Apakah Anda yakin ingin menghapus event "${paymentToDelete?.title}"?`}
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setPaymentToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Ya, Hapus',
                            onClick: () => paymentToDelete && handleDelete(paymentToDelete.id),
                            variant: 'danger',
                        },
                    ]}
                />

                <ActionModal
                    isOpen={!!paymentToNotify}
                    onClose={() => setPaymentToNotify(null)}
                    title="Konfirmasi Notifikasi"
                    message={
                        <span>
                            Apakah Anda yakin ingin mengirim notifikasi untuk tagihan <strong>{paymentToNotify?.title}</strong>?
                            <br />
                            <small className="text-gray-500">Notifikasi akan dikirim ke orang tua siswa yang belum melakukan pembayaran.</small>
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setPaymentToNotify(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Kirim Notifikasi',
                            onClick: () => {
                                if (paymentToNotify) {
                                    router.post(route('payments.resend-notification', paymentToNotify.id));
                                    setPaymentToNotify(null);
                                }
                            },
                            variant: 'primary',
                        },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
