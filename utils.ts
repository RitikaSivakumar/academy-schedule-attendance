
import { Student } from './types';

export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const isBirthdayToday = (dob: string): boolean => {
  const birthDate = new Date(dob);
  const today = new Date();
  return (
    birthDate.getDate() === today.getDate() &&
    birthDate.getMonth() === today.getMonth()
  );
};

export const getUpcomingBirthdays = (students: Student[], days: number): Student[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  futureDate.setHours(23, 59, 59, 999);

  return students.filter((student) => {
    const bday = new Date(student.dob);
    bday.setFullYear(today.getFullYear());
    
    // Handle wrap-around for birthdays early next year if we are at year end
    if (bday < today) {
        bday.setFullYear(today.getFullYear() + 1);
    }
    
    return bday >= today && bday <= futureDate;
  }).sort((a, b) => {
    const bdayA = new Date(a.dob);
    bdayA.setFullYear(today.getFullYear());
    const bdayB = new Date(b.dob);
    bdayB.setFullYear(today.getFullYear());
    return bdayA.getTime() - bdayB.getTime();
  });
};

export const downloadCSV = (data: any[], filename: string) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + data.map(row => Object.values(row).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
