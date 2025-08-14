import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id?: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    role?: Role | null;
}

export default function RoleFormModal({ isOpen, onClose, role }: Props) {
    const [formData, setFormData] = useState<Role>({
        name: '',
    });

    useEffect(() => {
        if (role) {
            setFormData({
                id: role.id,
                name: role.name,
            });
        } else {
            setFormData({
                name: '',
            });
        }
    }, [role]);

    const handleChange = (field: keyof Role, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const requestData = {
            ...formData,
            _method: role?.id ? 'PUT' : 'POST',
        };

        if (role?.id) {
            router.post(`/roles/${role.id}`, requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to update role: ${errorMessage}`);
                },
            });
        } else {
            router.post('/roles', requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to add new role: ${errorMessage}`);
                },
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Add New Role'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Role Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={255}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                    {role ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
