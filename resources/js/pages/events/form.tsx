import TimePickerWrapper from '@/components/time-picker-wrapper';
import MultiSearchableSelectInline from '@/components/ui/multi-searchable-select-inline';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import '../../../css/time-picker.css';

interface Teacher {
    id: number;
    full_name: string;
}

interface Classroom {
    id: number;
    name: string;
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

interface Props {
    teachers: Teacher[];
    classrooms: Classroom[];
    event?: {
        id?: number;
        name: string;
        description: string;
        start_date: string;
        end_date: string;
        start_hour: string;
        end_hour: string;
        pics: { id: number; user: Teacher }[];
    };
    selectedStudents?: number[];
}

const breadcrumbs = (isEdit: boolean): BreadcrumbItem[] => [
    {
        title: 'Events',
        href: '/events',
    },
    {
        title: isEdit ? 'Edit Event' : 'Buat Event Baru',
    },
];

export default function EventForm({ teachers, classrooms, event, selectedStudents = [] }: Props) {
    const [formData, setFormData] = useState({
        name: event?.name || '',
        description: event?.description || '',
        start_date: event?.start_date || '',
        end_date: event?.end_date || '',
        start_hour: event?.start_hour || '',
        end_hour: event?.end_hour || '',
    });

    const [selectedPics, setSelectedPics] = useState<number[]>(event?.pics ? event.pics.map((pic) => pic.user.id) : []);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(selectedStudents);
    const [selectedStudentsInfo, setSelectedStudentsInfo] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const teacherOptions = teachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.full_name,
    }));

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
        const currentClassStudentIds = students.map((student) => student.id);

        if (checked) {
            setSelectedStudentIds((prev) => {
                const newIds = [...prev];
                currentClassStudentIds.forEach((id) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return newIds;
            });
        } else {
            setSelectedStudentIds((prev) => prev.filter((id) => !currentClassStudentIds.includes(id)));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudentIds.length === 0) {
            toast.error('Pilih minimal 1 peserta');
            return;
        }

        if (selectedPics.length === 0) {
            toast.error('Pilih minimal 1 PIC');
            return;
        }

        const url = event?.id ? `/events/${event.id}` : '/events';
        const method = event?.id ? 'put' : 'post';

        router[method](
            url,
            {
                ...formData,
                pics: selectedPics.map((id) => ({ id })),
                selected_students: selectedStudentIds,
            },
            {
                onSuccess: () => { },
                onError: () => { },
            },
        );
    };

    // Check if all students in current class are selected
    const areAllStudentsSelected = students.length > 0 && students.every((student) => selectedStudentIds.includes(student.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs(!!event?.id)}>
            <Head title={event?.id ? 'Edit Event' : 'Buat Event Baru'} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <h1 className="text-2xl font-bold">{event?.id ? 'Edit Event' : 'Buat Event Baru'}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="rounded-lg border p-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nama Event*
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Nama kegiatan"
                                    maxLength={70}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>
                            <div className="">
                                <label htmlFor="pics" className="block text-sm font-medium text-gray-700">
                                    PIC (Penanggung Jawab)*
                                </label>
                                <MultiSearchableSelectInline
                                    value={selectedPics}
                                    onChange={setSelectedPics}
                                    placeholder="Cari guru..."
                                    endpoint={route('teachers.search')}
                                    initialOptions={teacherOptions}
                                    showInitialOptions={true}
                                    maxInitialOptions={10}
                                />
                            </div>

                            <div>
                                <label htmlFor="start_hour" className="block text-sm font-medium text-gray-700">
                                    Jam Mulai*
                                </label>
                                <TimePickerWrapper
                                    id="start_hour"
                                    value={formData.start_hour}
                                    onChange={(e) => setFormData({ ...formData, start_hour: e })}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="end_hour" className="block text-sm font-medium text-gray-700">
                                    Jam Selesai*
                                </label>
                                <TimePickerWrapper
                                    id="end_hour"
                                    value={formData.end_hour}
                                    minTime={formData.start_hour}
                                    onChange={(e) => setFormData({ ...formData, end_hour: e })}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                                    Tanggal Mulai*
                                </label>
                                <input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                                    Tanggal Selesai*
                                </label>
                                <input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    min={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
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
                                    required
                                />
                            </div>
                        </div>
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
                            href={route('events.index')}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700"
                        >
                            {event?.id ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
