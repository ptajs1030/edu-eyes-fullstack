<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventPic;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventPicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = Event::all();
        $teacherRole = Role::where('name', 'teacher')->first();
        $teachers = User::where('role_id', $teacherRole->id)->get();

        foreach ($events as $index => $event) {
            $picCount = rand(1, 2);
            $selectedTeachers = $teachers->random($picCount);

            foreach ($selectedTeachers as $teacher) {
                EventPic::create([
                    'event_id' => $event->id,
                    'pic_id' => $teacher->id,
                ]);
            }
        }
    }
}
