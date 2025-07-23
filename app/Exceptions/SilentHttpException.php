<?php

namespace App\Exceptions;

use Exception;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SilentHttpException extends HttpException
{
    // Class kosong sudah cukup, karena kita hanya mau melempar tanpa log
}
