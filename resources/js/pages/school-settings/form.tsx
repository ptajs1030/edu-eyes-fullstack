import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Setting {
    id?: number;
    key: string;
    value: string;
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
    });

    useEffect(() => {
        if (setting) {
            setFormData({
                key: setting.key,
                value: setting.value,
            });
        } else {
            setFormData({
                key: '',
                value: '',
            });
        }
    }, [setting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                toast.error(`Failed to update setting: ${errorMessage}`);
            },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title="Edit Setting" onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                    Key
                </label>
                <input id="key" name="key" type="text" value={formData.key} readOnly className="w-full rounded border bg-gray-100 p-2" />
            </div>
            <div className="mb-3">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                    Value
                </label>
                <textarea
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                    required
                    rows={5}
                />
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                    Update
                </button>
            </div>
        </FormModal>
    );
}
