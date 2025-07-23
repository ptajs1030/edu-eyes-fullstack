import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

interface Classroom {
    id: number;
    name: string;
    level: number;
}

interface AcademicYear {
    id: number;
    title: string;
    start_year: number;
}

interface Student {
    id: number;
    full_name: string;
    date_of_birth: string;
    age: number | null;
    parent: {
        id: number;
        full_name: string;
        phone: string;
    } | null;
}

interface Props {
    classroom: Classroom;
    academicYears: AcademicYear[];
    selectedAcademicYear: AcademicYear | null;
    students: Student[];
    studentCount: number;
    filters: {
        sort?: string;
        direction?: string;
    };
}

const breadcrumbs = (classroomName: string, classroomId: number): BreadcrumbItem[] => [
    {
        title: 'Kelas',
        href: '/classrooms',
    },
    {
        title: classroomName,
        href: `/classrooms/${classroomId}`,
    },
    {
        title: 'Riwayat',
        href: '',
    },
];

export default function ClassroomHistory({ classroom, academicYears, selectedAcademicYear, students, studentCount, filters }: Props) {
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get(route('classrooms.history', classroom.id), {
            academic_year: e.target.value,
            sort: filters.sort,
            direction: filters.direction,
        });
    };

    const handleSortChange = (column: string) => {
        router.get(route('classrooms.history', classroom.id), {
            academic_year: selectedAcademicYear?.id,
            sort: column,
            direction: filters.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(classroom.name, classroom.id)}>
            <Head title={`Riwayat - ${classroom.name}`} />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="rounded-lg border p-4">
                    <h1 className="mb-6 text-2xl font-bold">Classroom History</h1>
                    <div className="grid w-2/5 grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">Nama Kelas</p>
                            <p className="font-semibold">{classroom.name}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">Level</p>
                            <p className="font-semibold">{classroom.level}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">Number of Students</p>
                            <p className="font-semibold">{studentCount} students</p>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-500">Tahun Akademik</label>
                            <select
                                value={selectedAcademicYear?.id || ''}
                                onChange={handleYearChange}
                                className="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.title} ({year.start_year})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border p-4">
                    <h1 className="mb-6 text-2xl font-bold">Siswa</h1>
                    <Table
                        headers={[
                            { key: 'no', label: 'No.', sortable: false },
                            { key: 'full_name', label: 'Nama', sortable: false },
                            { key: 'age', label: 'Usia', sortable: false },
                            { key: 'parent', label: 'Nama Orang Tua', sortable: false },
                            { key: 'phone', label: 'Telepon Orang Tua', sortable: false },
                            { key: 'actions', label: 'Aksi', sortable: false },
                        ]}
                        data={students}
                        sortColumn={filters.sort ?? ''}
                        sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                        onSort={handleSortChange}
                        emptyMessage="No students found for selected academic year"
                        rowRender={(student, index) => (
                            <tr key={student.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm">{index + 1}.</td>
                                <td className="p-3 text-sm">{student.full_name}</td>
                                <td className="p-3 text-sm">{student.age ?? '-'}</td>
                                <td className="p-3 text-sm">{student.parent?.full_name || '-'}</td>
                                <td className="p-3 text-sm">{student.parent?.phone || '-'}</td>
                                <td className="p-3">
                                    <button
                                        className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                        onClick={() => {
                                            // Akan diimplementasikan nanti
                                            console.log('View student detail:', student.id);
                                        }}
                                    >
                                        Student Detail
                                    </button>
                                </td>
                            </tr>
                        )}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
