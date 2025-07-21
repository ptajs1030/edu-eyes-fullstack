import AnnouncementDeleteConfirmationModal from '@/components/announcement-delete-confirmation-modal';
import AnnouncementFormModal from '@/components/announcement-form-modal';
import SortDropdown from '@/components/ui/sort-drop-down';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';

type Announcement = {
    id: number;
    title: string;
    content: string;
    picture?: string;
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
        title: 'Pengumuman',
        href: '/announcements',
    },
];

export default function Announcement() {
    const sortOptions = [
        { label: 'Title (A-Z)', value: { sort: 'title', direction: 'asc' } },
        { label: 'Title (Z-A)', value: { sort: 'title', direction: 'desc' } },
        { label: 'Created At (Newest)', value: { sort: 'created_at', direction: 'desc' } },
        { label: 'Created At (Oldest)', value: { sort: 'created_at', direction: 'asc' } },
    ];

    const { announcements, filters } = usePage<{
        announcements: PaginatedResponse<Announcement, Link>;
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    const openModal = (announcement: Announcement | null = null) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        router.delete(`/announcements/${id}`, {
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
        const selectedData = announcements.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Title,Content\n`;
        const csv = selectedData.map((a) => `${a.title},${a.content}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'announcements.csv';
        link.click();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.get(
            '/announcements',
            { ...(filters || {}), search: e.target.value },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSortChange = (sort: string, direction: string) => {
        router.get(
            '/announcements',
            { ...filters, sort, direction },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <Toaster position="top-right" richColors />
            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            defaultValue={filters.search || ''}
                            onChange={handleSearchChange}
                            placeholder="Search by title..."
                            className="w-64 rounded border px-3 py-1"
                        />
                        <SortDropdown options={sortOptions} onSortChange={handleSortChange} />
                        <button
                            onClick={exportSelected}
                            className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                        >
                            Export Selected
                        </button>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-green-700"
                    >
                        Tambah Pengumuman
                    </button>
                </div>

                <table className="w-full border-collapse rounded-lg bg-white text-black shadow-sm">
                    <thead>
                        <tr className="border-b bg-gray-100 text-gray-800">
                            <th className="p-4">
                                <input
                                    type="checkbox"
                                    onChange={(e) => setSelectedIds(e.target.checked ? announcements.data.map((a) => a.id) : [])}
                                />
                            </th>
                            {/*<th className="p-4 text-sm font-semibold">Picture</th>*/}
                            <th className="p-4 text-sm font-semibold">Title</th>
                            <th className="p-4 text-sm font-semibold">Content</th>
                            <th className="p-4 text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.data.length > 0 ? (
                            announcements.data.map((announcement) => (
                                <tr key={announcement.id} className="border-b">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(announcement.id)}
                                            onChange={() => toggleSelect(announcement.id)}
                                        />
                                    </td>
                                    {/*<td className="p-3">*/}
                                    {/*    {announcement.picture ? (*/}
                                    {/*        <img src={announcement.picture} alt="announcement" className="h-16 w-16 rounded-full object-cover" />*/}
                                    {/*    ) : (*/}
                                    {/*        'No Picture'*/}
                                    {/*    )}*/}
                                    {/*</td>*/}
                                    <td className="p-3">{announcement.title}</td>
                                    <td className="p-3">{announcement.content}</td>
                                    <td className="flex gap-2 p-3">
                                        <button
                                            onClick={() => openModal(announcement)}
                                            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAnnouncementToDelete(announcement);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-600">
                                    No announcements found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="mt-4 flex justify-center gap-2">
                    {announcements.links.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => link.url && router.visit(link.url)}
                            disabled={!link.url}
                            className={`rounded px-3 py-1 text-sm hover:cursor-pointer ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
            <AnnouncementFormModal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} announcement={selectedAnnouncement} />
            <AnnouncementDeleteConfirmationModal
                isDeleteModalOpen={isDeleteModalOpen}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                handleDelete={handleDelete}
                announcementToDelete={announcementToDelete}
            />
        </AppLayout>
    );
}
