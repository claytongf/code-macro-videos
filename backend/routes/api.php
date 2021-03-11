<?php

use App\Http\Controllers\Api\CastMemberController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\GenreController;
use App\Http\Controllers\Api\VideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

$exceptCreateAndEdit = ['create', 'edit'];
Route::resource('categories', CategoryController::class)->except($exceptCreateAndEdit);
Route::delete('categories', [CategoryController::class, 'destroyCollection']);
Route::resource('genres', GenreController::class)->except($exceptCreateAndEdit);
Route::delete('genres', [GenreController::class, 'destroyCollection']);
Route::resource('cast-members', CastMemberController::class)->except($exceptCreateAndEdit);
Route::delete('cast-members', [CastMemberController::class, 'destroyCollection']);
Route::resource('videos', VideoController::class)->except($exceptCreateAndEdit);
Route::delete('videos', [VideoController::class, 'destroyCollection']);
