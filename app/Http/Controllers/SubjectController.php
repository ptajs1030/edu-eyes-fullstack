<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $subjects = Subject::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'name', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('subjects/index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'curriculum_year' => 'required|string|max:70',
                'is_archived' => 'required|boolean'
            ]);

            Subject::create($validated);

            return back()
                ->with('success', 'Subject created successfully.')
                ->with('queryParams', request()->query());
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create subject: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $subject = Subject::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'curriculum_year' => 'required|string|max:70',
                'is_archived' => 'required|boolean'
            ]);

            $subject->update($validated);

            return redirect()->back()
                ->with('success', 'Subject updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update subject: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $subject = Subject::findOrFail($id);
            $subject->delete();

            return redirect()->back()
                ->with('success', 'Subject deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Failed to delete subject'
                    : 'Failed to delete subject: ' . $e->getMessage());
        }
    }

    public function searchSubject(Request $request)
    {
        $request->validate([
            'query' => 'nullable|string'
        ]);

        $query = $request->input('query', '');

        $subjects = Subject::where('is_archived', false)
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name as full_name']);

        return response()->json($subjects);
    }
}
