import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ShiftingAttendance } from './types';

const ShiftAttendanceTable = ({
    shiftAttendances,
    onEdit,
}: {
    shiftAttendances: ShiftingAttendance[];
    onEdit: (attendance: ShiftingAttendance) => void;
}) => (
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
                {shiftAttendances.map((attendance) => (
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
                                onClick={() => onEdit(attendance)}
                                className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                            >
                                Ubah
                            </button>
                        </td>
                    </tr>
                ))}
                {shiftAttendances.length === 0 && (
                    <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                            Tidak ada data kehadiran untuk bulan ini
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

export default ShiftAttendanceTable;
