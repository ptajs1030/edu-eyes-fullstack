import AppLayout from '@/layouts/app-layout';
import RichTextEditor from '@/components/rich-text-editor';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface AcademicYear { id: number; title: string; start_year: number; status: 'active' | 'inactive'; }
interface Classroom { id: number; name: string; level: string; }
interface Student { id: number; full_name: string; nis: string | null; class_id: number; classroom?: { name: string }; }
interface Subject { id: number; name: string; }
interface Attachment { url: string; }

interface Props {
    academicYears: AcademicYear[];
    selectedStudents: number[];
    subjects: Subject[];
    classrooms: Classroom[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tugas', href: '/tasks' },
    { title: 'Buat Tugas Baru' },
];

const avatarGrads = ['avatar-grad-1', 'avatar-grad-2', 'avatar-grad-3', 'avatar-grad-4', 'avatar-grad-5', 'avatar-grad-6'];

export default function CreateTask({ academicYears, selectedStudents, classrooms, subjects }: Props) {
    const activeYear = academicYears.find((y) => y.status === 'active');
    const [formData, setFormData] = useState({
        title: '', academic_year_id: activeYear?.id || 0, description: '',
        due_date: '', due_time: '', attachments: [] as Attachment[], subject_id: '',
    });
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(selectedStudents || []);
    const [selectedStudentsInfo, setSelectedStudentsInfo] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash]);
    useEffect(() => { if (selectedClass) fetchStudentsByClass(selectedClass); }, [selectedClass]);
    useEffect(() => {
        if (selectedStudentIds.length > 0) fetchSelectedStudentsInfo(selectedStudentIds);
        else setSelectedStudentsInfo([]);
    }, [selectedStudentIds]);

    const fetchStudentsByClass = async (classId: number) => {
        setIsLoading(true);
        try {
            const r = await fetch(route('students.by-class', classId));
            if (!r.ok) throw new Error('Gagal memuat data siswa');
            setStudents(await r.json());
        } catch { toast.error('Gagal memuat data siswa'); setStudents([]); } finally { setIsLoading(false); }
    };

    const fetchSelectedStudentsInfo = async (ids: number[]) => {
        try {
            const r = await fetch(route('students.get-by-ids', { ids: ids.join(',') }));
            if (!r.ok) throw new Error('Gagal memuat data siswa terpilih');
            setSelectedStudentsInfo(await r.json());
        } catch { toast.error('Gagal memuat data siswa terpilih'); setSelectedStudentsInfo([]); }
    };

    const handleClassChange = (id: number) => { setSelectedClass(id); setStudents([]); setSearchQuery(''); };
    const handleStudentToggle = (id: number) => setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    const handleSelectAll = (checked: boolean) => {
        const ids = students.map((s) => s.id);
        setSelectedStudentIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)));
    };
    const handleAddAttachment = () => setAttachments([...attachments, { url: '' }]);
    const handleRemoveAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));
    const handleAttachmentChange = (index: number, value: string) => {
        const newAttachments = [...attachments];
        newAttachments[index].url = value;
        setAttachments(newAttachments);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) { toast.error('Pilih minimal 1 peserta'); return; }
        router.post('/tasks', { ...formData, student_ids: selectedStudentIds, attachments: attachments.map((a) => ({ url: a.url })) },
            { onSuccess: () => toast.success('Tugas berhasil ditambahkan'), onError: () => toast.error('Gagal menambahkan tugas') });
    };

    const areAllSelected = students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id));
    const filteredStudents = students.filter((s) => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const getInitial = (name: string) => name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
    const getGrad = (id: number) => avatarGrads[id % avatarGrads.length];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Tugas Baru" />
            <Toaster position="top-right" richColors />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">Akademik</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Buat Tugas Baru</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Buat tugas untuk siswa dengan mudah</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Detail Tugas */}
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Tugas</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Lengkapi informasi tugas</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Tugas <span className="text-rose-500">*</span></label>
                                    <input type="text" maxLength={70} value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tahun Ajaran <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input type="text"
                                            value={academicYears.find((y) => y.id === formData.academic_year_id)?.title || ''}
                                            disabled
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Batas Waktu <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                        </div>
                                        <input type="date" value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                            className="form-input w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Batas Waktu (Jam) <span className="text-rose-500">*</span></label>
                                    <input type="time" value={formData.due_time}
                                        onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mata Pelajaran <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select value={formData.subject_id}
                                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                            className="form-input appearance-none w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-10" required>
                                            <option value="">Pilih Mata Pelajaran</option>
                                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi</label>
                                    <RichTextEditor value={formData.description}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        placeholder="Ketik deskripsi tugas di sini..." />
                                </div>
                            </div>
                        </div>

                        {/* Lampiran */}
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 010-1.06l10.94-10.94" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lampiran</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Tambahkan link lampiran tugas</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="url" value={attachment.url}
                                            onChange={(e) => handleAttachmentChange(index, e.target.value)}
                                            placeholder="https://example.com/file.pdf"
                                            className="form-input flex-1 px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                                        <button type="button" onClick={() => handleRemoveAttachment(index)}
                                            className="px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700">
                                            Hapus
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddAttachment}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-dashed border-primary-300 dark:border-primary-700">
                                    + Tambah Lampiran
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Pilih Peserta */}
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Peserta</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Pilih siswa yang akan mengerjakan tugas ini</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">{selectedStudentIds.length}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">terpilih</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kelas</label>
                                        <div className="relative">
                                            <select value={selectedClass || ''} onChange={(e) => handleClassChange(Number(e.target.value))}
                                                className="form-input appearance-none w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-10">
                                                <option value="">Pilih Kelas</option>
                                                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                        </div>
                                        <input type="text" placeholder="Cari siswa..." value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="form-input w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                                    </div>
                                    {students.length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={areAllSelected} onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer" />
                                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">Pilih Semua</span>
                                            </label>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">{students.length} siswa</span>
                                        </div>
                                    )}
                                    <div className="relative">
                                        {!selectedClass ? (
                                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                    <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Pilih kelas untuk melihat siswa</p>
                                            </div>
                                        ) : isLoading ? (
                                            <div className="flex justify-center py-12">
                                                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                                            </div>
                                        ) : students.length === 0 || filteredStudents.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                                                    {selectedClass && students.length === 0 ? 'Tidak ada siswa di kelas ini' : 'Siswa tidak ditemukan'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 max-h-80 overflow-y-auto custom-scroll">
                                                {filteredStudents.map((student, i) => (
                                                    <div key={student.id}
                                                        className={`student-item flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${selectedStudentIds.includes(student.id) ? 'selected border-primary-300 dark:border-primary-600' : 'border-transparent'}`}
                                                        onClick={() => handleStudentToggle(student.id)}
                                                        style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s forwards`, opacity: 0 }}>
                                                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => {}}
                                                            className="student-checkbox w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()} />
                                                        <div className={`w-9 h-9 rounded-full ${getGrad(student.id)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                                                            {getInitial(student.full_name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{student.full_name}</p>
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">NIS: {student.nis || '-'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Peserta Terpilih <span className="ml-1 text-xs text-slate-400 dark:text-slate-500 font-normal">({selectedStudentIds.length})</span>
                                        </h3>
                                        {selectedStudentIds.length > 0 && (
                                            <button type="button" onClick={() => setSelectedStudentIds([])}
                                                className="text-[11px] font-medium text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Hapus Semua</button>
                                        )}
                                    </div>
                                    {selectedStudentIds.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 animate-float">
                                                <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Belum ada peserta terpilih</p>
                                            <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">Pilih siswa dari daftar di sebelah kiri</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStudentsInfo.map((student) => (
                                                <div key={student.id}
                                                    className="chip flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-full text-xs font-medium text-primary-700 dark:text-primary-400">
                                                    <div className={`w-5 h-5 rounded-full ${getGrad(student.id)} flex items-center justify-center text-white text-[9px] font-bold`}>
                                                        {getInitial(student.full_name)}
                                                    </div>
                                                    <span className="truncate max-w-[100px]">{student.full_name}</span>
                                                    <button type="button" onClick={() => handleStudentToggle(student.id)}
                                                        className="ml-1 w-4 h-4 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 flex items-center justify-center transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="sticky bottom-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/40 animate-fade-in-up stagger-5">
                            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs">Pastikan semua data sudah benar sebelum menyimpan.</span>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Link href={route('tasks.index')}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 text-center">
                                        Batal
                                    </Link>
                                    <button type="submit"
                                        className="flex-1 sm:flex-none px-6 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                                        Simpan Tugas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
