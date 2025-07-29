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
            ['key' => 'late_tolerance', 'title' => 'Toleransi Keterlambatan', 'value' => '15'],
            ['key' => 'school_name', 'title' => 'Nama Sekolah', 'value' => 'Sekolah Cemerlang'],
            ['key' => 'school_address', 'title' => 'Alamat Sekolah', 'value' => 'Jl. Baru No.123'],
            ['key' => 'admin_phone', 'title' => 'Telepon Admin Sekolah', 'value' => '021-12345678'],
            ['key' => 'school_logo', 'title' => 'Logo Sekolah', 'value' => 'https://png.pngtree.com/png-vector/20230725/ourmid/pngtree-school-logo-design-template-vector-png-image_8668651.png'],
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
                    'value' => $item['value']
                ]);
            }
            // Else do nothing (same value)
        }
    }
}
