import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import FormModal from '@/components/form-modal';
import { useEffect, useState } from 'react';

interface User {
    id?: number;
    full_name: string;
    username: string;
    phone?: string;
    email?: string;
    nip?: string;
    job?: string;
    position?: string;
    address?: string;
    password?: string;
    password_confirmation?: string;
    role_id: number;
    status: string;
}

interface BaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    statuses: { value: string; label: string }[];
    role: {
        id: number;
        name: string;
        value: string;
    };
    routePrefix: string;
}

export default function BaseForm({
    isOpen,
    onClose,
    user,
    statuses,
    role,
    routePrefix,
}: BaseFormProps) {
    const [formData, setFormData] = useState<User>({
        full_name: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: role.id,
        status: 'active',
        ...(role.value === 'admin' || role.value === 'teacher' ? { 
            nip: '',
            position: '' 
        } : {}),
        ...(role.value === 'parent' ? { job: '' } : {}),
        address: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                password: '',
                password_confirmation: '',
            });
        } else {
            setFormData({
                full_name: '',
                username: '',
                phone: '',
                email: '',
                password: '',
                password_confirmation: '',
                role_id: role.id,
                status: 'active',
                ...(role.value === 'admin' || role.value === 'teacher' ? { 
                    nip: '',
                    position: '' 
                } : {}),
                ...(role.value === 'parent' ? { job: '' } : {}),
                address: '',
            });
        }
    }, [user, role.id]);

    const handleChange = (field: keyof User, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const requestData = {
            ...formData,
            _method: user?.id ? 'PUT' : 'POST',
        };

        const url = user?.id 
            ? route(`${routePrefix}.update`, user.id)
            : route(`${routePrefix}.store`);

        router.post(url, requestData, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                toast.success(user ? `${role.name} updated successfully` : `New ${role.name} created successfully`);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).join('\n');
                toast.error(`Operation failed: ${errorMessage}`);
            },
        });
    };

    return (
        <FormModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={user ? `Edit ${role.name}` : `Add New ${role.name}`}
            onSubmit={handleSubmit}
        >
            {/* Role Field (disabled) */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Role
                </label>
                <input
                    type="text"
                    value={role.name}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
                <input type="hidden" name="role_id" value={role.id} />
            </div>

            {/* Common Fields */}
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name*
                </label>
                <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>

            <div className="mb-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username*
                </label>
                <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required
                />
            </div>

            {/* Role-specific Fields */}
            {(role.value === 'admin' || role.value === 'teacher') && (
                <>
                    <div className="mb-3">
                        <label htmlFor="nip" className="block text-sm font-medium text-gray-700">
                            NIP
                        </label>
                        <input
                            id="nip"
                            type="text"
                            value={formData.nip || ''}
                            onChange={(e) => handleChange('nip', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            Position
                        </label>
                        <input
                            id="position"
                            type="text"
                            value={formData.position || ''}
                            onChange={(e) => handleChange('position', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        />
                    </div>
                </>
            )}

            {role.value === 'parent' && (
                <div className="mb-3">
                    <label htmlFor="job" className="block text-sm font-medium text-gray-700">
                        Job
                    </label>
                    <input
                        id="job"
                        type="text"
                        value={formData.job || ''}
                        onChange={(e) => handleChange('job', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    />
                </div>
            )}

            {/* Common Contact Fields */}
            <div className="mb-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                </label>
                <textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    rows={3}
                />
            </div>

            {/* Status Field */}
            <div className="mb-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status*
                </label>
                <select
                    id="status"
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
            </div>

            {/* Password Fields */}
            <div className="mb-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {user ? 'New Password' : 'Password*'}
                </label>
                <input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    placeholder={user ? 'Leave blank to keep current password' : ''}
                    required={!user}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    {user ? 'Confirm New Password' : 'Confirm Password*'}
                </label>
                <input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation || ''}
                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required={!user}
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
                    {user ? 'Update' : 'Create'}
                </button>
            </div>
        </FormModal>
    );
}