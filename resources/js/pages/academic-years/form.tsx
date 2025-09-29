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
    status?: 'active' | 'complete';
}

interface Props {
    isOpen: boolean;
    closeModal: () => void;
    academicYear?: AcademicYear | null;
    attendanceModes: { value: string; label: string }[];
}

export default function AcademicYearFormModal({ isOpen, closeModal, academicYear, attendanceModes }: Props) {
    const isLocked = academicYear?.status === 'complete'; // <— true jika harus di-disable
    const [formData, setFormData] = useState<AcademicYear>({
        start_year: new Date().getFullYear(),
        attendance_mode: '',
        note: '',
    });
    const [hasInitialized, setHasInitialized] = useState(false); // Add this flag
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && academicYear && !hasInitialized) {
            setFormData({
                start_year: academicYear.start_year,
                attendance_mode: academicYear.attendance_mode,
                note: academicYear.note || '',
            });

            setHasInitialized(true);
        } else if (isOpen && !academicYear && !hasInitialized) {
            setFormData({
                start_year: new Date().getFullYear(),
                attendance_mode: '',
                note: '',
            });

            setHasInitialized(true);
        }
    }, [academicYear, isOpen, hasInitialized]);

    // Reset initialization flag when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) {
            toast.error('Tahun ajaran sudah complete — tidak bisa diedit.');
            return;
        }

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
                        toast.success('Tahun ajaran berhasil diperbarui.');
                        router.reload();
                    },
                    onError: (errors) => {
                        const errorMessage = Object.values(errors).join('\n');
                        toast.error('Gagal memperbarui tahun ajaran: ' + errorMessage);
                    },
                },
            );
        } else {
            router.post('/academic-years', payload, {
                onSuccess: () => {
                    closeModal();
                    toast.success('Tahun ajaran berhasil ditambahkan.');
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error('Gagal menambahkan tahun ajaran: ' + errorMessage);
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
                        min={new Date().getFullYear()}
                        disabled={academicYear ? true : false}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm ${academicYear ? 'bg-gray-100' : ''} `}
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
                        disabled={isLocked}
                        className={`mt-1 block w-full rounded-md border p-2 shadow-sm ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                        disabled={isLocked}
                        className={`mt-1 block w-full rounded-md border p-2 shadow-sm ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                        disabled={isLocked}
                        className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'hover:cursor-pointer bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {academicYear ? 'Ubah' : 'Simpan'}
                    </button>
                </div>
            </FormModal>
            <ActionModal
                isOpen={showConfirm}
                title="Konfirmasi"
                message="Apakah Anda yakin ingin menambahkan tahun ajaran baru?"
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setShowConfirm(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Ya',
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
