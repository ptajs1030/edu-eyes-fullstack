import MultiSearchableSelect from '@/components/ui/multi-searchable-select';
import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Tab } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
    editable?: boolean;
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
    { title: 'Kelas', href: '/classrooms' },
    { title: classroomName, href: `/classrooms/${classroomId}` },
    { title: 'Jadwal', href: '' },
];

export default function ClassroomSchedule({ classroom, days, shiftings, teachers, academicYear, subjectSchedulesByDay, subjects }: Props) {
    // Shift Schedule State
    const {
        data: shiftData,
        setData: setShiftData,
        post: postShift,
        processing: isSavingShift,
    } = useForm({
        days: days,
    });

    const [subjectSchedules, setSubjectSchedules] = useState<Record<number, SubjectSchedule[]>>(() =>
        initializeSubjectSchedules(subjectSchedulesByDay),
    );
    const [isSavingSubject, setIsSavingSubject] = useState(false);
    const [selectedTab, setSelectedTab] = useState(academicYear.attendance_mode === 'per-shift' ? 0 : 1);
    const [editingSchedule, setEditingSchedule] = useState<{ day: number; index: number; original: SubjectSchedule } | null>(null);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const isShiftMode = academicYear.attendance_mode === 'per-shift';
    const isSubjectMode = academicYear.attendance_mode === 'per-subject';
    const teacherOptions = useMemo(() => formatTeacherOptions(teachers), [teachers]);

    // Effects
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        setSelectedTab(isShiftMode ? 0 : 1);
    }, [academicYear.attendance_mode]);

    // Handlers
    const handleTabChange = (index: number) => {
        if ((index === 0 && isShiftMode) || (index === 1 && isSubjectMode)) {
            setSelectedTab(index);
        } else {
            toast.warning(
                `Current attendance mode is "${academicYear.attendance_mode}". Switch mode in Academic Year settings to access this feature.`,
            );
        }
    };

    const handleShiftChange = (dayIndex: number, shiftingId: number | null) => {
        const newDays = [...shiftData.days];
        newDays[dayIndex] = {
            ...newDays[dayIndex],
            shifting_id: shiftingId,
            teachers: shiftingId ? newDays[dayIndex].teachers : [],
            selected_teachers: shiftingId ? newDays[dayIndex].selected_teachers : [],
        };
        setShiftData('days', newDays);
    };

    const handleTeachersChange = (dayIndex: number, selectedIds: (number | string)[]) => {
        const newDays = [...shiftData.days];
        const teacherIds = selectedIds.filter((id) => id !== null).map(Number);
        const selectedTeachers = teacherIds.map((id) => ({
            id,
            name: teachers.find((t) => t.id === id)?.full_name || 'Unknown',
        }));

        newDays[dayIndex] = {
            ...newDays[dayIndex],
            teachers: teacherIds,
            selected_teachers: selectedTeachers,
        };
        setShiftData('days', newDays);
    };

    const handleEditSchedule = (day: number, index: number) => {
        const original = { ...subjectSchedules[day][index] };
        setEditingSchedule({ day, index, original });
    };

    const handleCancelEdit = (day: number, index: number) => {
        if (editingSchedule) {
            setSubjectSchedules((prev) => {
                const updated = [...prev[day]];
                updated[index] = editingSchedule.original;
                return { ...prev, [day]: updated };
            });
            setEditingSchedule(null);
        }
    };

    const handleAddSubjectSchedule = (day: number) => {
        setSubjectSchedules((prev) => ({
            ...prev,
            [day]: [
                ...(prev[day] || []),
                {
                    subject_id: null,
                    teacher_id: null,
                    start_hour: '08:00',
                    end_hour: '09:00',
                    editable: true,
                },
            ],
        }));
    };

    const handleUpdateSubjectSchedule = (day: number, index: number, field: string, value: any) => {
        setSubjectSchedules((prev) => {
            const newSchedules = [...prev[day]];
            newSchedules[index] = { ...newSchedules[index], [field]: value };
            return { ...prev, [day]: newSchedules };
        });
    };

    const handleRemoveSubjectSchedule = (day: number, index: number) => {
        setSubjectSchedules((prev) => {
            const newSchedules = [...prev[day]];
            newSchedules.splice(index, 1);
            return { ...prev, [day]: newSchedules };
        });
    };

    const handleSubmitShift = (e: React.FormEvent) => {
        e.preventDefault();
        postShift(route('classrooms.schedule.shift.save', classroom.id));
    };

    const handleSubmitSubject = (e: React.FormEvent) => {
        e.preventDefault();

        const schedules = prepareSubjectSchedulesForSubmit(subjectSchedules);
        const validationErrors = validateSubjectSchedules(schedules);

        if (validationErrors.length > 0) {
            validationErrors.forEach((err) => toast.error(err));
            return;
        }

        setIsSavingSubject(true);

        router.post(
            route('classrooms.schedule.subject.save', classroom.id),
            { schedules },
            {
                onError: (errors) => {
                    Object.values(errors)
                        .flat()
                        .forEach((msg: string) => toast.error(msg));
                },
                onSuccess: () => {
                    window.location.reload();
                },
                onFinish: () => {
                    setIsSavingSubject(false);
                },
            },
        );
    };

    // Helper functions
    function initializeSubjectSchedules(data: { [day: number]: any[] }): Record<number, SubjectSchedule[]> {
        const schedules: Record<number, SubjectSchedule[]> = {};
        for (let day = 1; day <= 7; day++) {
            schedules[day] =
                data[day]?.map((s) => ({
                    id: s.id,
                    subject_id: s.subject_id,
                    teacher_id: s.teacher_id,
                    start_hour: s.start_hour,
                    end_hour: s.end_hour,
                })) || [];
        }
        return schedules;
    }

    function formatTeacherOptions(teachers: Teacher[]) {
        return teachers.map((t) => ({ id: t.id, name: t.full_name }));
    }

    function prepareSubjectSchedulesForSubmit(schedules: Record<number, SubjectSchedule[]>) {
        return Object.entries(schedules)
            .flatMap(([day, daySchedules]) =>
                daySchedules.map((s) => ({
                    id: s.id || undefined,
                    day: parseInt(day),
                    subject_id: s.subject_id ?? null,
                    teacher_id: s.teacher_id ?? null,
                    start_hour: s.start_hour ?? '',
                    end_hour: s.end_hour ?? '',
                })),
            )
            .sort((a, b) => a.day - b.day || a.start_hour.localeCompare(b.start_hour));
    }

    function validateSubjectSchedules(schedules: any[]): string[] {
        const errors: string[] = [];
        const daySchedules: Record<number, any[]> = {};

        // Group by day and check time validity
        schedules.forEach((schedule, index) => {
            if (!schedule.day) {
                errors.push(`Schedule at index ${index + 1} is missing day`);
            }
            if (!schedule.subject_id) {
                errors.push(`Schedule on day ${schedule.day} is missing subject`);
            }
            if (!schedule.teacher_id) {
                errors.push(`Schedule on day ${schedule.day} is missing teacher`);
            }
            if (!schedule.start_hour || !schedule.end_hour) {
                errors.push(`Schedule on day ${schedule.day} is missing start or end time`);
            }
            if (schedule.end_hour <= schedule.start_hour) {
                errors.push(`Day ${schedule.day}: End time must be after start time`);
            }

            if (!daySchedules[schedule.day]) {
                daySchedules[schedule.day] = [];
            }
            daySchedules[schedule.day].push(schedule);
        });

        // Check for overlaps per day
        Object.entries(daySchedules).forEach(([day, schedules]) => {
            schedules.sort((a, b) => a.start_hour.localeCompare(b.start_hour));
            for (let i = 1; i < schedules.length; i++) {
                const prev = schedules[i - 1];
                const current = schedules[i];
                if (current.start_hour < prev.end_hour) {
                    errors.push(
                        `Day ${day}: Schedule overlaps between ${prev.start_hour}-${prev.end_hour} and ${current.start_hour}-${current.end_hour}`,
                    );
                }
            }
        });

        return errors;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs(classroom.name, classroom.id)}>
            <Head title={`Jadwal - ${classroom.name}`} />
            <Toaster position="top-right" richColors />

            <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-2xl font-bold">Jadwal: {classroom.name}</h1>
                    <button
                        type="submit"
                        form={selectedTab === 0 ? 'shift-form' : 'subject-form'}
                        disabled={selectedTab === 0 ? isSavingShift : isSavingSubject}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                    >
                        {selectedTab === 0
                            ? isSavingShift
                                ? 'Saving...'
                                : 'Save Shift Schedule'
                            : isSavingSubject
                              ? 'Saving...'
                              : 'Save Subject Schedule'}
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
                            <form id="shift-form" onSubmit={handleSubmitShift} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {shiftData.days.map((daySchedule, index) => (
                                    <div key={daySchedule.day} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                        <h3 className="mb-3 text-lg font-semibold text-gray-800">{daySchedule.day_name}</h3>

                                        <div className="mb-4">
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Shifting:</label>
                                            <select
                                                value={daySchedule.shifting_id || ''}
                                                onChange={(e) => handleShiftChange(index, e.target.value ? parseInt(e.target.value) : null)}
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
                                <form id="subject-form" onSubmit={handleSubmitSubject} className="space-y-6">
                                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                        <div key={day} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day - 1]}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSubjectSchedule(day)}
                                                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-green-700"
                                                >
                                                    + Add Subject
                                                </button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-1">
                                                {subjectSchedules[day]?.map((schedule, index) => {
                                                    const isEditing = editingSchedule?.day === day && editingSchedule?.index === index;
                                                    const isNew = !schedule.id;

                                                    return (
                                                        <div key={index} className="relative rounded-md border border-gray-300 bg-gray-50 p-4">
                                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                                                                    <input
                                                                        type="time"
                                                                        value={schedule.start_hour}
                                                                        onChange={(e) =>
                                                                            handleUpdateSubjectSchedule(day, index, 'start_hour', e.target.value)
                                                                        }
                                                                        className={`w-full rounded-md border p-2 text-sm ${!isEditing && !isNew ? 'bg-gray-100' : 'bg-white'}`}
                                                                        disabled={!isEditing && !isNew}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
                                                                    <input
                                                                        type="time"
                                                                        value={schedule.end_hour}
                                                                        onChange={(e) =>
                                                                            handleUpdateSubjectSchedule(day, index, 'end_hour', e.target.value)
                                                                        }
                                                                        className={`w-full rounded-md border p-2 text-sm ${!isEditing && !isNew ? 'bg-gray-100' : 'bg-white'}`}
                                                                        disabled={!isEditing && !isNew}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                                                                    <SearchableSelect
                                                                        value={schedule.subject_id}
                                                                        onChange={(value) =>
                                                                            handleUpdateSubjectSchedule(day, index, 'subject_id', value)
                                                                        }
                                                                        placeholder="Select subject..."
                                                                        endpoint={route('subjects.search')}
                                                                        initialOption={
                                                                            schedule.subject_id
                                                                                ? {
                                                                                      id: schedule.subject_id,
                                                                                      full_name:
                                                                                          subjects.find((s) => s.id === schedule.subject_id)?.name ||
                                                                                          '',
                                                                                  }
                                                                                : undefined
                                                                        }
                                                                        showInitialOptions={true}
                                                                        disabled={!isEditing && !isNew}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Teacher</label>
                                                                    <SearchableSelect
                                                                        value={schedule.teacher_id}
                                                                        onChange={(value) =>
                                                                            handleUpdateSubjectSchedule(day, index, 'teacher_id', value)
                                                                        }
                                                                        placeholder="Select teacher..."
                                                                        endpoint={route('teachers.search')}
                                                                        initialOption={
                                                                            schedule.teacher_id
                                                                                ? {
                                                                                      id: schedule.teacher_id,
                                                                                      full_name:
                                                                                          teachers.find((t) => t.id === schedule.teacher_id)
                                                                                              ?.full_name || '',
                                                                                  }
                                                                                : undefined
                                                                        }
                                                                        showInitialOptions={true}
                                                                        disabled={!isEditing && !isNew}
                                                                    />
                                                                </div>

                                                                <div className="flex h-full items-center justify-start space-x-2 pt-6 md:pt-0">
                                                                    {isNew ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveSubjectSchedule(day, index)}
                                                                                className="rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-gray-600"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingSchedule(null)}
                                                                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-800"
                                                                            >
                                                                                Done
                                                                            </button>
                                                                        </>
                                                                    ) : isEditing ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCancelEdit(day, index)}
                                                                                className="rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-gray-600"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingSchedule(null)}
                                                                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer"
                                                                            >
                                                                                Done
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditSchedule(day, index)}
                                                                                className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-yellow-600"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveSubjectSchedule(day, index)}
                                                                                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-red-700"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

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
