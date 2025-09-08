type AcademicYear = {
    id: number;
    title: string;
    start_year: number;
    status: 'active' | 'inactive';
};

export const getActiveAcademicYear = (academicYears: AcademicYear[]): AcademicYear | undefined => {
    return academicYears.find((year) => year.status === 'active');
};

export const isAcademicYearPassed = (examAcademicYear: AcademicYear | undefined, activeAcademicYear: AcademicYear | undefined): boolean => {
    if (!examAcademicYear || !activeAcademicYear) return false;

    // Bandingkan berdasarkan start_year
    return examAcademicYear.start_year < activeAcademicYear.start_year;
};
