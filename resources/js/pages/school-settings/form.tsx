import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Setting {
    id?: number;
    key: string;
    value: string;
    title?: string;
    type?: 'text' | 'number';
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setting?: Setting | null;
}

export default function SettingFormModal({ isOpen, onClose, setting }: Props) {
    const [formData, setFormData] = useState<Setting>({ key: '', value: '', title: '' });

    useEffect(() => {
        if (setting) {
            setFormData({ key: setting.key, value: setting.value, title: setting.title || '', type: setting.type || 'text' });
        } else {
            setFormData({ key: '', value: '', title: '', type: 'text' });
        }
    }, [setting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (formData.type === 'number' && name === 'value') {
            if (value === '' || /^\d+$/.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setting?.id) { onClose(); return; }
        router.post(`/school-settings/${setting.id}`, { ...formData, _method: 'PUT' }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); router.reload(); },
            onError: (errors) => toast.error('Gagal memperbarui pengaturan: ' + Object.values(errors).join('\n')),
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Edit Pengaturan" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Key</label>
                <input type="text" value={formData.title || formData.key} readOnly className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Value
                    {['late_tolerance', 'early_tolerance'].includes(formData.key) && ' (Menit)'}
                    {['payment_reminder_days', 'task_reminder_days'].includes(formData.key) && ' (Hari)'}
                    <span className="text-rose-500">*</span>
                </label>
                {formData.type === 'text' ? (
                    <textarea
                        name="value" value={formData.value} onChange={handleChange}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
                        required rows={5}
                    />
                ) : (
                    <input
                        type="text" name="value" value={formData.value} onChange={handleChange}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none font-mono"
                        required pattern="\d*"
                    />
                )}
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    Ubah
                </button>
            </div>
        </FormModal>
    );
}
