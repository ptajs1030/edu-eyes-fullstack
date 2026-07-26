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

type LinkType = {
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

const avatarGradients = ['avatar-grad-1', 'avatar-grad-2', 'avatar-grad-3', 'avatar-grad-4', 'avatar-grad-5', 'avatar-grad-6'];

export default function StudentIndex() {
    const { students, classrooms, sexes, statuses, religions, filters } = usePage<{
        students: PaginatedResponse<Student, LinkType>;
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
        setSelectedIds([]);

        const queryParams: any = {
            search: filters.search || undefined,
            sort: filters.sort || undefined,
            direction: filters.direction || undefined,
            status: filters.status || undefined,
            page: 1,
        };

        if (newSelectedClassrooms.length > 0) {
            queryParams.classrooms = newSelectedClassrooms;
        }

        router.get(route('students.index'), queryParams, {
            preserveState: true,
            replace: true,
            only: ['students', 'filters'],
        });
    };

    const clearClassroomFilters = () => {
        setSelectedClassrooms([]);
        setSelectedIds([]);

        const queryParams: any = {
            search: filters.search || undefined,
            sort: filters.sort || undefined,
            direction: filters.direction || undefined,
            status: filters.status || undefined,
            page: 1,
        };

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

        const excelData = selectedData.map((student) => {
            const formattedDate = student.date_of_birth ? new Date(student.date_of_birth).toISOString().slice(0, 10) : '-';
            const genderMap: Record<string, string> = {
                male: 'Laki-laki',
                female: 'Perempuan',
            };
            const statusMap: Record<string, string> = {
                active: 'Aktif',
                inactive: 'Tidak Aktif',
                graduated: 'Lulus',
            };

            return {
                'Nama Lengkap': student.full_name || '-',
                NIS: { v: student.nis || '-', t: 's' },
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

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const colWidths = [
            { width: 25 }, { width: 25 }, { width: 15 }, { width: 15 },
            { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 },
            { width: 15 }, { width: 30 }, { width: 12 },
        ];
        worksheet['!cols'] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
        const filename = `data-siswa.xlsx`;

        try {
            XLSX.writeFile(workbook, filename);
            toast.success(`Berhasil mengekspor ${selectedData.length} data siswa`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal mengekspor data. Silakan coba lagi.');
        }
    };

    const handleBulkPrint = async () => {
        if (selectedIds.length === 0) {
            toast.error('Pilih minimal satu siswa.');
            return;
        }

        try {
            const response = await fetch('/bulk-kartu-siswa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ student_ids: selectedIds }),
            });

            if (!response.ok) throw new Error('Gagal generate PDF');

            const blob: Blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kartu-siswa-bulk.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Gagal generate kartu siswa.');
            console.error(err);
        }
    };

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

    const handleSegmentClick = (status: string) => {
        const value = status === 'all' ? '' : status;
        setSelectedIds([]);
        router.get(
            route('students.index'),
            {
                ...filters,
                status: value || undefined,
                classrooms: selectedClassrooms.length > 0 ? selectedClassrooms : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleShowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedIds([]);
        router.get(
            route('students.index'),
            {
                ...filters,
                show: value,
                classrooms: selectedClassrooms.length > 0 ? selectedClassrooms : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const tableHeaders = [
        { key: 'profile_picture', label: 'Foto', sortable: false },
        { key: 'full_name', label: 'Nama Siswa', sortable: true },
        { key: 'parent.full_name', label: 'Orang Tua', sortable: false },
        { key: 'classroom.name', label: 'Kelas', sortable: true },
        { key: 'nis', label: 'NIS', sortable: true },
        { key: 'entry_year', label: 'Thn Masuk', sortable: true },
        { key: 'gender', label: 'JK', sortable: true },
        { key: 'religion', label: 'Agama', sortable: true },
        { key: 'date_of_birth', label: 'Tmp/Tgl Lahir', sortable: true },
        { key: 'address', label: 'Alamat', sortable: false },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Aksi', sortable: false },
    ];

    const getStatusLabel = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'active': return 'Aktif';
            case 'inactive': return 'Tidak Aktif';
            case 'graduated': return 'Lulus';
            default: return status;
        }
    };

    const getGenderLabel = (gender: string): string => {
        switch (gender) {
            case 'male': return 'Laki-Laki';
            case 'female': return 'Perempuan';
            default: return gender;
        }
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarGradientClass = (id: number): string => {
        return avatarGradients[id % avatarGradients.length];
    };

    const activeCount = students.data.filter((s) => s.status === 'active').length;
    const inactiveCount = students.data.filter((s) => s.status === 'inactive').length;
    const graduatedCount = students.data.filter((s) => s.status === 'graduated').length;

    const currentStatus = filters.status || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Siswa" />
            <Toaster position="top-right" richColors />

<div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                    Data Akademik
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Data Siswa</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Kelola data siswa dan wali murid dengan mudah
                            </p>
                        </div>
                        <button
                            onClick={() => openForm(null)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-shimmer text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Siswa
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{students.total}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Siswa</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{activeCount > 0 ? Math.round((activeCount / students.total) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Siswa Aktif</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                    </svg>
                                    -{inactiveCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tidak Aktif</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm card-glow animate-fade-in-up stagger-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                    </svg>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                    +{graduatedCount}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{graduatedCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Lulus</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up stagger-5">
                        <div className="relative flex-1 min-w-[280px] max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama, NIS, atau kelas..."
                                defaultValue={filters.search || ''}
                                onChange={(e) => {
                                    setSelectedIds([]);
                                    router.get(
                                        route('students.index'),
                                        {
                                            ...filters,
                                            search: e.target.value,
                                            classrooms: selectedClassrooms.length > 0 ? selectedClassrooms : undefined,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                                className="input-glow w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                                {[
                                    { value: '', label: 'Semua' },
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'inactive', label: 'Tidak Aktif' },
                                    { value: 'graduated', label: 'Lulus' },
                                ].map((seg) => (
                                    <button
                                        key={seg.value}
                                        onClick={() => handleSegmentClick(seg.value || 'all')}
                                        className={`segment-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            currentStatus === seg.value
                                                ? 'active'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {seg.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <select
                                    value={filters.show || '10'}
                                    onChange={handleShowChange}
                                    className="appearance-none pl-3.5 pr-9 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-foreground dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                                >
                                    <option value="10">10 data</option>
                                    <option value="20">20 data</option>
                                    <option value="50">50 data</option>
                                    <option value="all">Semua</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            {/* Classroom Filter */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowClassroomFilter(!showClassroomFilter)}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
                                >
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 8.75h14.5M4.75 12h14.5m-14.5 3.25h14.5" />
                                    </svg>
                                    Kelas {selectedClassrooms.length > 0 ? `(${selectedClassrooms.length})` : ''}
                                </button>

                                {showClassroomFilter && (
                                    <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">Filter Kelas</span>
                                            {selectedClassrooms.length > 0 && (
                                                <button onClick={clearClassroomFilters} className="text-xs text-primary hover:text-primary/80 transition-colors">
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {classrooms.map((classroom) => (
                                                <label key={classroom.id} className="flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedClassrooms.includes(classroom.id)}
                                                        onChange={() => handleClassroomFilterChange(classroom.id)}
                                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-foreground">{classroom.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={selectedIds.length === 0}
                                onClick={exportSelected}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all ${
                                    selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            >
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Ekspor
                            </button>

                            <button
                                disabled={selectedIds.length === 0}
                                onClick={handleBulkPrint}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all ${
                                    selectedIds.length === 0 ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            >
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                </svg>
                                Print Kartu
                            </button>

                            <button
                                onClick={() => setIsImportOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                            >
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                Impor
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="animate-fade-in-up stagger-6">
                        <Table
                            headers={tableHeaders}
                            data={students.data}
                            sortColumn={filters.sort ?? ''}
                            sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                            onSort={handleSortChange}
                            onSelectAll={(checked) => setSelectedIds(checked ? students.data.map((a) => a.id) : [])}
                            selectedIds={selectedIds}
                            rowRender={(student) => (
                                <tr key={student.id} className="row-card group bg-white dark:bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(student.id)}
                                            onChange={() => toggleSelect(student.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full ${getAvatarGradientClass(student.id)} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform`}>
                                                {getInitials(student.full_name)}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${student.status === 'active' ? 'bg-emerald-500 status-pulse' : student.status === 'graduated' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-foreground dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{student.full_name}</p>
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground">{student.parent?.full_name || '-'}</td>
                                    <td className="px-5 py-4">
                                        {student.classroom?.name ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
                                                {student.classroom.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs tracking-wide">{student.nis || '-'}</td>
                                    <td className="px-5 py-4 text-muted-foreground">{student.entry_year}</td>
                                    <td className="px-5 py-4 text-foreground text-xs capitalize">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                                            {student.gender === 'male' ? 'L' : 'P'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground">{student.religion || '-'}</td>
                                    <td className="px-5 py-4 text-muted-foreground text-xs">
                                        {(() => {
                                            const bp = student.birth_place;
                                            const dob = student.date_of_birth;
                                            if (bp && dob) return `${bp}, ${dob}`;
                                            if (bp) return bp;
                                            if (dob) return dob;
                                            return '-';
                                        })()}
                                    </td>
                                    <td className="px-5 py-4 max-w-[200px]">
                                        <p className="text-muted-foreground text-xs truncate" title={student.address || ''}>
                                            {student.address || '-'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        {student.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {getStatusLabel(student.status)}
                                            </span>
                                        ) : student.status === 'graduated' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                {getStatusLabel(student.status)}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                {getStatusLabel(student.status)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Edit</span>
                                                <button
                                                    onClick={() => openForm(student)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Kehadiran</span>
                                                <Link
                                                    href={route('students.attendance', student.id)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all ${!student.classroom?.name ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    onClick={(e) => {
                                                        if (!student.classroom?.name) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    title={!student.classroom?.name ? 'Siswa harus memiliki kelas' : ''}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </Link>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Kartu</span>
                                                <button
                                                    onClick={async () => {
                                                        setQrStudent(student);
                                                        setQrModalOpen(true);

                                                        const response = await fetch(route('student.qrcode.preview', { student: student.id }));
                                                        const html = await response.text();
                                                        setQrSvgHtml(html);

                                                        setQrDownloadUrl(route('kartu-siswa', { student_id: student.id }));
                                                    }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="has-tooltip relative">
                                                <span className="tooltip absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-md whitespace-nowrap z-10">Hapus</span>
                                                <button
                                                    onClick={() => setStudentToDelete(student)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        <Pagination links={students.links} />
                    </div>

                </div>
            </div>

            <StudentFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                student={selectedStudent as any}
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
                        <a href={qrDownloadUrl} download className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors">
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

            <ImportStudentModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
        </AppLayout>
    );
}
