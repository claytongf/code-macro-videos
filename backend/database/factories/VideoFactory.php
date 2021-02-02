<?php

namespace Database\Factories;

use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

class VideoFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Video::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $rating = Video::RATING_LIST[array_rand(Video::RATING_LIST)];
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->sentence(10),
            'year_launched' => rand(1895, 2022),
            'opened' => rand(0, 1),
            'rating' => $rating,
            'duration' => rand(1, 30),
            'thumb_file' => $this->faker->uuid . '.jpg',
            'banner_file' => $this->faker->uuid . '.jpg',
            'trailer_file' => $this->faker->uuid . '.mp4',
            'video_file' => $this->faker->uuid . '.mp4',
            // 'published' => rand(0, 1)
        ];
    }
}
