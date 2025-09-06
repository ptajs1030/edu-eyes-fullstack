import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface AcademicYear {
    id: number;
    title: string;
    start_year: number;
    status: 'active' | 'inactive';
}

interface Classroom {
    id: number;
    name: string;
    level: string;
}

interface Student {
    id: number;
    full_name: string;
    nis: string | null;
    class_id: number;
    classroom?: {
        name: string;
    };
}

interface Subject {
    id: number;
    name: string;
}
interface Attachment {
    url: string;
}

interface Props {
    academicYears: AcademicYear[];
    selectedStudents: number[];
    tasks?: {
        id: number;
        title: string;
        academic_year_id: number;
        description: string;
        due_date: string;
        due_time: string;
        attachments: Attachment[];
        student_assignments: {
            student_id: number;
        }[];
    };
    subjects: Subject[];
    classrooms: Classroom[];
}

const breadcrumbs = (isEdit: boolean): BreadcrumbItem[] => [
    {
        title: 'Tugas',
        href: '/tasks',
    },
    {
        title: isEdit ? 'Edit Tugas' : 'Buat Tugas Baru',
    },
];

export default function CreateTask({ academicYears, selectedStudents, task, classrooms, subjects }: Props) {
    const activeYear = academicYears.find((y) => y.status === 'active');
    const [formData, setFormData] = useState({
        title: task?.title || '',
        academic_year_id: task?.academic_year_id || activeYear?.id || 0,
        description: task?.description || '',
        due_date: task?.due_date || '',
        due_time: task?.due_time || '',
        attachments: task?.attachments || [],
        subject_id: task?.subject_id || '',
        student_assignments: task?.student_assignments || [],
    });

    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [academicYear, setAcademicYear] = useState<number>(task?.academic_year_id || academicYears[0]?.id || 0);
    const selectedAcademicYear = academicYears.find((y) => y.id === academicYear);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(selectedStudents || []);
    const [selectedStudentsInfo, setSelectedStudentsInfo] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || props.attachments || []);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedStudentIds.length > 0) {
            fetchSelectedStudentsInfo(selectedStudentIds);
        } else {
            setSelectedStudentsInfo([]);
        }
    }, [selectedStudentIds]);

    const fetchStudentsByClass = async (classId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('students.by-class', classId));
            if (!response.ok) throw new Error('Failed to fetch students');
            const data = await response.json();
            setStudents(data);
        } catch {
            toast.error('Gagal memuat data siswa');
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSelectedStudentsInfo = async (studentIds: number[]) => {
        try {
            const response = await fetch(route('students.get-by-ids', { ids: studentIds.join(',') }));

            if (!response.ok) throw new Error('Failed to fetch student info');

            const data = await response.json();
            setSelectedStudentsInfo(data);
        } catch {
            toast.error('Gagal memuat data siswa terpilih');
            setSelectedStudentsInfo([]);
        }
    };

    const handleClassChange = (classId: number) => {
        setSelectedClass(classId);
        setStudents([]);
    };

    const handleStudentToggle = (studentId: number) => {
        setSelectedStudentIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
    };

    const handleSelectAllStudents = (checked: boolean) => {
        if (checked) {
            const allStudentIds = students.map((student) => student.id);
            setSelectedStudentIds(allStudentIds);
        } else {
            const studentIdsToRemove = students.map((student) => student.id);
            setSelectedStudentIds((prev) => prev.filter((id) => !studentIdsToRemove.includes(id)));
        }
    };

    const handleAddAttachment = () => {
        setAttachments([...attachments, { url: '' }]);
    };

    const handleRemoveAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleAttachmentChange = (index: number, value: string) => {
        const newAttachments = [...attachments];
        newAttachments[index].url = value;
        setAttachments(newAttachments);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudentIds.length === 0) {
            toast.error('Pilih minimal 1 peserta');
            return;
        }

        const url = task?.id ? `/tasks/${task.id}` : '/tasks';
        const method = task?.id ? 'put' : 'post';

        router[method](
            url,
            {
                ...formData,
                student_ids: selectedStudentIds,
                attachments: attachments.map((a) => ({ url: a.url })),
            },
            {
                onSuccess: () => {},
                onError: () => {},
            },
        );
    };
    const areAllStudentsSelected = students.length > 0 && students.every((student) => selectedStudentIds.includes(student.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs(!!task?.id)}>
            <Head title={task?.id ? 'Edit Tugas' : 'Buat Tugas Baru'} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <h1 className="text-2xl font-bold">{task?.id ? 'Edit Tugas' : 'Buat Tugas Baru'}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="rounded-lg border p-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Nama Tugas*
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    maxLength={70}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="academic_year_id" className="mb-2 block text-sm font-medium text-gray-700">
                                    Tahun Ajaran*
                                </label>
                                <input
                                    type="text"
                                    id="academic_year_id"
                                    value={academicYears.find((y) => y.id === formData.academic_year_id)?.title || ''}
                                    disabled
                                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Tahun ajaran otomatis dipilih dari yang <span className="font-medium">aktif</span>.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                                    Batas Waktu*
                                </label>
                                <input
                                    id="due_date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="due_time" className="block text-sm font-medium text-gray-700">
                                    Batas Waktu (Jam)*
                                </label>
                                <input
                                    id="due_time"
                                    type="time"
                                    value={formData.due_time}
                                    onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                    Mata Pelajaran*
                                </label>
                                <select
                                    id="subject"
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                >
                                    <option value="">Pilih Mata Pelajaran</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Deskripsi
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Lampiran</label>
                        {attachments.map((attachment, index) => (
                            <div key={index} className="mb-2 flex items-center">
                                <input
                                    type="url"
                                    value={attachment.url}
                                    onChange={(e) => handleAttachmentChange(index, e.target.value)}
                                    placeholder="https://example.com/file.pdf"
                                    className="block w-full flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(index)}
                                    className="ml-2 inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm leading-4 font-medium text-red-700 hover:cursor-pointer hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Hapus
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddAttachment}
                            className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-sky-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                        >
                            Tambah Lampiran
                        </button>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Link
                            href="/tasks"
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                        >
                            Batal
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Student Selection */}
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 text-lg font-semibold">Pilih Peserta</h2>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
                                <select
                                    value={selectedClass || ''}
                                    onChange={(e) => handleClassChange(Number(e.target.value))}
                                    className="w-full rounded border p-2"
                                >
                                    <option value="">Pilih Kelas</option>
                                    {classrooms.map((classroom) => (
                                        <option key={classroom.id} value={classroom.id}>
                                            {classroom.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : students.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">{students.length} siswa ditemukan</span>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={areAllStudentsSelected}
                                                onChange={(e) => handleSelectAllStudents(e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 hover:cursor-pointer"
                                            />
                                            Pilih Semua
                                        </label>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto rounded-lg border">
                                        <div className="divide-y divide-gray-200">
                                            {students.map((student) => (
                                                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{student.full_name}</p>
                                                        <p className="text-sm text-gray-500">NIS: {student.nis || '-'}</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudentIds.includes(student.id)}
                                                        onChange={() => handleStudentToggle(student.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 hover:cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-gray-50 p-6 text-center">
                                    <div className="text-gray-400">
                                        {selectedClass ? 'Tidak ada siswa di kelas ini' : 'Pilih kelas untuk melihat siswa'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Students */}
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 text-lg font-semibold">Peserta Terpilih ({selectedStudentIds.length})</h2>

                            {selectedStudentsInfo.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto rounded-lg border border-gray-200">
                                        {selectedStudentsInfo.map((student) => (
                                            <div key={student.id} className="flex items-center justify-between bg-white p-3">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{student.full_name}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>
                                                            {classrooms.find((c) => c.id === student.class_id)?.name ||
                                                                student.classroom?.name ||
                                                                '-'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>NIS: {student.nis || '-'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStudentToggle(student.id)}
                                                    className="text-red-500 hover:cursor-pointer hover:text-red-700"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-gray-50 p-6 text-center">
                                    <div className="text-gray-400">Belum ada peserta terpilih</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link
                            href={route('tasks.index')}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                        >
                            {task?.id ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
