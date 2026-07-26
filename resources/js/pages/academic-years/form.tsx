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
    const isLocked = academicYear?.status === 'complete';
    const [formData, setFormData] = useState<AcademicYear>({
        start_year: new Date().getFullYear(),
        attendance_mode: '',
        note: '',
    });
    const [hasInitialized, setHasInitialized] = useState(false);
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

    useEffect(() => {
        if (!isOpen) setHasInitialized(false);
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
                    onSuccess: () => { closeModal(); toast.success('Tahun ajaran berhasil diperbarui.'); router.reload(); },
                    onError: (errors) => toast.error('Gagal memperbarui tahun ajaran: ' + Object.values(errors).join('\n')),
                },
            );
        } else {
            router.post('/academic-years', payload, {
                onSuccess: () => { closeModal(); toast.success('Tahun ajaran berhasil ditambahkan.'); router.reload(); },
                onError: (errors) => toast.error('Gagal menambahkan tahun ajaran: ' + Object.values(errors).join('\n')),
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <FormModal isOpen={isOpen} onClose={closeModal} title={academicYear ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'} onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Tahun Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="start_year"
                        name="start_year"
                        value={formData.start_year}
                        min={new Date().getFullYear()}
                        disabled={!!academicYear}
                        onChange={handleChange}
                        className={`form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none ${academicYear ? 'opacity-60 cursor-not-allowed' : ''}`}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Mode Kehadiran <span className="text-rose-500">*</span>
                    </label>
                    <select
                        name="attendance_mode"
                        value={formData.attendance_mode}
                        onChange={handleChange}
                        disabled={isLocked}
                        className={`form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        required
                    >
                        <option value="">-- Select Mode --</option>
                        {attendanceModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Catatan (opsional)
                    </label>
                    <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        disabled={isLocked}
                        className={`form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        rows={3}
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                        Batal
                    </button>
                    <button type="submit" disabled={isLocked} className={`ml-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isLocked ? 'bg-slate-400' : 'btn-shimmer'}`}>
                        {academicYear ? 'Ubah' : 'Simpan'}
                    </button>
                </div>
            </FormModal>
            <ActionModal
                isOpen={showConfirm}
                title="Konfirmasi"
                message="Apakah Anda yakin ingin menambahkan tahun ajaran baru?"
                buttons={[
                    { label: 'Batal', onClick: () => setShowConfirm(false), variant: 'neutral' },
                    { label: 'Ya', onClick: () => { handleConfirm(); setShowConfirm(false); }, variant: 'primary' },
                ]}
                onClose={() => setShowConfirm(false)}
            />
        </>
    );
}
