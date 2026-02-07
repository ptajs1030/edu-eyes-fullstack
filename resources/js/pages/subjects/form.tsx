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
    const [hasInitialized, setHasInitialized] = useState(false); // Add this flag
    const [formData, setFormData] = useState<Subject>({
        name: '',
        curriculum_year: '',
        is_archived: false,
    });

    useEffect(() => {
        if (isOpen && subject && !hasInitialized) {
            setFormData({
                name: subject.name,
                curriculum_year: subject.curriculum_year,
                is_archived: subject.is_archived,
            });

            setHasInitialized(true);
        } else if (isOpen && !subject && !hasInitialized) {
            setFormData({
                name: '',
                curriculum_year: '',
                is_archived: false,
            });

            setHasInitialized(true);
        }
    }, [subject, isOpen, hasInitialized]);

    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
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
                        toast.error(`Gagal memperbarui mata pelajaran: ${errorMessage}`);
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
                        toast.error(`Gagal menambahkan mata pelajaran baru: ${errorMessage}`);
                    },
                },
            );
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={subject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={70}
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="curriculum_year" className="block text-sm font-medium text-gray-700">
                    Nama Kurikulum
                </label>
                <input
                    id="curriculum_year"
                    name="curriculum_year"
                    type="text"
                    maxLength={70}
                    value={formData.curriculum_year}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="flex items-start gap-3">
                    <div className="flex h-5 items-center">
                        <input
                            type="checkbox"
                            id="is_archived"
                            name="is_archived"
                            checked={formData.is_archived}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-white"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-700">Archive this subject</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                            Archived subjects will be hidden from default views but remain accessible
                        </span>
                    </div>
                </label>
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
                    {subject ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
