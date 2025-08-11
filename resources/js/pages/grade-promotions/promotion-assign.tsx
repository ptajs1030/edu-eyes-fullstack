import ActionModal from '@/components/action-modal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface StudentAssignment {
    id: number;
    student_id: number;
    full_name: string;
    nis: string | null;
    target_class_id: number | null;
    is_graduate: boolean;
}

interface TargetClassOption {
    id: number;
    name: string;
    level: number;
}

interface IncomingStudent {
    id: number;
    full_name: string;
    nis: string | null;
    initial_class_name: string;
}

interface Classroom {
    id: number;
    name: string;
    level: number;
}

interface Props {
    currentClass: Classroom;
    students: StudentAssignment[];
    targetClassOptions: TargetClassOption[];
    isHighestLevel: boolean;
    unassignedCount: number;
    incomingStudents: IncomingStudent[];
}

export default function PromotionAssign({
    currentClass,
    students: initialStudents,
    targetClassOptions,
    isHighestLevel,
    unassignedCount,
    incomingStudents,
}: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [students, setStudents] = useState<StudentAssignment[]>(initialStudents);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        } else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const toggleStudentSelection = (id: number) => {
        setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id]));
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(students.map((student) => student.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleAssignmentChange = (id: number, field: string, value: any) => {
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, [field]: value } : student)));
    };

    const handleBulkAction = () => {
        if (!bulkAction) return;

        setStudents((prev) =>
            prev.map((student) => {
                if (selectedStudents.includes(student.id)) {
                    return bulkAction === 'graduate'
                        ? { ...student, target_class_id: null, is_graduate: true }
                        : bulkAction === 'null'
                          ? { ...student, target_class_id: null, is_graduate: false }
                          : { ...student, target_class_id: parseInt(bulkAction), is_graduate: false };
                }
                return student;
            }),
        );

        setBulkAction('');
        setSelectedStudents([]);
    };

    const handleSubmit = () => {
        router.post(route('grade-promotions.update', currentClass.id), {
            students,
        });
    };

    const getClassOptions = () => {
        const sameLevelClasses = targetClassOptions.filter((c) => c.level === currentClass.level).map((c) => ({ value: c.id, label: c.name }));

        const nextLevelClasses = targetClassOptions.filter((c) => c.level === currentClass.level + 1).map((c) => ({ value: c.id, label: c.name }));

        const options = [{ value: '', label: 'Belum Ditentukan' }, ...sameLevelClasses, ...nextLevelClasses];

        if (isHighestLevel) {
            options.push({ value: 'graduate', label: 'Lulus' });
        }

        return options;
    };

    const getBulkActionOptions = () => {
        const sameLevelClasses = targetClassOptions
            .filter((c) => c.level === currentClass.level)
            .map((c) => ({ value: c.id, label: `Pindah ke ${c.name}` }));

        const nextLevelClasses = targetClassOptions
            .filter((c) => c.level === currentClass.level + 1)
            .map((c) => ({ value: c.id, label: `Pindah ke ${c.name}` }));

        const options = [{ value: 'null', label: 'Pilih Aksi Massal' }, ...sameLevelClasses, ...nextLevelClasses];

        if (isHighestLevel) {
            options.push({ value: 'graduate', label: 'Luluskan' });
        }

        return options;
    };

    const getStudentStatusColor = (student: StudentAssignment) => {
        if (student.is_graduate) return 'bg-purple-50 border-purple-200';
        if (student.target_class_id) return 'bg-green-50 border-green-200';
        return 'bg-white border';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kenaikan Kelas',
            href: '/grade-promotions',
        },
        {
            title: 'Atur Siswa',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Promosi Kelas - ${currentClass.name}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <h1 className="text-2xl font-bold">Atur Promosi Kelas {currentClass.name}</h1>

                <div className="grid grid-cols-1 gap-6">
                    {students.length === 0 ? (
                        // If Empty class
                        <div className="rounded-lg bg-green-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold">Kelas ini tidak memiliki siswa</p>
                                    <p className="text-sm text-gray-600">Status: {unassignedCount === 0 ? 'Selesai' : 'Belum Selesai'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Current Class Students
                        <div className="rounded-lg border p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Siswa Kelas {currentClass.name}</h2>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Pilih Semua
                                    </label>

                                    <select
                                        value={bulkAction}
                                        onChange={(e) => setBulkAction(e.target.value)}
                                        className="rounded border px-3 py-1 text-sm"
                                    >
                                        {getBulkActionOptions().map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleBulkAction}
                                        disabled={!bulkAction || selectedStudents.length === 0}
                                        className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className={`flex items-center justify-between rounded-lg border p-3 ${getStudentStatusColor(student)}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => toggleStudentSelection(student.id)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="font-medium">{student.full_name}</p>
                                                    <p className="text-sm text-gray-500">NIS: {student.nis || '-'}</p>
                                                </div>
                                            </div>

                                            <select
                                                value={student.is_graduate ? 'graduate' : student.target_class_id || ''}
                                                onChange={(e) => {
                                                    if (e.target.value === 'graduate') {
                                                        handleAssignmentChange(student.id, 'is_graduate', true);
                                                        handleAssignmentChange(student.id, 'target_class_id', null);
                                                    } else {
                                                        handleAssignmentChange(student.id, 'is_graduate', false);
                                                        handleAssignmentChange(
                                                            student.id,
                                                            'target_class_id',
                                                            e.target.value ? parseInt(e.target.value) : null,
                                                        );
                                                    }
                                                }}
                                                className="rounded border px-2 py-1 text-sm"
                                            >
                                                {getClassOptions().map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {unassignedCount > 0 ? (
                                <div className="mt-4 flex items-center rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Siswa belum ditentukan: {unassignedCount}</span>
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Siswa selesai ditentukan</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Incoming Students */}
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-4 text-lg font-semibold">Siswa yang Akan Masuk</h2>

                        <div className="max-h-[500px] overflow-y-auto">
                            {incomingStudents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {incomingStudents.map((student) => (
                                        <div key={student.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <p className="font-medium">{student.full_name}</p>
                                            <div className="mt-1 flex justify-between text-sm text-gray-600">
                                                <span>NIS: {student.nis || '-'}</span>
                                                <span>Dari: {student.initial_class_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500">Belum ada siswa yang akan masuk ke kelas ini</div>
                            )}
                        </div>

                        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Total Siswa Masuk: {incomingStudents.length}</div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-green-700"
                    >
                        Simpan Perubahan
                    </button>
                    <Link
                        href={route('grade-promotions.index')}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                    >
                        Kembali
                    </Link>
                </div>
            </div>

            <ActionModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Konfirmasi Simpan"
                message="Apakah Anda yakin ingin menyimpan perubahan promosi kelas ini?"
                buttons={[
                    {
                        label: 'Batal',
                        onClick: () => setIsConfirmModalOpen(false),
                        variant: 'neutral',
                    },
                    {
                        label: 'Simpan',
                        onClick: () => {
                            handleSubmit();
                            setIsConfirmModalOpen(false);
                        },
                        variant: 'primary',
                    },
                ]}
            />
        </AppLayout>
    );
}
