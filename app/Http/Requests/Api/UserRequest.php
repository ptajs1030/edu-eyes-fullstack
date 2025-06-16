<?php

namespace App\Http\Requests\Api;

use App\DTOs\UserData;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email','unique:users'],
            'username' => ['required', 'string','unique:users'],
            'phone' => ['required', 'string','unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function getDto() : UserData
    {
        return new UserData($this->validated());
    }
}
