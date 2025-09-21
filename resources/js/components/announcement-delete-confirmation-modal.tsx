
import { motion } from 'framer-motion';

export default function AnnouncementDeleteConfirmationModal({
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleDelete,
    announcementToDelete,
}: {
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    handleDelete: (id: number) => void;
    announcementToDelete: { id: number; title: string } | null;
}) {
    return (isDeleteModalOpen && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="bg-white p-6 rounded-lg w-full max-w-xl shadow-xl"
            >
                <h2 className='text-lg font-bold mb-4'>Konfirmasi Penghapusan</h2>
                <p>Apakah Anda yakin ingin menghapus <strong>{announcementToDelete?.title}</strong>?</p>
                <div className='mt-4 flex justify-end gap-2'>
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className='px-4 py-2 bg-gray-300 rounded hover:cursor-pointer'
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => {
                            if (announcementToDelete) {
                                handleDelete(announcementToDelete.id);
                            }
                            setIsDeleteModalOpen(false);
                        }}
                        className='px-4 py-2 bg-red-500 text-white rounded hover:cursor-pointer'
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </motion.div>
    ));
}