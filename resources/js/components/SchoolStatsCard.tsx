import React from 'react';

interface SchoolStatsCardProps {
  stats: {
    siswa: number;
    guru: number;
    admin: number;
    orangTua: number;
    kelas: number;
    mataPelajaran: number;
    tahunAkademik: string;
  };
}

export default function SchoolStatsCard({ stats }: SchoolStatsCardProps) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl bg-white shadow border border-gray-200">
      <div className="mb-2 text-center">
        <span className="text-base font-semibold text-gray-500">Tahun Akademik Aktif</span>
        <div className="text-3xl font-bold text-primary mt-1">{stats.tahunAkademik}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Siswa" value={stats.siswa} color="bg-blue-100 text-blue-700" icon="👨‍🎓" />
        <StatCard label="Guru" value={stats.guru} color="bg-green-100 text-green-700" icon="👩‍🏫" />
        <StatCard label="Admin" value={stats.admin} color="bg-yellow-100 text-yellow-700" icon="🛡️" />
        <StatCard label="Orang Tua/Wali" value={stats.orangTua} color="bg-pink-100 text-pink-700" icon="👨‍👩‍👧" />
        <StatCard label="Kelas" value={stats.kelas} color="bg-purple-100 text-purple-700" icon="🏫" />
        <StatCard label="Mata Pelajaran" value={stats.mataPelajaran} color="bg-indigo-100 text-indigo-700" icon="📚" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg p-4 shadow-sm ${color}`} style={{ minHeight: 90 }}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-lg font-large text-gray-600 mt-1">{label}</div>
    </div>
  );
}
