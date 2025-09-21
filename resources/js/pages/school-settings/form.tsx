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
    const [formData, setFormData] = useState<Setting>({
        key: '',
        value: '',
        title: '',
    });

    useEffect(() => {
        if (setting) {
            setFormData({
                key: setting.key,
                value: setting.value,
                title: setting.title || '',
                type: setting.type || 'text',
            });
        } else {
            setFormData({
                key: '',
                value: '',
                title: '',
                type: 'text',
            });
        }
    }, [setting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (formData.type === 'number' && name === 'value') {
            // Only allow numbers
            if (value === '' || /^\d+$/.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!setting?.id) {
            onClose();
            return;
        }

        const payload = {
            ...formData,
            _method: 'PUT',
        };

        router.post(`/school-settings/${setting.id}`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                router.reload();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).join('\n');
                toast.error(`Gagal memperbarui pengaturan: ${errorMessage}`);
            },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Edit Pengaturan" onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                    Key
                </label>
                <input id="key" name="key" type="text" value={formData.title || formData.key} readOnly className="w-full rounded border bg-gray-100 p-2" />
            </div>
            <div className="mb-3">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                    Value
                    {['late_tolerance', 'early_tolerance'].includes(formData.key) && ' (Menit)'}
                    {['payment_reminder_days', 'task_reminder_days'].includes(formData.key) && ' (Hari)'}
                </label>
                {formData.type === 'text' ? (
                    <textarea
                        id="value"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        className="w-full rounded border p-2"
                        required
                        rows={5}
                    />
                ) : (
                    <input
                        id="value"
                        name="value"
                        type="text"
                        value={formData.value}
                        onChange={handleChange}
                        className="w-full rounded border p-2"
                        required
                        pattern="\d*"
                    />
                )}
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
                    className="rounded rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                >
                    Ubah
                </button>
            </div>
        </FormModal>
    );
}
