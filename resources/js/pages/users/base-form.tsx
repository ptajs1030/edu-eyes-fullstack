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
    const [formKey, setFormKey] = useState(0);
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    }, [user, role, isOpen, hasInitialized]);

    useEffect(() => {
        if (!isOpen) {
            // Reset semua state ke default
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
            setHasInitialized(false);
            setPreviewImage(null);
            setRemoveProfile(false);
            setFormKey((prev) => prev + 1); // Force re-render

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isOpen, role.id, role.value]);

    const handleChange = (field: keyof User, value: any) => {
        // Remove all whitespace for password fields
        if (field === 'password' || field === 'password_confirmation') {
            value = value.replace(/\s+/g, '');
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNumericInputChange = (fieldName: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
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
                const errorMessage = Object.values(errors).join(', ');
                toast.error(`Validasi gagal: ${errorMessage}`);
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    };

    const mappingStatus = (label: string): string => {
        // lowered label
        switch (label.toLowerCase()) {
            case 'active':
                return 'Aktif';
            case 'inactive':
                return 'Tidak Aktif';
            default:
                return label;
        }
    };

    return (
        <FormModal
            key={formKey}
            isOpen={isOpen}
            onClose={onClose}
            title={user ? `Edit ${role.name}` : `Tambah ${role.name} Baru`}
            onSubmit={handleSubmit}
        >
            {/* Profile Picture */}
            {(role.value === 'admin' || role.value === 'teacher') && (
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
                        <span>Upload Photo</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Max 2MB (300x300)</p>
                </div>
            )}

            {/* Common Fields */}
            <div className="mb-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap*
                </label>
                <input
                    autoComplete="off"
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
                    autoComplete="off"
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
                            autoComplete="off"
                            id="nip"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            minLength={18}
                            maxLength={18}
                            value={formData.nip || ''}
                            onChange={handleNumericInputChange('nip')}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            Posisi/Jabatan
                        </label>
                        <input
                            autoComplete="off"
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
                        autoComplete="off"
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
                    autoComplete="off"
                    id="phone"
                    type="tel"
                    minLength={7}
                    maxLength={15}
                    value={formData.phone || ''}
                    onChange={handleNumericInputChange('phone')}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email{role.value === 'admin' ? '*' : ''}
                </label>
                <input
                    autoComplete="off"
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                    required={role.value === 'admin'}
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
                            {mappingStatus(status.label)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Password Fields */}
            <div className="mb-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {user ? 'Password Baru' : 'Password*'}
                </label>
                <div className="relative">
                    <input
                        autoComplete="off"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 shadow-sm"
                        placeholder={user ? 'Leave blank to keep current password' : ''}
                        required={!user}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.974 9.974 0 013.276-4.568m2.743-1.68A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.974 9.974 0 01-2.47 3.63M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3l-9 9" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>


            <div className="mb-3">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    {user ? 'Konfirmasi Password Baru' : 'Konfirmasi Password*'}
                </label>
                <div className="relative">
                    <input
                        autoComplete="off"
                        id="password_confirmation"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.password_confirmation || ''}
                        onChange={(e) => handleChange('password_confirmation', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 shadow-sm"
                        required={!user}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.974 9.974 0 013.276-4.568m2.743-1.68A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.974 9.974 0 01-2.47 3.63M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3l-9 9" />
                            </svg>
                        )}
                    </button>
                </div>
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
                    {user ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
