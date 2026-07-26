import ActionModal from '@/components/action-modal';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface ClassGroup {
    class_id: number;
    status: string;
    student_count: number;
    classroom: {
        id: number;
        name: string;
        level: number;
    };
}

interface Props {
    classGroups: ClassGroup[];
    nextAcademicYear: string;
    allCompleted: boolean;
    hasData: boolean;
    hasActiveAcademicYear: boolean;
    attendanceModes: { value: string; label: string }[];
    filters: {
        sort?: string;
        direction?: 'asc' | 'desc';
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Kenaikan Kelas', href: '' }];
type Banner = { type: 'success' | 'error'; message: string } | null;

export default function GradePromotionIndex({
    classGroups,
    nextAcademicYear,
    allCompleted,
    hasData,
    hasActiveAcademicYear,
    filters,
    attendanceModes,
}: Props) {
    const [attendanceMode, setAttendanceMode] = useState('');
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showPopulateModal, setShowPopulateModal] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);
    const [banner, setBanner] = useState<Banner>(null);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
            const isBF = (e as any)?.persisted || nav?.type === 'back_forward';
            if (isBF) {
                setBanner(null);
                toast.dismiss?.();
            }
        };
        const onPageHide = () => {
            setBanner(null);
            toast.dismiss?.();
        };
        window.addEventListener('pageshow', onPageShow as any);
        window.addEventListener('pagehide', onPageHide);
        return () => {
            window.removeEventListener('pageshow', onPageShow as any);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, []);

    useEffect(() => {
        const markPop = () => sessionStorage.setItem('gp:index:suppressBannerOnce', '1');
        window.addEventListener('popstate', markPop);
        return () => window.removeEventListener('popstate', markPop);
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem('gp:index:suppressBannerOnce') === '1') {
            setBanner(null);
            sessionStorage.removeItem('gp:index:suppressBannerOnce');
            return;
        }

        const msg = flash?.success || flash?.error;
        if (msg) {
            setBanner({ type: flash?.success ? 'success' : 'error', message: msg });
        } else {
            setBanner(null);
        }
    }, [flash]);

    const handleSortChange = (column: string) => {
        const direction = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(
            route('grade-promotions.index'),
            {
                sort: column,
                direction,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const tableHeaders = [
        { key: 'level', label: 'Tingkat', sortable: true },
        { key: 'name', label: 'Kelas Asal', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'student_count', label: 'Jumlah Siswa', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const handleFinalize = () => {
        setShowFinalizeModal(true);
    };

    const confirmFinalize = () => {
        router.post(
            route('grade-promotions.finalize'),
            {
                attendance_mode: attendanceMode,
            },
            {
                onSuccess: () => {
                    setShowFinalizeModal(false);
                },
            },
        );
    };

    const handlePopulate = () => {
        setShowPopulateModal(true);
    };

    const confirmPopulate = () => {
        setIsPopulating(true);
        setShowPopulateModal(false);

        router.post(
            route('grade-promotions.populate'),
            {},
            {
                onFinish: () => setIsPopulating(false),
            },
        );
    };

    const handleReset = () => {
        setShowResetModal(true);
    };

    const confirmReset = () => {
        router.post(
            route('grade-promotions.reset'),
            {},
            {
                onSuccess: () => {
                    setShowResetModal(false);
                },
                onError: () => {
                    setShowResetModal(false);
                },
            },
        );
    };

    const FlashBanner = () =>
        banner ? (
            <div
                role="alert"
                className={`relative mb-4 flex items-start gap-3 rounded-lg border shadow-sm p-3 sm:p-4 ${banner.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                    }`}
            >
                <div className="shrink-0">
                    {banner.type === 'success' ? (
                        <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.707a1 1 0 00-1.414-1.414L9 8.586 7.707 7.293A1 1 0 006.293 8.707l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-6a1 1 0 00-1 1v2a1 1 0 002 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-medium">{banner.message}</p>
                </div>

                <button
                    onClick={() => setBanner(null)}
                    aria-label="Tutup notifikasi"
                    className="ml-2 rounded-md p-1.5 text-current/70 hover:bg-black/5 hover:text-current focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        ) : null;

    const totalKelas = classGroups.length;
    const selesaiCount = classGroups.filter((g) => g.status === 'completed').length;
    const drafCount = classGroups.filter((g) => g.status !== 'completed').length;

    if (!hasActiveAcademicYear) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Kenaikan Kelas" />
                <Toaster position="top-right" richColors />

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
                        <div className="flex flex-col items-center justify-center gap-6 rounded-xl bg-white p-8 text-center shadow-lg">
                            <div className="rounded-full bg-yellow-100 p-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 text-yellow-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Tahun Akademik Tidak Ditemukan</h2>
                            <p className="max-w-md text-sm text-gray-600">
                                Tidak ada tahun akademik yang aktif. Silakan set tahun akademik aktif terlebih dahulu sebelum melanjutkan proses kenaikan
                                kelas.
                            </p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kenaikan Kelas" />
            <Toaster position="top-right" richColors />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
                    <FlashBanner />

                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center gap-6 rounded-xl bg-white p-8 text-center shadow-lg">
                            <div className="rounded-full bg-blue-100 p-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">Mulai Proses Kenaikan Kelas</h2>
                            <p className="max-w-md text-sm text-gray-600">
                                Belum ada data migrasi yang tersedia. Klik tombol di bawah untuk menginisialisasi data siswa.
                            </p>
                            <button
                                onClick={handlePopulate}
                                disabled={isPopulating}
                                className={`rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-600 ${isPopulating ? 'cursor-not-allowed opacity-70' : ''
                                    }`}
                            >
                                {isPopulating ? 'Memproses...' : 'Inisialisasi Data'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Page Header */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                            Akademik
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Kenaikan Kelas</h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Migrasi data siswa untuk tahun ajaran baru
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                                    </svg>
                                    Reset Proses
                                </button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                            </svg>
                                        </div>
                                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                            </svg>
                                            +{totalKelas}%
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalKelas}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Kelas</p>
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
                                            +{totalKelas > 0 ? Math.round((selesaiCount / totalKelas) * 100) : 0}%
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{selesaiCount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Selesai</p>
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
                                            -{drafCount}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{drafCount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Draf</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="animate-fade-in-up stagger-6">
                                <Table
                                    headers={tableHeaders}
                                    data={classGroups.map((group) => ({
                                        ...group,
                                        name: group.classroom?.name,
                                        level: group.classroom?.level,
                                    }))}
                                    sortColumn={filters.sort ?? ''}
                                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                                    onSort={handleSortChange}
                                    rowRender={(group) => (
                                        <tr key={group.class_id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                                    Tingkat {group.classroom?.level || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {group.classroom?.name || '-'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                {group.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Selesai
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        Draf
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground text-sm">
                                                {group.student_count} Siswa
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <div className="has-tooltip relative">
                                                        <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Atur Siswa</span>
                                                        <Link
                                                            href={route('grade-promotions.show', group.class_id)}
                                                            onClick={() => sessionStorage.setItem('gp:index:suppressBannerOnce', '1')}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                />
                            </div>

                            {/* Finalization Section */}
                            <div className="animate-fade-in-up stagger-7 mt-6">
                                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow p-6">
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Finalisasi Kenaikan Kelas</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tahun Ajaran Baru</label>
                                            <input
                                                type="text"
                                                value={nextAcademicYear}
                                                disabled
                                                className="input-glow w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2.5 text-sm text-foreground dark:text-white outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mode Absensi</label>
                                            <select
                                                value={attendanceMode}
                                                onChange={(e) => setAttendanceMode(e.target.value)}
                                                className="input-glow w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-2.5 text-sm text-foreground dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                                            >
                                                <option value="">-- Select Mode --</option>
                                                {attendanceModes.map((mode) => (
                                                    <option key={mode.value} value={mode.value}>
                                                        {mode.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleFinalize}
                                                disabled={!allCompleted}
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] ${!allCompleted ? 'cursor-not-allowed opacity-50' : ''
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Finalisasi
                                            </button>
                                        </div>
                                    </div>
                                    {!allCompleted && (
                                        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                                            * Semua kelas harus berstatus "Selesai" sebelum melakukan finalisasi
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirmation Modal untuk Finalize */}
            <ActionModal
                isOpen={showFinalizeModal}
                onClose={() => setShowFinalizeModal(false)}
                title="Konfirmasi Finalisasi"
                message="Anda yakin ingin memfinalisasi kenaikan kelas? Proses ini tidak dapat dibatalkan dan akan mempengaruhi data siswa."
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setShowFinalizeModal(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Finalisasi',
                        onClick: confirmFinalize,
                        variant: 'danger',
                    },
                ]}
            />

            {/* Confirmation Modal untuk Reset */}
            <ActionModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Konfirmasi Reset Proses"
                message="Anda yakin ingin mereset seluruh proses kenaikan kelas? Semua data sementara akan dihapus permanen."
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setShowResetModal(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Reset',
                        onClick: confirmReset,
                        variant: 'danger',
                    },
                ]}
            />

            {/* Confirmation Modal untuk Populate */}
            <ActionModal
                isOpen={showPopulateModal}
                onClose={() => setShowPopulateModal(false)}
                title="Konfirmasi Inisialisasi Data"
                message="Anda yakin ingin menginisialisasi data kenaikan kelas?"
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setShowPopulateModal(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Inisialisasi',
                        onClick: confirmPopulate,
                        variant: 'primary',
                    },
                ]}
            />
        </AppLayout>
    );
}
