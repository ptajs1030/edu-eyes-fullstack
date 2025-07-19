import MultiSearchableSelect from '@/components/ui/multi-searchable-select';
import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Tab } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Subject {
    id: number;
    name: string;
}

interface SubjectSchedule {
    id?: number;
    subject_id: number | null;
    teacher_id: number | null;
    start_hour: string;
    end_hour: string;
}

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
    subjectSchedulesByDay: { [key: number]: any[] };
    subjects: Subject[];
}

const breadcrumbs = (classroomName: string, classroomId: number): BreadcrumbItem[] => [
    { title: 'Classrooms', href: '/classrooms' },
    { title: classroomName, href: `/classrooms/${classroomId}` },
    { title: 'Schedule', href: '' },
];

export default function ClassroomSchedule({ classroom, days, shiftings, teachers, academicYear, subjectSchedulesByDay, subjects }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        days: days,
    });
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [subjectSchedules, setSubjectSchedules] = useState<{ [day: number]: SubjectSchedule[] }>({});
    const isShiftMode = academicYear.attendance_mode === 'per-shift';
    const isSubjectMode = academicYear.attendance_mode === 'per-subject';
    const [selectedTab, setSelectedTab] = useState(isShiftMode ? 0 : 1);

    // Initialize subject schedules from props
    useEffect(() => {
        const initialSchedules: { [day: number]: SubjectSchedule[] } = {};
        for (let day = 1; day <= 7; day++) {
            initialSchedules[day] =
                subjectSchedulesByDay[day]?.map((schedule) => ({
                    id: schedule.id,
                    subject_id: schedule.subject_id,
                    teacher_id: schedule.teacher_id,
                    start_hour: schedule.start_hour,
                    end_hour: schedule.end_hour,
                })) || [];
        }
        setSubjectSchedules(initialSchedules);
    }, [subjectSchedulesByDay]);

    // Clean initial shift data
    useEffect(() => {
        const cleanedDays = days.map((day) => ({
            ...day,
            teachers: Array.isArray(day.teachers) ? day.teachers.filter((id) => id !== null) : [],
            selected_teachers: Array.isArray(day.selected_teachers) ? day.selected_teachers.filter((t) => t.id !== null) : [],
        }));
        setData('days', cleanedDays);
    }, []);

    // Flash message handler
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

    // Subject schedule handlers
    const addSubjectSchedule = (day: number) => {
        setSubjectSchedules((prev) => ({
            ...prev,
            [day]: [
                ...(prev[day] || []),
                {
                    subject_id: null,
                    teacher_id: null,
                    start_hour: '08:00',
                    end_hour: '09:00',
                },
            ],
        }));
    };

    const updateSubjectSchedule = (day: number, index: number, field: string, value: any) => {
        setSubjectSchedules((prev) => {
            const newSchedules = [...prev[day]];
            newSchedules[index] = { ...newSchedules[index], [field]: value };
            return { ...prev, [day]: newSchedules };
        });
    };

    const removeSubjectSchedule = (day: number, index: number) => {
        setSubjectSchedules((prev) => {
            const newSchedules = [...prev[day]];
            newSchedules.splice(index, 1);
            return { ...prev, [day]: newSchedules };
        });
    };

    // Shift schedule handlers
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
        const teacherIds = selectedIds.filter((id) => id !== null).map((id) => Number(id));
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

    // Tab and submit handlers
    useEffect(() => {
        setSelectedTab(isShiftMode ? 0 : 1);
    }, [academicYear.attendance_mode]);

    const handleTabChange = (index: number) => {
        if ((index === 0 && isShiftMode) || (index === 1 && isSubjectMode)) {
            setSelectedTab(index);
        } else {
            toast.warning(
                `Current attendance mode is "${academicYear.attendance_mode}". 
                Switch mode in Academic Year settings to access this feature.`,
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedTab === 0 && isShiftMode) {
            post(route('classrooms.schedule.shift.save', classroom.id), {
                days: data.days,
            });
        } else if (selectedTab === 1 && isSubjectMode) {
            const schedules = Object.entries(subjectSchedules).flatMap(([day, daySchedules]) =>
                daySchedules
                    .filter((schedule) => schedule.subject_id && schedule.teacher_id)
                    .map((schedule) => ({
                        id: schedule.id,
                        day: parseInt(day),
                        subject_id: schedule.subject_id,
                        teacher_id: schedule.teacher_id,
                        start_hour: schedule.start_hour,
                        end_hour: schedule.end_hour,
                    })),
            );

            post(route('classrooms.schedule.subject.save', classroom.id), {
                schedules,
            });
        }
    };

    const getSaveButtonLabel = () => {
        if (processing) return 'Saving...';
        if (selectedTab === 0) return 'Save Shift Schedule';
        if (selectedTab === 1) return 'Save Subject Schedule';
        return 'Save Schedule';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(classroom.name, classroom.id)}>
            <Head title={`Classroom Schedule - ${classroom.name}`} />
            <Toaster position="top-right" richColors />

            <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-2xl font-bold">Classroom Schedule: {classroom.name}</h1>
                    <button
                        type="submit"
                        form={selectedTab === 0 ? 'schedule-form' : 'subject-schedule-form'}
                        disabled={processing}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                    >
                        {getSaveButtonLabel()}
                    </button>
                </div>

                <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
                    <Tab.List className="mb-6 flex rounded-lg bg-blue-100 p-1">
                        {['By Shifting', 'By Subject'].map((tab) => (
                            <Tab
                                key={tab}
                                disabled={(tab === 'By Shifting' && !isShiftMode) || (tab === 'By Subject' && !isSubjectMode)}
                                className={({ selected }) =>
                                    `flex-1 rounded-lg py-3 text-center text-sm font-medium transition-all hover:cursor-pointer ${
                                        selected ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:bg-blue-200'
                                    } ${
                                        (tab === 'By Shifting' && !isShiftMode) || (tab === 'By Subject' && !isSubjectMode)
                                            ? 'cursor-not-allowed opacity-50'
                                            : ''
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
                            {isSubjectMode ? (
                                <form id="subject-schedule-form" onSubmit={handleSubmit} className="space-y-6">
                                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                        <div key={day} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day - 1]}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => addSubjectSchedule(day)}
                                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    + Add Subject
                                                </button>
                                            </div>

                                            {subjectSchedules[day]?.map((schedule, index) => (
                                                <div
                                                    key={index}
                                                    className="mb-4 grid grid-cols-1 gap-4 rounded-lg border bg-gray-50 p-3 md:grid-cols-12"
                                                >
                                                    <div className="md:col-span-4">
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                                                        <SearchableSelect
                                                            value={schedule.subject_id}
                                                            onChange={(value) => updateSubjectSchedule(day, index, 'subject_id', value)}
                                                            placeholder="Select subject..."
                                                            endpoint={route('subjects.search')}
                                                            initialOption={
                                                                schedule.subject_id
                                                                    ? {
                                                                          id: schedule.subject_id,
                                                                          full_name: subjects.find((s) => s.id === schedule.subject_id)?.name || '',
                                                                      }
                                                                    : undefined
                                                            }
                                                            showInitialOptions={true}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-4">
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Teacher</label>
                                                        <SearchableSelect
                                                            value={schedule.teacher_id}
                                                            onChange={(value) => updateSubjectSchedule(day, index, 'teacher_id', value)}
                                                            placeholder="Select teacher..."
                                                            endpoint={route('teachers.search')}
                                                            initialOption={
                                                                schedule.teacher_id
                                                                    ? {
                                                                          id: schedule.teacher_id,
                                                                          full_name:
                                                                              teachers.find((t) => t.id === schedule.teacher_id)?.full_name || '',
                                                                      }
                                                                    : undefined
                                                            }
                                                            showInitialOptions={true}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                                                        <input
                                                            type="time"
                                                            value={schedule.start_hour}
                                                            onChange={(e) => updateSubjectSchedule(day, index, 'start_hour', e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
                                                        <input
                                                            type="time"
                                                            value={schedule.end_hour}
                                                            onChange={(e) => updateSubjectSchedule(day, index, 'end_hour', e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    <div className="flex items-end md:col-span-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSubjectSchedule(day, index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            × Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {subjectSchedules[day]?.length === 0 && (
                                                <div className="py-4 text-center text-gray-500">No subjects scheduled for this day</div>
                                            )}
                                        </div>
                                    ))}
                                </form>
                            ) : (
                                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                                    <div className="mx-auto max-w-md">
                                        <div className="mb-4 text-5xl">⚠️</div>
                                        <h3 className="mb-2 text-xl font-semibold">Attendance Mode Mismatch</h3>
                                        <p className="text-gray-600">
                                            Currently active attendance mode is "Per Shift". Switch to "Per Subject" mode in Academic Year settings to
                                            use this feature.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </AppLayout>
    );
}
