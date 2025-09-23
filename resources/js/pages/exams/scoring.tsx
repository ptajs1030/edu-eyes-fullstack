import AppLayout from '@/layouts/app-layout';
import { getActiveAcademicYear, isAcademicYearPassed } from '@/lib/academic-year-utils';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Subject {
    id: number;
    name: string;
}

interface AcademicYear {
    id: number;
    title: string;
    start_year: number;
    status: 'active' | 'inactive';
}

interface StudentAssignment {
    id: number;
    student_id: number;
    student_name: string;
    nis: string;
    class_name: string;
    class_id: number;
    score: number | null;
}

interface ExamData {
    id: number;
    academic_year_id: number;
    subject_id: number;
    name: string;
    type: string;
    date: string;
    academic_year: AcademicYear;
    subject: Subject;
    student_assignments: StudentAssignment[];
}

interface Props {
    exam: ExamData;
    academicYears: AcademicYear[];
}

export default function ExamScoring({ exam, academicYears }: Props) {
    const [scores, setScores] = useState<Record<number, string>>({});
    const [editingScores, setEditingScores] = useState<Record<number, boolean>>({});
    const [savingScores, setSavingScores] = useState<Record<number, boolean>>({});

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const isExamEditable = (examAcademicYear: AcademicYear | undefined, academicYears: AcademicYear[]): boolean => {
        const activeAcademicYear = getActiveAcademicYear(academicYears);
        return !isAcademicYearPassed(examAcademicYear, activeAcademicYear);
    };
    const examAcademicYear = academicYears.find((year) => year.id === exam.academic_year_id);
    const isEditable = isExamEditable(examAcademicYear, academicYears);
    const activeAcademicYear = getActiveAcademicYear(academicYears);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ujian', href: '/exams' },
        { title: 'Penilaian', href: '' },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Initialize scores from exam data
    useEffect(() => {
        const initialScores: Record<number, string> = {};
        exam.student_assignments.forEach((assignment) => {
            initialScores[assignment.id] = assignment.score?.toString() || '';
        });
        setScores(initialScores);
    }, [exam.student_assignments]);

    const handleScoreChange = (assignmentId: number, value: string) => {
        // Only allow numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setScores((prev) => ({ ...prev, [assignmentId]: value }));
        }
    };

    const handleEditClick = (assignmentId: number) => {
        setEditingScores((prev) => ({ ...prev, [assignmentId]: true }));
    };

    const handleCancelEdit = (assignmentId: number) => {
        // Reset to original value
        const originalScore = exam.student_assignments.find((a) => a.id === assignmentId)?.score;
        setScores((prev) => ({ ...prev, [assignmentId]: originalScore?.toString() || '' }));
        setEditingScores((prev) => ({ ...prev, [assignmentId]: false }));
    };

    const handleSaveScore = async (assignmentId: number) => {
        const scoreValue = scores[assignmentId];

        if (scoreValue === '') {
            toast.error('Nilai tidak boleh kosong');
            return;
        }

        const numericScore = parseFloat(scoreValue);
        if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
            toast.error('Nilai harus antara 0-100');
            return;
        }

        setSavingScores((prev) => ({ ...prev, [assignmentId]: true }));

        // Gunakan Inertia router untuk PUT request
        router.put(
            `/exams/${exam.id}/assignments/${assignmentId}/score`,
            { score: numericScore },
            {
                onSuccess: () => {
                    setEditingScores((prev) => ({ ...prev, [assignmentId]: false }));

                    // Update the exam data to reflect the new score
                    const assignmentIndex = exam.student_assignments.findIndex((a) => a.id === assignmentId);
                    if (assignmentIndex !== -1) {
                        exam.student_assignments[assignmentIndex].score = numericScore;
                    }
                },
                onError: (errors) => {
                    console.error('Error saving score:', errors);
                    toast.error('Gagal menyimpan nilai');
                    handleCancelEdit(assignmentId);
                },
                onFinish: () => {
                    setSavingScores((prev) => ({ ...prev, [assignmentId]: false }));
                },
            },
        );
    };

    const handleSaveAllScores = async () => {
        const scoresToUpdate = Object.entries(scores)
            .filter(([assignmentId, score]) => {
                const numericScore = parseFloat(score);
                return !isNaN(numericScore) && numericScore >= 0 && numericScore <= 100;
            })
            .map(([assignmentId, score]) => ({
                assignment_id: parseInt(assignmentId),
                score: parseFloat(score),
            }));

        if (scoresToUpdate.length === 0) {
            toast.error('Tidak ada nilai valid untuk disimpan');
            return;
        }

        const loadingToast = toast.loading('Menyimpan semua nilai...');

        // Gunakan Inertia router untuk bulk update
        router.put(
            `/exams/${exam.id}/scores/bulk`,
            { scores: scoresToUpdate },
            {
                onSuccess: (page) => {
                    toast.dismiss(loadingToast);
                    setEditingScores({});

                    // Update all scores in the exam data
                    scoresToUpdate.forEach(({ assignment_id, score }) => {
                        const assignmentIndex = exam.student_assignments.findIndex((a) => a.id === assignment_id);
                        if (assignmentIndex !== -1) {
                            exam.student_assignments[assignmentIndex].score = score;
                        }
                    });
                },
                onError: (errors) => {
                    toast.dismiss(loadingToast);
                    console.error('Error saving bulk scores:', errors);
                    toast.error('Gagal menyimpan nilai');
                },
                onFinish: () => {
                    toast.dismiss(loadingToast);
                },
            },
        );
    };

    const handleExportScoresCSV = () => {
        const headers = ['Nama', 'NIS', 'Kelas', 'Nilai'];
        const rows = exam.student_assignments.map((a) => [
            a.student_name,
            a.nis || '-',
            a.class_name || '-',
            a.score !== null && a.score !== undefined ? a.score : '-',
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `exam_${exam.id}_scores.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-400';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreStatus = (score: number | null) => {
        if (score === null) return 'Belum dinilai';
        else return 'Sudah Dinilai';
    };

    const hasUnsavedChanges = Object.keys(editingScores).some((key) => editingScores[parseInt(key)]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Penilaian - ${exam.name}`} />
            <Toaster position="top-right" richColors />

            {/* Warning banner jika tidak bisa scoring */}
            {!isEditable && (
                <div className="m-6 mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center">
                        <svg className="mr-2 h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.46 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                        <div>
                            <span className="font-medium text-yellow-800">
                                Tahun ajaran {examAcademicYear?.title} sudah lewat dari tahun ajaran aktif ({activeAcademicYear?.title}).
                            </span>
                            <p className="mt-1 text-sm text-yellow-700">Penilaian hanya dapat dilihat dan tidak dapat diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-lg">
                {/* Exam Header */}
                <div className="mb-6 border-b pb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">{exam.name}</h2>
                    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                            <div className="mt-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                {exam.academic_year.title}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                            <div className="mt-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                {exam.subject.name}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipe</label>
                            <div className="mt-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                {exam.type || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tanggal Pelaksanaan</label>
                            <div className="mt-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                {new Date(exam.date).toLocaleDateString('id-ID')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Assignments Table */}
                <div className="mb-6">
                    <div className="mb-6">
                        <div className="mb-4 flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>

                            {/* kanan */}
                            <div className="ml-auto flex items-center gap-3">
                                <div className="text-sm text-gray-700">
                                    Total: <span className="font-semibold">{exam.student_assignments.length}</span> siswa
                                </div>

                                <button
                                    onClick={handleExportScoresCSV}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                >
                                    Ekspor CSV
                                </button>

                                {isEditable && hasUnsavedChanges && (
                                    <button
                                        onClick={handleSaveAllScores}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        Simpan Semua Nilai
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">NIS</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Kelas</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">NILAI</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exam.student_assignments.map((assignment) => (
                                    <tr key={assignment.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{assignment.student_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{assignment.nis || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{assignment.class_name}</td>
                                        <td className="px-4 py-3 text-center">
                                            {editingScores[assignment.id] ? (
                                                <input
                                                    type="text"
                                                    value={scores[assignment.id] || ''}
                                                    onChange={(e) => handleScoreChange(assignment.id, e.target.value)}
                                                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    placeholder="0-100"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className={`text-sm font-medium ${getScoreColor(assignment.score)}`}>
                                                    {assignment.score !== null ? assignment.score : '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${assignment.score === null ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                                                    }`}
                                            >
                                                {getScoreStatus(assignment.score)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {editingScores[assignment.id] ? (
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleSaveScore(assignment.id)}
                                                        disabled={savingScores[assignment.id]}
                                                        className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                                                    >
                                                        {savingScores[assignment.id] ? '...' : 'Simpan'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelEdit(assignment.id)}
                                                        disabled={savingScores[assignment.id]}
                                                        className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditClick(assignment.id)}
                                                    className={`rounded px-3 py-1 text-xs text-white ${isEditable ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-500 disabled:opacity-50 cursor-not-allowed'}`}
                                                    disabled={!isEditable}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Instructions */}
                <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="text-sm font-medium text-blue-900">Petunjuk:</h4>
                    <ul className="mt-2 text-sm text-blue-800">
                        <li>• Klik tombol "Edit" untuk memperbarui nilai siswa</li>
                        <li>• Nilai harus antara 0-100</li>
                        <li>• Klik "Simpan" untuk menyimpan nilai atau "Batal" untuk membatalkan</li>
                        <li>• Jika ada beberapa perubahan, gunakan tombol "Simpan Semua Nilai" untuk menyimpan sekaligus</li>
                    </ul>
                </div>

                {/* Back Button */}
                <div className="mt-6 flex justify-end border-t pt-6">
                    <button
                        onClick={() => router.get('/exams')}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Kembali ke Daftar Exam
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
