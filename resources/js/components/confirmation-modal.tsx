import { motion } from 'framer-motion';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: Props) {
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
                <h2 className="mb-4 text-lg font-bold">{title}</h2>
                <p className="mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="rounded bg-gray-300 px-4 py-2 hover:cursor-pointer">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="rounded bg-blue-600 px-4 py-2 text-white hover:cursor-pointer">
                        Konfirmasi
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
