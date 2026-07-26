import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { router } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
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
    profile_picture?: string | null;
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
        parent_id: null, class_id: null, full_name: '', nis: '', entry_year: new Date().getFullYear(),
        gender: '', status: '', religion: '', birth_place: '', date_of_birth: '', address: '', profile_picture: null,
    });
    const [initialParent, setInitialParent] = useState<Parent | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && student && !hasInitialized) {
            setFormData({
                parent_id: student.parent_id, class_id: student.class_id, full_name: student.full_name,
                nis: student.nis || '', entry_year: student.entry_year, gender: student.gender,
                status: student.status, religion: student.religion, birth_place: student.birth_place,
                date_of_birth: student.date_of_birth, address: student.address, profile_picture: student.profile_picture,
            });
            if (student.profile_picture) setPreviewImage(`/storage/${student.profile_picture}`);
            if (student.parent) {
                setInitialParent({ id: student.parent_id as number, full_name: student.parent.full_name });
            } else {
                setInitialParent(null);
            }
            setHasInitialized(true);
        } else if (isOpen && !student && !hasInitialized) {
            setFormData({
                parent_id: null, class_id: null, full_name: '', nis: '', entry_year: new Date().getFullYear(),
                gender: '', status: '', religion: '', birth_place: '', date_of_birth: '', address: '', profile_picture: null,
            });
            setInitialParent(null);
            setHasInitialized(true);
        }
    }, [student, isOpen, hasInitialized]);

    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false); setInitialParent(null); setPreviewImage(null); setRemoveProfilePicture(false);
        }
    }, [isOpen]);

    useEffect(() => { if (formData.parent_id === null) setInitialParent(null); }, [formData.parent_id]);

    const handleChange = (field: keyof Omit<Student, 'id'>, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, nis: e.target.value.replace(/\D/g, '') }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
            setFormData((prev) => ({ ...prev, profile_picture: file }));
            setRemoveProfilePicture(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setFormData((prev) => ({ ...prev, profile_picture: undefined }));
        setRemoveProfilePicture(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.status) formData.status = 'active';
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'profile_picture' && value !== null) formDataToSend.append(key, value as string);
        });
        if (formData.profile_picture instanceof File) {
            formDataToSend.append('profile_picture', formData.profile_picture);
        } else if (removeProfilePicture) {
            formDataToSend.append('remove_profile_picture', '1');
        }
        formDataToSend.append('_method', student?.id ? 'PUT' : 'POST');
        router.post(student?.id ? `/students/${student.id}` : '/students', formDataToSend, {
            preserveScroll: true, forceFormData: true,
            onSuccess: () => { onClose(); router.reload(); },
            onError: (errors) => toast.error('Validasi Gagal: ' + Object.values(errors).join(', ')),
        });
    };

    const getStatusLabel = (s: string) => { switch (s.toLowerCase()) { case 'active': return 'Aktif'; case 'inactive': return 'Tidak Aktif'; case 'graduated': return 'Lulus'; default: return s; } };
    const getGenderLabel = (k: string) => { switch (k.toLowerCase()) { case 'male': return 'Laki-Laki'; case 'female': return 'Perempuan'; default: return k; } };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Siswa' : 'Tambah Siswa Baru'} onSubmit={handleSubmit}>
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
                    {(previewImage || (student?.profile_picture && !removeProfilePicture)) && (
                        <button type="button" onClick={handleRemoveImage} className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-1.5 text-white hover:bg-rose-600 transition-all">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <label className="mt-2 cursor-pointer text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                    <span>Upload Photo</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Max 2MB (300x300)</p>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input type="text" maxLength={70} value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">NIS</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={20}
                        value={formData.nis ?? ''} onChange={handleNisChange}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none font-mono" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Tahun Masuk <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1}
                        value={formData.entry_year}
                        onChange={(e) => setFormData({ ...formData, entry_year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Orang Tua/Wali</label>
                <SearchableSelect
                    value={formData.parent_id ?? null}
                    onChange={(value) => handleChange('parent_id', value ? Number(value) : null)}
                    placeholder="Cari orang tua dengan nama..."
                    endpoint={route('parents.search')}
                    initialOption={initialParent}
                    required={true}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kelas</label>
                <select value={formData.class_id || ''}
                    onChange={(e) => handleChange('class_id', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none">
                    <option value="">--Pilih kelas--</option>
                    {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <select value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none" required>
                        <option value="">--Pilih Jenis Kelamin--</option>
                        {sexes.map((s) => <option key={s.value} value={s.value}>{getGenderLabel(s.label)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Agama <span className="text-rose-500">*</span>
                    </label>
                    <select value={formData.religion}
                        onChange={(e) => handleChange('religion', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none" required>
                        <option value="">--Pilih Agama--</option>
                        {religions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Tempat Lahir <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" maxLength={70} value={formData.birth_place}
                        onChange={(e) => handleChange('birth_place', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <input type="date" value={formData.date_of_birth}
                            onChange={(e) => handleChange('date_of_birth', e.target.value)}
                            className="form-input w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status <span className="text-rose-500">*</span>
                </label>
                {student ? (
                    <select value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none" required>
                        {statuses.map((s) => <option key={s.value} value={s.value}>{getStatusLabel(s.label)}</option>)}
                    </select>
                ) : (
                    <input type="text" value="Aktif" disabled className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" />
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Alamat <span className="text-rose-500">*</span>
                </label>
                <textarea value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none" required rows={3} />
            </div>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {student ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
