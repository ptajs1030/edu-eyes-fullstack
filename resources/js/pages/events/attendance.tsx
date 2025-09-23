import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import EditAttendanceModal from './editAttendance';

interface Student {
    id: number;
    full_name: string;
    nis: string | null;
    classroom: {
        name: string;
    };
}

interface Attendance {
    id?: number;
    student: Student;
    status: string;
    clock_in_hour: string | null;
    clock_out_hour: string | null;
    minutes_of_late: number | null;
    note: string | null;
    submit_date: string;
}

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    start_hour: string;
    end_hour: string;
    event_pics: Array<{ user: { full_name: string } }>;
    participants: Array<{ student: Student }>;
}

interface Props {
    event: Event;
    attendances: {
        data: Attendance[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    filters: {
        dates?: string[];
        limit?: string | number;
    };
    canEditAttendance: boolean;
}

const breadcrumbs = (eventName: string): BreadcrumbItem[] => [
    {
        title: 'Events',
        href: '/events',
    },
    {
        title: eventName,
    },
];

export default function EventAttendance({ event, attendances, canEditAttendance, filters }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    // Selalu gunakan filters.dates dari props
    const selectedDates = filters.dates ?? [];
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    // Limit langsung dari props
    const limit = typeof filters?.limit !== 'undefined' ? filters.limit : 10;
    // Reset selectedIds saat filter tanggal atau limit berubah
    useEffect(() => {
        setSelectedIds([]);
    }, [selectedDates, limit]);

    // Hapus sync state limit, gunakan filters.limit langsung
    // Export CSV
    const handleExportCSV = () => {
        if (selectedIds.length === 0) return;
        const selectedData = attendances.data.filter((a) => selectedIds.includes(a.id!));
        const headers = ['Tanggal', 'Nama', 'NIS', 'Kelas', 'Status', 'Jam Masuk', 'Jam Keluar', 'Keterlambatan', 'Catatan'];
        const rows = selectedData.map((a) => [
            a.submit_date,
            a.student.full_name,
            a.student.nis || '-',
            a.student.classroom?.name || '-',
            getStatusLabel(a.status),
            a.clock_in_hour || '-',
            a.clock_out_hour || '-',
            a.minutes_of_late !== null ? a.minutes_of_late : '-',
            a.note || '-',
        ]);
        // Escape only if needed, and join with comma
        const escape = (v: any) => {
            const s = String(v ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        };
        const csvContent = [headers, ...rows]
            .map(row => row.map(escape).join(',')).join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `attendance_event_${event.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(attendances.data.map((a) => a.id!));
        } else {
            setSelectedIds([]);
        }
    };
    // Handle select row
    const handleSelectRow = (id: number) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    };

    // Handle flash messages
    if (flash?.success) {
        toast.success(flash.success);
    } else if (flash?.error) {
        toast.error(flash.error);
    }

    const allDates = useMemo(() => {
        const dates = [];
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }, [event.start_date, event.end_date]);

    // Handle select/deselect all dates
    const toggleAllDates = () => {
        let newDates: string[];
        if (selectedDates.length === allDates.length) {
            newDates = [];
        } else {
            newDates = [...allDates];
        }
        // Kirim ke backend, reset ke page 1
        const params: any = { dates: newDates, limit, page: 1 };
        router.get(route('events.attendance', event.id), params, { preserveState: true });
    };

    // Handle individual date selection
    const toggleDate = (date: string) => {
        let newDates: string[];
        if (selectedDates.includes(date)) {
            newDates = selectedDates.filter((d) => d !== date);
        } else {
            newDates = [...selectedDates, date];
        }
        // Kirim ke backend, reset ke page 1
        const params: any = { dates: newDates, limit, page: 1 };
        router.get(route('events.attendance', event.id), params, { preserveState: true });
    };

    const handleUpdateAttendance = (formData: any) => {
        router.patch(route('events.attendance.update', event.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedAttendance(null);
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'present_in_tolerance':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'late':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'alpha':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present':
                return 'Hadir';
            case 'present_in_tolerance':
                return 'Hadir (Toleransi)';
            case 'late':
                return 'Terlambat';
            case 'alpha':
                return 'Tidak Masuk';
            default:
                return 'Belum Diisi';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(event.name)}>
            <Head title={`Detail Event - ${event.name}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                {/* Event Info */}
                <div className="rounded-lg border p-4">
                    <h1 className="mb-4 text-2xl font-bold">{event.name}</h1>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <p className="font-semibold">Tanggal</p>
                            <p className="mt-1">
                                {new Date(event.start_date).toLocaleDateString('id-ID')} - {new Date(event.end_date).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold">Waktu</p>
                            <p className="mt-1">
                                {event.start_hour} - {event.end_hour}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold">PIC</p>
                            <p className="mt-1">{event.event_pics.map((pic) => pic.user.full_name).join(', ') || '-'}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Deskripsi</p>
                            <p className="mt-1">{event.description || '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border p-4">
                    <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
                        <h2 className="text-xl font-bold">Daftar Kehadiran</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={limit}
                                onChange={e => {
                                    const val = e.target.value;
                                    let newLimit = val === 'all' ? 'all' : Number(val);
                                    // Kirim ke backend, reset ke page 1
                                    const params: any = { limit: newLimit, page: 1 };
                                    if (selectedDates.length > 0) params.dates = selectedDates;
                                    router.get(route('events.attendance', event.id), params, { preserveState: true });
                                }}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={'all'}>Show All</option>
                            </select>
                            <button
                                onClick={handleExportCSV}
                                disabled={selectedIds.length === 0}
                                className={`rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Ekspor CSV
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                        />
                                    </svg>
                                    Filter Tanggal
                                    {selectedDates.length > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-800 text-xs">
                                            {selectedDates.length}
                                        </span>
                                    )}
                                </button>
                                {/* ...existing filter dropdown code... */}
                                {isFilterOpen && (
                                    <div className="absolute top-full right-0 z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                                        {/* ...existing filter dropdown content... */}
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">Filter Berdasarkan Tanggal</h3>
                                            <button
                                                onClick={() => setIsFilterOpen(false)}
                                                className="text-gray-400 hover:cursor-pointer hover:text-gray-600"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDates.length === allDates.length}
                                                    onChange={toggleAllDates}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900">Pilih Semua Tanggal</span>
                                            </label>
                                            <div className="max-h-60 overflow-y-auto border-t border-gray-200 pt-3">
                                                {allDates.map((date) => (
                                                    <label key={date} className="flex items-center space-x-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDates.includes(date)}
                                                            onChange={() => toggleDate(date)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            {new Date(date).toLocaleDateString('id-ID', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex justify-between border-t border-gray-200 pt-3">
                                                <span className="text-sm text-gray-600">{selectedDates.length} tanggal dipilih</span>
                                                <button
                                                    onClick={() => {
                                                        // Reset filter tanggal, kirim ke backend, reset ke page 1
                                                        const params: any = { dates: [], limit, page: 1 };
                                                        router.get(route('events.attendance', event.id), params, { preserveState: true });
                                                    }}
                                                    className="text-sm text-blue-600 hover:cursor-pointer hover:text-blue-800"
                                                >
                                                    Reset Filter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === attendances.data.length && attendances.data.length > 0}
                                            onChange={e => handleSelectAll(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Keluar</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterlambatan</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                                    {canEditAttendance && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {attendances.data.map(attendance => (
                                    <tr key={`${attendance.submit_date}-${attendance.student.id}`}>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(attendance.id!)}
                                                onChange={() => handleSelectRow(attendance.id!)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(attendance.submit_date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{attendance.student.full_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.student.nis || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.student.classroom?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusColor(attendance.status)}`}>{getStatusLabel(attendance.status)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.clock_in_hour || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.clock_out_hour || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.minutes_of_late !== null ? attendance.minutes_of_late : '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.note || '-'}</td>
                                        {canEditAttendance && (
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
                                                    onClick={() => {
                                                        setSelectedAttendance(attendance);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        {attendances.links && attendances.links.length > 0 ? (
                            <Pagination links={attendances.links} dates={selectedDates} limit={limit} />
                        ) : (
                            // Show single page if Show All
                            <div className="flex justify-center gap-2">
                                <button
                                    disabled
                                    className="rounded px-3 py-1 text-sm bg-gray-100 text-black"
                                    dangerouslySetInnerHTML={{ __html: '&laquo;' }}
                                />
                                <button
                                    className="rounded px-3 py-1 text-sm bg-blue-500 text-white font-bold"
                                >
                                    1
                                </button>
                                <button
                                    disabled
                                    className="rounded px-3 py-1 text-sm bg-gray-100 text-black"
                                    dangerouslySetInnerHTML={{ __html: '&raquo;' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* No data message */}
                    {attendances.data.length === 0 && (
                        <div className="mt-4 text-center text-gray-500">Tidak ada data kehadiran untuk tanggal yang dipilih</div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        href={route('events.index')}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                    >
                        Kembali ke Daftar Event
                    </Link>
                </div>
            </div>

            {/* Edit Attendance Modal */}
            {isEditModalOpen && selectedAttendance && (
                <EditAttendanceModal
                    attendance={selectedAttendance}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedAttendance(null);
                    }}
                    onSubmit={handleUpdateAttendance}
                />
            )}
        </AppLayout>
    );
}
