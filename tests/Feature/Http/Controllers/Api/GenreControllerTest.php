<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\Genre;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class GenreControllerTest extends TestCase
{
    use DatabaseMigrations;

    /**
     * A basic feature test example.
     *
     * @return void
     */
    public function testIndex()
    {
        $genre = Genre::factory(1)->create();
        $response = $this->get(route('genres.index'));

        $response
            ->assertStatus(200)
            ->assertJson($genre->toArray());
    }

    public function testShow()
    {
        $genre = Genre::factory(1)->create();
        $response = $this->get(route('genres.show', ['genre' => $genre[0]->id]));
        $response
            ->assertStatus(200)
            ->assertJson($genre[0]->toArray());
    }

    public function testInvalidationData()
    {
        $response = $this->json('POST', route('genres.store'), []);
        $this->assertInvalidationRequired($response);

        $response = $this->json('POST', route('genres.store'), [
            'name' => str_repeat('a', 256),
            'is_active' => 'a'
        ]);
        $this->assertInvalidationMax($response);
        $this->assertInvalidationBoolean($response);

        $genre = Genre::factory(1)->create();
        $response = $this->json('PUT', route('genres.update', ['genre' => $genre[0]->id]), []);
        $this->assertInvalidationRequired($response);

        $response = $this->json('PUT', route('genres.update', ['genre' => $genre[0]->id]), [
            'name' => str_repeat('a', 256),
            'is_active' => 'a'
        ]);
        $this->assertInvalidationMax($response);
        $this->assertInvalidationBoolean($response);
    }

    protected function assertInvalidationRequired(TestResponse $response)
    {
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonMissingValidationErrors(['is_active'])
            ->assertJsonFragment([
                \Lang::get('validation.required', ['attribute' => 'name'])
            ]);
    }

    protected function assertInvalidationMax(TestResponse $response)
    {
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonFragment([
                \Lang::get('validation.max.string', ['attribute' => 'name', 'max' => 255])
            ]);
    }

    protected function assertInvalidationBoolean(TestResponse $response)
    {
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_active'])
            ->assertJsonFragment([
                \Lang::get('validation.boolean', ['attribute' => 'is active'])
            ]);
    }

    public function testStore()
    {
        $response = $this->json('POST', route('genres.store'), [
            'name' => 'test'
        ]);
        $id = $response->json('id');
        $genre = Genre::find($id);

        $response->assertStatus(201)
            ->assertJson($genre->toArray());
        $this->assertTrue($response->json('is_active'));
        $this->assertNull($response->json('description'));

        $response = $this->json('POST', route('genres.store'), [
            'name' => 'test',
            'description' => 'description',
            'is_active' => false
        ]);

        $response->assertJsonFragment([
            'is_active' => false,
            'description' => 'description'
        ]);
    }

    public function testUpdate()
    {
        $genre = Genre::factory(1)->create([
            'description' => 'description',
            'is_active' => false
        ]);
        $response = $this->json('PUT', route('genres.update', ['genre' => $genre[0]->id]), [
            'name' => 'test',
            'description' => 'test',
            'is_active' => true
        ]);
        $id = $response->json('id');
        $genre = Genre::find($id);

        $response->assertStatus(200)
            ->assertJson($genre->toArray())
            ->assertJsonFragment([
                'description' => 'test',
                'is_active' => true
            ]);

        $response = $this->json('PUT', route('genres.update', ['genre' => $genre->id]), [
            'name' => 'test',
            'description' => '',
            'is_active' => true
        ]);
        $response->assertJsonFragment([
            'description' => null
        ]);

        $genre->description = null;
        $genre->save();

        $response = $this->json('PUT', route('genres.update', ['genre' => $genre->id]), [
            'name' => 'test',
            'description' => null,
            'is_active' => true
        ]);
        $response->assertJsonFragment([
            'description' => null
        ]);
    }

    public function testDelete()
    {
        $genre = Genre::factory(1)->create();
        $response = $this->json('DELETE', route('genres.destroy', ['genre' => $genre[0]->id]));
        $response->assertStatus(204);
        $this->assertNull(Genre::find($genre[0]->id));
        $this->assertNotNull(Genre::withTrashed()->find($genre[0]->id));
    }
}
