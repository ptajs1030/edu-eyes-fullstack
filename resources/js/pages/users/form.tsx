import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
}

interface User {
    id?: number;
    full_name: string;
    username: string;
    phone?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role_id: number | null;
    status: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    roles: Role[];
    statuses: { value: string; label: string }[];
}

export default function UserFormModal({ isOpen, onClose, user, roles, statuses }: Props) {
    const [formData, setFormData] = useState<User>({
        full_name: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: null,
        status: 'active',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                phone: user.phone || '',
                email: user.email || '',
                password: '',
                password_confirmation: '',
                role_id: user.role_id,
                status: user.status,
            });
        } else {
            setFormData({
                full_name: '',
                username: '',
                phone: '',
                email: '',
                password: '',
                password_confirmation: '',
                role_id: null,
                status: 'active',
            });
        }
    }, [user]);

    const handleChange = (field: keyof User, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const requestData = {
            ...formData,
            _method: user?.id ? 'PUT' : 'POST',
        };

        if (user?.id) {
            router.post(`/users/${user.id}`, requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to update user: ${errorMessage}`);
                },
            });
        } else {
            router.post('/users', requestData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join('\n');
                    toast.error(`Failed to add new user: ${errorMessage}`);
                },
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name*
                </label>
                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username*
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="w-full rounded border p-2"
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                </label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded border p-2"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded border p-2"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
                    Role*
                </label>
                <select
                    id="role_id"
                    name="role_id"
                    value={formData.role_id || ''}
                    onChange={(e) => handleChange('role_id', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded border p-2"
                    required
                >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                            {role.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status*
                </label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded border p-2"
                    required
                >
                    {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                            {status.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password*
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full rounded border p-2"
                    placeholder={user ? 'Leave blank to keep current password' : ''}
                />
            </div>
            <div className="mb-3">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    Confirm Password*
                </label>
                <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                    className="w-full rounded border p-2"
                />
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                    {user ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}
