<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ExceptionHandler
{
    public static function handleApiException(Exception $exception, Request $request)
    {
        switch (get_class($exception)) {
            case AuthenticationException::class:
                return self::error(2001, 'Unauthorized.', 401);
            case NotFoundHttpException::class:
                return self::error(2002, $exception->getMessage(), 404);
            case SilentHttpException::class:
                return self::error(2003, $exception->getMessage(), $exception->getStatusCode());
            case ValidationException::class:
                return self::error(2002, $exception->getMessage(), 422, $exception->validator->errors());
            default:
                logger()->error('unkown exception', [
                    'exception' => get_class($exception),
                    'exception_message' => $exception->getMessage(),
                    'line' => $exception->getLine(),
                    'file' => $exception->getFile(),
                    'client_ip' => $request->getClientIp(),
                    'request' => $request,
                    'request_params' => $request->all(),
                ]);

                return self::error(2000, $exception->getMessage());
        }
    }

    public static function error(
        ?int $errorCode = null,
        ?string $message = null,
        int $statusCode = 400,
        $errors = []
    ): JsonResponse {
        $result = [
            // 'error_code' => $errorCode,
            'success' => false,
            'message' => $message ?? 'something went wrong!',
        ];

        if (! empty($errors)) {
            $result['errors'] = $errors;
        }

        return response()->json($result, $statusCode);
    }
}
