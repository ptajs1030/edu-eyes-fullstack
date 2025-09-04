import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { statusOptions } from './constants';
import { DayOffOption, ShiftingAttendance } from './types';

const EditShiftModal = ({
    attendance,
    dayOffOptions,
    onClose,
    onSubmit,
}: {
    attendance: ShiftingAttendance | null;
    dayOffOptions: DayOffOption[];
    onClose: () => void;
    onSubmit: (formData: Partial<ShiftingAttendance>) => void;
}) => {
    const [formData, setFormData] = useState<Partial<ShiftingAttendance>>(attendance || {});

    useEffect(() => {
        if (attendance) {
            setFormData({ ...attendance });
        }
    }, [attendance]);

    const handleDayOffReasonChange = (id: string) => {
        const selected = dayOffOptions.find((option) => option.id === parseInt(id));
        setFormData((prev) => ({
            ...prev,
            day_off_reason: selected?.description,
            day_off_reason_id: selected?.id,
        }));
    };

    const handleChange = (field: keyof ShiftingAttendance, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!attendance) return null;

    return (
        <FormModal isOpen={true} onClose={onClose} title="Ubah Data Kehadiran" onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                    type="text"
                    value={attendance.submit_date ? format(parseISO(attendance.submit_date), 'dd MMM yyyy') : ''}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Shift</label>
                <input
                    type="text"
                    value={`${attendance.shifting_name} (${attendance.shifting_start_hour_formatted} - ${attendance.shifting_end_hour_formatted})`}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                    <input
                        type="time"
                        value={formData.clock_in_hour_formatted || ''}
                        onChange={(e) => handleChange('clock_in_hour_formatted', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Pulang</label>
                    <input
                        type="time"
                        value={formData.clock_out_hour_formatted || ''}
                        onChange={(e) => handleChange('clock_out_hour_formatted', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                        disabled
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
                    {statusOptions.shift.map((option) => (
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
                        value={formData.day_off_reason?.toString() || ''}
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
};

export default EditShiftModal;
