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
    role: { id: number; name: string; value: string };
    routePrefix: string;
}

export default function BaseForm({ isOpen, onClose, user, statuses, role, routePrefix }: BaseFormProps) {
    const [formKey, setFormKey] = useState(0);
    const [formData, setFormData] = useState<User>({
        full_name: '', username: '', phone: '', email: '', password: '', password_confirmation: '',
        role_id: role.id, status: 'active',
        ...(role.value === 'admin' || role.value === 'teacher' ? { nip: '', position: '' } : {}),
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
            setFormData({ ...user, password: '', password_confirmation: '', profile_picture: undefined });
            if (user.profile_picture) setPreviewImage(`/storage/${user.profile_picture}`);
            setHasInitialized(true);
        } else if (isOpen && !user && !hasInitialized) {
            setFormData({
                full_name: '', username: '', phone: '', email: '', password: '', password_confirmation: '',
                role_id: role.id, status: 'active',
                ...(role.value === 'admin' || role.value === 'teacher' ? { nip: '', position: '' } : {}),
                ...(role.value === 'parent' ? { job: '' } : {}),
                address: '',
            });
            setPreviewImage(null);
            setHasInitialized(true);
        }
    }, [user, role, isOpen, hasInitialized]);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                full_name: '', username: '', phone: '', email: '', password: '', password_confirmation: '',
                role_id: role.id, status: 'active',
                ...(role.value === 'admin' || role.value === 'teacher' ? { nip: '', position: '' } : {}),
                ...(role.value === 'parent' ? { job: '' } : {}),
                address: '',
            });
            setHasInitialized(false); setPreviewImage(null); setRemoveProfile(false);
            setFormKey((prev) => prev + 1);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen, role.id, role.value]);

    const handleChange = (field: keyof User, value: any) => {
        if (field === 'password' || field === 'password_confirmation') value = value.replace(/\s+/g, '');
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNumericInputChange = (fieldName: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [fieldName]: e.target.value.replace(/\D/g, '') }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
            setFormData((prev) => ({ ...prev, profile_picture: file }));
            setRemoveProfile(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setFormData((prev) => ({ ...prev, profile_picture: undefined }));
        setRemoveProfile(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formDataObj = new FormData();
        if (formData.profile_picture instanceof File) formDataObj.append('profile_picture', formData.profile_picture);
        if (removeProfile) formDataObj.append('remove_profile_picture', '1');
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'profile_picture' && value !== undefined && value !== null) formDataObj.append(key, value);
        });
        if (user?.id) formDataObj.append('_method', 'PUT');
        const url = user?.id ? route(`${routePrefix}.update`, user.id) : route(`${routePrefix}.store`);
        router.post(url, formDataObj, {
            preserveScroll: true,
            onSuccess: () => { onClose(); router.reload(); },
            onError: (errors) => toast.error('Validasi gagal: ' + Object.values(errors).join(', ')),
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    };

    const mappingStatus = (label: string): string => {
        switch (label.toLowerCase()) { case 'active': return 'Aktif'; case 'inactive': return 'Tidak Aktif'; default: return label; }
    };

    return (
        <FormModal key={formKey} isOpen={isOpen} onClose={onClose} title={user ? `Edit ${role.name}` : `Tambah ${role.name} Baru`} onSubmit={handleSubmit}>
            {(role.value === 'admin' || role.value === 'teacher') && (
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile preview" className="h-full w-full object-cover" />
                            ) : (
                                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            )}
                        </div>
                        {(previewImage || (user?.profile_picture && !removeProfile)) && (
                            <button type="button" onClick={handleRemoveImage} className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-1.5 text-white hover:bg-rose-600 transition-all">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <label className="mt-2 cursor-pointer text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                        <span>Upload Photo</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Max 2MB (300x300)</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Lengkap<span className="text-rose-500">*</span>
                </label>
                <input autoComplete="off" type="text" maxLength={70} value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Username<span className="text-rose-500">*</span>
                </label>
                <input autoComplete="off" type="text" maxLength={70} value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
            </div>

            {(role.value === 'admin' || role.value === 'teacher') && (
                <>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">NIP</label>
                        <input autoComplete="off" type="text" inputMode="numeric" pattern="[0-9]*" minLength={18} maxLength={18}
                            value={formData.nip || ''} onChange={handleNumericInputChange('nip')}
                            className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Posisi/Jabatan</label>
                        <input autoComplete="off" type="text" maxLength={70} value={formData.position || ''}
                            onChange={(e) => handleChange('position', e.target.value)}
                            className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                    </div>
                </>
            )}

            {role.value === 'parent' && (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pekerjaan</label>
                    <input autoComplete="off" type="text" maxLength={70} value={formData.job || ''}
                        onChange={(e) => handleChange('job', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nomor Telepon</label>
                <input autoComplete="off" type="tel" minLength={7} maxLength={15}
                    value={formData.phone || ''} onChange={handleNumericInputChange('phone')}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none font-mono" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email{role.value === 'admin' ? <span className="text-rose-500">*</span> : ''}
                </label>
                <input autoComplete="off" type="email" value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required={role.value === 'admin'} />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Alamat</label>
                <textarea value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none" rows={3} />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status<span className="text-rose-500">*</span>
                </label>
                <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none" required>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{mappingStatus(s.label)}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {user ? 'Password Baru' : 'Password<span className="text-rose-500">*</span>'}
                </label>
                <div className="relative">
                    <input autoComplete="off" type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none pr-10"
                        placeholder={user ? 'Leave blank to keep current password' : ''}
                        required={!user} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {user ? 'Konfirmasi Password Baru' : 'Konfirmasi Password<span className="text-rose-500">*</span>'}
                </label>
                <div className="relative">
                    <input autoComplete="off" type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.password_confirmation || ''}
                        onChange={(e) => handleChange('password_confirmation', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none pr-10"
                        required={!user} />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        {showConfirmPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {user ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
