<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class BaseApiController extends Controller
{
    protected function success($data = null, $message = 'Berhasil', int $status = 200, array $headers = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status, $headers);
    }

    protected function resource(JsonResource $resource, int $status = 200): JsonResponse
    {
        // $resource->response()->setStatusCode($status)
        return response()->json([
            'success' => true,
            'data' => $resource->toArray(request()),
        ]);
    }

    // sample reusable function
//    public function tenantByToken(){
//        return Tenant::where('id_user',Auth::user()->id)->firstOrFail();
//    }
}
