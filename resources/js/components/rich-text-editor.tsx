import React, { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const quillRef = useRef<any>(null);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.setAttribute('multiple', 'true');
        input.click();

        input.onchange = () => {
            const files = input.files;
            if (!files || files.length === 0) return;

            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection();

            Array.from(files).forEach((file) => {
                if (!file.type.match('image.*')) {
                    toast.error('Hanya file gambar yang diizinkan');
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {
                    toast.error('Ukuran gambar maksimal 2MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageUrl = e.target?.result as string;
                    editor?.insertEmbed(range?.index || 0, 'image', imageUrl);
                };
                reader.readAsDataURL(file);
            });
        };
    };

    // Konfigurasi modul toolbar
    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
            ],
            handlers: {
                image: imageHandler,
            },
        },
    };

    // Format yang didukung
    const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image'];

    return (
        <div className="rich-editor">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Ketik konten di sini...'}
                className="rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
            />
        </div>
    );
};

export default RichTextEditor;
