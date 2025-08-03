import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
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
            // handlers: {
            //     image: imageHandler,
            // },
        },
    };

    // Format yang didukung
    const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image'];

    // const imageHandler = () => {
    //     const input = document.createElement('input');
    //     input.setAttribute('type', 'file');
    //     input.setAttribute('accept', 'image/*');
    //     input.click();

    //     input.onchange = async () => {
    //         const file = input.files?.[0];
    //         if (file) {
    //             const formData = new FormData();
    //             formData.append('image', file);

    //             try {
    //                 const response = await axios.post('/api/upload-image', formData, {
    //                     headers: {
    //                         'Content-Type': 'multipart/form-data',
    //                     },
    //                 });
    //                 const quill = quillRef.current?.getEditor();
    //                 const range = quill?.getSelection();
    //                 quill?.insertEmbed(range?.index || 0, 'image', response.data.url);
    //             } catch (error) {
    //                 console.error('Upload failed:', error);
    //                 toast.error('Gagal mengupload gambar');
    //             }
    //         }
    //     };
    // };

    return (
        <div className="rich-editor">
            <ReactQuill
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
