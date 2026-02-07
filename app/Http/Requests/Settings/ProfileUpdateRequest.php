<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'username' => [
                'nullable',
                'string',
                'max:70',
                Rule::unique(User::class)->whereNull('deleted_at')->ignore($this->user()->id),
            ],
            'nip' => ['nullable', 'string', 'max:70'],
            'position' => ['nullable', 'string', 'max:70'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique(User::class)->whereNull('deleted_at')->ignore($this->user()->id),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->whereNull('deleted_at')->ignore($this->user()->id),
            ],
        ];
    }

    public function messages()
    {
        return [
            'email.required' => 'Email wajib diisi.',
            'full_name.required' => 'Nama wajib diisi.',
            'email.unique' => 'Email sudah digunakan.',
            'phone.unique' => 'Nomor telepon sudah digunakan.',
            'username.unique' => 'Username sudah digunakan.',
            'profile_picture.uploaded' => 'Maksimal ukuran file 2 MB (jpg,jpeg,png)',
        ];
    }
}
