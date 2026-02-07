<?php

namespace App\Http\Requests\Api;

use App\DTOs\EditEventAttendanceData;
use Illuminate\Foundation\Http\FormRequest;

class EditEventAttendanceRequest extends FormRequest
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
            'status' => 'required|string|in:present,alpha,present_in_tolerance,late',
        ];
    }

    public function getDto(){
        return new EditEventAttendanceData($this->validated());
    }
}
