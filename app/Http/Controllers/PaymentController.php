<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Events\PaymentCreated;
use App\Jobs\SendPaymentRealTimeNotification;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Payment;
use App\Models\PaymentAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
    public function index(Request $request)
    {
        $payments = Payment::with('academicYear')
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        $payments->getCollection()->transform(function ($payments) {
            return [
                'id' => $payments->id,
                'academic_year' => $payments->academicYear,
                'title' => $payments->title,
                'description' => $payments->description,
                'nominal' => $payments->nominal,
                'due_date' => $this->formatTimeForDisplay($payments->due_date),
            ];
        });

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'sort', 'direction'])
        ]);
    }

    public function create()
    {
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
        $classrooms = Classroom::orderBy('level')->orderBy('name')->get();
        return Inertia::render('payments/form', [
            'classrooms' => $classrooms,
            'academicYears' => [$activeAcademicYear],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'academic_year_id' => 'required|exists:academic_years,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'nominal' => 'required|integer|min:0',
                'due_date' => 'required|date',
                'classroom_id' => 'nullable|exists:classrooms,id',
                'student_ids' => 'nullable|array',
                'student_ids.*' => 'exists:students,id',
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

                event(new PaymentCreated($payment));
            });

            return redirect()->route('payments.index')
                ->with('success', 'Tagihan Berhasil Ditambahkan');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create payment: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function edit(Payment $payment)
    {
        $payment->load('academicYear', 'assignments');

        $classrooms = Classroom::orderBy('level')->orderBy('name')->get();
        $academicYears = AcademicYear::where('status', 'active')->get();
        $selectedStudents = $payment->assignments->pluck('student_id')->toArray();

        return Inertia::render('payments/form', [
            'payment' => [
                'id' => $payment->id,
                'academic_year_id' => $payment->academic_year_id,
                'title' => $payment->title,
                'description' => $payment->description,
                'nominal' => $payment->nominal,
                'due_date' => $this->formatTimeForDisplay($payment->due_date),
            ],
            'selectedStudents' => $selectedStudents,
            'classrooms' => $classrooms,
            'academicYears' => $academicYears,
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        try {
            $validated = $request->validate([
                'academic_year_id' => 'required|exists:academic_years,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'nominal' => 'required|integer|min:0',
                'due_date' => 'required|date',
                'classroom_id' => 'nullable|exists:classrooms,id',
                'student_ids' => 'nullable|array',
                'student_ids.*' => 'exists:students,id',
            ]);

            DB::transaction(function () use ($validated, $payment) {
                $payment->update([
                    'academic_year_id' => $validated['academic_year_id'],
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'nominal' => $validated['nominal'],
                    'due_date' => $this->formatTimeForDatabase($validated['due_date']),
                ]);

                // Update assignments
                $payment->assignments()->delete();
                foreach ($validated['student_ids'] as $studentId) {
                    PaymentAssignment::create([
                        'payment_id' => $payment->id,
                        'student_id' => $studentId,
                    ]);
                }
            });

            return redirect()->route('payments.index')
                ->with('success', 'Tagihan Berhasil Diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update payment: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function show(Payment $payment)
    {
        $payment->load('academicYear', 'assignments.student.classroom');
        $transactions = PaymentAssignment::with('student', 'payment')->where('payment_id', $payment->id)->get();

        return Inertia::render('payments/detail', [
            'payment' => $payment,
            'transaction' => $transactions,
        ]);
    }

    public function updateTransactions(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'transaction_ids' => 'required|array',
            'status' => 'required|in:lunas,belum',
        ]);

        foreach ($validated['transaction_ids'] as $id) {
            $transaction = PaymentAssignment::find($id);
            if ($transaction) {
                if ($validated['status'] === 'lunas') {
                    $transaction->payment_date = now();
                } else {
                    $transaction->payment_date = null;
                }
                $transaction->save();
            }
        }

        return back()->with('success', 'Status pembayaran berhasil diperbarui.');
    }

    public function destroy(Payment $payment)
    {
        try {

            if ($payment->assignments()->count() === 0) {
                $payment->delete();
                return redirect()->route('payments.index')
                    ->with('success', 'Tagihan Berhasil Dihapus');
            } else {
                return redirect()->back()
                    ->with('error', 'Tagihan tidak dapat dihapus karena memiliki keterkaitan dengan data daftar pembayaran');
            }
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to delete payment: ' . $e->getMessage());
        }
    }

    public function resendNotification(Payment $payment)
    {
        try {
            // Validasi: cek apakah payment sudah lewat deadline
            $now = now('Asia/Jakarta');
            $dueDate = $payment->due_date->format('Y-m-d');
            $dueDateTime = Carbon::parse($dueDate . ' 23:59:59', 'Asia/Jakarta');

            if ($now->greaterThan($dueDateTime)) {
                return redirect()->route('payments.index')
                    ->with('error', 'Tidak dapat mengirim notifikasi karena pembayaran sudah melewati tenggat waktu.');
            }

            $payment->load(['assignments.student.parent', 'academicYear']);

            $notificationCount = collect($payment->assignments)
                ->filter(
                    fn($assignment) =>
                    $assignment->student?->parent?->role->name === Role::Parent->value &&
                        $assignment->student->parent->notification_key &&
                        !$assignment->payment_date // Hanya kirim untuk yang belum bayar
                )
                ->each(
                    fn($assignment) =>
                    SendPaymentRealTimeNotification::dispatch($payment, $assignment->student->parent, 'manual')
                )
                ->count();

            return redirect()->route('payments.index')
                ->with(
                    $notificationCount > 0 ? 'success' : 'info',
                    $notificationCount > 0
                        ? "Notifikasi berhasil dikirim ke {$notificationCount} orang tua."
                        : 'Tidak ada orang tua yang dapat menerima notifikasi atau semua pembayaran sudah lunas.'
                );
        } catch (\Exception $e) {
            Log::error('Gagal mengirim notifikasi pembayaran', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('payments.index')
                ->with('error', 'Gagal mengirim notifikasi: ' . $e->getMessage());
        }
    }
}
