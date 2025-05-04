import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AnnouncementFormModal from '@/components/announcement-form-modal';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Toaster, toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Announcements',
        href: '/announcements',
    },
];

export default function Announcement() {
    const { announcements } = usePage<{ announcements: { id: number; title: string; content: string; picture?: string }[] }>().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<{ id: number; title: string; content: string; picture?: string } | null>(null);

    const openModal = (announcement: { id: number; title: string; content: string; picture?: string } | null = null) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    }

    const handleDelete = async (id: Number) => {
        router.delete(`/announcements/${id}`, {
            onSuccess: () => {
                toast.success('Announcement deleted successfully.');
                router.reload();
            },
            onError: (error) => {
                toast.error('Failed to delete announcement.');
                console.error('Failed to delete announcement.');
            }
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Announcements' />
            <Toaster position='top-right' richColors />
            <div className='flex flex-col gap-6 p-6 bg-white text-black shadow-lg rounded-xl'>
                <div className='flex justify-end'>
                    <button onClick={() => openModal()} className='hover:cursor-pointer bg-green-600 text-white rounded px-3 py-1 text-sm hover:bg-green-700 transition'>
                        Add Announcement
                    </button>
                </div>
                <table className='w-full border-collapse bg-white text-black shadow-sm rounded-lg'>
                    <thead>
                        <tr className='bg-gray-100 text-gray-800 border-b'>
                            {['Picture', 'Title', 'Content', 'Actions'].map((header) => (
                                <th key={header} className='p-4 font-semibold text-sm'>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.length > 0 ?
                            announcements.map((announcement) => (
                                <tr key={announcement.id} className='border-b'>
                                    <td className='p-3'>
                                        {announcement.picture ?
                                            <img src={announcement.picture} alt='announcement' className='w-16 h-16 object-cover rounded-full' />
                                            : 'No Picture'
                                        }
                                    </td>
                                    <td className='p-3'>{announcement.title}</td>
                                    <td className='p-3'>{announcement.content}</td>
                                    <td className='p-3 flex gap-2'>
                                        <button onClick={() => openModal(announcement)} className='hover:cursor-pointer  bg-blue-500 text-sm text-white px-3 py-1 rounded'>Edit</button>
                                        <button onClick={() => handleDelete(announcement.id)} className='hover:cursor-pointer bg-red-500 text-sm text-white px-3 py-1 rounded'>Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className='text-center p-4 text-gray-600'>No announcements found.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
            <AnnouncementFormModal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} announcement={selectedAnnouncement} />
        </AppLayout >
    )
}