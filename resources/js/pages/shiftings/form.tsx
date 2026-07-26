import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Shifting {
    id?: number;
    name: string;
    start_hour: string;
    end_hour: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shifting?: Shifting | null;
}

export default function ShiftingFormModal({ isOpen, onClose, shifting }: Props) {
    const [hasInitialized, setHasInitialized] = useState(false);
    const [formData, setFormData] = useState<Shifting>({ name: '', start_hour: '07:00', end_hour: '12:00' });

    useEffect(() => {
        if (isOpen && shifting && !hasInitialized) {
            setFormData({ name: shifting.name, start_hour: shifting.start_hour, end_hour: shifting.end_hour });
            setHasInitialized(true);
        } else if (isOpen && !shifting && !hasInitialized) {
            setFormData({ name: '', start_hour: '', end_hour: '' });
            setHasInitialized(true);
        }
    }, [shifting, isOpen, hasInitialized]);

    useEffect(() => { if (!isOpen) setHasInitialized(false); }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (shifting?.id) {
            router.put(`/shiftings/${shifting.id}`, { ...formData }, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal memperbarui shifting: ' + Object.values(errors).join('\n')),
            });
        } else {
            router.post('/shiftings', { ...formData }, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal menambahkan shifting baru: ' + Object.values(errors).join('\n')),
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={shifting ? 'Edit Shift' : 'Tambah Shift Baru'} onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Shift <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" name="name" maxLength={70} value={formData.name} onChange={handleChange}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Waktu Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="time" name="start_hour" value={formData.start_hour} onChange={handleChange}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Waktu Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="time" name="end_hour" value={formData.end_hour} onChange={handleChange}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                        required
                    />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {shifting ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
