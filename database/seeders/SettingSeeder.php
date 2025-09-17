<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['key' => 'late_tolerance', 'title' => 'Toleransi Keterlambatan', 'value' => '15', 'type' => 'number'],
            ['key' => 'early_tolerance', 'title' => 'Toleransi Kepulangan Awal', 'value' => '15', 'type' => 'number'],
            ['key' => 'school_name', 'title' => 'Nama Sekolah', 'value' => 'Sekolah Cemerlang', 'type' => 'text'],
            ['key' => 'school_address', 'title' => 'Alamat Sekolah', 'value' => 'Jl. Baru No.123', 'type' => 'text'],
            ['key' => 'school_logo', 'title' => 'Logo Sekolah', 'value' => 'https://png.pngtree.com/png-vector/20230725/ourmid/pngtree-school-logo-design-template-vector-png-image_8668651.png', 'type' => 'text'],
            ['key' => 'payment_reminder_days', 'title' => 'Pengingat Tagihan (hari sebelum jatuh tempo)', 'value' => '2', 'type' => 'number'],
            ['key' => 'task_reminder_days', 'title' => 'Pengingat Tugas (hari sebelum deadline)', 'value' => '1', 'type' => 'number'],
        ];

        foreach ($data as $item) {
            $setting = Setting::where('key', $item['key'])->first();

            if (!$setting) {
                // Create if not exists
                Setting::create($item);
            } elseif ($setting->value !== $item['value'] || $setting->title !== $item['title']) {
                // Update only if value is different
                $setting->update([
                    'title' => $item['title'],
                    'value' => $item['value'],
                    'type' => $item['type']
                ]);
            }
            // Else do nothing (same value)
        }
    }
}
