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
    const [formData, setFormData] = useState<Role>({ name: '' });

    useEffect(() => {
        if (role) {
            setFormData({ id: role.id, name: role.name });
        } else {
            setFormData({ name: '' });
        }
    }, [role]);

    const handleChange = (field: keyof Role, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const requestData = { ...formData, _method: role?.id ? 'PUT' : 'POST' };
        if (role?.id) {
            router.post(`/roles/${role.id}`, requestData, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal memperbarui role: ' + Object.values(errors).join('\n')),
            });
        } else {
            router.post('/roles', requestData, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal menambahkan role baru: ' + Object.values(errors).join('\n')),
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Add New Role'} onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" maxLength={70} value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required
                />
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {role ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
