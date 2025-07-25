import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { statusOptions } from './constants';
import { DayOffOption, SubjectAttendance } from './types';

const EditSubjectModal = ({
    attendance,
    dayOffOptions,
    onClose,
    onSubmit,
}: {
    attendance: SubjectAttendance | null;
    dayOffOptions: DayOffOption[];
    onClose: () => void;
    onSubmit: (formData: Partial<SubjectAttendance>) => void;
}) => {
    const [formData, setFormData] = useState<Partial<SubjectAttendance>>(attendance || {});

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
        }));
    };

    const handleChange = (field: keyof SubjectAttendance, value: any) => {
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
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                <input
                    type="text"
                    value={attendance.subject_name}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Waktu Pelajaran</label>
                <input
                    type="text"
                    value={`${attendance.subject_start_hour_formatted} - ${attendance.subject_end_hour_formatted}`}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Jam Absen</label>
                <input
                    type="time"
                    value={formData.submit_hour_formatted || ''}
                    onChange={(e) => handleChange('submit_hour_formatted', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    value={formData.status || ''}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                >
                    {statusOptions.subject.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {formData.status === 'day_off' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Alasan Libur</label>
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

export default EditSubjectModal;
