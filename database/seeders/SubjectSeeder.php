<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            ['name' => 'Matematika', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'Bahasa Indonesia', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'Bahasa Inggris', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'IPA', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'IPS', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'PKn', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'Seni Budaya', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'PJOK', 'curriculum_year' => '2013', 'is_archived' => false],
            ['name' => 'Informatika', 'curriculum_year' => '2015', 'is_archived' => false],
            ['name' => 'Sejarah', 'curriculum_year' => '2015', 'is_archived' => false],
        ];

        foreach ($subjects as $subject) {
            Subject::create($subject);
        }
    }
}
