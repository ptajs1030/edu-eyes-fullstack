import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Subject {
    id?: number;
    name: string;
    curriculum_year?: string;
    is_archived: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    subject?: Subject | null;
}

export default function SubjectFormModal({ isOpen, onClose, subject }: Props) {
    const [formData, setFormData] = useState<Subject>({
        name: '',
        curriculum_year: '',
        is_archived: false,
    });

    useEffect(() => {
        if (subject) {
            setFormData({
                name: subject.name,
                curriculum_year: subject.curriculum_year,
                is_archived: subject.is_archived,
            });
        } else {
            setFormData({
                name: '',
                curriculum_year: '',
                is_archived: false,
            });
        }
    }, [subject]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (subject?.id) {
            router.put(
                `/subjects/${subject.id}`,
                { ...formData },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                        router.reload();
                    },
                    onError: (errors) => {
                        const errorMessage = Object.values(errors).join('\n');
                        toast.error(`Failed to update subject: ${errorMessage}`);
                    },
                },
            );
        } else {
            router.post(
                '/subjects',
                { ...formData },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                        router.reload();
                    },
                    onError: (errors) => {
                        const errorMessage = Object.values(errors).join('\n');
                        toast.error(`Failed to add new subject: ${errorMessage}`);
                    },
                },
            );
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={subject ? 'Edit Subject' : 'Add New Subject'} onSubmit={handleSubmit}>
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
                    <label htmlFor="curriculum_year" className="block text-sm font-medium text-gray-700">
                        Curriculum Year
                    </label>
                    <input
                        id="curriculum_year"
                        name="curriculum_year"
                        type="time"
                        value={formData.curriculum_year}
                        onChange={handleChange}
                        className="w-full rounded border p-2"
                        required
                    />
                </div>
                <div className="basis-1/2">
                    <label htmlFor="is_archived" className="block text-sm font-medium text-gray-700">
                        Is Archived
                    </label>
                    <input
                        id="is_archived"
                        name="is_archived"
                        type="time"
                        value={formData.is_archived}
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
                    {subject ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
