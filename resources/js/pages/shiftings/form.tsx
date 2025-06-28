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

        // const requestData = {
        //     ...formData,
        //     _method: shifting?.id ? 'PUT' : 'POST',
        // };

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
        <FormModal isOpen={isOpen} onClose={onClose} title={shifting ? 'Edit Shifting' : 'Add New Shifting'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="mb-3 flex flex-row justify-between gap-4">
                <div className="basis-1/2">
                    <label htmlFor="start_hour" className="block text-sm font-medium text-gray-700">
                        Start Hour
                    </label>
                    <input
                        id="start_hour"
                        name="start_hour"
                        type="time"
                        value={formData.start_hour}
                        onChange={handleChange}
                        className="w-full rounded border p-2"
                        required
                    />
                </div>
                <div className="basis-1/2">
                    <label htmlFor="end_hour" className="block text-sm font-medium text-gray-700">
                        End Hour
                    </label>
                    <input
                        id="end_hour"
                        name="end_hour"
                        type="time"
                        value={formData.end_hour}
                        onChange={handleChange}
                        className="w-full rounded border p-2"
                        required
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                    {shifting ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
