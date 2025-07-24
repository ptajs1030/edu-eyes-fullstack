<?php

namespace App\Http\Controllers;

use App\Models\CustomDayOff;
use Illuminate\Http\Request;

class CustomDayOffController extends Controller
{
    public function searchDayOff(Request $request)
    {
        $request->validate([
            'query' => 'nullable|string'
        ]);

        $query = $request->input('query', '');

        return CustomDayOff::when($query, function ($q) use ($query) {
            $q->where('description', 'like', "%{$query}%");
        })
            ->limit(10)
            ->get(['id', 'description as full_name']);
    }
}
