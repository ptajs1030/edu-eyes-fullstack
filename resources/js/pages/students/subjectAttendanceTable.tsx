import { Disclosure, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, ChevronDown, CircleX, TriangleAlert } from 'lucide-react';
import React from 'react';
import { DaySummary, SubjectAttendance } from './types';

const SubjectAttendanceTable = ({
    subjectAttendances,
    onEdit,
}: {
    subjectAttendances: SubjectAttendance[];
    onEdit: (attendance: SubjectAttendance) => void;
}) => {
    // Group attendances by date
    const groupedAttendances = subjectAttendances.reduce(
        (acc, curr) => {
            if (!acc[curr.submit_date]) {
                acc[curr.submit_date] = [];
            }
            acc[curr.submit_date].push(curr);
            return acc;
        },
        {} as Record<string, SubjectAttendance[]>,
    );

    // Calculate summary for each day
    const getDaySummary = (date: string): DaySummary => {
        const dayAttendances = groupedAttendances[date] || [];
        const total = dayAttendances.length;
        const presentCount = dayAttendances.filter((a) => ['present', 'late'].includes(a.status)).length;
        const lateCount = dayAttendances.filter((a) => a.status === 'late').length;
        const absentCount = dayAttendances.filter((a) => ['alpha', 'leave', 'sick_leave', 'day_off'].includes(a.status)).length;

        return {
            total,
            presentCount,
            lateCount,
            absentCount,
            perfect: presentCount === total && lateCount === 0,
            hasLate: lateCount > 0,
            hasAbsent: absentCount > 0,
        };
    };

    return (
        <div className="w-full overflow-x-auto rounded-lg border">
            <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs tracking-wider text-gray-500 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs tracking-wider text-gray-500 uppercase">Tahun Ajaran</th>
                        <th className="px-4 py-3 text-left text-xs tracking-wider text-gray-500 uppercase">Ringkasan Kehadiran</th>
                        <th className="px-4 py-3 text-left text-xs tracking-wider text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(groupedAttendances)
                        .sort(([a], [b]) => +new Date(b) - +new Date(a))
                        .map(([date, dayAttendances]) => {
                            const summary = getDaySummary(date);
                            const academicYear = dayAttendances[0]?.academic_year?.title || '-';

                            return (
                                <Disclosure as={React.Fragment} key={date}>
                                    {({ open }) => (
                                        <>
                                            {/* Baris Ringkasan */}
                                            <tr className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
                                                    {format(parseISO(date), 'EEE, dd MMM yyyy', { locale: id })}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">{academicYear}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {summary.perfect ? (
                                                        <div className="flex items-center gap-3 text-green-600">
                                                            <CheckCircle className="h-5 w-5 shrink-0" />
                                                            <div>
                                                                Hadir sempurna ({summary.presentCount}/{summary.total})
                                                            </div>
                                                        </div>
                                                    ) : summary.hasLate ? (
                                                        <div className="flex items-center gap-3 text-yellow-600">
                                                            <TriangleAlert className="h-5 w-5 shrink-0" />
                                                            <div>
                                                                Terlambat di beberapa mata pelajaran ({summary.presentCount}/{summary.total})
                                                            </div>
                                                        </div>
                                                    ) : summary.hasAbsent ? (
                                                        <div className="flex items-center gap-3 text-red-600">
                                                            <CircleX className="h-5 w-5 shrink-0" />
                                                            Tidak hadir di beberapa mata pelajaran ({summary.presentCount}/{summary.total})
                                                        </div>
                                                    ) : (
                                                        <span>Belum ada data kehadiran</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                                                    <Disclosure.Button className="flex items-center text-blue-600 hover:cursor-pointer hover:text-blue-800 focus:outline-none">
                                                        <span className="mr-1">{open ? 'Tutup' : 'Detail'}</span>
                                                        <ChevronDown
                                                            className={`h-5 w-5 transform transition-transform duration-300 ${
                                                                open ? 'rotate-180' : 'rotate-0'
                                                            }`}
                                                        />
                                                    </Disclosure.Button>
                                                </td>
                                            </tr>

                                            {/* Baris Detail di Bawah */}
                                            <Transition
                                                show={open}
                                                enter="transition duration-300 ease-out"
                                                enterFrom="transform scale-y-0 opacity-0"
                                                enterTo="transform scale-y-100 opacity-100"
                                                leave="transition duration-200 ease-in"
                                                leaveFrom="transform scale-y-100 opacity-100"
                                                leaveTo="transform scale-y-0 opacity-0"
                                                className="origin-top"
                                                as={React.Fragment}
                                            >
                                                <tr className="bg-gray-50">
                                                    <td colSpan={4} className="px-6 py-4">
                                                        <table className="w-full table-fixed divide-y divide-gray-200">
                                                            <thead className="bg-gray-100">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Mata Pelajaran
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Waktu
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Absen Masuk
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Status
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Catatan
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                        Aksi
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                                {dayAttendances.map((att) => (
                                                                    <tr key={att.id}>
                                                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                                            {att.subject_name}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                                            {att.subject_start_hour_formatted} - {att.subject_end_hour_formatted}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                                            {att.submit_hour_formatted || '-'}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-600 capitalize">
                                                                            {att.status.replace(/_/g, ' ')}
                                                                            {att.day_off_reason && (
                                                                                <div className="text-xs text-gray-400">({att.day_off_reason})</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-600">{att.note || '-'}</td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            <button
                                                                                onClick={() => onEdit(att)}
                                                                                className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer hover:bg-blue-600"
                                                                            >
                                                                                Ubah
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </Transition>
                                        </>
                                    )}
                                </Disclosure>
                            );
                        })}

                    {Object.keys(groupedAttendances).length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                Tidak ada data kehadiran untuk bulan ini
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SubjectAttendanceTable;
