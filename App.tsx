
import React, { useState, useEffect, useMemo } from 'react';
import { Weekday, Student, AttendanceRecord } from './types';
import { INITIAL_STUDENTS } from './data';
import { 
  calculateAge, 
  isBirthdayToday, 
  getUpcomingBirthdays, 
  downloadCSV 
} from './utils';
import { 
  HomeIcon, UsersIcon, CalendarIcon, CakeIcon, 
  FileIcon, CheckSquareIcon, SearchIcon, DownloadIcon 
} from './components/Icons';

type Tab = 'Dashboard' | 'Schedule' | 'Students' | 'Biodata' | 'Birthday' | 'Attendance';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States for historical attendance export
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const currentStudents = useMemo(() => students, [students]);

  const stats = {
    totalStudents: currentStudents.length,
    activeStudents: currentStudents.filter(s => s.status === 'Active').length,
    birthdaysToday: currentStudents.filter(s => isBirthdayToday(s.dob)).length,
    upcomingBirthdays: getUpcomingBirthdays(currentStudents, 7).length,
  };

  const markAttendance = (studentId: string, status: AttendanceRecord['status']) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.findIndex(a => a.studentId === studentId && a.date === today);
    const newRecords = [...attendance];
    
    if (existing > -1) {
      newRecords[existing].status = status;
    } else {
      newRecords.push({ studentId, date: today, status });
    }
    setAttendance(newRecords);
  };

  const exportBiodata = () => {
    const data = currentStudents.map(s => ({
      ID: s.id,
      Name: s.fullName,
      DOB: s.dob,
      Age: calculateAge(s.dob),
      Father: s.fatherName,
      Mother: s.motherName,
      Phone: s.phone,
      Address: `"${s.address}"`,
      School: s.schoolName,
      Grade: s.grade,
      Status: s.status
    }));
    downloadCSV(data, 'R3_Academy_Biodata.csv');
  };

  const exportAttendanceToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(a => a.date === today);
    
    if (todaysAttendance.length === 0) {
      alert("No attendance records found for today.");
      return;
    }

    const data = todaysAttendance.map(a => {
      const student = currentStudents.find(s => s.id === a.studentId);
      return {
        Date: a.date,
        StudentID: student?.id || 'N/A',
        FullName: student?.fullName || 'Unknown',
        School: student?.schoolName || 'N/A',
        Grade: student?.grade || 'N/A',
        Status: a.status
      };
    });
    downloadCSV(data, `Attendance_R3_${today}.csv`);
  };

  const exportAttendanceRange = () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const rangeAttendance = attendance.filter(a => {
      return a.date >= exportStartDate && a.date <= exportEndDate;
    });

    if (rangeAttendance.length === 0) {
      alert("No attendance records found for the selected range.");
      return;
    }

    const data = rangeAttendance.map(a => {
      const student = currentStudents.find(s => s.id === a.studentId);
      return {
        Date: a.date,
        StudentID: student?.id || 'N/A',
        FullName: student?.fullName || 'Unknown',
        School: student?.schoolName || 'N/A',
        Grade: student?.grade || 'N/A',
        Status: a.status
      };
    });
    downloadCSV(data, `Attendance_History_R3_${exportStartDate}_to_${exportEndDate}.csv`);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Students" value={stats.totalStudents} icon={<UsersIcon />} color="blue" />
        <DashboardCard title="Active Students" value={stats.activeStudents} icon={<CheckSquareIcon />} color="green" />
        <DashboardCard title="Birthdays Today" value={stats.birthdaysToday} icon={<CakeIcon />} color="pink" />
        <DashboardCard title="Upcoming (7d)" value={stats.upcomingBirthdays} icon={<CalendarIcon />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <CalendarIcon /> Today's Schedule
          </h3>
          <div className="space-y-3">
            {currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday])).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-medium text-slate-900 truncate">{s.fullName}</div>
                  <div className="text-xs text-slate-500 truncate">{s.grade} - {s.schoolName}</div>
                </div>
                <div className="text-[10px] font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded uppercase tracking-wider shrink-0">
                  Regular
                </div>
              </div>
            ))}
            {currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday])).length === 0 && (
              <div className="text-center py-8 text-slate-400">No classes scheduled for today.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <CakeIcon /> Recent Birthdays
          </h3>
          <div className="space-y-3">
            {getUpcomingBirthdays(currentStudents, 15).map(s => {
              const today = isBirthdayToday(s.dob);
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${today ? 'bg-pink-50 border-pink-200 ring-2 ring-pink-500 ring-offset-2' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm ${today ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {s.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-slate-900 truncate">{s.fullName}</div>
                      <div className="text-xs text-slate-500">{new Date(s.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Turning {calculateAge(s.dob)}</div>
                    </div>
                  </div>
                  {today && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-bold text-pink-600 uppercase">Today!</span>
                      <span className="text-lg">🎉</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Weekly Planner</h2>
      </div>
      <div className="overflow-x-auto p-4 scrollbar-hide">
        <div className="flex gap-4 min-w-[1200px]">
          {Object.values(Weekday).map(day => (
            <div key={day} className="flex-1 space-y-4">
              <h3 className="font-bold text-center py-2 bg-slate-900 rounded-lg text-white text-sm border border-slate-950 shadow-md">{day}</h3>
              <div className="space-y-2">
                {currentStudents.filter(s => s.assignedDays.includes(day)).map(s => (
                  <div key={s.id} className="p-3 text-xs bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-400 transition-colors cursor-pointer group hover:bg-indigo-50/20">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.fullName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{s.schoolName}</div>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded border text-slate-500 font-semibold">{s.grade}</span>
                    </div>
                  </div>
                ))}
                {currentStudents.filter(s => s.assignedDays.includes(day)).length === 0 && (
                  <div className="py-8 text-center text-slate-300 text-[10px]">No sessions</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => {
    const filtered = currentStudents.filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{s.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {s.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {s.assignedDays.map(d => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">{d.substring(0, 3)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{s.schoolName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 font-semibold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-0 divide-y divide-slate-100">
          {filtered.map(s => (
            <div key={s.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-slate-900">{s.fullName}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">ID: {s.id}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {s.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-2 truncate">{s.schoolName} • {s.grade}</div>
              <div className="flex flex-wrap gap-1 items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {s.assignedDays.map(d => (
                    <span key={d} className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">{d.substring(0, 3)}</span>
                  ))}
                </div>
                <button className="text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg border border-indigo-100">Manage</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBiodata = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Biodata Records</h2>
        <button 
          onClick={exportBiodata}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium w-full sm:w-auto shadow-sm"
        >
          <DownloadIcon /> Download CSV
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-900 text-slate-100 text-[10px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-4">Student Name</th>
              <th className="px-4 py-4">Birth Details</th>
              <th className="px-4 py-4">Parents</th>
              <th className="px-4 py-4">Contact</th>
              <th className="px-4 py-4">Institute Info</th>
              <th className="px-4 py-4">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {currentStudents.map(s => (
              <tr key={s.id} className="hover:bg-indigo-50/30">
                <td className="px-4 py-4 font-bold text-slate-900">{s.fullName}</td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{s.dob}</div>
                  <div className="text-[10px] text-slate-500">Age: {calculateAge(s.dob)}</div>
                </td>
                <td className="px-4 py-4 leading-tight">
                  <div className="text-slate-700">F: {s.fatherName}</div>
                  <div className="text-slate-700">M: {s.motherName}</div>
                </td>
                <td className="px-4 py-4 font-mono text-indigo-600">{s.phone}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-700">{s.schoolName}</div>
                  <div className="text-[10px] text-slate-500">{s.grade}</div>
                </td>
                <td className="px-4 py-4 text-[11px] max-w-xs text-slate-500 whitespace-normal leading-relaxed">
                  {s.address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {currentStudents.map(s => (
          <div key={s.id} className="p-4 space-y-3 bg-white">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="font-black text-slate-900">{s.fullName}</h3>
              <div className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Age: {calculateAge(s.dob)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Date of Birth</p>
                <p className="font-medium">{new Date(s.dob).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Contact</p>
                <p className="font-mono text-indigo-600">{s.phone}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Guardians</p>
              <p className="text-slate-700 font-medium">Father: {s.fatherName}</p>
              <p className="text-slate-700 font-medium">Mother: {s.motherName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Institute</p>
              <p className="text-slate-900 font-bold">{s.schoolName} • {s.grade}</p>
            </div>
            <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Address</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">{s.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBirthdayDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-pink-600 to-rose-700 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden ring-4 ring-pink-100 ring-offset-2">
          <div className="absolute top-[-20px] right-[-20px] opacity-20 rotate-12 scale-150">
             <CakeIcon />
          </div>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <CakeIcon /> Today's Birthdays
          </h3>
          <div className="text-6xl font-black mb-4 tracking-tighter drop-shadow-md">{stats.birthdaysToday}</div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {currentStudents.filter(s => isBirthdayToday(s.dob)).map(s => (
              <div key={s.id} className="bg-white/20 p-3 rounded-xl text-sm backdrop-blur-md border border-white/30 flex items-center gap-3 animate-pulse">
                <span className="text-xl">🎂</span>
                <span className="font-bold">{s.fullName}</span>
                <span className="ml-auto text-xs font-bold opacity-90">{calculateAge(s.dob)}th</span>
              </div>
            ))}
            {stats.birthdaysToday === 0 && <p className="text-sm opacity-80 italic">No birthdays today. Quiet day at R3 Academy!</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <CalendarIcon /> Next 30 Days Forecast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {getUpcomingBirthdays(currentStudents, 30).map(s => {
              const bdayToday = isBirthdayToday(s.dob);
              return (
                <div key={s.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${bdayToday ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-500 ring-offset-2' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-sm ${bdayToday ? 'bg-pink-500 text-white' : 'bg-white text-indigo-700 border border-indigo-100'}`}>
                    {s.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 truncate">{s.fullName}</div>
                    <div className="text-xs text-slate-500 font-medium">{new Date(s.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                    <div className="text-[10px] text-indigo-500 font-bold mt-1 uppercase truncate">{s.schoolName}</div>
                  </div>
                  {bdayToday && <span className="ml-auto text-2xl animate-bounce">🎈</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
          <UsersIcon /> Institute Directory Calendar
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
           {Array.from(new Set(currentStudents.map(s => s.schoolName))).map(school => (
             <div key={school} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="font-black text-indigo-700 text-xs uppercase tracking-widest truncate max-w-[80%]">{school}</h4>
                 <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                   {currentStudents.filter(s => s.schoolName === school).length}
                 </span>
               </div>
               <ul className="space-y-3">
                 {currentStudents.filter(s => s.schoolName === school).sort((a,b) => new Date(a.dob).getMonth() - new Date(b.dob).getMonth()).map(s => (
                   <li key={s.id} className="text-xs flex items-center justify-between group">
                     <span className="font-medium text-slate-700 group-hover:text-slate-900">{s.fullName}</span>
                     <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${isBirthdayToday(s.dob) ? 'bg-pink-500 text-white' : 'bg-white border text-slate-400'}`}>
                       {new Date(s.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </span>
                   </li>
                 ))}
               </ul>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysStudents = currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday]));

    return (
      <div className="space-y-6">
        {/* Main Attendance Logging Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Attendance Log</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button 
              onClick={exportAttendanceToday}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-black w-full sm:w-auto shadow-lg shadow-indigo-100 active:scale-95"
            >
              <DownloadIcon /> Today's Report
            </button>
          </div>
          <div className="p-4">
            {todaysStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {todaysStudents.map(s => {
                  const currentStatus = attendance.find(a => a.studentId === s.id && a.date === today)?.status;
                  return (
                    <div key={s.id} className={`p-4 rounded-2xl border transition-all duration-300 ${currentStatus === 'Present' ? 'bg-green-50/50 border-green-200 ring-1 ring-green-100' : currentStatus === 'Absent' ? 'bg-red-50/50 border-red-200 ring-1 ring-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">{s.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{s.grade} • {s.schoolName}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => markAttendance(s.id, 'Present')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black text-sm ${currentStatus === 'Present' ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-105' : 'bg-white border border-slate-200 text-slate-300 hover:text-green-500 hover:border-green-300'}`}
                          >P</button>
                          <button 
                            onClick={() => markAttendance(s.id, 'Absent')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black text-sm ${currentStatus === 'Absent' ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105' : 'bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-300'}`}
                          >A</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CalendarIcon />
                <p className="mt-4 font-bold text-slate-600">No sessions scheduled for today.</p>
                <p className="text-xs text-slate-400 italic mt-1">Check the Weekly Planner for other dates.</p>
              </div>
            )}
          </div>
        </div>

        {/* History Export Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <DownloadIcon /> Export History Attendance
             </h3>
             <p className="text-xs text-slate-500 mt-1">Select a custom date range to download historical attendance records.</p>
          </div>
          <div className="p-6 bg-slate-50/50">
             <div className="flex flex-col md:flex-row gap-4 items-end">
               <div className="flex-1 w-full space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Date</label>
                 <input 
                   type="date" 
                   value={exportStartDate}
                   onChange={(e) => setExportStartDate(e.target.value)}
                   className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                 />
               </div>
               <div className="flex-1 w-full space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">End Date</label>
                 <input 
                   type="date" 
                   value={exportEndDate}
                   onChange={(e) => setExportEndDate(e.target.value)}
                   className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                 />
               </div>
               <button 
                 onClick={exportAttendanceRange}
                 className="flex-none w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-black shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
               >
                 <DownloadIcon /> Download History
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-6 py-5 bg-slate-900 text-white sticky top-0 z-50 shadow-2xl">
        <h1 className="text-xl font-black tracking-tighter italic flex items-center gap-2">
           <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center not-italic">R</span>
           R3 ACADEMY
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 bg-slate-800 rounded-xl shadow-inner border border-slate-700"
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 p-8 flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out
        md:static md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-slate-800
      `}>
        <div className="mb-12 hidden md:block">
          <h1 className="text-2xl font-black text-white tracking-tighter italic flex items-center gap-2">
             <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center not-italic text-sm">R3</span>
             ACADEMY
          </h1>
          <p className="text-[10px] uppercase font-black text-slate-500 mt-2 tracking-widest bg-slate-800/50 inline-block px-2 py-0.5 rounded">Tutor Admin Portal</p>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <SidebarLink icon={<HomeIcon />} label="Main Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CalendarIcon />} label="Weekly Planner" active={activeTab === 'Schedule'} onClick={() => { setActiveTab('Schedule'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<UsersIcon />} label="Student List" active={activeTab === 'Students'} onClick={() => { setActiveTab('Students'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<FileIcon />} label="Biodata Records" active={activeTab === 'Biodata'} onClick={() => { setActiveTab('Biodata'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CakeIcon />} label="Birthday Hub" active={activeTab === 'Birthday'} onClick={() => { setActiveTab('Birthday'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CheckSquareIcon />} label="Attendance Log" active={activeTab === 'Attendance'} onClick={() => { setActiveTab('Attendance'); setIsSidebarOpen(false); }} />
        </nav>
        
        <div className="mt-auto pt-8 border-t border-slate-800">
          <div className="flex items-center gap-4 group cursor-pointer">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-950 group-hover:scale-105 transition-transform">NV</div>
             <div className="min-w-0">
               <div className="text-sm font-black text-white truncate uppercase tracking-tight">Naveen</div>
               <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Lead Tutor</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-slate-50 p-6 md:p-10 lg:p-14 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between mb-12">
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none border-l-4 border-indigo-600 pl-4">{activeTab}</h2>
            <div className="flex items-center gap-2 mt-3 pl-4">
               <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-200"></span>
               <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">System Status: Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black shadow-sm flex items-center gap-3 text-slate-600 hover:shadow-md transition-shadow">
              <CalendarIcon />
              {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Mobile View Header */}
        <div className="md:hidden mb-8">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-10 bg-indigo-600 rounded-full"></div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeTab}</h2>
           </div>
        </div>

        <div className="max-w-[1500px] mx-auto pb-24 md:pb-0">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Schedule' && renderSchedule()}
          {activeTab === 'Students' && renderStudents()}
          {activeTab === 'Biodata' && renderBiodata()}
          {activeTab === 'Birthday' && renderBirthdayDashboard()}
          {activeTab === 'Attendance' && renderAttendance()}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 20px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}} />
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 font-black text-sm ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 translate-x-1' : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'}`}
  >
    <span className={`${active ? 'scale-110' : 'opacity-60'}`}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

const DashboardCard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: 'blue' | 'green' | 'pink' | 'amber' }> = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-600 shadow-blue-200/50',
    green: 'bg-emerald-600 shadow-emerald-200/50',
    pink: 'bg-rose-600 shadow-rose-200/50',
    amber: 'bg-amber-500 shadow-amber-200/50'
  };
  
  return (
    <div className="p-7 rounded-[2rem] bg-white shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 text-white shadow-xl ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 truncate">{title}</div>
        <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</div>
      </div>
    </div>
  );
};

export default App;
