import MultiSearchableSelectInline from '@/components/ui/multi-searchable-select-inline';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

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
        // pics: event?.pics || [],
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
            setStudents([]);
            toast.error('Gagal memuat data siswa');
        } finally {
            setIsLoading(false);
        }
    };

    // const fetchStudents = async (classId: number) => {
    //     setIsLoading(true);
    //     try {
    //         const response = await fetch(route('events.get-students', classId));
    //         const data = await response.json();
    //         setStudents(data);
    //     } catch {
    //         toast.error('Gagal memuat data siswa');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const fetchSelectedStudentsInfo = async () => {
    //     try {
    //         const response = await fetch(route('students.get-by-ids', { ids: selectedStudents.join(',') }));
    //         const data = await response.json();
    //         setSelectedStudentsInfo(data);
    //     } catch (error) {
    //         toast.error('Gagal memuat data siswa terpilih');
    //     }
    // };

    const fetchSelectedStudentsInfo = async (studentIds: number[]) => {
        try {
            const response = await fetch(route('students.get-by-ids', { ids: studentIds.join(',') }));

            if (!response.ok) throw new Error('Failed to fetch student info');

            const data = await response.json();
            setSelectedStudentsInfo(data);
        } catch {
            setSelectedStudentsInfo([]);
            toast.error('Gagal memuat data siswa terpilih');
        }
    };

    const handleClassChange = (classId: number) => {
        setSelectedClass(classId);
        setStudents([]);
    };

    // const handleStudentToggle = (studentId: number) => {
    //     setSelectedStudents((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
    // };

    const handleStudentToggle = (studentId: number) => {
        setSelectedStudentIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
    };

    const handleSelectAllStudents = (checked: boolean) => {
        if (checked) {
            const allStudentIds = students.map((student) => student.id);
            setSelectedStudentIds(allStudentIds);
        } else {
            // Hapus hanya siswa dari kelas yang sedang dipilih
            const studentIdsToRemove = students.map((student) => student.id);
            setSelectedStudentIds((prev) => prev.filter((id) => !studentIdsToRemove.includes(id)));
        }
    };

    // const handlePicChange = (selected: Teacher[]) => {
    //     setFormData((prev) => ({ ...prev, pics: selected }));
    // };

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

        const url = event?.id ? `/events/${event.id}` : '/events/';
        const method = event?.id ? 'put' : 'post';

        router[method](
            url,
            {
                // ...formData,
                // selected_students: selectedStudents,
                ...formData,
                pics: selectedPics.map((id) => ({ id })),
                selected_students: selectedStudentIds,
            },
            {
                onSuccess: () => {
                    // toast.success(`Event ${event?.id ? 'diperbarui' : 'dibuat'} successfully`);
                },
                onError: (errors) => {
                    // toast.error(Object.values(errors).join('\n'));
                },
            },
        );
    };

    console.log(selectedStudentIds);

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
                                {/* <MultiSearchableSelect
                                    value={selectedPics}
                                    onChange={setSelectedPics}
                                    placeholder="Cari guru..."
                                    options={teacherOptions}
                                /> */}
                                <MultiSearchableSelectInline
                                    value={selectedPics}
                                    onChange={setSelectedPics}
                                    placeholder="Cari guru..."
                                    endpoint={route('teachers.search')}
                                    initialOptions={teacherOptions}
                                    showInitialOptions={true}
                                    maxInitialOptions={10}
                                />
                                <p className="mt-1 text-xs text-gray-500">Guru yang dipilih akan muncul di sini. Klik × untuk menghapus.</p>
                            </div>

                            <div>
                                <label htmlFor="start_hour" className="block text-sm font-medium text-gray-700">
                                    Jam Mulai*
                                </label>
                                <input
                                    id="start_hour"
                                    type="time"
                                    value={formData.start_hour}
                                    onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="end_hour" className="block text-sm font-medium text-gray-700">
                                    Jam Selesai*
                                </label>
                                <input
                                    id="end_hour"
                                    type="time"
                                    value={formData.end_hour}
                                    min={formData.start_hour}
                                    onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
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
                                    rows={3}
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
                                <div className="max-h-[300px] overflow-y-auto rounded border">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                    <input
                                                        type="checkbox"
                                                        checked={areAllStudentsSelected}
                                                        onChange={(e) => handleSelectAllStudents(e.target.checked)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudentIds.includes(student.id)}
                                                            onChange={() => handleStudentToggle(student.id)}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">{student.full_name}</td>
                                                    <td className="px-4 py-2 text-sm">{student.nis || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded border bg-gray-50 p-4 text-center text-gray-500">
                                    {selectedClass ? 'Tidak ada siswa di kelas ini' : 'Pilih kelas untuk melihat siswa'}
                                </div>
                            )}
                        </div>

                        {/* Selected Students */}
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 text-lg font-semibold">Peserta Terpilih ({selectedStudentIds.length})</h2>

                            {selectedStudentsInfo.length > 0 ? (
                                <div className="max-h-[300px] overflow-y-auto rounded border">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {selectedStudentsInfo.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-sm">{student.full_name}</td>
                                                    <td className="px-4 py-2 text-sm">{student.nis || '-'}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {classrooms.find((c) => c.id === student.class_id)?.name || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded border bg-gray-50 p-4 text-center text-gray-500">Belum ada peserta terpilih</div>
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
