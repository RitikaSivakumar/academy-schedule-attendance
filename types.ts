
export enum Weekday {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday'
}

export interface Student {
  id: string;
  fullName: string;
  dob: string;
  fatherName: string;
  motherName: string;
  phone: string;
  altPhone?: string;
  address: string;
  schoolName: string;
  grade: string;
  notes?: string;
  assignedDays: Weekday[];
  status: 'Active' | 'Inactive';
}

export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Schedule {
  id: string;
  day: Weekday;
  className: string;
  timeSlot: string;
  studentIds: string[];
  tutorNotes?: string;
}
