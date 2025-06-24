import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmationModal from './confirmation-modal';

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
                            toast.error('Failed to create academic year: ' + errors.start_year);
                        } else {
                            toast.error('Failed to create academic year');
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
                >
                    <h2 className="mb-4 text-lg font-semibold">{academicYear ? 'Edit Academic Year' : 'Adding Academic Year'}</h2>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="mb-3 flex flex-wrap justify-between">
                            <label htmlFor="start_year" className="block text-sm font-medium text-gray-700">
                                Start year
                            </label>
                            <input
                                type="number"
                                id="start_year"
                                name="start_year"
                                value={formData.start_year}
                                onChange={handleChange}
                                className="w-full rounded border p-2"
                                required
                            ></input>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="attendance_mode" className="block text-sm font-medium text-gray-700">
                                Attendance Mode
                            </label>
                            <select
                                name="attendance_mode"
                                value={formData.attendance_mode}
                                onChange={handleChange}
                                className="w-full rounded border p-2"
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
                                Notes (optional)
                            </label>
                            <textarea name="note" value={formData.note} onChange={handleChange} className="w-full rounded border p-2" />
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={closeModal} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                                Cancel
                            </button>
                            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                                {academicYear ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
            <ConfirmationModal
                isOpen={showConfirm}
                message="Are you sure you want to create new academic year?"
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
