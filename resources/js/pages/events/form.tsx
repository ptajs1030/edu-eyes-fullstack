import RichTextEditor from '@/components/rich-text-editor';
import MultiSearchableSelectInline from '@/components/ui/multi-searchable-select-inline';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Teacher { id: number; full_name: string; }
interface Classroom { id: number; name: string; }
interface Student { id: number; full_name: string; nis: string | null; class_id: number; classroom?: { name: string }; }

interface Props {
    teachers: Teacher[];
    classrooms: Classroom[];
    event?: { id?: number; name: string; description: string; start_date: string; end_date: string; start_hour: string; end_hour: string; pics: { id: number; user: Teacher }[] };
    selectedStudents?: number[];
}

const breadcrumbs = (isEdit: boolean): BreadcrumbItem[] => [
    { title: 'Kegiatan', href: '/events' },
    { title: isEdit ? 'Edit Kegiatan' : 'Buat Kegiatan Baru' },
];

const avatarGrads = ['avatar-grad-1', 'avatar-grad-2', 'avatar-grad-3', 'avatar-grad-4', 'avatar-grad-5', 'avatar-grad-6'];

export default function EventForm({ teachers, classrooms, event, selectedStudents = [] }: Props) {
    const [formData, setFormData] = useState({
        name: event?.name || '', description: event?.description || '',
        start_date: event?.start_date || '', end_date: event?.end_date || '',
        start_hour: event?.start_hour || '', end_hour: event?.end_hour || '',
    });
    const [selectedPics, setSelectedPics] = useState<number[]>(event?.pics ? event.pics.map((pic) => pic.user.id) : []);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(selectedStudents);
    const [selectedStudentsInfo, setSelectedStudentsInfo] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash]);

    const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.full_name }));

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) { toast.error('Pilih minimal 1 peserta'); return; }
        if (selectedPics.length === 0) { toast.error('Pilih minimal 1 PIC'); return; }
        const url = event?.id ? `/events/${event.id}` : '/events';
        const method = event?.id ? 'put' : 'post';
        router[method](url, { ...formData, pics: selectedPics.map((id) => ({ id })), selected_students: selectedStudentIds }, { onSuccess: () => {}, onError: () => {} });
    };

    const isEdit = !!event?.id;
    const areAllSelected = students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id));
    const filteredStudents = students.filter((s) => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const getInitial = (name: string) => name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
    const getGrad = (id: number) => avatarGrads[id % avatarGrads.length];

    return (
        <AppLayout breadcrumbs={breadcrumbs(isEdit)}>
            <Head title={isEdit ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'} />
            <Toaster position="top-right" richColors />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">Akademik</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{isEdit ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isEdit ? 'Ubah informasi kegiatan' : 'Buat kegiatan sekolah dengan mudah'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Detail Kegiatan */}
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Kegiatan</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Lengkapi informasi kegiatan</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Kegiatan <span className="text-rose-500">*</span></label>
                                    <input type="text" maxLength={70} placeholder="Nama kegiatan" value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">PIC (Penanggung Jawab) <span className="text-rose-500">*</span></label>
                                    <MultiSearchableSelectInline
                                        value={selectedPics} onChange={setSelectedPics}
                                        placeholder="Cari guru..." endpoint={route('teachers.search')}
                                        initialOptions={teacherOptions} showInitialOptions={true} maxInitialOptions={10} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Jam Mulai <span className="text-rose-500">*</span></label>
                                    <input type="time" value={formData.start_hour}
                                        onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Jam Selesai <span className="text-rose-500">*</span></label>
                                    <input type="time" value={formData.end_hour} min={formData.start_hour}
                                        onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tanggal Mulai <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                        </div>
                                        <input type="date" value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className="form-input w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tanggal Selesai <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                        </div>
                                        <input type="date" value={formData.end_date} min={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="form-input w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none" required />
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi <span className="text-rose-500">*</span></label>
                                    <RichTextEditor value={formData.description}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        placeholder="Ketik deskripsi kegiatan di sini..." />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pilih Peserta */}
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Peserta</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Pilih siswa yang mengikuti kegiatan ini</p>
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
                        <div className="sticky bottom-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/40 animate-fade-in-up stagger-4">
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
                                    <Link href={route('events.index')}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 text-center">
                                        Batal
                                    </Link>
                                    <button type="submit"
                                        className="flex-1 sm:flex-none px-6 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]">
                                        {isEdit ? 'Ubah Kegiatan' : 'Simpan Kegiatan'}
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
