import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Calendar, CheckCircle2, CreditCard, FileText, Loader2, Play, Terminal, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import SettingFormModal from './form';

type Setting = {
    id: number;
    key: string;
    value: string;
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
        title: 'Pengaturan Sekolah',
        href: '/school-settings',
    },
];

export default function SettingIndex() {
    const { settings, filters } = usePage<{
        settings: PaginatedResponse<Setting, Link>;
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
    const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        status: 'loading' | 'success' | 'error';
        title: string;
        message: string;
        output?: string;
    }>({
        isOpen: false,
        status: 'loading',
        title: '',
        message: '',
    });

    const handleRunAction = async (routeName: string, title: string) => {
        setActionModal({
            isOpen: true,
            status: 'loading',
            title: title,
            message: 'Menghubungkan ke server dan menjalankan perintah Artisan...',
        });

        try {
            const response = await axios.post(route(routeName));
            if (response.data.success) {
                setActionModal({
                    isOpen: true,
                    status: 'success',
                    title: title,
                    message: response.data.message || 'Perintah berhasil dijalankan.',
                    output: response.data.output,
                });
            } else {
                setActionModal({
                    isOpen: true,
                    status: 'error',
                    title: title,
                    message: response.data.message || 'Perintah gagal dijalankan.',
                    output: response.data.output,
                });
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Koneksi ke server terputus.';
            const errorOutput = error.response?.data?.output || error.response?.data?.message || error.message || '';
            setActionModal({
                isOpen: true,
                status: 'error',
                title: title,
                message: 'Gagal mengeksekusi perintah.',
                output: `Error: ${errorMsg}\n\nStack:\n${errorOutput}`,
            });
        }
    };

    const openForm = (setting: Setting) => {
        setSelectedSetting(setting);
        setIsFormOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = settings.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Key,Value\n`;
        const csv = selectedData.map((a) => `${a.key},${a.value}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'general-settngs.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data pengaturan sekolah`, {
            description: 'File CSV telah didownload otomatis'
        });
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('school-settings.index'),
            { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'title', label: 'Pengaturan', sortable: true },
        { key: 'value', label: 'Nilai', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari pengaturan..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('school-settings.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1 text-sm"
                        />
                        {/* <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer'
                                }`}
                        >
                            Ekspor Data
                        </button> */}
                    </div>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={settings.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? settings.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(setting) => (
                        <tr key={setting.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(setting.id)} onChange={() => toggleSelect(setting.id)} />
                            </td>
                            <td className="p-3 text-sm">{setting.title}</td>
                            <td className="p-3 text-sm">
                                {setting.value}
                                {(setting.key === 'late_tolerance' || setting.key === 'early_tolerance') && ' Menit'}
                                {(setting.key === 'payment_reminder_days' || setting.key === 'task_reminder_days') && ' Hari'}
                            </td>
                            <td className="flex gap-2 p-3">
                                <button
                                    onClick={() => openForm(setting)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={settings.links} />

                {/* Modal */}
                <SettingFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} setting={selectedSetting} />
            </div>

            {/* Aksi Pengujian / Demo */}
            <div className="mt-6 flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg border border-gray-100">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-gray-700" />
                        Aksi Demo & Pengujian (Artisan Commands)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Jalankan tugas terjadwal (cron job) secara manual di bawah ini untuk menguji fungsionalitas aplikasi secara langsung tanpa harus menunggu jadwal cron.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Action 1: Shifting Attendance */}
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/30 hover:border-blue-500 hover:bg-blue-50/5 transition-all duration-200">
                        <div>
                            <div className="p-2 w-fit bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm mt-3">Generate Absensi Shifting</h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Menghasilkan log absensi harian (status awal Alpha) bagi semua siswa yang memiliki jadwal shift hari ini.
                            </p>
                        </div>
                        <button
                            onClick={() => handleRunAction('school-settings.actions.generate-shifting', 'Generate Absensi Shifting')}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition-all shadow-sm cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Jalankan
                        </button>
                    </div>

                    {/* Action 2: Event Attendance */}
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/30 hover:border-blue-500 hover:bg-blue-50/5 transition-all duration-200">
                        <div>
                            <div className="p-2 w-fit bg-amber-50 text-amber-600 rounded-lg">
                                <Award className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm mt-3">Generate Absensi Kegiatan</h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Menghasilkan log absensi harian (status awal Alpha) bagi siswa yang terdaftar di event/kegiatan hari ini.
                            </p>
                        </div>
                        <button
                            onClick={() => handleRunAction('school-settings.actions.generate-event', 'Generate Absensi Kegiatan')}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition-all shadow-sm cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Jalankan
                        </button>
                    </div>

                    {/* Action 3: Check Payment Deadlines */}
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/30 hover:border-blue-500 hover:bg-blue-50/5 transition-all duration-200">
                        <div>
                            <div className="p-2 w-fit bg-emerald-50 text-emerald-600 rounded-lg">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm mt-3">Cek Deadline Pembayaran</h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Memeriksa tenggat tagihan aktif dan otomatis mengirim notifikasi pengingat Firebase push ke perangkat orang tua.
                            </p>
                        </div>
                        <button
                            onClick={() => handleRunAction('school-settings.actions.check-payment-deadlines', 'Cek Deadline Pembayaran')}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition-all shadow-sm cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Jalankan
                        </button>
                    </div>

                    {/* Action 4: Check Task Deadlines */}
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/30 hover:border-blue-500 hover:bg-blue-50/5 transition-all duration-200">
                        <div>
                            <div className="p-2 w-fit bg-indigo-50 text-indigo-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm mt-3">Cek Deadline Tugas</h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Memeriksa batas akhir pengumpulan tugas dan otomatis mengirim notifikasi pengingat Firebase push ke orang tua.
                            </p>
                        </div>
                        <button
                            onClick={() => handleRunAction('school-settings.actions.check-task-deadlines', 'Cek Deadline Tugas')}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition-all shadow-sm cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Jalankan
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Loading/Hasil Aksi Kustom */}
            <AnimatePresence>
                {actionModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-blue-600" />
                                    {actionModal.title}
                                </h3>
                                {actionModal.status !== 'loading' && (
                                    <button
                                        onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                        className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold cursor-pointer"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                {actionModal.status === 'loading' && (
                                    <div className="flex flex-col items-center py-6">
                                        <div className="relative flex items-center justify-center">
                                            {/* Pulsing ring outer */}
                                            <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 animate-ping opacity-75"></div>
                                            {/* Inner spinning loader */}
                                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                        </div>
                                        <h4 className="mt-6 font-medium text-gray-900">Sedang Memproses...</h4>
                                        <p className="mt-2 text-sm text-gray-500 max-w-md">
                                            Sistem sedang menjalankan perintah Artisan backend. Mohon tunggu beberapa saat.
                                        </p>
                                    </div>
                                )}

                                {actionModal.status === 'success' && (
                                    <div className="flex flex-col items-center w-full py-4">
                                        <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                                        <h4 className="mt-4 font-semibold text-gray-900 text-lg">Eksekusi Berhasil!</h4>
                                        <p className="mt-1 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
                                            {actionModal.message}
                                        </p>

                                        {actionModal.output && (
                                            <div className="mt-6 w-full text-left">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                                    Console Output:
                                                </span>
                                                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60 shadow-inner leading-relaxed whitespace-pre-wrap">
                                                    {actionModal.output}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {actionModal.status === 'error' && (
                                    <div className="flex flex-col items-center w-full py-4">
                                        <XCircle className="w-16 h-16 text-rose-500 animate-pulse" />
                                        <h4 className="mt-4 font-semibold text-gray-900 text-lg">Eksekusi Gagal</h4>
                                        <p className="mt-1 text-sm text-rose-600 font-medium bg-rose-50 px-3 py-1 rounded-full">
                                            {actionModal.message}
                                        </p>

                                        {actionModal.output && (
                                            <div className="mt-6 w-full text-left">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                                    Error Log:
                                                </span>
                                                <div className="bg-gray-950 text-rose-400 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-60 shadow-inner whitespace-pre-wrap">
                                                    {actionModal.output}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-end">
                                <button
                                    disabled={actionModal.status === 'loading'}
                                    onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                    className={`px-5 py-2 text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none ${
                                        actionModal.status === 'loading'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-900 text-white hover:bg-gray-800 hover:cursor-pointer'
                                    }`}
                                >
                                    Tutup
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
