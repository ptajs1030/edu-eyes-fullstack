import FormModal from '@/components/form-modal';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const expectedStudentHeader = [
  'nama_lengkap',
  'nama_orang_tua',
  'kelas',
  'nis',
  'tahun_masuk',
  'jenis_kelamin',
  'status',
  'agama',
  'tempat_lahir',
  'tanggal_lahir',
  'alamat',
];


const normalizeHeader = (s: string) =>
    s.replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, '_');

export default function ImportStudentModal({ isOpen, onClose }: ImportStudentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [validating, setValidating] = useState(false);
    const [processing, setProcessing] = useState(false);

    const resetState = () => {
        setFile(null);
        setErrorMsg('');
        setValidating(false);
        setProcessing(false);
    };

    const handleClose = () => {
        if (!processing) {
            resetState();
            onClose();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg('');
        const f = e.target.files?.[0] ?? null;
        if (!f) {
            setFile(null);
            return;
        }

        if (f.size > 2 * 1024 * 1024) {
            setErrorMsg('Ukuran file maksimal 2MB');
            setFile(null);
            return;
        }

        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ];
        if (f.type && !validTypes.includes(f.type)) {
            setErrorMsg('Tipe file tidak didukung. Upload .xlsx / .xls');
            setFile(null);
            return;
        }

        setValidating(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = ev.target?.result;
                const wb = XLSX.read(data, { type: 'array' });
                const first = wb.SheetNames[0];
                const ws = wb.Sheets[first];
                const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const headerRow = (rows[0] || []).map((v) =>
                    normalizeHeader(String(v ?? '')),
                );
                const expected = expectedStudentHeader.map(normalizeHeader);

                const match =
                    headerRow.length === expected.length &&
                    expected.every((col, idx) => col === headerRow[idx]);

                if (!match) {
                    setErrorMsg('Header file tidak sesuai template.');
                    setFile(null);
                } else {
                    setFile(f);
                    toast.success('File valid. Siap diimpor.');
                }
            } catch {
                setErrorMsg('Gagal membaca file. Format Excel tidak valid.');
                setFile(null);
            } finally {
                setValidating(false);
            }
        };
        reader.readAsArrayBuffer(f);
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await fetch(route('students.template'), { method: 'GET' });
            if (!res.ok) {
                const msg =
                    (await res.json().catch(() => null))?.message ||
                    'Gagal mengunduh template';
                toast.error(msg);
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const fileName =
                res.headers.get('X-File-Name') || `template-import-siswa.xlsx`;
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Template siswa berhasil diunduh');
        } catch {
            toast.error('Terjadi kesalahan saat mengunduh template');
        }
    };

    const handleImport = () => {
        if (!file) {
            setErrorMsg('Pilih file terlebih dahulu');
            return;
        }
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('students.import'), formData, {
            onSuccess: () => {
                handleClose();
                router.reload();
            },
            onError: (errors) => {
                const msg = (errors as any)?.file || 'Import gagal. Periksa isi file.';
                toast.error(msg);
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Data Siswa"
            onSubmit={(e) => {
                e.preventDefault();
                handleImport();
            }}
        >
            <div className="space-y-5">
                <div className="rounded-lg border border-dashed border-gray-300 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Upload File (.xlsx / .xls)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        disabled={processing}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        Gunakan template agar header sesuai. Maks 2MB.
                    </p>
                    {errorMsg && (
                        <div className="mt-2 text-xs text-red-600">{errorMsg}</div>
                    )}
                    {validating && (
                        <div className="mt-2 inline-flex items-center text-xs text-gray-600">
                            <svg
                                className="mr-1.5 h-3.5 w-3.5 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    d="M4 12a8 8 0 018-8v8z"
                                    fill="currentColor"
                                ></path>
                            </svg>
                            Memvalidasi header...
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        disabled={processing}
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
                            />
                        </svg>
                        Template
                    </button>
                    <div className="text-xs text-gray-500">
                        Header: {expectedStudentHeader.join(', ')}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={processing}
                    className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={processing || !file || !!errorMsg || validating}
                    className={`inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ${
                        processing
                            ? 'cursor-not-allowed bg-blue-400'
                            : 'hover:bg-blue-700'
                    }`}
                >
                    {processing ? 'Memproses...' : 'Impor'}
                </button>
            </div>
        </FormModal>
    );
}
