<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'role_id' => $this->role_id,
            'full_name' => $this->full_name,
            'username' => $this->username,
            'phone' => $this->phone,
            'email' => $this->email,
            'status' => $this->status,
            'email'=> $this->email,
            'nip'=> $this->nip,
            'job'=> $this->job,
            'position' => $this->position,
            'profile_picture' => $this->profile_picture,
            'address' => $this->address,

        ];
    }
}
