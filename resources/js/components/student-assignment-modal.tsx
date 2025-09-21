import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface Classroom {
    id: number;
    name: string;
    level: string;
}

interface Student {
    id: number;
    full_name: string;
    nis: string;
    classroom: {
        id: number;
        name: string;
    };
}

interface AssignedStudent {
    student_id: number;
    student_name: string;
    nis: string;
    class_name: string;
    class_id: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (students: AssignedStudent[]) => void;
    classrooms: Classroom[];
    assignedStudentIds: number[];
}

export default function StudentAssignmentModal({ isOpen, onClose, onSubmit, classrooms, assignedStudentIds }: Props) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch students when class is selected
    useEffect(() => {
        if (selectedClassId) {
            setLoading(true);
            fetch(`/classrooms/${selectedClassId}/students`)
                .then(res => res.json())
                .then(data => {
                    setStudents(data.students || []);
                    setSelectedStudentIds([]);
                })
                .catch(err => {
                    console.error('Error fetching students:', err);
                    setStudents([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setStudents([]);
            setSelectedStudentIds([]);
        }
    }, [selectedClassId]);

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const availableStudentIds = students
                .filter(student => !assignedStudentIds.includes(student.id))
                .map(student => student.id);
            setSelectedStudentIds(availableStudentIds);
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleStudentSelect = (studentId: number, checked: boolean) => {
        if (checked) {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        } else {
            setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
        }
    };

    const handleSubmit = () => {
        const selectedStudents: AssignedStudent[] = students
            .filter(student => selectedStudentIds.includes(student.id))
            .map(student => ({
                student_id: student.id,
                student_name: student.full_name,
                nis: student.nis,
                class_name: student.classroom.name,
                class_id: student.classroom.id
            }));

        onSubmit(selectedStudents);
    };

    const availableStudents = students.filter(student => !assignedStudentIds.includes(student.id));
    const allAvailableSelected = availableStudents.length > 0 && 
        availableStudents.every(student => selectedStudentIds.includes(student.id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Pilih Siswa</h3>
                    <p className="text-sm text-gray-600">Pilih kelas terlebih dahulu, kemudian pilih siswa yang akan di-assign ke exam</p>
                </div>

                {/* Class Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Kelas
                    </label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {classrooms.map((classroom) => (
                            <option key={classroom.id} value={classroom.id}>
                                {classroom.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Student List */}
                {selectedClassId && (
                    <div className="mb-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">PILIH SISWA</h4>
                            {availableStudents.length > 0 && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={allAvailableSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    Check All
                                </label>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">Loading students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">Tidak ada siswa di kelas ini</p>
                            </div>
                        ) : availableStudents.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">Semua siswa di kelas ini sudah di-assign</p>
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                {students.map((student) => {
                                    const isAssigned = assignedStudentIds.includes(student.id);
                                    const isSelected = selectedStudentIds.includes(student.id);
                                    
                                    return (
                                        <div
                                            key={student.id}
                                            className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                                                isAssigned ? 'bg-gray-100' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isAssigned}
                                                onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                                                className="rounded border-gray-300 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${isAssigned ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {student.full_name} ({student.nis})
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedStudentIds.length === 0}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}