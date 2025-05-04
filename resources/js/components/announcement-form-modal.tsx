import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';

interface Announcement {
    id?: number;
    title: string;
    content: string;
    picture?: string;
}

interface Props {
    isOpen: boolean;
    closeModal: () => void;
    announcement?: Announcement | null;
}

export default function AnnouncementFormModal({ isOpen, closeModal, announcement }: Props) {
    const [formData, setFormData] = useState<Announcement>({ title: "", content: "", picture: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");

    useEffect(() => {
        if (announcement) {
            setFormData({ title: announcement.title, content: announcement.content, picture: announcement.picture || "" });
            setPreview(announcement.picture || "");
            setSelectedFile(null);
        } else {
            setFormData({ title: "", content: "", picture: "" });
            setPreview("");
            setSelectedFile(null);
        }
    }, [announcement]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData();
        form.append("title", formData.title);
        form.append("content", formData.content);
        if (selectedFile) {
            form.append("picture", selectedFile);
        }

        if (announcement) {
            form.append("_method", "PUT");
            router.post(`/announcements/${announcement.id}`, form, {
                onSuccess: () => {
                    closeModal();
                    toast.success('Announcement updated successfully.');
                    router.reload();
                },
                onError: (error) => {
                    toast.error('Failed to update announcement.');
                    console.error(error.message || 'Failed to update announcement.');
                }
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
                }
            });
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl">
                <h2 className='text-lg font-semibold mb-4'>{announcement ? 'Edit Announcement' : 'Add Announcement'}</h2>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="mb-3">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required>
                        </input>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className="w-full border rounded p-2 h-50"
                            required>
                        </textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="picture" className="block text-sm font-medium text-gray-700">Picture (optional)</label>
                        <input
                            type="file"
                            id="picture"
                            name="picture"
                            onChange={handleFileChange}
                            accept='image/*'
                            className="w-full">
                        </input>
                    </div>
                    {preview &&
                        <div className="mb-3">
                            <p className='text-small mb-1'>Image Preview:</p>
                            <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                        </div>
                    }
                    <div className="flex justify-end">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded mr-2 hover:cursor-pointer">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:cursor-pointer">{announcement ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}