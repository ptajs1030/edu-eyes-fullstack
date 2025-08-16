import ActionModal from '@/components/action-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import StudentFormModal from './form';

type Student = {
    id: number;
    full_name: string;
    entry_year: number;
    gender: string;
    religion: string;
    status: string;
    nis: string;
    birth_place: string;
    date_of_birth: string;
    address: string;
    classroom?: {
        name: string;
    };
};

type Classroom = {
    id: number;
    name: string;
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
        title: 'Siswa',
        href: '/students',
    },
];

export default function StudentIndex() {
    const { students, classrooms, sexes, statuses, religions, filters } = usePage<{
        students: PaginatedResponse<Student, Link>;
        classrooms: Classroom[];
        sexes: { value: string; label: string }[];
        statuses: { value: string; label: string }[];
        religions: { value: string; label: string }[];
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

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrStudent, setQrStudent] = useState<Student | null>(null);
    const [qrDownloadUrl, setQrDownloadUrl] = useState<string>('');
    const [qrSvgHtml, setQrSvgHtml] = useState<string>('');

    const openForm = (student: Student | null = null) => {
        setSelectedStudent(student);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/students/${id}`, {
            onSuccess: () => {
                // Do nothing here – let the flash message logic handle it
                router.reload();
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) return;

        const selectedData = students.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Nama,Kelas,Tahun masuk,Jenis kelamin,Agama,Status\n`;
        const csv = selectedData.map((a) => `${a.full_name},${a.classroom?.name},${a.entry_year},${a.gender},${a.religion},${a.status}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'students.csv';
        link.click();
        
         toast.success(`Berhasil mengekspor ${selectedData.length} data siswa`, {
            description: 'File CSV telah didownload otomatis'
        });

        URL.revokeObjectURL(url);
    };

    const handleSortChange = (column: string) => {
        const sortDirection = filters.direction === 'asc' ? 'desc' : 'asc';
        let sortColumn = column;

        // Mapping untuk kolom relasi
        if (column === 'classroom.name') {
            sortColumn = 'class_name'; // Nama yang akan dikenali oleh backend
        }

        router.get(route('students.index'), { sort: sortColumn, direction: sortDirection }, { preserveState: true });
    };

    const handleBulkPrint = async () => {
        if (selectedIds.length === 0) return;

        try {
            const response = await fetch('/bulk-kartu-siswa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ student_ids: selectedIds }),
            });

            if (!response.ok) throw new Error('Failed to download PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'kumpulan-kartu-siswa.pdf';
            link.click();
        } catch (error) {
            toast.error('Gagal download kartu siswa.');
        }
    };

    const tableHeaders = [
        { key: 'profile_picture', label: 'Foto', sortable: false },
        { key: 'full_name', label: 'Nama Siswa', sortable: true },
        { key: 'parent.full_name', label: 'Nama Orang Tua/wali', sortable: false },
        { key: 'classroom.name', label: 'Kelas', sortable: true },
        { key: 'nis', label: 'NIS', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'entry_year', label: 'Tahun Masuk', sortable: true },
        { key: 'gender', label: 'Gender', sortable: true },
        { key: 'religion', label: 'Agama', sortable: true },
        { key: 'date_of_birth', label: 'Tanggal Lahir', sortable: true },
        { key: 'address', label: 'Alamat', sortable: false },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Siswa" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search and Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari siswa..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('students.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
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
                        <button
                            disabled={selectedIds.length === 0}
                            onClick={handleBulkPrint}
                            className="rounded bg-indigo-700 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Bulk Print Kartu Siswa
                        </button>
                    </div>
                    <button
                        onClick={() => openForm(null)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Siswa
                    </button>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={students.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? students.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(student) => (
                        <tr key={student.id} className="border-b">
                            <td className="w-[10px] p-3 text-sm">
                                <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} />
                            </td>
                            <td className="p-3">
                                <div className="flex justify-center">
                                    {student.profile_picture ? (
                                        <img
                                            src={`/storage/${student.profile_picture}`}
                                            alt={student.full_name}
                                            className="h-10 w-10 rounded-full border border-gray-300 object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(student.full_name)}`}
                                            alt={student.full_name}
                                            className="h-10 w-10 rounded-full border border-gray-300 object-cover"
                                        />
                                    )}
                                </div>
                            </td>
                            <td className="p-3 text-sm">{student.full_name}</td>
                            <td className="p-3 text-sm">{student.parent?.full_name || '-'}</td>
                            <td className="p-3 text-sm">{student.classroom?.name || '-'}</td>
                            <td className="p-3 text-sm">{student.nis || '-'}</td>
                            <td className="p-3 text-sm">{student.status}</td>
                            <td className="p-3 text-sm">{student.entry_year}</td>
                            <td className="p-3 text-sm">{student.gender}</td>
                            <td className="p-3 text-sm">{student.religion}</td>
                            <td className="p-3 text-sm">
                                {student.birth_place}, {student.date_of_birth}
                            </td>
                            <td className="p-3 text-sm">
                                {student.address ? (student.address.length > 70 ? student.address.substring(0, 70) + '...' : student.address) : '-'}
                            </td>
                            <td className="flex justify-center gap-2 p-3">
                                <button
                                    onClick={() => openForm(student)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                                <Link
                                    href={route('students.attendance', student.id)}
                                    className={`rounded px-3 py-1 text-sm font-medium text-white ${
                                        student.classroom?.name 
                                        ? 'bg-sky-500 hover:bg-sky-600 hover:cursor-pointer' 
                                        : 'bg-sky-300 cursor-not-allowed'
                                    }`}
                                    onClick={(e) => {
                                        if (!student.classroom?.name) {
                                        e.preventDefault();
                                        }
                                    }}
                                    title={!student.classroom?.name ? "Siswa harus memiliki kelas untuk melihat kehadiran" : ""}
                                >
                                    Kehadiran
                                </Link>
                                <button
                                    onClick={async () => {
                                        setQrStudent(student);
                                        setQrModalOpen(true);

                                        const response = await fetch(route('student.qrcode.preview', { student: student.id }));
                                        const html = await response.text();
                                        setQrSvgHtml(html);

                                        setQrDownloadUrl(route('kartu-siswa', { student_id: student.id }));
                                    }}
                                    className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Kartu
                                </button>
                                <button
                                    onClick={() => setStudentToDelete(student)}
                                    className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={students.links} />

                {/* Modals */}
                <StudentFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    student={selectedStudent}
                    classrooms={classrooms}
                    sexes={sexes}
                    statuses={statuses}
                    religions={religions}
                />

                <ActionModal
                    isOpen={!!studentToDelete}
                    onClose={() => setStudentToDelete(null)}
                    title="Confirm Deletion"
                    message={
                        <span>
                            Are you sure you want to delete student <strong>{studentToDelete?.full_name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Cancel',
                            onClick: () => setStudentToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Delete',
                            onClick: () => {
                                if (studentToDelete) {
                                    handleDelete(studentToDelete.id);
                                    setStudentToDelete(null);
                                }
                            },
                            variant: 'danger',
                        },
                    ]}
                />

                <ActionModal
                    isOpen={qrModalOpen}
                    onClose={() => {
                        setQrModalOpen(false);
                        setQrStudent(null);
                        setQrSvgHtml('');
                        setQrDownloadUrl('');
                    }}
                    title={`Kartu Pelajar - ${qrStudent?.full_name}`}
                    message={
                        <div className="flex flex-col items-center gap-4">
                            <div dangerouslySetInnerHTML={{ __html: qrSvgHtml }} className="h-[200px] w-[200px]" />
                            <a href={qrDownloadUrl} download className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                                Download PDF
                            </a>
                        </div>
                    }
                    buttons={[
                        {
                            label: 'Close',
                            onClick: () => setQrModalOpen(false),
                            variant: 'neutral',
                        },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
