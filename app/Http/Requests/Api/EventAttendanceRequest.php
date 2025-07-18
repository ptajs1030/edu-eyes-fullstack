<?php

namespace App\Http\Requests\Api;

use App\DTOs\EventAttendanceData;
use Illuminate\Foundation\Http\FormRequest;

class EventAttendanceRequest extends FormRequest
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
            'qr_code' => 'required',
            'submit_hour' => 'required|date_format:H:i',
            'event_id' => 'required|exists:events,id',
        ];
    }

public function getDto(){
    return new EventAttendanceData($this->validated());
}
}
