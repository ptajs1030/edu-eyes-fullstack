<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Payment;
use App\Models\PaymentAssignment;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    private function formatTimeForDisplay($time)
    {
        return Carbon::parse($time)->format('Y-m-d');
    }

    private function formatTimeForDatabase($time)
    {
        return Carbon::parse($time)->format('Y-m-d');
    }
    public function index(Request $request){
        $payments=Payment::with('academicYear')
                    ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
                    ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'asc')
                    ->paginate(10)
                    ->withQueryString();

        $payments->getCollection()->transform(function ($payments){
            return[
                'id'=>$payments->id,
                'academic_year'=>$payments->academicYear,
                'title'=>$payments->title,
                'description'=>$payments->description,
                'nominal'=>$payments->nominal,
                'due_date'=>$this->formatTimeForDisplay($payments->due_date),
            ];
        });

        return Inertia::render('payments/index', [
            'payments'=>$payments,
            'filters'=>$request->only(['search', 'sort', 'direction'])
        ]);
    }

    public function show(){}

    public function create(){
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
        $classrooms=Classroom::orderBy('level')->orderBy('name')->get();
        return Inertia::render('payments/create', [
            'classrooms'=>$classrooms,
            'academicYears' => [$activeAcademicYear], 
        ]);
    }

    public function store(Request $request){
        try {
            $validated=$request->validate([
                'academic_year_id'=>'required|exists:academic_years,id',
                'title'=>'required|string|max:255',
                'description'=>'nullable|string',
                'nominal'=>'required|integer|min:0',
                'due_date'=>'required|date',
                'classroom_id'=>'nullable|exists:classrooms,id',
                'student_ids'=>'nullable|array',
                'student_ids.*'=>'exists:students,id',
            ]);

            DB::transaction(function () use ($validated) {
                $payment = Payment::create([
                    'academic_year_id' => $validated['academic_year_id'],
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'nominal' => $validated['nominal'],
                    'due_date' => $this->formatTimeForDatabase($validated['due_date']),
                ]);

                foreach ($validated['student_ids'] as $studentId) {
                    PaymentAssignment::create([
                        'payment_id' => $payment->id,
                        'student_id' => $studentId,
                    ]);
                }
                
            });
            return redirect()->route('payments.index')
                ->with('success', 'Tagihan Berhasil Ditambahkan');
        } catch (\ValidationException $e) {
           return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create payment: ' . $e->getMessage())
                ->withInput();
        }
    }
}
