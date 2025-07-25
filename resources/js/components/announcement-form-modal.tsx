import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Announcement {
    id?: number;
    title: string;
    content: string;
    short_content: string;
}

interface Props {
    isOpen: boolean;
    closeModal: () => void;
    announcement?: Announcement | null;
}

export default function AnnouncementFormModal({ isOpen, closeModal, announcement }: Props) {
    const [formData, setFormData] = useState<Announcement>({ title: '', content: '', short_content: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');

    useEffect(() => {
        if (announcement) {
            setFormData({ title: announcement.title, content: announcement.content, short_content: announcement.short_content || '' });
            setPreview(announcement.short_content || '');
            setSelectedFile(null);
        } else {
            setFormData({ title: '', content: '', short_content: '' });
            setPreview('');
            setSelectedFile(null);
        }
    }, [announcement]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData();
        form.append('title', formData.title);
        form.append('content', formData.content);
        form.append('short_content', formData.short_content);

        if (announcement) {
            form.append('_method', 'PUT');
            router.post(`/announcements/${announcement.id}`, form, {
                onSuccess: () => {
                    closeModal();
                    toast.success('Announcement updated successfully.');
                    router.reload();
                },
                onError: (error) => {
                    toast.error('Failed to update announcement.');
                    console.error(error.message || 'Failed to update announcement.');
                },
            });
        } else {
            router.post('/announcements', form, {
                onSuccess: () => {
                    closeModal();
                    toast.success('Announcement created successfully.');
                    router.reload();
                },
                onError: (error) => {
                    toast.error('Failed to create announcement.');
                    console.error(error.message || 'Failed to create announcement.');
                },
            });
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
            >
                <h2 className="mb-4 text-lg font-semibold">{announcement ? 'Edit Announcement' : 'Adding Announcement'}</h2>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="mb-3">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Judul
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full rounded border p-2"
                            required
                        ></input>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                            Isi Pengumuman
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className="h-50 w-full rounded border p-2"
                            required
                        ></textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="short_content" className="block text-sm font-medium text-gray-700">
                            Ringkasan Pengumuman
                        </label>
                        <textarea
                            id="short_content"
                            name="short_content"
                            value={formData.short_content}
                            onChange={handleChange}
                            className="h-50 w-full rounded border p-2"
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={closeModal} className="mr-2 rounded bg-gray-500 px-4 py-2 text-white hover:cursor-pointer">
                            Batal
                        </button>
                        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                            {announcement ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
