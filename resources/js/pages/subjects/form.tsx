import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Subject {
    id?: number;
    name: string;
    curriculum_year?: string;
    is_archived: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    subject?: Subject | null;
}

export default function SubjectFormModal({ isOpen, onClose, subject }: Props) {
    const [hasInitialized, setHasInitialized] = useState(false);
    const [formData, setFormData] = useState<Subject>({ name: '', curriculum_year: '', is_archived: false });

    useEffect(() => {
        if (isOpen && subject && !hasInitialized) {
            setFormData({ name: subject.name, curriculum_year: subject.curriculum_year, is_archived: subject.is_archived });
            setHasInitialized(true);
        } else if (isOpen && !subject && !hasInitialized) {
            setFormData({ name: '', curriculum_year: '', is_archived: false });
            setHasInitialized(true);
        }
    }, [subject, isOpen, hasInitialized]);

    useEffect(() => { if (!isOpen) setHasInitialized(false); }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (subject?.id) {
            router.put(`/subjects/${subject.id}`, { ...formData }, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal memperbarui mata pelajaran: ' + Object.values(errors).join('\n')),
            });
        } else {
            router.post('/subjects', { ...formData }, {
                preserveScroll: true,
                onSuccess: () => { onClose(); router.reload(); },
                onError: (errors) => toast.error('Gagal menambahkan mata pelajaran baru: ' + Object.values(errors).join('\n')),
            });
        }
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={subject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'} onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" name="name" maxLength={70} value={formData.name} onChange={handleChange}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Kurikulum <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" name="curriculum_year" maxLength={70} value={formData.curriculum_year} onChange={handleChange}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required
                />
            </div>
            <div>
                <label className="flex items-start gap-3 cursor-pointer">
                    <div className="flex h-5 items-center">
                        <input
                            type="checkbox" id="is_archived" name="is_archived"
                            checked={formData.is_archived} onChange={handleCheckboxChange}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 transition-all cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Archive this subject</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Archived subjects will be hidden from default views but remain accessible</span>
                    </div>
                </label>
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {subject ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
