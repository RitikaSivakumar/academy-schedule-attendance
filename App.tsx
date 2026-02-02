
import React, { useState, useMemo } from 'react';
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
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <CalendarIcon /> Today's Schedule
          </h3>
          <div className="space-y-3">
            {currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday])).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-slate-900 truncate">{s.fullName}</div>
                  <div className="text-xs text-slate-500 truncate">{s.grade} - {s.schoolName}</div>
                </div>
                <div className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded uppercase tracking-wider">Regular</div>
              </div>
            ))}
            {currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday])).length === 0 && (
              <div className="text-center py-8 text-slate-400">No sessions scheduled for today.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <CakeIcon /> Recent Birthdays
          </h3>
          <div className="space-y-3">
            {getUpcomingBirthdays(currentStudents, 15).map(s => {
              const today = isBirthdayToday(s.dob);
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${today ? 'bg-pink-50 border-pink-200 ring-2 ring-pink-500 ring-offset-2' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${today ? 'bg-pink-500 text-white shadow-lg' : 'bg-slate-200 text-slate-600'}`}>
                      {s.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{s.fullName}</div>
                      <div className="text-xs text-slate-500">{new Date(s.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Turning {calculateAge(s.dob)}</div>
                    </div>
                  </div>
                  {today && <span className="text-xl animate-bounce">🎉</span>}
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
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Weekly Planner</h2>
      </div>
      <div className="overflow-x-auto p-4 scrollbar-hide">
        <div className="flex gap-4 min-w-[1200px]">
          {Object.values(Weekday).map(day => (
            <div key={day} className="flex-1 space-y-4">
              <h3 className="font-black text-center py-2.5 bg-slate-900 rounded-xl text-white text-xs border border-slate-950 shadow-md uppercase tracking-widest">{day}</h3>
              <div className="space-y-2">
                {currentStudents.filter(s => s.assignedDays.includes(day)).map(s => (
                  <div key={s.id} className="p-4 text-xs bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all cursor-pointer group hover:shadow-md">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.fullName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{s.schoolName}</div>
                    <div className="mt-3 flex items-center justify-between">
                       <span className="text-[9px] px-2 py-0.5 bg-slate-100 rounded-md border text-slate-600 font-bold uppercase">{s.grade}</span>
                    </div>
                  </div>
                ))}
                {currentStudents.filter(s => s.assignedDays.includes(day)).length === 0 && (
                  <div className="py-12 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Sessions</div>
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
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Student Directory</h2>
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input 
              type="text" 
              placeholder="Filter by name..." 
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {/* Responsive Student View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-5">Student Details</th>
                <th className="px-8 py-5">Class Days</th>
                <th className="px-8 py-5">Institution</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{s.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ID: {s.id}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {s.assignedDays.map(d => (
                        <span key={d} className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 font-bold uppercase">{d.substring(0, 3)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-slate-700 font-bold">{s.schoolName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{s.grade}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-indigo-600 font-black text-xs uppercase hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden grid grid-cols-1 divide-y divide-slate-100">
          {filtered.map(s => (
            <div key={s.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900">{s.fullName}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1">ID: {s.id}</p>
                </div>
                <span className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded-md border border-green-100">Active</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.assignedDays.map(d => (
                  <span key={d} className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border font-bold">{d.substring(0, 3)}</span>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold">{s.schoolName} • {s.grade}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBiodata = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Biodata Archive</h2>
        <button 
          onClick={exportBiodata}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-black w-full sm:w-auto shadow-md"
        >
          <DownloadIcon /> Export All
        </button>
      </div>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-900 text-slate-100 text-[10px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-6 py-5">Student</th>
              <th className="px-6 py-5">Birthday</th>
              <th className="px-6 py-5">Parents</th>
              <th className="px-6 py-5">Mobile</th>
              <th className="px-6 py-5">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {currentStudents.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5 font-bold text-slate-900">{s.fullName}</td>
                <td className="px-6 py-5">
                  <div className="font-bold">{s.dob}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black">Age: {calculateAge(s.dob)}</div>
                </td>
                <td className="px-6 py-5 leading-relaxed">
                  <div className="text-slate-500 font-bold uppercase text-[9px]">F: {s.fatherName}</div>
                  <div className="text-slate-500 font-bold uppercase text-[9px]">M: {s.motherName}</div>
                </td>
                <td className="px-6 py-5 font-black text-indigo-600">{s.phone}</td>
                <td className="px-6 py-5 text-[11px] max-w-xs text-slate-400 whitespace-normal line-clamp-2 leading-relaxed">{s.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden divide-y divide-slate-100">
        {currentStudents.map(s => (
          <div key={s.id} className="p-6 space-y-4">
             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
               <h3 className="font-black text-slate-900">{s.fullName}</h3>
               <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded">Age: {calculateAge(s.dob)}</span>
             </div>
             <div className="grid grid-cols-2 gap-4 text-xs font-bold">
               <div>
                 <p className="text-[9px] uppercase text-slate-400 font-black mb-1">DOB</p>
                 <p>{s.dob}</p>
               </div>
               <div>
                 <p className="text-[9px] uppercase text-slate-400 font-black mb-1">Mobile</p>
                 <p className="text-indigo-600">{s.phone}</p>
               </div>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-[11px]">
               <p className="text-slate-500">Father: <span className="text-slate-900 font-bold">{s.fatherName}</span></p>
               <p className="text-slate-500">Mother: <span className="text-slate-900 font-bold">{s.motherName}</span></p>
               <p className="text-slate-500 mt-2">Address: <span className="text-slate-700 leading-relaxed block mt-1">{s.address}</span></p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysStudents = currentStudents.filter(s => s.assignedDays.includes(Weekday[new Date().toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof Weekday]));
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Attendance Log</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button 
              onClick={exportAttendanceToday}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-black w-full sm:w-auto shadow-lg shadow-emerald-100"
            >
              <DownloadIcon /> Export Today
            </button>
          </div>
          <div className="p-6">
            {todaysStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {todaysStudents.map(s => {
                  const currentStatus = attendance.find(a => a.studentId === s.id && a.date === today)?.status;
                  return (
                    <div key={s.id} className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${currentStatus === 'Present' ? 'bg-green-50 border-green-200' : currentStatus === 'Absent' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="font-black text-slate-900 truncate">{s.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mt-1">{s.grade} • {s.schoolName}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => markAttendance(s.id, 'Present')} className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${currentStatus === 'Present' ? 'bg-green-600 text-white shadow-lg' : 'bg-white border text-slate-300 hover:text-green-500'}`}>P</button>
                        <button onClick={() => markAttendance(s.id, 'Absent')} className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${currentStatus === 'Absent' ? 'bg-red-600 text-white shadow-lg' : 'bg-white border text-slate-300 hover:text-red-500'}`}>A</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 font-black uppercase tracking-widest bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">No sessions today</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6">Historical Download</h3>
           <div className="flex flex-col md:flex-row gap-6 items-end">
             <div className="flex-1 w-full">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Start Date</label>
               <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold" />
             </div>
             <div className="flex-1 w-full">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">End Date</label>
               <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold" />
             </div>
             <button onClick={exportAttendanceRange} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 w-full md:w-auto">Download Records</button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:hidden flex items-center justify-between px-6 py-5 bg-slate-900 text-white sticky top-0 z-50">
        <h1 className="text-xl font-black italic tracking-tighter">R3 ACADEMY</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-xl">
          {isSidebarOpen ? 'CLOSE' : 'MENU'}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-900 p-8 flex flex-col z-50 transition-all duration-300 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} border-r border-slate-800`}>
        <div className="mb-12 hidden md:block">
          <h1 className="text-3xl font-black text-white italic tracking-tighter">R3 ACADEMY</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Management Portal</p>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarLink icon={<HomeIcon />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CalendarIcon />} label="Sessions" active={activeTab === 'Schedule'} onClick={() => { setActiveTab('Schedule'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<UsersIcon />} label="Directory" active={activeTab === 'Students'} onClick={() => { setActiveTab('Students'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<FileIcon />} label="Biodata" active={activeTab === 'Biodata'} onClick={() => { setActiveTab('Biodata'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CakeIcon />} label="Birthdays" active={activeTab === 'Birthday'} onClick={() => { setActiveTab('Birthday'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<CheckSquareIcon />} label="Attendance" active={activeTab === 'Attendance'} onClick={() => { setActiveTab('Attendance'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-800">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-900">NV</div>
              <div>
                <div className="text-sm font-black text-white uppercase">Naveen</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Lead Tutor</div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between mb-16">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter border-l-8 border-indigo-600 pl-6 uppercase">{activeTab}</h2>
          <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 shadow-sm">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </header>
        <div className="max-w-[1500px] mx-auto pb-24 md:pb-0">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Schedule' && renderSchedule()}
          {activeTab === 'Students' && renderStudents()}
          {activeTab === 'Biodata' && renderBiodata()}
          {activeTab === 'Birthday' && (
             <div className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="bg-gradient-to-br from-pink-600 to-rose-700 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                   <h3 className="text-lg font-black uppercase mb-2">Today's Birthdays</h3>
                   <div className="text-7xl font-black mb-6 tracking-tighter">{stats.birthdaysToday}</div>
                   <div className="space-y-3">
                     {currentStudents.filter(s => isBirthdayToday(s.dob)).map(s => (
                       <div key={s.id} className="bg-white/20 p-4 rounded-2xl text-sm font-black backdrop-blur-md border border-white/20 flex items-center justify-between">
                         <span>{s.fullName}</span>
                         <span>{calculateAge(s.dob)}th 🎉</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200">
                    <h3 className="text-lg font-black uppercase text-slate-800 mb-6">Upcoming Forecast</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                      {getUpcomingBirthdays(currentStudents, 30).map(s => (
                        <div key={s.id} className={`p-5 rounded-2xl border transition-all ${isBirthdayToday(s.dob) ? 'bg-pink-50 border-pink-200 ring-2 ring-pink-500' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                          <div className="font-black text-slate-900 text-sm truncate">{s.fullName}</div>
                          <div className="text-xs text-slate-500 font-bold uppercase mt-1">{new Date(s.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                          <div className="text-[10px] text-indigo-500 font-black uppercase mt-2">{s.schoolName}</div>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
             </div>
          )}
          {activeTab === 'Attendance' && renderAttendance()}
        </div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 translate-x-2' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const DashboardCard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: 'blue' | 'green' | 'pink' | 'amber' }> = ({ title, value, icon, color }) => {
  const colors = { blue: 'bg-blue-600', green: 'bg-emerald-600', pink: 'bg-rose-600', amber: 'bg-amber-500' };
  return (
    <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-100 flex items-center gap-8 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 text-white shadow-xl ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <div className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2">{title}</div>
        <div className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{value}</div>
      </div>
    </div>
  );
};

export default App;
