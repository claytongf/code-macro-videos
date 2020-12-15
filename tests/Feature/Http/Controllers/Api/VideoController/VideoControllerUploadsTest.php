<?php

namespace Tests\Feature\Http\Controllers\Api\VideoController;

use App\Models\Category;
use App\Models\Genre;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Traits\TestUploads;
use Tests\Traits\TestValidations;

class VideoControllerUploadsTest extends BaseVideoControllerTestCase
{
    use TestValidations, TestUploads;

    public function testInvalidationVideoFields()
    {
        $this->assertInvalidationFile(
            'video_file',
            'mp4',
            12,
            'mimetypes',
            ['values' => 'video/mp4']
        );
    }

    public function testStoreWithFiles()
    {
        Storage::fake();
        $files = $this->getFiles();

        $category = Category::factory(1)->create()->first();
        $genre = Genre::factory(1)->create()->first();
        $genre->categories()->sync($category->id);

        $response = $this->json('POST', $this->routeStore(), $this->sendData + [
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id]
        ] + $files);

        $response->assertStatus(201);
        $id = $response->json('id');
        foreach ($files as $file) {
            Storage::assertExists("$id/{$file->hashName()}");
        }
    }

    public function testUpdateWithFiles()
    {
        Storage::fake();
        $files = $this->getFiles();

        $category = Category::factory(1)->create()->first();
        $genre = Genre::factory(1)->create()->first();
        $genre->categories()->sync($category->id);

        $response = $this->json('PUT', $this->routeUpdate(), $this->sendData + [
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id]
        ] + $files);

        $response->assertStatus(200);
        $id = $response->json('id');
        foreach ($files as $file) {
            Storage::assertExists("$id/{$file->hashName()}");
        }
    }

    protected function getFiles()
    {
        return [
            'video_file' => UploadedFile::fake()->create('video_file.mp4')
        ];
    }

    protected function routeStore()
    {
        return route('videos.store');
    }

    protected function routeUpdate()
    {
        return route('videos.update', ['video' => $this->video[0]->id]);
    }

    protected function model()
    {
        return Video::class;
    }
}
