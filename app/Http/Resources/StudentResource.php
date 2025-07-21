<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid'=> $this->uuid,
            'parent_id' => $this->parent_id,
            'classroom' => optional($this->classroom)->name,
            'full_name' => $this->full_name,
            'nis' => $this->nis,
            'entry_year' => $this->entry_year,
            'gender' => $this->gender,
            'status' => $this->status,
            'religion' => $this->religion,
            'birth_place' => $this->birth_place,
            'date_of_birth' => $this->date_of_birth,
            'address' => $this->address,
            'qr_code_url' => $this->qr_code_url,
            
        ];
    }
}
