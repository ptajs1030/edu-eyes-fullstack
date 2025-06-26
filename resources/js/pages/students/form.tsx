import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

interface Classroom {
    id: number;
    name: string;
}

interface Student {
    id?: number;
    full_name: string;
    class_id?: number | null;
    entry_year: number;
    gender: string;
    religion: string;
    status: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student?: Student | null;
    classrooms: Classroom[];
    sexes: { value: string; label: string }[];
    religions: { value: string; label: string }[];
}

export default function StudentFormModal({ isOpen, onClose, student, classrooms, sexes, religions }: Props) {
    const [formData, setFormData] = useState<Omit<Student, 'id'>>({
        full_name: '',
        entry_year: 0,
        gender: '',
        religion: '',
        status: '',
        class_id: null,
    });

    useEffect(() => {
        if (student) {
            setFormData({
                full_name: student.full_name,
                entry_year: student.entry_year,
                gender: student.gender,
                religion: student.religion,
                status: student.status,
                class_id: student.class_id || null,
            });
        } else {
            setFormData({
                full_name: '',
                entry_year: new Date().getFullYear(),
                gender: '',
                religion: '',
                status: '',
                class_id: null,
            });
        }
    }, [student]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (student?.id) {
            router.post(
                route('students.update', student.id),
                {
                    ...formData,
                    _method: 'PUT',
                },
                {
                    onSuccess: () => onClose(),
                },
            );
        } else {
            router.post(route('students.store'), formData, {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Student' : 'Add New Student'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                </label>
                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="entry_year" className="block text-sm font-medium text-gray-700">
                    Entry Year
                </label>
                <input
                    id="entry_year"
                    name="entry_year"
                    type="number"
                    min="1900"
                    max="2099"
                    value={formData.entry_year}
                    onChange={handleChange}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                </label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded border p-2">
                    <option value="">Select Gender</option>
                    {sexes.map((sex) => (
                        <option key={sex.value} value={sex.value}>
                            {sex.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                    Religion
                </label>
                <select id="religion" name="religion" value={formData.religion} onChange={handleChange} className="w-full rounded border p-2">
                    <option value="">Select Religion</option>
                    {religions.map((religion) => (
                        <option key={religion.value} value={religion.value}>
                            {religion.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
                    Classroom
                </label>
                <select id="class_id" name="class_id" value={formData.class_id || ''} onChange={handleChange} className="w-full rounded border p-2">
                    <option value="">Select Classroom</option>
                    {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                            {classroom.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                    {student ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
