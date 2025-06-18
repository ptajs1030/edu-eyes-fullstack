<?php

namespace App\Http\Controllers\Api;

use App\DTOs\AuthData;
use App\Http\Requests\Api\AuthRequest;
use App\Http\Requests\Api\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\SampleAuthTeacherService;
use Illuminate\Http\JsonResponse;

class SampleAuthTeacherController extends BaseApiController
{
    public function __construct(protected SampleAuthTeacherService $service)
    {
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\Api\UserRequest  $data
     * @return \Illuminate\Http\JsonResponse
     */
    public function addUser(UserRequest $data): JsonResponse
    {
        return $this->success($this->service->addUser($data->getDto()));
    }

    /**
     * Display a user resource or a collection of user resources.
     *
     * If an ID is provided, the specific user with that ID is retrieved and returned.
     * Otherwise, a collection of all users is returned.
     *
     * @param  int|null  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(?int $id = null): JsonResponse
    {
        if ($id) {
            return $this->resource(
                UserResource::make(User::findOrFail($id))
            );
        }
        return $this->resource(
            UserResource::collection(User::get())
        );
    }

    /**
     * Show a collection of user resources with custom logic.
     *
     * The logic is implemented in the `showWithLogic` method of the `AuthTeacherService`.
     * The method returns a collection of user resources that match the custom logic.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function showWithLogic(): JsonResponse
    {
        return $this->resource(UserResource::collection($this->service->showWithLogic()));
    }

    /**
     * Authenticate a user and return a Sanctum Token.
     *
     * The method validates the request data using the `AuthRequest` request class.
     * If the validation succeeds, the `login` method of the `AuthTeacherService` is called.
     * The method returns a JSON Web Token that can be used to authenticate the user in subsequent requests.
     *
     * @param  \App\Http\Requests\Api\AuthRequest  $data
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(AuthRequest $data): JsonResponse
    {
        return $this->success($this->service->login($data->getDto()));
    }

    /**
     * Get the authenticated user.
     *
     * This method returns a JSON response containing the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function profile(): JsonResponse
    {
        return $this->resource(UserResource::make(auth()->user()));
    }
}
