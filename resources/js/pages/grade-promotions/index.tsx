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
                // hide banner & dismiss toasts yang mungkin tertinggal
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

    // useEffect(() => {
    //     const key = 'gp:index:flashShown';
    //     const msg = flash?.success ?? flash?.error ?? '';

    //     if (!msg) return;

    //     // Hanya tampilkan jika pesan berbeda dari yang sudah pernah ditampilkan pada visit ini
    //     const already = sessionStorage.getItem(key) === msg;
    //     if (!already) {
    //         if (flash?.success) toast.success(flash.success);
    //         if (flash?.error) toast.error(flash.error);
    //         sessionStorage.setItem(key, msg);
    //     }
    // }, [flash]);

    useEffect(() => {
        const markPop = () => sessionStorage.setItem('gp:index:suppressBannerOnce', '1');
        window.addEventListener('popstate', markPop);
        return () => window.removeEventListener('popstate', markPop);
    }, []);

    useEffect(() => {
        // Jika barusan back/forward, jangan render banner satu kali
        if (sessionStorage.getItem('gp:index:suppressBannerOnce') === '1') {
            setBanner(null);
            sessionStorage.removeItem('gp:index:suppressBannerOnce'); // habiskan sekali pakai
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
        setShowPopulateModal(false); // Tutup modal

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

    if (!hasActiveAcademicYear) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Kenaikan Kelas" />
                <Toaster position="top-right" richColors />

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
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kenaikan Kelas" />
            <Toaster position="top-right" richColors />
            <div className="px-6 pt-4">
                <FlashBanner />
            </div>

            {!hasActiveAcademicYear}
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
                <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Migrasi Kenaikan Kelas</h1>
                        <button
                            onClick={handleReset}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-red-700"
                        >
                            Reset Proses
                        </button>
                    </div>

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
                            <tr key={group.class_id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-sm">Tingkat {group.classroom?.level || '-'}</td>
                                <td className="p-4 text-sm">{group.classroom?.name || '-'}</td>
                                <td className="p-4 text-sm">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${group.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {group.status === 'completed' ? 'Selesai' : 'Draf'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{group.student_count} Siswa</td>
                                <td className="p-4 text-sm">
                                    <Link
                                        href={route('grade-promotions.show', group.class_id)}
                                        onClick={() => sessionStorage.setItem('gp:index:suppressBannerOnce', '1')}
                                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Atur Siswa
                                    </Link>
                                </td>
                            </tr>
                        )}
                    />

                    {/* Finalization Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">Finalisasi Kenaikan Kelas</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tahun Ajaran Baru</label>
                                <input
                                    type="text"
                                    value={nextAcademicYear}
                                    disabled
                                    className="mt-1 block w-full rounded-md border bg-gray-100 p-2 shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mode Absensi</label>
                                <select
                                    value={attendanceMode}
                                    onChange={(e) => setAttendanceMode(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
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
                                    className={`rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 ${!allCompleted ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'
                                        }`}
                                >
                                    Finalisasi
                                </button>
                            </div>
                        </div>
                        {!allCompleted && (
                            <p className="mt-2 text-sm text-yellow-600">* Semua kelas harus berstatus "Selesai" sebelum melakukan finalisasi</p>
                        )}
                    </div>
                </div>
            )}

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
