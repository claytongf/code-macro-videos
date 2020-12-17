<?php

namespace Tests\Feature\Http\Controllers\Api\VideoController;

use App\Models\Category;
use App\Models\Genre;
use App\Models\Video;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

abstract class BaseVideoControllerTestCase extends TestCase
{
    use DatabaseMigrations;

    protected $video;
    protected $sendData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->video = Video::factory(1)->create([
            'opened' => false
        ]);
        $category = Category::factory(1)->create()->first();
        $genre = Genre::factory(1)->create()->first();
        $genre->categories()->sync($category->id);
        $this->sendData = [
            'title' => 'title',
            'description' => 'description',
            'year_launched' => 2012,
            'rating' => Video::RATING_LIST[0],
            'duration' => 90,
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id]
        ];
    }

    protected function assertIfFilesUrlExists(Video $video, TestResponse $response)
    {
        $fileFields = Video::$fileFields;
        $data = $response->json('data');
        $data = array_key_exists(0, $data) ? $data[0] : $data;
        foreach ($fileFields as $field) {
            $file = $video->{$field};
            $this->assertEquals(
                Storage::url($video->relativeFilePath($file)),
                $data[$field . '_url']
            );
        }
    }
}
