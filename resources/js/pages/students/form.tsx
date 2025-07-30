import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Classroom {
    id: number;
    name: string;
}

interface Parent {
    id: number;
    full_name: string;
}

interface Student {
    id?: number;
    parent_id?: number | null;
    parent?: Parent | null;
    class_id?: number | null;
    full_name: string;
    nis: string | null;
    entry_year: number;
    gender: string;
    status: string;
    religion: string;
    birth_place: string;
    date_of_birth: string;
    address: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student?: Student | null;
    classrooms: Classroom[];
    sexes: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    religions: { value: string; label: string }[];
}

export default function StudentFormModal({ isOpen, onClose, student, classrooms, sexes, statuses, religions }: Props) {
    const [formData, setFormData] = useState<Omit<Student, 'id'>>({
        parent_id: null,
        class_id: null,
        full_name: '',
        nis: '',
        entry_year: new Date().getFullYear(),
        gender: '',
        status: '',
        religion: '',
        birth_place: '',
        date_of_birth: '',
        address: '',
    });
    const [initialParent, setInitialParent] = useState<Parent | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false); // Add this flag

    useEffect(() => {
        if (isOpen && student && !hasInitialized) {
            // Only initialize once when modal opens
            setFormData({
                parent_id: student.parent_id,
                class_id: student.class_id,
                full_name: student.full_name,
                nis: student.nis || '',
                entry_year: student.entry_year,
                gender: student.gender,
                status: student.status,
                religion: student.religion,
                birth_place: student.birth_place,
                date_of_birth: student.date_of_birth,
                address: student.address,
            });

            if (student.parent) {
                setInitialParent({
                    id: student.parent_id as number,
                    full_name: student.parent.full_name,
                });
            } else {
                setInitialParent(null);
            }
            setHasInitialized(true);
        } else if (isOpen && !student && !hasInitialized) {
            setFormData({
                parent_id: null,
                class_id: null,
                full_name: '',
                nis: '',
                entry_year: new Date().getFullYear(),
                gender: '',
                status: '',
                religion: '',
                birth_place: '',
                date_of_birth: '',
                address: '',
            });
            setInitialParent(null);
            setHasInitialized(true);
        }
    }, [student, isOpen, hasInitialized]);

    // Reset initialization flag when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
            setInitialParent(null);
        }
    }, [isOpen]);

    // Update initialParent when formData.parent_id changes (user selects new parent)
    useEffect(() => {
        if (formData.parent_id === null) {
            setInitialParent(null);
        }
    }, [formData.parent_id]);

    const handleChange = (field: keyof Omit<Student, 'id'>, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // set default value
        if (!formData.status) {
            formData.status = 'active';
        }

        const { parent, ...payload } = formData;
        const requestData = {
            ...payload,
            _method: student?.id ? 'PUT' : 'POST',
        };

        if (student?.id) {
            router.post(`/students/${student.id}`, requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to update student: ${errorMessage}`);
                },
            });
        } else {
            router.post('/students', requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to add new student: ${errorMessage}`);
                },
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Siswa' : 'Tambah Siswa Baru'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap
                </label>
                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="nis" className="block text-sm font-medium text-gray-700">
                    NIS
                </label>
                <input
                    id="nis"
                    name="nis"
                    type="text"
                    value={formData.nis ?? ''}
                    onChange={(e) => handleChange('nis', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                    Orang Tua/Wali
                </label>
                <SearchableSelect
                    value={formData.parent_id ?? null}
                    onChange={(value) => handleChange('parent_id', value ? Number(value) : null)}
                    placeholder="Search parent by name..."
                    endpoint={route('parents.search')}
                    initialOption={initialParent ? { id: initialParent.id, full_name: initialParent.full_name } : undefined}
                />
            </div>
            <div className="mb-3">
                <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
                    Kelas
                </label>
                <select
                    id="class_id"
                    name="class_id"
                    value={formData.class_id || ''}
                    onChange={(e) => handleChange('class_id', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                >
                    <option value="">--Pilih kelas--</option>
                    {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                            {classroom.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3 flex flex-row justify-between gap-4">
                <div className="basis-1/2">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Jenis Kelamin
                    </label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    >
                        <option value="">Select Gender</option>
                        {sexes.map((sex) => (
                            <option key={sex.value} value={sex.value}>
                                {sex.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="basis-1/2">
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Agama
                    </label>
                    <select
                        id="religion"
                        name="religion"
                        value={formData.religion}
                        onChange={(e) => handleChange('religion', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    >
                        <option value="">Select Religion</option>
                        {religions.map((religion) => (
                            <option key={religion.value} value={religion.value}>
                                {religion.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mb-3 flex flex-row justify-between gap-4">
                <div className="basis-1/2">
                    <label htmlFor="entry_year" className="block text-sm font-medium text-gray-700">
                        Tahun Masuk
                    </label>
                    <input
                        id="entry_year"
                        name="entry_year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={formData.entry_year}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                entry_year: parseInt(e.target.value) || new Date().getFullYear(),
                            })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    />
                </div>
                <div className="basis-1/2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                    </label>
                    {student ? (
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                            required
                        >
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" value="active" disabled className="w-full rounded border bg-gray-100 px-3 py-2" />
                    )}
                </div>
            </div>
            <div className="mb-3 flex flex-row justify-between gap-4">
                <div className="basis-1/2">
                    <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700">
                        Tempat Lahir
                    </label>
                    <input
                        id="birth_place"
                        name="birth_place"
                        type="text"
                        value={formData.birth_place}
                        onChange={(e) => handleChange('birth_place', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    />
                </div>
                <div className="basis-1/2">
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                        Tanggal Lahir
                    </label>
                    <input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        required
                    />
                </div>
            </div>
            <div className="mb-3"></div>
            <div className="mb-3"></div>
            <div className="mb-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Alamat
                </label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                    rows={3}
                />
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
                    {student ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
