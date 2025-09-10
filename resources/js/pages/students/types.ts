export interface Student {
    id: number;
    full_name: string;
    classroom: {
        id: number;
        name: string;
        main_teacher: {
            id: number;
            full_name: string;
        };
    };
}

export interface AcademicYear {
    id: number;
    title: string;
}

export interface DayOffOption {
    id: number;
    description: string;
}

export interface BaseAttendance {
    id: number;
    submit_date: string;
    academic_year_id: number;
    academic_year: {
        title: string;
    };
    status: string;
    note?: string;
    day_off_reason?: string;
    leave_reason?: string;
}

export interface ShiftingAttendance extends BaseAttendance {
    shifting_name: string;
    shifting_start_hour_formatted: string;
    shifting_end_hour_formatted: string;
    clock_in_hour_formatted?: string;
    clock_out_hour_formatted?: string;
    minutes_of_late?: number;
}

export interface SubjectAttendance extends BaseAttendance {
    subject_name: string;
    subject_start_hour_formatted: string;
    subject_end_hour_formatted: string;
    submit_hour_formatted?: string;
}

export interface DaySummary {
    total: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    perfect: boolean;
    hasLate: boolean;
    hasAbsent: boolean;
}
