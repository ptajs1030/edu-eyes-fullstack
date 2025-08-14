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
    const [formData, setFormData] = useState<Shifting>({
        name: '',
        start_hour: '07:00',
        end_hour: '12:00',
    });

    useEffect(() => {
        if (shifting) {
            setFormData({
                name: shifting.name,
                start_hour: shifting.start_hour,
                end_hour: shifting.end_hour,
            });
        } else {
            setFormData({
                name: '',
                start_hour: '',
                end_hour: '',
            });
        }
    }, [shifting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (shifting?.id) {
            router.put(
                `/shiftings/${shifting.id}`,
                { ...formData },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                        router.reload();
                    },
                    onError: (errors) => {
                        const errorMessage = Object.values(errors).join('\n');
                        toast.error(`Failed to update shifting: ${errorMessage}`);
                    },
                },
            );
        } else {
            router.post(
                '/shiftings',
                { ...formData },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                        router.reload();
                    },
                    onError: (errors) => {
                        const errorMessage = Object.values(errors).join('\n');
                        toast.error(`Failed to add new shifting: ${errorMessage}`);
                    },
                },
            );
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={shifting ? 'Edit Shift' : 'Tambah Shift Baru'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Shift
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={255}
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>
            <div className="mb-3 flex flex-row justify-between gap-4">
                <div className="basis-1/2">
                    <label htmlFor="start_hour" className="block text-sm font-medium text-gray-700">
                        Waktu Mulai
                    </label>
                    <input
                        id="start_hour"
                        name="start_hour"
                        type="time"
                        value={formData.start_hour}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    />
                </div>
                <div className="basis-1/2">
                    <label htmlFor="end_hour" className="block text-sm font-medium text-gray-700">
                        Waktu Selesai
                    </label>
                    <input
                        id="end_hour"
                        name="end_hour"
                        type="time"
                        value={formData.end_hour}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:cursor-pointer hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                >
                    {shifting ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
