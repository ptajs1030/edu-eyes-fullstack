import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

type Subject = {
    id: number;
    name: string;
    curriculum_year: string;
};

type AcademicYear = {
    id: number;
    title: string;
    status: 'active' | 'inactive';
};

type ExamAssignment = {
    id: number;
    student_id: number;
    score?: number;
    student: {
        id: number;
        full_name: string;
        nis: string;
    };
    classroom: {
        id: number;
        name: string;
    };
};

type Exam = {
    id: number;
    name: string;
    type?: string;
    date: string;
    subject_id: number;
    academic_year_id: number;
    student_count: number;
    created_at: string;
    updated_at: string;
    subject: Subject;
    academicYear: AcademicYear;
    assignments: ExamAssignment[];
};

type PaginatedResponse<T, L> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: L[];
};

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ujian',
        href: '/exams',
    },
];

export default function ExamIndex() {
    const { exams, filters } = usePage<{
        exams: PaginatedResponse<Exam, Link>;
        subjects: Subject[];
        academicYears: AcademicYear[];
        filters: { search?: string; sort?: string; direction?: string };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);


    const openForm = (exam: Exam | null = null) => {
        if (exam) {
            // Edit - redirect ke edit page
            router.get(`/exams/${exam.id}/edit`);
        } else {
            // Create - redirect ke create page
            router.get('/exams/create');
        }
    };


    const handleDelete = async (id: number) => {
        router.delete(`/exams/${id}`, {
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = exams.data.filter((exam) => selectedIds.includes(exam.id));
        const headers = `Tahun Ajaran,Mata Pelajaran,Nama Exam,Tipe,Tanggal,Jumlah Siswa\n`;
        const csv = selectedData
            .map(
                (exam) =>
                    `${exam.academicYear?.title},${exam.subject.name},${exam.name},${exam.type || ''},${exam.date},${exam.student_count}`
            )
            .join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'exams.csv';
        link.click();

        toast.success(`Berhasil mengekspor ${selectedData.length} data ujian`, {
            description: 'File CSV telah didownload otomatis'
        });
    };

    const handleSortChange = (column: string) => {
        router.get(
            route('exams.index'),
            { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' },
            { preserveState: true }
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const tableHeaders = [
        { key: 'academic_year', label: 'Tahun Ajaran', sortable: true },
        { key: 'subject_name', label: 'Mata Pelajaran', sortable: true },
        { key: 'name', label: 'Nama Exam', sortable: true },
        { key: 'type', label: 'Tipe', sortable: true },
        { key: 'date', label: 'Tanggal Pelaksanaan', sortable: true },
        { key: 'student_count', label: 'Jumlah Siswa', sortable: true },
        { key: 'actions', label: 'Action', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Export Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search exam by name or type..."
                            defaultValue={filters.search || ''}
                            onChange={(e) =>
                                router.get(route('exams.index'), { search: e.target.value }, { preserveState: true })
                            }
                            className="w-80 rounded border px-3 py-1"
                        />
                        <button
                            disabled={selectedIds.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 ${
                                selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer'
                            }`}
                        >
                            Ekspor data yang dipilih
                        </button>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Exam
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={exams.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? exams.data.map((exam) => exam.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(exam) => (
                        // log the exam output 
                        <tr key={exam.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(exam.id)}
                                    onChange={() => toggleSelect(exam.id)}
                                />
                            </td>
                            <td className="p-3 text-sm">{exam.academic_year?.title}</td>
                            <td className="p-3 text-sm">{exam.subject.name}</td>
                            <td className="p-3 text-sm font-medium">{exam.name}</td>
                            <td className="p-3 text-sm">{exam.type}</td>
                            <td className="p-3 text-sm">{formatDate(exam.date)}</td>
                            <td className="p-3 text-sm">
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                    {exam.student_count} Siswa
                                </span>
                            </td>
                            <td className="flex justify-center gap-2 p-3">
                                <button
                                    onClick={() => openForm(exam)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <Link
                                    href={route('exams.scoring', exam.id)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Penilaian
                                </Link>
                                <button
                                    onClick={() => setExamToDelete(exam)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={exams.links} />

                {/* Modals */}

                <ActionModal
                    isOpen={!!examToDelete}
                    onClose={() => setExamToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete exam <strong>{examToDelete?.name}</strong>? This action will
                            delete all student assignments and scores and cannot be undone.
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setExamToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (examToDelete) {
                                    handleDelete(examToDelete.id);
                                    setExamToDelete(null);
                                }
                            },
                            variant: 'danger',
                        },
                    ]}
                />
            </div>
        </AppLayout>
    );
}