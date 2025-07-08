import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

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

// const breadcrumbs: BreadcrumbItem[] = [
//     {
//         title: 'Classrooms',
//         href: '/classrooms',
//     },
// ];

const breadcrumbs = (classroomName: string): BreadcrumbItem[] => [
    {
        title: 'Classrooms',
        href: '/classrooms',
    },
    {
        title: classroomName,
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
        <AppLayout breadcrumbs={breadcrumbs(classroom.name)}>
            <Head title={`Classroom: ${classroom.name}`} />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                {/* Section 1: Classroom Info */}
                <div className="rounded-lg border p-4">
                    <h2 className="mb-6 text-xl font-bold">Classroom Information</h2>
                    <div className="grid w-2/5 grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <p className="mb-1 text-sm text-gray-500">Class Name</p>
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
                            <p className="mb-1 text-sm text-gray-500">Academic Year</p>
                            <p className="font-semibold">{academicYear?.title || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Students Table */}
                <div className="rounded-lg border p-4">
                    <h2 className="mb-6 text-xl font-bold">Students</h2>
                    <Table
                        headers={[
                            { key: 'no', label: 'No.', sortable: false },
                            { key: 'full_name', label: 'Name', sortable: true },
                            { key: 'date_of_birth', label: 'Age', sortable: true },
                            { key: 'parent', label: 'Parent', sortable: false },
                            { key: 'phone', label: 'Parent Phone', sortable: false },
                            { key: 'actions', label: 'Actions', sortable: false },
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
