import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Tab } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';

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

interface DaySchedule {
    day: number;
    day_name: string;
    shifting_id: number | null;
    teachers: number[];
    selected_teachers: { id: number; name: string }[];
    shifting: Shifting | null;
}

interface Props {
    classroom: Classroom;
    days: DaySchedule[];
    shiftings: Shifting[];
    teachers: { id: number; full_name: string }[];
}

const breadcrumbs = (classroomName: string): BreadcrumbItem[] => [
    {
        title: 'Classrooms',
        href: '/classrooms',
    },
    {
        title: classroomName,
        href: `/classrooms/${classroom.id}/detail`,
    },
    {
        title: 'Schedule',
    },
];

export default function ClassroomSchedule({ classroom, days, shiftings, teachers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        days: days,
    });

    const handleShiftingChange = (dayIndex: number, shiftingId: number | null) => {
        const newDays = [...data.days];
        newDays[dayIndex] = {
            ...newDays[dayIndex],
            shifting_id: shiftingId,
            // Reset teachers jika shifting dihapus
            teachers: shiftingId ? newDays[dayIndex].teachers : [],
            selected_teachers: shiftingId ? newDays[dayIndex].selected_teachers : [],
        };
        setData('days', newDays);
    };

    const handleTeachersChange = (dayIndex: number, selectedTeachers: number[]) => {
        const newDays = [...data.days];
        newDays[dayIndex] = {
            ...newDays[dayIndex],
            teachers: selectedTeachers,
            selected_teachers: selectedTeachers.map((id) => {
                const teacher = teachers.find((t) => t.id === id);
                return { id, name: teacher ? teacher.full_name : '' };
            }),
        };
        setData('days', newDays);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('classrooms.schedule.save', classroom.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(classroom.name)}>
            <Head title={`Classroom Schedule - ${classroom.name}`} />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <h1 className="text-2xl font-bold">Classroom Schedule: {classroom.name}</h1>

                <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                        <Tab
                            className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm leading-5 font-medium text-blue-700 ${selected ? 'bg-white shadow' : 'text-blue-500 hover:bg-white/[0.12] hover:text-white'}`
                            }
                        >
                            By Shifting
                        </Tab>
                        <Tab
                            className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm leading-5 font-medium text-blue-700 ${selected ? 'bg-white shadow' : 'text-blue-500 hover:bg-white/[0.12] hover:text-white'}`
                            }
                        >
                            By Subject
                        </Tab>
                    </Tab.List>
                    <Tab.Panels>
                        <Tab.Panel>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    {data.days.map((daySchedule, index) => (
                                        <div key={daySchedule.day} className="rounded-lg border p-4">
                                            <h3 className="mb-2 text-lg font-semibold">{daySchedule.day_name}</h3>
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700">Shifting</label>
                                                <select
                                                    value={daySchedule.shifting_id || ''}
                                                    onChange={(e) => handleShiftingChange(index, e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full rounded border p-2"
                                                >
                                                    <option value="">-- Select Shifting --</option>
                                                    {shiftings.map((shifting) => (
                                                        <option key={shifting.id} value={shifting.id}>
                                                            {shifting.name} ({shifting.start_hour} - {shifting.end_hour})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {daySchedule.shifting_id && (
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700">Attendance PICs</label>
                                                    <SearchableSelect
                                                        // multiple
                                                        value={daySchedule.teachers}
                                                        onChange={(value) => handleTeachersChange(index, value)}
                                                        placeholder="Select teachers..."
                                                        options={teachers.map((teacher) => ({
                                                            value: teacher.id,
                                                            label: teacher.full_name,
                                                        }))}
                                                    />
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {daySchedule.selected_teachers.map((teacher) => (
                                                            <span key={teacher.id} className="rounded bg-blue-100 px-2 py-1 text-sm">
                                                                {teacher.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer disabled:opacity-50"
                                    >
                                        Save Schedule
                                    </button>
                                </div>
                            </form>
                        </Tab.Panel>
                        <Tab.Panel>
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-gray-500">By Subject schedule will be implemented soon</p>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </AppLayout>
    );
}
