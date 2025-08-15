import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Classroom {
    id: number;
    name: string;
    level: number;
    students_count: number;
    main_teacher: {
        id: number;
        full_name: string;
    };
    students: Array<{
        id: number;
        full_name: string;
        date_of_birth: string;
        parent: {
            id: number;
            full_name: string;
            phone: string;
        } | null;
    }>;
}

interface AcademicYear {
    title: string;
}

interface Props {
    classroom: Classroom;
    academicYear: AcademicYear | null;
    filters: {
        sort?: string;
        direction?: string;
    };
}

const breadcrumbs = (): BreadcrumbItem[] => [
    {
        title: 'Kelas',
        href: '/classrooms',
    },
    {
        title: 'Detail',
        href: '',
    },
];

export default function ClassroomDetail({ classroom, academicYear, filters }: Props) {
    const calculateAge = (dateOfBirth: string) => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('classrooms.show', classroom.id),
            {
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title={`Kelas - ${classroom.name}`} />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                {/* Section 1: Classroom Info */}
                <div className="rounded-lg border p-4">
                    <h1 className="mb-6 text-2xl font-bold">Informasi Kelas</h1>
                    <div className="grid w-2/5 grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <p className="mb-1 text-sm text-gray-500">Nama Kelas</p>
                            <p className="font-semibold">{classroom.name}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-sm text-gray-500">Main Teacher</p>
                            <p className="font-semibold">{classroom.main_teacher?.full_name || 'Not assigned'}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-sm text-gray-500">Number of Students</p>
                            <p className="font-semibold">{classroom.students_count} students</p>
                        </div>
                        <div>
                            <p className="mb-1 text-sm text-gray-500">Tahun Akademik</p>
                            <p className="font-semibold">{academicYear?.title || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Students Table */}
                <div className="rounded-lg border p-4">
                    <h1 className="mb-6 text-2xl font-bold">Siswa</h1>
                    <Table
                        headers={[
                            { key: 'no', label: 'No.', sortable: false },
                            { key: 'full_name', label: 'Nama', sortable: true },
                            { key: 'date_of_birth', label: 'Usia', sortable: true },
                            { key: 'parent', label: 'Orang Tua', sortable: false },
                            { key: 'phone', label: 'Telepon Orang Tua', sortable: false },
                            { key: 'actions', label: 'Aksi', sortable: false },
                        ]}
                        data={classroom.students}
                        sortColumn={filters.sort ?? ''}
                        sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                        onSort={handleSortChange}
                        rowRender={(student, index) => (
                            <tr key={student.id} className="border-b">
                                <td className="p-3 text-sm">{index + 1}.</td>
                                <td className="p-3 text-sm">{student.full_name}</td>
                                <td className="p-3 text-sm">{calculateAge(student.date_of_birth)} years</td>
                                <td className="p-3 text-sm">{student.parent?.full_name || '-'}</td>
                                <td className="p-3 text-sm">{student.parent?.phone || '-'}</td>
                                <td className="p-3">
                                    <Link
                                        href={route('students.attendance', student.id)}
                                        className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                    >
                                        Detail Siswa
                                    </Link>
                                </td>
                            </tr>
                        )}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
