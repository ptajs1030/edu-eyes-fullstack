import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengumuman', href: '/announcements' },
    { title: 'Buat Baru', href: '' },
];

interface Attachment {
    url: string;
}

export default function CreateAnnouncement() {
    const [title, setTitle] = useState('');
    const [shortContent, setShortContent] = useState('');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([{ url: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleAddAttachment = () => {
        setAttachments([...attachments, { url: '' }]);
    };

    const handleRemoveAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleAttachmentChange = (index: number, value: string) => {
        const newAttachments = [...attachments];
        newAttachments[index].url = value;
        setAttachments(newAttachments);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formattedAttachments = attachments.filter((att) => att.url.trim() !== '').map((att) => ({ url: att.url }));

        router.post(
            '/announcements',
            {
                title,
                short_content: shortContent,
                content,
                attachments: formattedAttachments,
            },
            {
                onSuccess: () => {},
                onError: (errors) => {
                    Object.values(errors)
                        .flat()
                        .forEach((msg: string) => toast.error(msg));
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Pengumuman" />
            <Toaster position="top-right" richColors />
            <div className="rounded-xl bg-white p-6 shadow-lg">
                <h1 className="mb-6 text-xl font-bold">Buat Pengumuman Baru</h1>
                <div className="rounded-lg border p-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Judul
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                maxLength={70}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                required
                            />
                            <span className="ml-auto text-xs text-gray-500">{title.length}/70 karakter</span>
                        </div>
                        <div>
                            <label htmlFor="short_content" className="block text-sm font-medium text-gray-700">
                                Ringkasan
                            </label>
                            <textarea
                                id="short_content"
                                value={shortContent}
                                onChange={(e) => setShortContent(e.target.value)}
                                rows={3}
                                maxLength={255}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                required
                            />
                            <span className="text-xs text-gray-500">{shortContent.length}/255 karakter</span>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Konten <span className="text-red-500">*</span>
                            </label>
                            <RichTextEditor value={content} onChange={setContent} placeholder="Ketik konten pengumuman di sini..." />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Lampiran</label>
                            {attachments.map((attachment, index) => (
                                <div key={index} className="mb-2 flex items-center">
                                    <input
                                        type="url"
                                        value={attachment.url}
                                        onChange={(e) => handleAttachmentChange(index, e.target.value)}
                                        placeholder="https://example.com/file.pdf"
                                        className="block w-full flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(index)}
                                        className="ml-2 inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm leading-4 font-medium text-red-700 hover:cursor-pointer hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddAttachment}
                                className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-sky-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Tambah Lampiran
                            </button>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Link
                                href="/announcements"
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
