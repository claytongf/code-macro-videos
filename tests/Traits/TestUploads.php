<?php

namespace Tests\Traits;

use Illuminate\Http\UploadedFile;
use App\Models\Traits\UploadFiles;
use Illuminate\Support\Facades\Storage;

trait TestUploads
{
    protected function assertInvalidationFile($field, $extension, $maxSize, $rule, $ruleParams = [])
    {
        $routes = [
            [
                'method' => 'POST',
                'route' => $this->routeStore()
            ],
            [
                'method' => 'PUT',
                'route' => $this->routeUpdate()
            ],
        ];

        foreach ($routes as $route) {
            $file = UploadedFile::fake()->create("$field.1$extension");//forçar extensão errada. .1mp4
            $response = $this->json($route['method'], $route['route'], [$field => $file]);

            $this->assertInvalidationFields($response, [$field], $rule, $ruleParams);

            $file = UploadedFile::fake()->create("$field.$extension")->size($maxSize + 1);
            $response = $this->json($route['method'], $route['route'], [$field => $file]);

            $this->assertInvalidationFields($response, [$field], 'max.file', ['max' => $maxSize]);
        }
    }

    protected function assertFilesExistsInStorage($model, array $files)
    {
        /** @var UploadFiles $model */
        foreach ($files as $file) {
            Storage::assertExists($model->relativeFilePath($file->hashName()));
        }
    }
}
