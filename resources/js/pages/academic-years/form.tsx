import ActionModal from '@/components/action-modal';
import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AcademicYear {
    id?: number;
    start_year: number;
    attendance_mode: string;
    note?: string;
}

interface Props {
    isOpen: boolean;
    closeModal: () => void;
    academicYear?: AcademicYear | null;
    attendanceModes: { value: string; label: string }[];
}

export default function AcademicYearFormModal({ isOpen, closeModal, academicYear, attendanceModes }: Props) {
    const [formData, setFormData] = useState<AcademicYear>({
        start_year: new Date().getFullYear(),
        attendance_mode: '',
        note: '',
    });
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (academicYear) {
            setFormData({
                start_year: academicYear.start_year,
                attendance_mode: academicYear.attendance_mode,
                note: academicYear.note || '',
            });
        } else {
            setFormData({
                start_year: new Date().getFullYear(),
                attendance_mode: '',
                note: '',
            });
        }
    }, [academicYear]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!academicYear) {
            setShowConfirm(true);
        } else {
            handleConfirm();
        }
    };

    const handleConfirm = () => {
        setShowConfirm(false);
        const payload = { ...formData };

        if (academicYear) {
            router.post(
                `/academic-years/${academicYear.id}`,
                { ...payload, _method: 'PUT' },
                {
                    onSuccess: () => {
                        closeModal();
                        toast.success('Academic year updated successfully.');
                        router.reload();
                    },
                    onError: (errors) => {
                        if (errors.start_year) {
                            toast.error('Failed to update academic year: ' + errors.start_year);
                        } else {
                            toast.error('Failed to update academic year');
                        }
                    },
                },
            );
        } else {
            router.post('/academic-years', payload, {
                onSuccess: () => {
                    closeModal();
                    toast.success('Academic year created successfully.');
                    router.reload();
                },
                onError: (errors) => {
                    if (errors.start_year) {
                        toast.error('Failed to create academic year: ' + errors.start_year);
                    } else {
                        toast.error('Failed to create academic year');
                    }
                },
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <FormModal
                isOpen={isOpen}
                onClose={closeModal}
                title={academicYear ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}
                onSubmit={handleSubmit}
            >
                <div className="mb-3 flex flex-wrap justify-between">
                    <label htmlFor="start_year" className="block text-sm font-medium text-gray-700">
                        Tahun Mulai
                    </label>
                    <input
                        type="number"
                        id="start_year"
                        name="start_year"
                        value={formData.start_year}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    ></input>
                </div>
                <div className="mb-3">
                    <label htmlFor="attendance_mode" className="block text-sm font-medium text-gray-700">
                        Mode Kehadiran
                    </label>
                    <select
                        name="attendance_mode"
                        value={formData.attendance_mode}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    >
                        <option value="">-- Select Mode --</option>
                        {attendanceModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                                {mode.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                        Catatan (optional)
                    </label>
                    <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:cursor-pointer hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="rounded rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                    >
                        {academicYear ? 'Update' : 'Simpan'}
                    </button>
                </div>
            </FormModal>
            <ActionModal
                isOpen={showConfirm}
                title="Confirmation"
                message="Are you sure you want to create new academic year?"
                buttons={[
                    {
                        label: 'Cancel',
                        onClick: () => setShowConfirm(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Confirm',
                        onClick: () => {
                            handleConfirm();
                            setShowConfirm(false);
                        },
                        variant: 'primary',
                    },
                ]}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
