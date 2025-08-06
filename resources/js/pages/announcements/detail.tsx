import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Announcement {
    id: number;
    title: string;
    short_content: string;
    content: string;
    attachments: { url: string }[];
    updated_at: string;
}

interface Props {
    announcement: Announcement;
}

const breadcrumbs = (title: string): BreadcrumbItem[] => [
    { title: 'Pengumuman', href: '/announcements' },
    { title: title, href: '' },
];

export default function AnnouncementDetail({ announcement }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(announcement.title)}>
            <Head title="Detail Pengumuman" />
            <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-6">
                    <h1 className="mb-2 text-2xl font-bold">{announcement.title}</h1>
                    <p className="text-xs text-gray-400">Terakhir diperbarui: {formatDate(announcement.updated_at)}</p>
                    <p className="mb-2 text-sm text-gray-600">{announcement.short_content}</p>
                </div>

                <div className="mb-6">
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: announcement.content }} />
                </div>

                {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mb-6">
                        <h2 className="mb-2 text-lg font-semibold">Lampiran</h2>
                        <ul className="list-disc space-y-1 pl-5">
                            {announcement.attachments.map((attachment, index) => (
                                <li key={index}>
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        {attachment.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end">
                    <Link
                        href="/announcements"
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Kembali
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
