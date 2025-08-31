import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id?: number;
    full_name: string;
    username: string;
    phone?: string;
    email?: string;
    nip?: string;
    job?: string;
    position?: string;
    profile_picture?: string;
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

export default function BaseForm({ isOpen, onClose, user, statuses, role, routePrefix }: BaseFormProps) {
    const [formData, setFormData] = useState<User>({
        full_name: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: role.id,
        status: 'active',
        ...(role.value === 'admin' || role.value === 'teacher'
            ? {
                  nip: '',
                  position: '',
              }
            : {}),
        ...(role.value === 'parent' ? { job: '' } : {}),
        address: '',
    });

    const [hasInitialized, setHasInitialized] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [removeProfile, setRemoveProfile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user && !hasInitialized) {
            setFormData({
                ...user,
                password: '',
                password_confirmation: '',
                profile_picture: undefined,
            });

            // Set preview if profile picture exists
            if (user.profile_picture) {
                setPreviewImage(`/storage/${user.profile_picture}`);
            }

            setHasInitialized(true);
        } else if (isOpen && !user && !hasInitialized) {
            setFormData({
                full_name: '',
                username: '',
                phone: '',
                email: '',
                password: '',
                password_confirmation: '',
                role_id: role.id,
                status: 'active',
                ...(role.value === 'admin' || role.value === 'teacher'
                    ? {
                          nip: '',
                          position: '',
                      }
                    : {}),
                ...(role.value === 'parent' ? { job: '' } : {}),
                address: '',
            });
            setPreviewImage(null);
            setHasInitialized(true);
        }

        setRemoveProfile(false);
    }, [user, role, isOpen, hasInitialized]);

    // Reset initialization flag when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false)
            setPreviewImage(null);
            setRemoveProfile(false);
        }
    }, [isOpen]);

    const handleChange = (field: keyof User, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview image
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Set to form data
            setFormData((prev) => ({ ...prev, profile_picture: file }));
            setRemoveProfile(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setFormData((prev) => ({ ...prev, profile_picture: undefined }));
        setRemoveProfile(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formDataObj = new FormData();

        // Handle profile picture
        if (formData.profile_picture instanceof File) {
            formDataObj.append('profile_picture', formData.profile_picture);
        }

        // Handle profile picture removal
        if (removeProfile) {
            formDataObj.append('remove_profile_picture', '1');
        }

        // Append other fields
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'profile_picture' && value !== undefined && value !== null) {
                formDataObj.append(key, value);
            }
        });

        // Append method for PUT
        if (user?.id) {
            formDataObj.append('_method', 'PUT');
        }

        const url = user?.id ? route(`${routePrefix}.update`, user.id) : route(`${routePrefix}.store`);

        router.post(url, formDataObj, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                router.reload();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).join('\n');
                toast.error(`Failed: ${errorMessage}`);
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={user ? `Edit ${role.name}` : `Tambah ${role.name} Baru`} onSubmit={handleSubmit}>
            {/* Profile Picture */}
            <div className="mb-4 flex flex-col items-center">
                <div className="relative">
                    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100">
                        {previewImage ? (
                            <img src={previewImage} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        )}
                    </div>

                    {(previewImage || (user?.profile_picture && !removeProfile)) && (
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:cursor-pointer hover:bg-red-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <label className="mt-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    <span>Unggah Foto</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="mt-1 text-xs text-gray-500">Max 2MB (300x300)</p>
            </div>

            {/* Role Field (disabled) */}
            {/* <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                    type="text"
                    value={role.name}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 shadow-sm"
                />
                <input type="hidden" name="role_id" value={role.id} />
            </div> */}

            {/* Common Fields */}
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap*
                </label>
                <input
                    id="full_name"
                    type="text"
                    maxLength={70}
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
                    maxLength={70}
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
                            maxLength={70}
                            value={formData.nip || ''}
                            onChange={(e) => handleChange('nip', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            Posisi/Jabatan
                        </label>
                        <input
                            id="position"
                            type="text"
                            maxLength={70}
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
                        Pekerjaan
                    </label>
                    <input
                        id="job"
                        type="text"
                        maxLength={70}
                        value={formData.job || ''}
                        onChange={(e) => handleChange('job', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    />
                </div>
            )}

            {/* Common Contact Fields */}
            <div className="mb-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Nomor Telepon
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
                    Alamat
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
                    {user ? 'Password Baru' : 'Password*'}
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
                    {user ? 'Konfirmasi Password Baru' : 'Konfirmasi Password*'}
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
