import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Calendar, CheckCircle2, CreditCard, FileText, Loader2, Play, Settings, Terminal, XCircle } from 'lucide-react';
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

    const handleSortChange = (column: string) => {
        router.get(
            route('school-settings.index'),
            { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' },
            { preserveState: true },
        );
    };

    const tableHeaders = [
        { key: 'key', label: 'Pengaturan', sortable: true },
        { key: 'value', label: 'Nilai', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const numericKeys = settings.data.filter((s) => ['late_tolerance', 'early_tolerance', 'payment_reminder_days', 'task_reminder_days'].includes(s.key)).length;
    const textKeys = settings.data.length - numericKeys;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan" />
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Konfigurasi
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Pengaturan Sekolah</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola pengaturan dan konfigurasi aplikasi sekolah
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    Total
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{settings.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Pengaturan</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    {textKeys}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{textKeys}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pengaturan Teks</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Terminal className="w-5 h-5 text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    {numericKeys}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{numericKeys}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pengaturan Numerik</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-4">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari pengaturan..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => router.get(route('school-settings.index'), { search: e.target.value }, { preserveState: true })}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-5">
                        <Table
                            headers={tableHeaders}
                            data={settings.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? settings.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(setting) => (
                                <tr key={setting.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(setting.id)}
                                            onChange={() => toggleSelect(setting.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                                <Settings className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm">
                                                    {setting.key}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-muted-foreground font-mono">
                                            {setting.value}
                                            {(setting.key === 'late_tolerance' || setting.key === 'early_tolerance') && <span className="text-xs ml-1 text-slate-400">Menit</span>}
                                            {(setting.key === 'payment_reminder_days' || setting.key === 'task_reminder_days') && <span className="text-xs ml-1 text-slate-400">Hari</span>}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openForm(setting)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        <Pagination links={settings.links} />
                    </div>

                    {/* SettingFormModal */}
                    <SettingFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} setting={selectedSetting} />

                    {/* Artisan Commands */}
                    <div className="mt-8 animate-fade-in-up stagger-6">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/40 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                    Command
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-foreground dark:text-white flex items-center gap-2 mt-1">
                                <Terminal className="w-5 h-5 text-amber-500" />
                                Aksi Demo & Pengujian (Artisan Commands)
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Jalankan tugas terjadwal (cron job) secara manual di bawah ini untuk menguji fungsionalitas aplikasi secara langsung tanpa harus menunggu jadwal cron.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Action 1: Shifting Attendance */}
                                <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/30 dark:bg-slate-700/10 hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition-all duration-200">
                                    <div>
                                        <div className="p-2 w-fit bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-foreground dark:text-white text-sm mt-3">Generate Absensi Shifting</h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                                <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/30 dark:bg-slate-700/10 hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition-all duration-200">
                                    <div>
                                        <div className="p-2 w-fit bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-foreground dark:text-white text-sm mt-3">Generate Absensi Kegiatan</h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                                <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/30 dark:bg-slate-700/10 hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition-all duration-200">
                                    <div>
                                        <div className="p-2 w-fit bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-foreground dark:text-white text-sm mt-3">Cek Deadline Pembayaran</h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                                <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/30 dark:bg-slate-700/10 hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition-all duration-200">
                                    <div>
                                        <div className="p-2 w-fit bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-foreground dark:text-white text-sm mt-3">Cek Deadline Tugas</h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
