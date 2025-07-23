import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Student {
    id: number;
    full_name: string;
    classroom: {
        id: number;
        name: string;
        main_teacher: {
            id: number;
            full_name: string;
        };
    };
}

interface ShiftingAttendance {
    id: number;
    submit_date: string;
    academic_year_id: number;
    academic_year: {
        title: string;
    };
    shifting_name: string;
    shifting_start_hour_formatted: string;
    shifting_end_hour_formatted: string;
    clock_in_hour_formatted?: string;
    clock_out_hour_formatted?: string;
    status: string;
    minutes_of_late?: number;
    note?: string;
    day_off_reason_id?: number;
    day_off_reason?: string;
}

interface AcademicYear {
    id: number;
    title: string;
}

interface Props {
    student: Student;
    attendances: ShiftingAttendance[];
    academicYears: AcademicYear[];
    filters: {
        academic_year_id: number;
        month: number;
        year: number;
    };
    statistics: {
        present: number;
        present_in_tolerance: number;
        alpha: number;
        late: number;
        leave: number;
        sick_leave: number;
        day_off: number;
    };
    dayOffOptions: Array<{ id: number; description: string }>;
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

export default function AttendanceHistory({ student, attendances, academicYears, filters, statistics, dayOffOptions }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<ShiftingAttendance | null>(null);
    const [formData, setFormData] = useState<Partial<ShiftingAttendance>>({});

    const statusOptions = [
        { value: 'present', label: 'Present' },
        { value: 'present_in_tolerance', label: 'Present in Tolerance' },
        { value: 'alpha', label: 'Alpha' },
        { value: 'late', label: 'Late' },
        { value: 'leave', label: 'Leave' },
        { value: 'sick_leave', label: 'Sick Leave' },
        { value: 'day_off', label: 'Day Off' },
    ];

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleDayOffReasonChange = (id: string) => {
        const selected = dayOffOptions.find((option) => option.id === parseInt(id));
        setFormData((prev) => ({
            ...prev,
            day_off_reason: selected?.description,
            day_off_reason_id: selected?.id,
        }));
    };

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

    const handleEdit = (attendance: ShiftingAttendance) => {
        setSelectedAttendance(attendance);
        setFormData({
            ...attendance,
            day_off_reason: attendance.day_off_reason,
        });
        setIsFormOpen(true);
    };

    const handleChange = (field: keyof ShiftingAttendance, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            clock_in_hour: formData.clock_in_hour_formatted || null,
            clock_out_hour: formData.clock_out_hour_formatted || null,
            status: formData.status,
            minutes_of_late: formData.minutes_of_late || null,
            note: formData.note || null,
            day_off_reason: formData.day_off_reason || null,
        };

        router.patch(route('students.attendance.shift.save', selectedAttendance?.id), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsFormOpen(false);
                router.reload();
            },
        });
    };

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
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Tanggal</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Tahun Ajaran</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Shift</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Waktu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Masuk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Pulang</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {attendances.map((attendance) => (
                                <tr key={attendance.id}>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        {format(parseISO(attendance.submit_date), 'EEE, dd MMM yyyy', { locale: id })}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{attendance.academic_year?.title}</td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{attendance.shifting_name}</td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        {attendance.shifting_start_hour_formatted} - {attendance.shifting_end_hour_formatted}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{attendance.clock_in_hour_formatted || '-'}</td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{attendance.clock_out_hour_formatted || '-'}</td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap capitalize">
                                        {attendance.status.replace(/_/g, ' ')}
                                        {attendance.day_off_reason && <div className="text-xs text-gray-500">({attendance.day_off_reason})</div>}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <button
                                            onClick={() => handleEdit(attendance)}
                                            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                        >
                                            Ubah
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {attendances.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                                        Tidak ada data kehadiran untuk bulan ini
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit Attendance Modal */}
                <FormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Ubah Data Kehadiran" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input
                            type="text"
                            value={selectedAttendance?.submit_date ? format(parseISO(selectedAttendance.submit_date), 'dd MMM yyyy') : ''}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Shift</label>
                        <input
                            type="text"
                            value={`${selectedAttendance?.shifting_name} (${selectedAttendance?.shifting_start_hour_formatted} - ${selectedAttendance?.shifting_end_hour_formatted})`}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                        />
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                            <input
                                type="time"
                                value={formData.clock_in_hour_formatted || ''}
                                onChange={(e) => handleChange('clock_in_hour', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jam Pulang</label>
                            <input
                                type="time"
                                value={formData.clock_out_hour_formatted || ''}
                                onChange={(e) => handleChange('clock_out_hour', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={formData.status || ''}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.status === 'day_off' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Alasan Izin</label>
                            <SearchableSelect
                                value={formData.day_off_reason_id?.toString() || ''}
                                onChange={handleDayOffReasonChange}
                                placeholder="Pilih alasan..."
                                endpoint={route('dayOff.search')}
                                initialOptions={dayOffOptions.map((option) => ({
                                    id: option.id,
                                    full_name: option.description,
                                }))}
                                showInitialOptions={true}
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Menit Terlambat</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.minutes_of_late || ''}
                            onChange={(e) => handleChange('minutes_of_late', parseInt(e.target.value) || 0)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Catatan</label>
                        <textarea
                            value={formData.note || ''}
                            onChange={(e) => handleChange('note', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:cursor-pointer hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                        >
                            Simpan
                        </button>
                    </div>
                </FormModal>
            </div>
        </AppLayout>
    );
}
