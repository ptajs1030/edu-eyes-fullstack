import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Teacher {
    id: number;
    full_name: string;
}

interface Classroom {
    id?: number;
    name: string;
    level: number;
    main_teacher_id: number | null;
    main_teacher?: Teacher | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classroom?: Classroom | null;
}

export default function ClassroomFormModal({ isOpen, onClose, classroom }: Props) {
    const [formData, setFormData] = useState<Omit<Classroom, 'id'>>({
        name: '',
        level: 1,
        main_teacher_id: null,
    });
    const [initialTeacher, setInitialTeacher] = useState<Teacher | null>(null);
    const [resetSelectKey, setResetSelectKey] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setIsSubmitting(false);

            if (classroom) {
                // Edit mode - isi dengan data classroom
                setFormData({
                    name: classroom.name,
                    level: classroom.level,
                    main_teacher_id: classroom.main_teacher_id,
                });

                if (classroom.main_teacher) {
                    setInitialTeacher({
                        id: classroom.main_teacher_id as number,
                        full_name: classroom.main_teacher.full_name,
                    });
                } else {
                    setInitialTeacher(null);
                }
            } else {
                // Create mode - reset ke default
                setFormData({
                    name: '',
                    level: 1,
                    main_teacher_id: null,
                });
                setInitialTeacher(null);
            }
            // Increment key untuk force reset SearchableSelect
            setResetSelectKey((prev) => prev + 1);
        }
    }, [isOpen, classroom]);

    const handleChange = (field: keyof Omit<Classroom, 'id'>, value: any) => {
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
            _method: classroom?.id ? 'PUT' : 'POST',
        };

        const url = classroom?.id ? `/classrooms/${classroom.id}` : '/classrooms';

        router.post(url, requestData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsSubmitting(false);
                onClose();
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const errorMessage = Object.values(errors).join('\n');
                toast.error(`Gagal memperbarui kelas: ${errorMessage}`);
            },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={classroom ? 'Edit Kelas' : 'Tambahkan Kelas Baru'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                    Level
                </label>
                <input
                    id="level"
                    name="level"
                    type="number"
                    min="1"
                    value={formData.level}
                    onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Kelas
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={70}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="main_teacher_id" className="block text-sm font-medium text-gray-700">
                    Wali Murid
                </label>
                <SearchableSelect
                    key={resetSelectKey}
                    value={formData.main_teacher_id}
                    onChange={(value) => handleChange('main_teacher_id', value ? Number(value) : null)}
                    placeholder="Cari guru dengan nama..."
                    endpoint={route('teachers.search')}
                    initialOption={initialTeacher}
                    showInitialOptions={true}
                    maxInitialOptions={10}
                />
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
                    {classroom ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
