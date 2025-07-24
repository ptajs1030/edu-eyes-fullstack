import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { months } from './constants';
import EditShiftModal from './editShiftModal';
import ShiftAttendanceTable from './shiftAttendanceTable';
import { AcademicYear, DayOffOption, ShiftingAttendance, Student } from './types';

export interface Props {
    student: Student;
    academicYears: AcademicYear[];
    filters: {
        academic_year_id: number;
        month: number;
        year: number;
    };
    dayOffOptions: DayOffOption[];
    attendanceMode: 'per-shift' | 'per-subject';

    // shift attendance data
    shiftAttendances: ShiftingAttendance[];
    shiftStatistics?: Record<string, number>;
}

const breadcrumbs = (studentName: string, studentId: number): BreadcrumbItem[] => [
    {
        title: 'Students',
        href: '/students',
    },
    {
        title: studentName,
        href: `/students/${studentId}/history`,
    },
    {
        title: 'Attendance History',
    },
];

export default function AttendanceHistory({
    student,
    academicYears,
    filters,
    dayOffOptions,
    attendanceMode,
    shiftAttendances = [],
    shiftStatistics = {},
}: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // State for modals
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [selectedShiftAttendance, setSelectedShiftAttendance] = useState<ShiftingAttendance | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('students.attendance', student.id),
            {
                ...filters,
                [key]: value,
            },
            { preserveState: true },
        );
    };

    const handleEditShift = (attendance: ShiftingAttendance) => {
        setSelectedShiftAttendance(attendance);
        setIsShiftModalOpen(true);
    };

    const handleSubmitShift = (formData: Partial<ShiftingAttendance>) => {
        const payload = {
            clock_in_hour: formData.clock_in_hour_formatted || null,
            clock_out_hour: formData.clock_out_hour_formatted || null,
            status: formData.status,
            minutes_of_late: formData.minutes_of_late || null,
            note: formData.note || null,
            day_off_reason: formData.day_off_reason || null,
        };

        router.patch(route('students.attendance.shift.save', selectedShiftAttendance?.id), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsShiftModalOpen(false);
                router.reload();
            },
        });
    };

    // const statistics = attendanceMode === 'per-shift' ? shiftStatistics : subjectStatistics;
    const statistics = attendanceMode === 'per-shift' ? shiftStatistics : shiftStatistics;
    console.log(shiftAttendances);
    console.log(shiftStatistics);

    return (
        <AppLayout breadcrumbs={breadcrumbs(student.full_name, student.id)}>
            <Head title={`Riwayat Kehadiran - ${student.full_name}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                {/* Student Info */}
                <div className="rounded-lg border p-4">
                    <h2 className="mb-4 text-xl font-bold">Informasi Siswa</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <p className="font-semibold">Nama</p>
                            <p>{student.full_name}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Kelas</p>
                            <p>{student.classroom.name}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Wali Kelas</p>
                            <p>{student.classroom.main_teacher.full_name}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="rounded-lg border p-4">
                    <h2 className="mb-4 text-xl font-bold">Filter</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                            <select
                                value={filters.academic_year_id}
                                onChange={(e) => handleFilterChange('academic_year_id', e.target.value)}
                                className="w-full rounded border p-2"
                            >
                                <option value="">Pilih Tahun Ajaran</option>
                                {academicYears.map((ay) => (
                                    <option key={ay.id} value={ay.id}>
                                        {ay.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bulan</label>
                            <select
                                value={filters.month}
                                onChange={(e) => handleFilterChange('month', e.target.value)}
                                className="w-full rounded border p-2"
                            >
                                {months.map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tahun</label>
                            <input
                                type="number"
                                value={filters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="w-full rounded border p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="rounded-lg border p-4">
                    <h2 className="mb-4 text-xl font-bold">Statistik Kehadiran (Bulan Ini)</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
                        {Object.entries(statistics).map(([status, count]) => (
                            <div key={status} className="rounded bg-gray-100 p-3 text-center">
                                <p className="text-lg font-bold">{count}</p>
                                <p className="capitalize">{status.replace(/_/g, ' ')}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance Table */}
                <ShiftAttendanceTable shiftAttendances={shiftAttendances} onEdit={handleEditShift} />

                {isShiftModalOpen && (
                    <EditShiftModal
                        attendance={selectedShiftAttendance}
                        dayOffOptions={dayOffOptions}
                        onClose={() => setIsShiftModalOpen(false)}
                        onSubmit={handleSubmitShift}
                    />
                )}
            </div>
        </AppLayout>
    );
}
