<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function searchParents(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2'
        ]);

        $parents = User::whereHas('role', function ($query) {
            $query->where('name', 'parent');
        })
            ->where('full_name', 'like', '%' . $request->input('query') . '%')
            ->limit(10)
            ->get(['id', 'full_name']);

        return response()->json($parents);
    }
}
