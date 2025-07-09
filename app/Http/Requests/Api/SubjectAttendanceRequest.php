<?php

namespace App\Http\Requests\Api;

use App;
use Illuminate\Foundation\Http\FormRequest;

class SubjectAttendanceRequest extends FormRequest
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
            'attendance_id_list' => 'required|array',
            'submit_hour' => 'required|date_format:H:i',
        ];
    }

    public function getDto(){
        return new \App\DTOs\SubjectAttendanceData($this->validated());
    }
}
