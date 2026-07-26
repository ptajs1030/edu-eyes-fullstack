import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Announcement { id: number; title: string; short_content: string; content: string; attachments: { url: string }[]; }
interface Props { announcement: Announcement; }

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'Pengumuman', href: '/announcements' },
    { title: 'Edit', href: '' },
];

export default function EditAnnouncement({ announcement }: Props) {
    const [title, setTitle] = useState(announcement.title);
    const [shortContent, setShortContent] = useState(announcement.short_content);
    const [content, setContent] = useState(announcement.content);
    const [attachments, setAttachments] = useState<{ url: string }[]>(announcement.attachments);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash]);

    const handleAddAttachment = () => setAttachments([...attachments, { url: '' }]);
    const handleRemoveAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));
    const handleAttachmentChange = (index: number, value: string) => {
        const newAttachments = [...attachments];
        newAttachments[index].url = value;
        setAttachments(newAttachments);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formattedAttachments = attachments.filter((att) => att.url.trim() !== '').map((att) => ({ url: att.url }));
        router.put(`/announcements/${announcement.id}`, { title, short_content: shortContent, content, attachments: formattedAttachments }, {
            onSuccess: () => {},
            onError: (errors) => { Object.values(errors).forEach((error: any) => toast.error(error)); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="Edit Pengumuman" />
            <Toaster position="top-right" richColors />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">Informasi</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Pengumuman</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ubah informasi pengumuman</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-fade-in-up stagger-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.954.954 0 00-.338 1.37.954.954 0 00.394.354l.657.38c.523.302 1.192.05 1.439-.511.402-.89.733-1.821.985-2.783m0-9.18A11.49 11.49 0 0112 6.001c.387 0 .77.02 1.15.06m-1.15 9.18c.306.078.614.15.925.216M12 6.001c-.387 0-.77.02-1.15.06M12 6.001a11.49 11.49 0 011.15.06m-6.15 9.18c.385.066.768.14 1.15.216" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Pengumuman</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Lengkapi informasi pengumuman</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Judul <span className="text-rose-500">*</span>
                                    </label>
                                    <input type="text" value={title} maxLength={70}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                        required />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{title.length}/70 karakter</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Ringkasan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea value={shortContent} maxLength={255} rows={3}
                                        onChange={(e) => setShortContent(e.target.value)}
                                        className="form-input w-full px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
                                        required />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{shortContent.length}/255 karakter</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Konten <span className="text-rose-500">*</span>
                                    </label>
                                    <RichTextEditor value={content} onChange={setContent} placeholder="Ketik konten pengumuman di sini..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Lampiran</label>
                                    <div className="space-y-3">
                                        {attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input type="url" value={attachment.url}
                                                    onChange={(e) => handleAttachmentChange(index, e.target.value)}
                                                    placeholder="https://example.com/file.pdf"
                                                    className="form-input flex-1 px-4 py-2.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                                                <button type="button" onClick={() => handleRemoveAttachment(index)}
                                                    className="px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700">
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddAttachment}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-dashed border-primary-300 dark:border-primary-700">
                                            + Tambah Lampiran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="sticky bottom-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/40 animate-fade-in-up stagger-4">
                            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs">Pastikan semua data sudah benar sebelum menyimpan.</span>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Link href="/announcements"
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 text-center">
                                        Batal
                                    </Link>
                                    <button type="submit" disabled={isSubmitting}
                                        className="flex-1 sm:flex-none px-6 py-2.5 btn-shimmer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2">
                                        {isSubmitting ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Menyimpan...</span></>
                                        ) : (
                                            <span>Simpan Perubahan</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
