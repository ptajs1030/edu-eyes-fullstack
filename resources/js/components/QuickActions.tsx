import { Button } from '@/components/ui/button';

export default function QuickActions() {
  const handleRedirect = (url: string) => {
    window.location.href = url;
  };
  const buttonClass = "bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 cursor-pointer";
  return (
    <div className="flex flex-col gap-2 p-6 rounded-xl bg-white shadow border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleRedirect('/events/create')} className={buttonClass}>
          Tambah Event/Kegiatan
        </Button>
         <Button onClick={() => handleRedirect('/exams/create')} className={buttonClass}>
          Tambah Ujian
        </Button>
        <Button onClick={() => handleRedirect('/tasks/create')} className={buttonClass}>
          Tambah Tugas
        </Button>
         <Button onClick={() => handleRedirect('/payments/create')} className={buttonClass}>
          Tambah Tagihan
        </Button>
        <Button onClick={() => handleRedirect('/announcements/create')} className={buttonClass}>
          Tambah Pengumuman
        </Button>
      </div>
    </div>
  );
}
