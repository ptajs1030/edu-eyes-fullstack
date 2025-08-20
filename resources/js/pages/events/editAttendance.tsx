import FormModal from '@/components/form-modal';
import { useState } from 'react';

interface Student {
    id: number;
    full_name: string;
    nis: string | null;
    classroom: {
        name: string;
    };
}

interface Attendance {
    student: Student;
    status: string;
    clock_in_hour: string | null;
    clock_out_hour: string | null;
    minutes_of_late: number | null;
    note: string | null;
}

interface Props {
    attendance: Attendance;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function EditAttendanceModal({ attendance, onClose, onSubmit }: Props) {
    const [formData, setFormData] = useState({
        student_id: attendance.student.id,
        status: attendance.status,
        clock_in_hour: attendance.clock_in_hour || '',
        clock_out_hour: attendance.clock_out_hour || '',
        minutes_of_late: attendance.minutes_of_late || '',
        note: attendance.note || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            minutes_of_late: formData.minutes_of_late ? parseInt(formData.minutes_of_late as string) : null,
            clock_in_hour: formData.clock_in_hour || null,
            clock_out_hour: formData.clock_out_hour || null,
        };

        onSubmit(submitData);
    };

    return (
        <FormModal isOpen={true} onClose={onClose} title={`Edit Kehadiran - ${attendance.student.full_name}`} onSubmit={handleSubmit}>
            <div className="space-y-4">
                {/* Student Info */}
                <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">Informasi Siswa</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Nama:</span>
                            <p className="font-medium">{attendance.student.full_name}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">NIS:</span>
                            <p className="font-medium">{attendance.student.nis || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Kelas:</span>
                            <p className="font-medium">{attendance.student.classroom?.name || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Status Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status*</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="not_set">Pilih Status</option>
                        <option value="present">Hadir</option>
                        <option value="present_in_tolerance">Hadir (Toleransi)</option>
                        <option value="late">Terlambat</option>
                        <option value="alpha">Alpha</option>
                    </select>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                        <input
                            type="time"
                            value={formData.clock_in_hour}
                            onChange={(e) => setFormData({ ...formData, clock_in_hour: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Jam Keluar</label>
                        <input
                            type="time"
                            value={formData.clock_out_hour}
                            onChange={(e) => setFormData({ ...formData, clock_out_hour: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Minutes Late */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Menit Keterlambatan</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.minutes_of_late}
                        onChange={(e) => setFormData({ ...formData, minutes_of_late: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0"
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Catatan</label>
                    <textarea
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tambahkan catatan jika diperlukan..."
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
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
    );
}
