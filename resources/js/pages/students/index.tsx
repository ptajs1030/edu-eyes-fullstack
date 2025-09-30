import ActionModal from '@/components/action-modal';
import ImportStudentModal from '@/components/ui/import-student-modal';
import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import StudentFormModal from './form';
import * as XLSX from 'xlsx';

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
    parent?: {
        full_name: string;
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
        filters: { search?: string; sort?: string; direction?: string; classrooms?: number[]; status?: string; show?: string };
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowClassroomFilter(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const currentClassrooms = filters.classrooms
            ? Array.isArray(filters.classrooms)
                ? filters.classrooms.map((id) => Number(id))
                : [Number(filters.classrooms)]
            : [];

        setSelectedClassrooms(currentClassrooms);
    }, [filters.classrooms]);

    const initialClassrooms = filters.classrooms
        ? Array.isArray(filters.classrooms)
            ? filters.classrooms.map((id) => Number(id))
            : [Number(filters.classrooms)]
        : [];
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrStudent, setQrStudent] = useState<Student | null>(null);
    const [qrDownloadUrl, setQrDownloadUrl] = useState<string>('');
    const [qrSvgHtml, setQrSvgHtml] = useState<string>('');
    const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>(initialClassrooms);
    const [showClassroomFilter, setShowClassroomFilter] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleClassroomFilterChange = (classroomId: number) => {
        const numericClassroomId = Number(classroomId);
        const newSelectedClassrooms = selectedClassrooms.includes(numericClassroomId)
            ? selectedClassrooms.filter((id) => id !== numericClassroomId)
            : [...selectedClassrooms, numericClassroomId];

        setSelectedClassrooms(newSelectedClassrooms);
        setSelectedIds([]); // Unselect all checkboxes when filter changes

        // Update URL dengan filter baru, pastikan status tetap ter-attach
        const queryParams: any = {
            search: filters.search || undefined,
            sort: filters.sort || undefined,
            direction: filters.direction || undefined,
            status: filters.status || undefined,
            page: 1, // Reset ke page 1
        };

        if (newSelectedClassrooms.length > 0) {
            queryParams.classrooms = newSelectedClassrooms;
        }

        router.get(route('students.index'), queryParams, {
            preserveState: true,
            replace: true,
            only: ['students', 'filters'], // Hanya update data yang diperlukan
        });
    };

    const clearClassroomFilters = () => {
        setSelectedClassrooms([]);
        setSelectedIds([]); // Unselect all checkboxes when filter changes

        const queryParams: any = {
            search: filters.search || undefined,
            sort: filters.sort || undefined,
            direction: filters.direction || undefined,
            status: filters.status || undefined,
            page: 1,
        };

        // Hapus classrooms dari query params
        if (filters.classrooms) {
            queryParams.classrooms = undefined;
        }

        router.get(route('students.index'), queryParams, {
            preserveState: true,
            replace: true,
            only: ['students', 'filters'],
        });
    };

    const openForm = (student: Student | null = null) => {
        setSelectedStudent(student);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/students/${id}`, {
            onSuccess: () => {
                router.reload();
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        if (selectedIds.length === 0) {
            toast.error('Pilih data siswa yang akan diexport terlebih dahulu');
            return;
        }

        const selectedData = students.data.filter((a) => selectedIds.includes(a.id));
        const timestamp = Date.now();

        // Prepare data untuk Excel sesuai urutan header yang diminta
        const excelData = selectedData.map((student) => {
            // Format tanggal lahir
            const formattedDate = student.date_of_birth ? new Date(student.date_of_birth).toISOString().slice(0, 10) : '-';

            // Mapping gender ke bahasa Indonesia
            const genderMap = {
                male: 'Laki-laki',
                female: 'Perempuan',
            };

            // Mapping status ke bahasa Indonesia
            const statusMap = {
                active: 'Aktif',
                inactive: 'Tidak Aktif',
                graduated: 'Lulus',
            };

            return {
                'Nama Lengkap': student.full_name || '-',
                NIS: { v: student.nis || '-', t: 's' }, // Force sebagai string
                'Orang Tua/Wali': student.parent?.full_name || '-',
                Kelas: student.classroom?.name || '-',
                'Jenis Kelamin': genderMap[student.gender] || student.gender,
                Agama: student.religion || '-',
                'Tahun Masuk': student.entry_year || '-',
                'Tempat Lahir': student.birth_place || '-',
                'Tanggal Lahir': formattedDate,
                Alamat: student.address || '-',
                Status: statusMap[student.status] || student.status,
            };
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths untuk tampilan yang lebih baik
        const colWidths = [
            { width: 25 }, // Nama Lengkap
            { width: 25 }, // Orang Tua/Wali
            { width: 15 }, // Kelas
            { width: 15 }, // NIS
            { width: 12 }, // Tahun Masuk
            { width: 15 }, // Jenis Kelamin
            { width: 15 }, // Agama
            { width: 15 }, // Tempat Lahir
            { width: 15 }, // Tanggal Lahir
            { width: 30 }, // Alamat
            { width: 12 }, // Status
        ];
        worksheet['!cols'] = colWidths;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

        // Filename dengan format epoch-data-siswa
        const filename = `data-siswa.xlsx`;

        // Export to file
        try {
            XLSX.writeFile(workbook, filename);
            toast.success(`Berhasil mengekspor ${selectedData.length} data siswa`, {
                description: `File: ${filename}`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal mengekspor data. Silakan coba lagi.');
        }
    };

    // const exportSelected = () => {
    //     if (selectedIds.length === 0) return;

    //     const selectedData = students.data.filter((a) => selectedIds.includes(a.id));
    //     const headers = `Nama Siswa,Nama Orang Tua/Wali,Kelas,NIS,Tahun Masuk,Jenis Kelamin,Agama,Tanggal Lahir,Alamat,Status\n`;
    //     const csv = selectedData
    //         .map((a) => {
    //             const addressOneLine = a.address ? `"${a.address.replace(/[\r\n\u2028\u2029\u0085]+/g, ' ').replace(/"/g, '""')}"` : '"-"';
    //             const formattedDate = a.date_of_birth ? new Date(a.date_of_birth).toISOString().slice(0, 10) : '-';
    //             const nis = a.nis ? a.nis : '-';
    //             const classroom = a.classroom?.name ? a.classroom?.name : '-';
    //             const religion = a.religion ? a.religion : '-';
    //             return `${a.full_name},${a.parent?.full_name},${classroom},${nis},${a.entry_year},${a.gender},${religion},${formattedDate},${addressOneLine},${a.status}`;
    //         })
    //         .join('\n');
    //     const blob = new Blob([headers, csv], { type: 'text/csv' });
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = 'students.csv';
    //     link.click();

    //     toast.success(`Berhasil mengekspor ${selectedIds.length} data siswa`, {
    //         description: 'File CSV telah didownload otomatis',
    //     });

    //     URL.revokeObjectURL(url);
    // };

    const handleSortChange = (column: string) => {
        const sortDirection = filters.direction === 'asc' ? 'desc' : 'asc';
        let sortColumn = column;

        if (column === 'classroom.name') {
            sortColumn = 'class_name';
        }

        router.get(
            route('students.index'),
            {
                sort: sortColumn,
                direction: sortDirection,
                classrooms: selectedClassrooms.length > 0 ? selectedClassrooms : undefined,
                search: filters.search || undefined,
            },
            { preserveState: true },
        );
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

            if (!response.ok) throw new Error('Gagal download file PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'kumpulan-kartu-siswa.pdf';
            link.click();
        } catch {
            toast.error('Gagal download kartu siswa.');
        }
    };

    const tableHeaders = [
        { key: 'profile_picture', label: 'Foto', sortable: false },
        { key: 'full_name', label: 'Nama Siswa', sortable: true },
        { key: 'parent.full_name', label: 'Nama Orang Tua/wali', sortable: false },
        { key: 'classroom.name', label: 'Kelas', sortable: true },
        { key: 'nis', label: 'NIS', sortable: true },
        { key: 'entry_year', label: 'Tahun Masuk', sortable: true },
        { key: 'gender', label: 'Jenis Kelamin', sortable: true },
        { key: 'religion', label: 'Agama', sortable: true },
        { key: 'date_of_birth', label: 'Tempat, Tanggal Lahir', sortable: true },
        { key: 'address', label: 'Alamat', sortable: false },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'graduated':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'Aktif';
            case 'inactive':
                return 'Tidak Aktif';
            case 'graduated':
                return 'Lulus';
            default:
                return status;
        }
    };

    const getGenderLabel = (gender: string): string => {
        switch (gender) {
            case 'male':
                return 'Laki-Laki';
            case 'female':
                return 'Perempuan';
            default:
                return gender;
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Siswa" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search, Status Filter, Show Data, Add Button */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Cari siswa..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => {
                                setSelectedIds([]); // Unselect all checkboxes when search changes
                                router.get(route('students.index'), { ...filters, search: e.target.value }, { preserveState: true });
                            }}
                            className="w-64 rounded border px-3 py-1 text-sm"
                        />
                        {/* Show Data Filter */}
                        <select
                            value={filters.show || '10'}
                            onChange={(e) => {
                                setSelectedIds([]); // Deselect all when show data filter changes
                                router.get(route('students.index'), { ...filters, show: e.target.value }, { preserveState: true });
                            }}
                            className="rounded border px-2 py-1 text-sm"
                        >
                            <option value="10">Show 10 data</option>
                            <option value="20">Show 20 data</option>
                            <option value="all">Show All</option>
                        </select>
                        {/* Status Filter */}
                        <select
                            value={filters.status || ''}
                            onChange={(e) => {
                                setSelectedIds([]); // Unselect all checkboxes when filter changes
                                router.get(route('students.index'), { ...filters, status: e.target.value }, { preserveState: true });
                            }}
                            className="rounded border px-2 py-1 text-sm"
                        >
                            <option value="">Semua Status</option>
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {getStatusLabel(s.label)}
                                </option>
                            ))}
                        </select>
                        {/* Classroom Filter Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowClassroomFilter(!showClassroomFilter)}
                                className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
                            >
                                Filter Kelas {selectedClassrooms.length > 0 ? `(${selectedClassrooms.length})` : ''}
                            </button>

                            {showClassroomFilter && (
                                <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium">Filter by Kelas</span>
                                        {selectedClassrooms.length > 0 && (
                                            <button onClick={clearClassroomFilters} className="text-xs text-blue-600 hover:text-blue-800">
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {classrooms.map((classroom) => (
                                            <label key={classroom.id} className="flex items-center space-x-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClassrooms.includes(classroom.id)}
                                                    onChange={() => handleClassroomFilterChange(classroom.id)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="text-sm">{classroom.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            disabled={selectedIds.length === 0 || students.data.length === 0}
                            onClick={exportSelected}
                            className={`rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white transition ${selectedIds.length === 0 || students.data.length === 0
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:cursor-pointer hover:bg-indigo-700'
                                }`}
                        >
                            Ekspor Data
                        </button>
                        <button
                            disabled={selectedIds.length === 0 || students.data.length === 0}
                            onClick={handleBulkPrint}
                            className={`rounded bg-indigo-700 px-3 py-1 text-sm font-medium text-white transition ${selectedIds.length === 0 || students.data.length === 0
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:cursor-pointer hover:bg-indigo-700'
                                }`}
                        >
                            Print Kartu
                        </button>
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v14"
                                />
                            </svg>
                            <span>Impor Data</span>
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
                            <td className="p-3 text-sm">{student.entry_year}</td>
                            <td className="p-3 text-sm">{getGenderLabel(student.gender)}</td>
                            <td className="p-3 text-sm">{student.religion || '-'}</td>
                            <td className="p-3 text-sm">
                                {(() => {
                                    const bp = student.birth_place;
                                    const dob = student.date_of_birth;
                                    if (bp && dob) return `${bp}, ${dob}`;
                                    if (bp) return bp;
                                    if (dob) return dob;
                                    return '-';
                                })()}
                            </td>
                            <td className="p-3 text-sm">
                                {student.address ? (student.address.length > 70 ? student.address.substring(0, 70) + '...' : student.address) : '-'}
                            </td>
                            <td className="p-3 text-sm min-w-[120px] w-[140px]">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(student.status)}`}
                                >
                                    {getStatusLabel(student.status)}
                                </span>
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
                                    className={`rounded px-3 py-1 text-sm font-medium text-white ${student.classroom?.name ? 'bg-sky-500 hover:cursor-pointer hover:bg-sky-600' : 'cursor-not-allowed bg-sky-300'
                                        }`}
                                    onClick={(e) => {
                                        if (!student.classroom?.name) {
                                            e.preventDefault();
                                        }
                                    }}
                                    title={!student.classroom?.name ? 'Siswa harus memiliki kelas untuk melihat kehadiran' : ''}
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
                    title="Konfirmasi Penghapusan"
                    message={
                        <span>
                            Apakah Anda yakin ingin menghapus siswa <strong>{studentToDelete?.full_name}</strong>?
                        </span>
                    }
                    buttons={[
                        {
                            label: 'Batal',
                            onClick: () => setStudentToDelete(null),
                            variant: 'neutral',
                        },
                        {
                            label: 'Ya, Hapus',
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
            <ImportStudentModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
        </AppLayout>
    );
}
