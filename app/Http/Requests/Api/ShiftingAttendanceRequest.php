<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ShiftingAttendanceRequest extends FormRequest
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
            'submit_hour' => 'required|date_format:H:i',
            'qr_code' => 'required',
            'type'=>'required|in:in,out',
        ];
    }

    public function getDto()
    {
        return new \App\DTOs\ShiftingAttendanceData($this->validated());
    }
}
