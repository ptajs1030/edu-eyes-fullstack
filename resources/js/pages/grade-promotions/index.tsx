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
    attendanceModes: { value: string; label: string }[];
    filters: {
        sort?: string;
        direction?: 'asc' | 'desc';
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Kenaikan Kelas', href: '' }];

export default function GradePromotionIndex({ classGroups, nextAcademicYear, allCompleted, hasData, filters, attendanceModes }: Props) {
    const [attendanceMode, setAttendanceMode] = useState('per-subject');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
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
        { key: 'level', label: 'Level', sortable: true },
        { key: 'name', label: 'Kelas Asal', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'student_count', label: 'Jumlah Siswa', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const handleFinalize = () => {
        setShowConfirmModal(true);
    };

    const confirmFinalize = () => {
        router.post(
            route('migration.finalize'),
            {
                attendance_mode: attendanceMode,
            },
            {
                onSuccess: () => {
                    toast.success('Migrasi kelas berhasil difinalisasi');
                    setShowConfirmModal(false);
                },
            },
        );
    };

    const handlePopulate = () => {
        setIsPopulating(true);
        router.post(
            route('grade-promotions.populate'),
            {},
            {
                onFinish: () => setIsPopulating(false),
            },
        );
    };

    // console.log(group.class_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kenaikan Kelas" />
            <Toaster position="top-right" richColors />

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
                        className={`rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-600 ${
                            isPopulating ? 'cursor-not-allowed opacity-70' : ''
                        }`}
                    >
                        {isPopulating ? 'Memproses...' : 'Inisialisasi Data'}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Migrasi Kenaikan Kelas</h1>
                        <div className="text-sm text-gray-500">
                            Tahun Ajaran Baru: <span className="font-medium">{nextAcademicYear}</span>
                        </div>
                    </div>

                    <Table
                        headers={tableHeaders}
                        data={classGroups.map((group) => ({
                            ...group,
                            name: group.classroom.name,
                            level: group.classroom.level,
                        }))}
                        sortColumn={filters.sort ?? ''}
                        sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                        onSort={handleSortChange}
                        rowRender={(group) => (
                            <tr key={group.class_id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-sm">Level {group.classroom.level}</td>
                                <td className="p-4 text-sm">{group.classroom.name}</td>
                                <td className="p-4 text-sm">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                            group.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {group.status === 'completed' ? 'Selesai' : 'Draf'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{group.student_count} Siswa</td>
                                <td className="p-4 text-sm">
                                    <Link
                                        href={route('grade-promotions.show', group.class_id)}
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
                                    className={`rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 ${
                                        !allCompleted ? 'cursor-not-allowed opacity-50' : ''
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

            {/* Confirmation Modal */}
            <ActionModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Konfirmasi Finalisasi"
                message="Anda yakin ingin memfinalisasi kenaikan kelas? Proses ini tidak dapat dibatalkan dan akan mempengaruhi data siswa."
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setShowConfirmModal(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya, Finalisasi',
                        onClick: confirmFinalize,
                        variant: 'danger',
                    },
                ]}
            />
        </AppLayout>
    );
}
