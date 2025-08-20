import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
    attendances: Attendance[];
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

export default function EventAttendance({ event, attendances, canEditAttendance }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Handle flash messages
    if (flash?.success) {
        toast.success(flash.success);
    } else if (flash?.error) {
        toast.error(flash.error);
    }

    const handleUpdateAttendance = (formData: any) => {
        router.patch(route('events.attendance.update', event.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedAttendance(null);
            },
            onError: () => {},
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
                return 'Alpha';
            default:
                return 'Belum Diisi';
        }
    };

    // Gabungkan data participants dengan attendances
    const combinedData = event.participants.map((participant) => {
        const attendance = attendances.find((a) => a.student.id === participant.student.id);
        return {
            student: participant.student,
            attendance: attendance || {
                status: 'not_set',
                clock_in_hour: null,
                clock_out_hour: null,
                minutes_of_late: null,
                note: null,
                submit_date: '',
            },
        };
    });

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

                {/* Attendance Table */}
                <div className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Daftar Kehadiran</h2>
                        <div className="text-sm text-gray-600">Total: {event.participants.length} peserta</div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
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
                                {combinedData.map(({ student, attendance }) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.full_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{student.nis || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{student.classroom?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                                    attendance.status,
                                                )}`}
                                            >
                                                {getStatusLabel(attendance.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.clock_in_hour || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.clock_out_hour || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {attendance.minutes_of_late ? `${attendance.minutes_of_late} menit` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{attendance.note || '-'}</td>
                                        {canEditAttendance && (
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAttendance({
                                                            student,
                                                            ...attendance,
                                                        });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
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

                    {!canEditAttendance && attendances.length === 0 && (
                        <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                            <div className="flex items-center">
                                <svg className="mr-2 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm text-yellow-700">
                                    Data kehadiran belum tersedia. Edit kehadiran akan tersedia setelah event dimulai.
                                </span>
                            </div>
                        </div>
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
