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
    const [formData, setFormData] = useState<CustomDayOff>({
        date: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setIsSubmitting(false);

            if (dayOff) {
                setFormData({
                    date: dayOff.date,
                    description: dayOff.description,
                });
            } else {
                setFormData({
                    date: '',
                    description: '',
                });
            }
        }
    }, [isOpen, dayOff]);

    const handleChange = (field: keyof CustomDayOff, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const requestData = {
            ...formData,
            _method: dayOff?.id ? 'PUT' : 'POST',
        };

        const url = dayOff?.id ? `/custom-day-offs/${dayOff.id}` : '/custom-day-offs';

        router.post(url, requestData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsSubmitting(false);
                onClose();
            },
            onError: (errors) => {
                setIsSubmitting(false);
                // Tangkap error validasi dari Inertia
                if (typeof errors === 'object') {
                    setErrors(errors);
                    const errorMessages = Object.values(errors).join('\n');
                    toast.error(`Validasi gagal:\n${errorMessages}`);
                } else {
                    toast.error('Terjadi kesalahan tidak diketahui');
                }
            },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={dayOff ? 'Edit Hari Libur' : 'Tambah Hari Libur'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Tanggal*
                </label>
                <input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className={`mt-1 block w-full rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300'} p-2 shadow-sm`}
                    required
                    disabled={isSubmitting}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div className="mb-3">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Nama Hari Libur*
                </label>
                <input
                    id="description"
                    name="description"
                    type="text"
                    maxLength={70}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={`mt-1 block w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'} p-2 shadow-sm`}
                    required
                    disabled={isSubmitting}
                    placeholder="Contoh: Libur Hari Raya Idul Fitri, Libur Nasional, dll."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:cursor-pointer hover:bg-gray-50 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="rounded rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Memproses...' : dayOff ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
