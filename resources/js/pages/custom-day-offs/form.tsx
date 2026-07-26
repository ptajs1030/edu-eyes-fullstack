import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CustomDayOff {
    id?: number;
    date: string;
    description: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dayOff?: CustomDayOff | null;
}

export default function CustomDayOffFormModal({ isOpen, onClose, dayOff }: Props) {
    const [formData, setFormData] = useState<CustomDayOff>({ date: '', description: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setIsSubmitting(false);
            if (dayOff) {
                setFormData({ date: dayOff.date, description: dayOff.description });
            } else {
                setFormData({ date: '', description: '' });
            }
        }
    }, [isOpen, dayOff]);

    const handleChange = (field: keyof CustomDayOff, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);
        router.post(dayOff?.id ? `/custom-day-offs/${dayOff.id}` : '/custom-day-offs',
            { ...formData, _method: dayOff?.id ? 'PUT' : 'POST' },
            {
                preserveScroll: true, preserveState: true,
                onSuccess: () => { setIsSubmitting(false); onClose(); },
                onError: (errors) => {
                    setIsSubmitting(false);
                    if (typeof errors === 'object') {
                        setErrors(errors);
                        toast.error(`Validasi gagal:\n${Object.values(errors).join(', ')}`);
                    } else {
                        toast.error('Terjadi kesalahan tidak diketahui');
                    }
                },
            },
        );
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={dayOff ? 'Edit Hari Libur' : 'Tambah Hari Libur'} onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tanggal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className={`form-input w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/50 border rounded-xl text-sm text-slate-900 dark:text-white outline-none ${errors.date ? 'border-rose-300 dark:border-rose-600' : 'border-slate-200 dark:border-slate-600'}`}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Hari Libur <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" maxLength={70}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Contoh: Libur Hari Raya Idul Fitri, Libur Nasional, dll."
                    className={`form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none ${errors.description ? 'border-rose-300 dark:border-rose-600' : 'border-slate-200 dark:border-slate-600'}`}
                    required
                    disabled={isSubmitting}
                />
                {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50">
                    Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                    {isSubmitting ? 'Memproses...' : dayOff ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
