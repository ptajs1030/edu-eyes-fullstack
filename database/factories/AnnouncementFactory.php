<?php

namespace Database\Factories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition()
    {
        // fake announcement title and content
        return [
            'title' => $this->faker->sentence(),
            'content' => $this->faker->text(),
            'short_content' => $this->faker->sentence(),
        ];
    }
}
