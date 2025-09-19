import ConfirmationModal from '@/components/confirmation-modal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Student {
    id: number;
    full_name: string;
    nis: string | null;
    classroom: {
        name: string;
    };
}

interface Payment {
    id: number;
    academic_year: { title: string };
    title: string;
    description?: string;
    nominal: number;
    due_date: string;
    assignments: Array<{ student: Student }>;
}

interface Transaction {
    id: number;
    student: Student | null;
    payment: Payment;
    payment_date: string | null;
}

interface Props {
    transaction: Transaction[];
    payment: Payment;
}

const breadcrumbs = (paymentTitle: string): BreadcrumbItem[] => [{ title: 'Tagihan', href: '/payments' }, { title: paymentTitle }];

export default function PaymentDetail({ transaction, payment }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [editedTransactions, setEditedTransactions] = useState<Record<number, string>>({});
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showBackModal, setShowBackModal] = useState(false);

    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);

    const safeTransactions = transaction.filter((t) => t.student !== null);

    const combinedData = payment.assignments.map((assignment) => {
        const student = assignment.student;
        const foundTransaction = safeTransactions.find((t) => t.student && t.student.id === student.id);

        return {
            student,
            transaction: foundTransaction || {
                id: 0,
                student,
                payment,
                payment_date: null,
            },
        };
    });

    const [isSaving, setIsSaving] = useState(false);

    const confirmSave = () => {
        setShowSaveModal(false);
        setIsSaving(true);

        const updates = Object.entries(editedTransactions).map(([id, status]) => ({
            id: Number(id),
            status,
        }));

        router.patch(
            route('payments.updateTransactions', payment.id),
            {
                transaction_ids: updates.map((u) => u.id),
                status: updates[0]?.status,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setEditedTransactions({});
                    toast.success('Perubahan berhasil disimpan');
                },
                onError: () => setIsSaving(false),
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const confirmBack = () => {
        setShowBackModal(false);
        router.visit(route('payments.index'));
    };

    const exportToCSV = () => {
        const headers = ['Nama', 'NIS', 'Kelas', 'Tanggal Pembayaran', 'Status'];

        const rows = combinedData.map(({ student, transaction }) => {
            const status = transaction.payment_date ? 'Lunas' : 'Belum Lunas';
            return [student.full_name, student.nis || '-', student.classroom?.name || '-', transaction.payment_date || '-', status];
        });

        const csvContent = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payment_${payment.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(payment.title)}>
            <Head title={`Detail Tagihan - ${payment.title}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                {/* Info Tagihan */}
                <div className="rounded-lg border p-4">
                    <h1 className="mb-4 text-2xl font-bold">{payment.title}</h1>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <p className="font-semibold">Tenggat Pembayaran</p>
                            <p className="mt-1">{new Date(payment.due_date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Nominal</p>
                            <p className="mt-1">Rp {payment.nominal.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Deskripsi</p>
                            <p className="mt-1">{payment.description || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Tabel */}
                <div className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Daftar Tagihan</h2>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-600">Total: {payment.assignments.length} peserta</div>
                            <button
                                onClick={exportToCSV}
                                className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600"
                            >
                                Ekspor CSV
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pembayaran</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {combinedData.map(({ student, transaction }) => {
                                    const currentStatus = transaction.payment_date ? 'lunas' : 'belum';
                                    const editedStatus = editedTransactions[transaction.id];
                                    const effectiveStatus = editedStatus ?? currentStatus;

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.full_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{student.nis || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{student.classroom?.name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{transaction.payment_date || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex flex-col">
                                                    <select
                                                        value={effectiveStatus}
                                                        onChange={(e) =>
                                                            setEditedTransactions({
                                                                ...editedTransactions,
                                                                [transaction.id]: e.target.value,
                                                            })
                                                        }
                                                        className={`rounded border px-2 py-1 text-sm ${
                                                            effectiveStatus === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        <option value="belum">Belum Lunas</option>
                                                        <option value="lunas">Lunas</option>
                                                    </select>
                                                    {editedStatus && editedStatus !== currentStatus && (
                                                        <span className="mt-1 text-xs text-orange-600">Perubahan belum disimpan</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="mt-4 flex gap-3">
                            {Object.keys(editedTransactions).length > 0 && (
                                <button
                                    disabled={isSaving}
                                    onClick={() => setShowSaveModal(true)}
                                    className={`rounded px-4 py-2 text-white ${isSaving ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                                >
                                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (Object.keys(editedTransactions).length > 0) {
                                        setShowBackModal(true);
                                    } else {
                                        router.visit(route('payments.index'));
                                    }
                                }}
                                className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                            >
                                Kembali ke Daftar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showSaveModal}
                title="Konfirmasi Simpan"
                message="Apakah Anda yakin ingin menyimpan perubahan ini?"
                onConfirm={confirmSave}
                onCancel={() => setShowSaveModal(false)}
            />

            <ConfirmationModal
                isOpen={showBackModal}
                title="Konfirmasi Kembali"
                message="Ada perubahan yang belum disimpan. Yakin mau kembali ke daftar?"
                onConfirm={confirmBack}
                onCancel={() => setShowBackModal(false)}
            />
        </AppLayout>
    );
}
