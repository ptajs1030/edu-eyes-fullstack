import FormModal from '@/components/form-modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Teacher {
    id: number;
    full_name: string;
}

interface Classroom {
    id?: number;
    name: string;
    level: number;
    main_teacher_id: number | null;
    main_teacher?: Teacher | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classroom?: Classroom | null;
}

export default function ClassroomFormModal({ isOpen, onClose, classroom }: Props) {
    const [formData, setFormData] = useState<Omit<Classroom, 'id'>>({
        name: '',
        level: 1,
        main_teacher_id: null,
    });
    const [initialTeacher, setInitialTeacher] = useState<Teacher | null>(null);
    const [resetSelectKey, setResetSelectKey] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setIsSubmitting(false);
            if (classroom) {
                setFormData({ name: classroom.name, level: classroom.level, main_teacher_id: classroom.main_teacher_id });
                if (classroom.main_teacher) {
                    setInitialTeacher({ id: classroom.main_teacher_id as number, full_name: classroom.main_teacher.full_name });
                } else {
                    setInitialTeacher(null);
                }
            } else {
                setFormData({ name: '', level: 1, main_teacher_id: null });
                setInitialTeacher(null);
            }
            setResetSelectKey((prev) => prev + 1);
        }
    }, [isOpen, classroom]);

    const handleChange = (field: keyof Omit<Classroom, 'id'>, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);
        const requestData = { ...formData, _method: classroom?.id ? 'PUT' : 'POST' };
        router.post(classroom?.id ? `/classrooms/${classroom.id}` : '/classrooms', requestData, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => { setIsSubmitting(false); onClose(); },
            onError: (errors) => { setIsSubmitting(false); toast.error(`Gagal memperbarui kelas: ${Object.values(errors).join('\n')}`); },
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={classroom ? 'Edit Kelas' : 'Tambahkan Kelas Baru'} onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tingkat <span className="text-rose-500">*</span>
                </label>
                <input
                    type="number" min="1" value={formData.level}
                    onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nama Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text" maxLength={70} value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Wali Murid</label>
                <SearchableSelect
                    key={resetSelectKey}
                    value={formData.main_teacher_id}
                    onChange={(value) => handleChange('main_teacher_id', value ? Number(value) : null)}
                    placeholder="Cari guru dengan nama..."
                    endpoint={route('teachers.search')}
                    initialOption={initialTeacher}
                    showInitialOptions={true}
                    maxInitialOptions={10}
                />
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                    Batal
                </button>
                <button type="submit" className="ml-3 px-5 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    {classroom ? 'Ubah' : 'Simpan'}
                </button>
            </div>
        </FormModal>
    );
}
