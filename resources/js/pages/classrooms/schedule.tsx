import MultiSearchableSelect from '@/components/ui/multi-searchable-select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Tab } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { toast, Toaster } from 'sonner';

interface Classroom {
    id: number;
    name: string;
}

interface Shifting {
    id: number;
    name: string;
    start_hour: string;
    end_hour: string;
}

interface Teacher {
    id: number;
    full_name: string;
}

interface DaySchedule {
    day: number;
    day_name: string;
    shifting_id: number | null;
    teachers: number[];
    shifting: Shifting | null;
    selected_teachers: { id: number; name: string }[];
}

interface AcademicYear {
    attendance_mode: string;
}

interface Props {
    classroom: Classroom;
    days: DaySchedule[];
    shiftings: Shifting[];
    teachers: Teacher[];
    academicYear: AcademicYear;
}

const breadcrumbs = (classroomName: string, classroomId: number): BreadcrumbItem[] => [
    { title: 'Classrooms', href: '/classrooms' },
    { title: classroomName, href: `/classrooms/${classroomId}` },
    { title: 'Schedule', href: '' },
];

export default function ClassroomSchedule({ classroom, days, shiftings, teachers, academicYear }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        days: days,
    });

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Convert teachers to options format
    const teacherOptions = useMemo(
        () =>
            teachers.map((teacher) => ({
                id: teacher.id,
                name: teacher.full_name,
            })),
        [teachers],
    );

    // Tambahkan useEffect untuk clean data awal
    useEffect(() => {
        const cleanedDays = days.map((day) => ({
            ...day,
            teachers: Array.isArray(day.teachers) ? day.teachers.filter((id) => id !== null) : [],
            selected_teachers: Array.isArray(day.selected_teachers) ? day.selected_teachers.filter((t) => t.id !== null) : [],
        }));

        setData('days', cleanedDays);
    }, []);

    const handleShiftingChange = (dayIndex: number, shiftingId: number | null) => {
        const newDays = [...data.days];
        newDays[dayIndex] = {
            ...newDays[dayIndex],
            shifting_id: shiftingId,
            teachers: shiftingId ? newDays[dayIndex].teachers : [],
            selected_teachers: shiftingId ? newDays[dayIndex].selected_teachers : [],
        };
        setData('days', newDays);
    };

    const handleTeachersChange = (dayIndex: number, selectedIds: (number | string)[]) => {
        const newDays = [...data.days];

        // Filter null values and convert to numbers
        const teacherIds = selectedIds.filter((id) => id !== null).map((id) => Number(id));

        // Get teacher names
        const selectedTeachers = teacherIds.map((id) => {
            const teacher = teachers.find((t) => t.id === id);
            return { id, name: teacher ? teacher.full_name : 'Unknown' };
        });

        newDays[dayIndex] = {
            ...newDays[dayIndex],
            teachers: teacherIds,
            selected_teachers: selectedTeachers,
        };

        setData('days', newDays);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('classrooms.schedule.save', classroom.id));
    };

    // Handle non-shifting mode
    if (academicYear.attendance_mode !== 'per-shift') {
        return (
            <AppLayout breadcrumbs={breadcrumbs(classroom.name, classroom.id)}>
                <Head title={`Classroom Schedule - ${classroom.name}`} />
                <div className="rounded-xl bg-white p-6 shadow-lg">
                    <h2 className="mb-6 text-xl font-bold">Classroom Schedule: {classroom.name}</h2>
                    <div className="rounded-lg bg-gray-50 py-10 text-center">
                        <div className="mb-4 text-5xl">📚</div>
                        <h2 className="mb-2 text-xl font-semibold">Fitur Tidak Tersedia</h2>
                        <p className="mx-auto max-w-md text-gray-600">
                            Sistem saat ini menggunakan mode presensi per subject. Fitur shifting hanya tersedia saat mode presensi diatur ke
                            per-shift.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs(classroom.name, classroom.id)}>
            <Head title={`Classroom Schedule - ${classroom.name}`} />
            <Toaster position="top-right" richColors />

            <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* <h1 className="text-2xl font-bold">Classroom Schedule: {classroom.name}</h1> */}
                    <h1 className="text-2xl font-bold">Classroom Schedule: {classroom.name}</h1>
                    <button
                        type="submit"
                        form="schedule-form"
                        disabled={processing}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>

                <Tab.Group>
                    <Tab.List className="mb-6 flex rounded-lg bg-blue-100 p-1">
                        {['By Shifting', 'By Subject'].map((tab) => (
                            <Tab
                                key={tab}
                                className={({ selected }) =>
                                    `flex-1 rounded-lg py-3 text-center text-sm font-medium transition-all hover:cursor-pointer ${
                                        selected ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:bg-blue-200'
                                    }`
                                }
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels>
                        <Tab.Panel>
                            <form id="schedule-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {data.days.map((daySchedule, index) => (
                                    <div key={daySchedule.day} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                        <h3 className="mb-3 text-lg font-semibold text-gray-800">{daySchedule.day_name}</h3>

                                        <div className="mb-4">
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Shifting:</label>
                                            <select
                                                value={daySchedule.shifting_id || ''}
                                                onChange={(e) => handleShiftingChange(index, e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">-- No Schedule --</option>
                                                {shiftings.map((shifting) => (
                                                    <option key={shifting.id} value={shifting.id}>
                                                        {shifting.name} ({shifting.start_hour} - {shifting.end_hour})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {daySchedule.shifting_id && (
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Teacher responsible:</label>
                                                <MultiSearchableSelect
                                                    value={daySchedule.teachers}
                                                    onChange={(value) => handleTeachersChange(index, value)}
                                                    placeholder="Search teachers..."
                                                    options={teacherOptions}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </form>
                        </Tab.Panel>

                        <Tab.Panel>
                            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                                <div className="mx-auto max-w-md">
                                    <div className="mb-4 text-5xl">📚</div>
                                    <h3 className="mb-2 text-xl font-semibold">Fitur Segera Hadir</h3>
                                    <p className="text-gray-600">
                                        Fitur jadwal per subject sedang dalam pengembangan. Silakan gunakan mode shifting untuk saat ini.
                                    </p>
                                </div>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </AppLayout>
    );
}
