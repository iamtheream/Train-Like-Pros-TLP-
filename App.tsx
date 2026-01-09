
import React, { useState, useRef } from 'react';
import { BookingState, Sport, LessonType } from './types';
import { SPORTS_OPTIONS, LESSONS, TIME_SLOTS } from './constants';

type AuthView = 'login' | 'register' | 'forgot' | 'admin';
type AdminTab = 'dashboard' | 'players' | 'schedule';

/**
 * Logo component that uses the uploaded PNG image
 */
const TLPLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const scale = size === 'sm' ? 'h-8' : size === 'md' ? 'h-12' : size === 'lg' ? 'h-24' : 'h-32';
  return (
    <div className={`${scale} flex items-center justify-center pointer-events-none tlp-logo-dripping`}>
      <img 
        src="logo.png" 
        alt="Train Like Pros Logo" 
        className="h-full w-auto object-contain drop-shadow-md"
      />
    </div>
  );
};

/**
 * Material 3 inspired Text Field component
 */
const TextField: React.FC<{
  label: string;
  type?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
  min?: string;
}> = ({ label, type = 'text', value, placeholder = ' ', required, onChange, id, min }) => {
  const isDate = type === 'date';
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputClick = () => {
    if (isDate && inputRef.current && 'showPicker' in HTMLInputElement.prototype) {
      try {
        (inputRef.current as any).showPicker();
      } catch (e) {
        console.debug("showPicker not supported or failed", e);
      }
    }
  };
  
  return (
    <div className="relative w-full group">
      <input
        ref={inputRef}
        type={type}
        id={id}
        value={value}
        min={min}
        required={required}
        onChange={onChange}
        onClick={handleInputClick}
        className={`block px-4 pt-6 pb-2 w-full text-base text-gray-900 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-tlp-pink peer transition-colors ${
          isDate ? 'cursor-pointer pr-10' : 'appearance-none'
        }`}
        placeholder={placeholder}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm duration-200 transform origin-[0] left-4 font-medium pointer-events-none transition-all
          ${isDate || (value && value !== '') 
            ? 'text-tlp-pink -translate-y-3 scale-75 top-4' 
            : 'text-gray-500 -translate-y-3 scale-75 top-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-tlp-pink'
          }`}
      >
        {label}
      </label>
      {isDate && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-tlp-pink transition-colors pt-2">
          <i className="fas fa-calendar-alt"></i>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [step, setStep] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [booking, setBooking] = useState<BookingState>({
    sport: null,
    lessonType: null,
    date: null,
    time: null,
    playerInfo: {
      firstName: '',
      lastName: '',
      age: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      notes: ''
    }
  });

  const [adminData] = useState({
    todaySessions: [
      { id: 1, player: 'Alex Rodriguez', time: '09:00 AM', lesson: 'Hitting', status: 'Confirmed' },
      { id: 2, player: 'Babe Ruth', time: '11:00 AM', lesson: 'Pitching', status: 'Pending' },
      { id: 3, player: 'Jackie Robinson', time: '02:00 PM', lesson: 'Fielding', status: 'Confirmed' },
    ],
    players: [
      { 
        id: 'p1',
        name: 'Alex Rodriguez', 
        age: 14, 
        sessions: 12, 
        lastSession: '2024-05-15',
        history: ['Hitting', 'Fielding', 'Hitting', 'Hitting', 'Hitting', 'Hitting'],
        parent: { name: 'Enrique Rodriguez', email: 'enrique.r@email.com', phone: '(555) 123-4567' }
      },
      { 
        id: 'p2',
        name: 'Babe Ruth', 
        age: 12, 
        sessions: 8, 
        lastSession: '2024-05-14',
        history: ['Pitching', 'Hitting', 'Pitching', 'Hitting', 'Pitching', 'Hitting'],
        parent: { name: 'George Ruth Sr.', email: 'george.ruth@email.com', phone: '(555) 987-6543' }
      },
      { 
        id: 'p3',
        name: 'Jackie Robinson', 
        age: 15, 
        sessions: 15, 
        lastSession: '2024-05-10',
        history: ['Fielding', 'Small Group', 'Hitting', 'Fielding', 'Fielding', 'Fielding'],
        parent: { name: 'Mallie Robinson', email: 'mallie.r@email.com', phone: '(555) 444-5555' }
      },
      { 
        id: 'p4',
        name: 'Ken Griffey Jr.', 
        age: 13, 
        sessions: 24, 
        lastSession: '2024-05-18',
        history: ['Hitting', 'Fielding', 'Hitting', 'Hitting', 'Fielding', 'Hitting'],
        parent: { name: 'Ken Griffey Sr.', email: 'ken.sr@email.com', phone: '(555) 222-3333' }
      },
    ],
    blackoutDates: ['2024-06-01', '2024-06-02'],
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const updateBooking = (updates: Partial<BookingState>) => {
    setBooking(prev => ({ ...prev, ...updates }));
  };

  const handleLogin = (e: React.FormEvent, type: 'user' | 'admin' = 'user') => {
    e.preventDefault();
    setIsAuthenticated(true);
    setIsAdmin(type === 'admin');
    setIsGuest(false);
  };

  const handleBackToLogin = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsGuest(false);
    setAuthView('login');
    setAdminTab('dashboard');
    setIsDrawerOpen(false);
    setStep(1); 
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const openPlayerProfile = (player: any) => {
    setSelectedPlayer(player);
    setIsDrawerOpen(true);
  };

  const renderAuth = () => {
    switch (authView) {
      case 'login':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">TRAIN LIKE PROS</h2>
              <p className="text-gray-500 mt-2 font-medium">Log in to your elite member portal</p>
            </div>
            <form onSubmit={(e) => handleLogin(e, 'user')} className="space-y-4">
              <TextField id="login-email" label="Email Address" type="email" required />
              <TextField id="login-password" label="Password" type="password" required />
              <button type="submit" className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black text-lg hover:brightness-110 shadow-lg shadow-pink-100 transition-all">
                Sign In
              </button>
            </form>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <button onClick={() => { setIsAuthenticated(true); setIsGuest(true); }} className="w-full border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-user-clock text-gray-400"></i> Continue as Guest
            </button>
            <div className="text-center pt-4 border-t space-y-2">
              <p className="text-sm text-gray-500 font-medium">New athlete? <button onClick={() => setAuthView('register')} className="font-black text-tlp-pink hover:underline">Create Account</button></p>
              <div className="pt-8"><button onClick={() => setAuthView('admin')} className="text-xs font-bold text-gray-400 hover:text-tlp-pink uppercase tracking-widest">Admin Portal</button></div>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-50 text-tlp-pink rounded-3xl mb-4 shadow-inner">
                <i className="fas fa-user-shield text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">COACH ACCESS</h2>
              <p className="text-gray-500 mt-2 font-medium">Authorize TLP Coaching Terminal</p>
            </div>
            <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-4">
              <TextField id="admin-id" label="Coach ID" required />
              <TextField id="admin-password" label="Security Key" type="password" required />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-black shadow-lg transition-all">
                Authorize Session
              </button>
              <button type="button" onClick={() => setAuthView('login')} className="w-full text-gray-500 font-bold py-2 hover:text-tlp-pink transition">Back to Player Site</button>
            </form>
          </div>
        );
      case 'register':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8"><h2 className="text-3xl font-black text-gray-800 tracking-tight">JOIN TLP ELITE</h2></div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><TextField id="reg-first" label="First Name" required /><TextField id="reg-last" label="Last Name" required /></div>
              <TextField id="reg-email" label="Email Address" type="email" required />
              <button type="submit" className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black text-lg hover:brightness-110 shadow-lg transition-all">Sign Up</button>
              <button type="button" onClick={() => setAuthView('login')} className="w-full text-gray-500 font-bold py-2">Return to Login</button>
            </form>
          </div>
        );
      case 'forgot':
        return (
          <div className="space-y-6 text-center">
             <h2 className="text-3xl font-black text-gray-800">RESET ACCESS</h2>
             <TextField id="reset-email" label="Email Address" type="email" required />
             <button onClick={() => setAuthView('login')} className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black">Send Recovery Link</button>
             <button onClick={() => setAuthView('login')} className="text-gray-500 font-bold py-2">Cancel</button>
          </div>
        );
    }
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tlp-pink rounded-3xl p-6 text-white shadow-xl shadow-pink-100">
          <p className="text-pink-100 text-xs font-bold uppercase tracking-widest mb-1">Total Pro-Turns</p>
          <h3 className="text-4xl font-black">124</h3>
          <p className="text-pink-200 text-sm mt-2"><i className="fas fa-arrow-up mr-1"></i> +12% this month</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-tlp-pink transition" onClick={() => setAdminTab('players')}>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Athletes</p>
          <h3 className="text-4xl font-black text-gray-800">{adminData.players.length}</h3>
          <p className="text-green-500 text-sm mt-2 font-bold tracking-tight"><i className="fas fa-check-circle mr-1"></i> Manage Roster</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Session Volume</p>
          <h3 className="text-4xl font-black text-gray-800">82%</h3>
          <p className="text-gray-400 text-sm mt-2">Facility utilization</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Today's Elite Lineup</h3>
          <button className="text-tlp-pink text-sm font-black hover:underline">View Master Calendar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Athlete</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Time</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Training Type</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Authorization</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminData.todaySessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-4 font-bold text-gray-800">{session.player}</td>
                  <td className="px-8 py-4 text-gray-600">{session.time}</td>
                  <td className="px-8 py-4"><span className="px-3 py-1 bg-pink-50 text-tlp-pink rounded-full text-[10px] font-black uppercase">{session.lesson}</span></td>
                  <td className="px-8 py-4">
                    <span className={`flex items-center gap-2 text-[10px] font-black uppercase ${session.status === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${session.status === 'Confirmed' ? 'bg-green-600' : 'bg-orange-500'}`}></span>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button className="w-8 h-8 text-gray-400 hover:text-tlp-pink"><i className="fas fa-ellipsis-v"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAdminPlayers = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Athlete Roster</h2>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Filter by name..." 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-tlp-pink transition-all w-full md:w-64"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
          <button className="bg-tlp-pink text-white px-4 py-2 rounded-xl text-sm font-black hover:brightness-110 transition uppercase tracking-tighter">
            Add Prospect
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Athlete Profile</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Curriculum History</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Emergency Contact</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminData.players.map(player => (
                <tr key={player.id} className="hover:bg-gray-50/50 transition align-top">
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-tlp-pink/10 rounded-full flex items-center justify-center font-black text-tlp-pink shrink-0 italic">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{player.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Age {player.age} • Class of 2028</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-lg font-black text-gray-800 leading-none">{player.sessions}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">PRO TURNS</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {Array.from(new Set(player.history)).map((lesson, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase tracking-tight">
                          {lesson}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-700">{player.parent.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                        <i className="fas fa-phone text-[8px]"></i> {player.parent.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => openPlayerProfile(player)}
                      className="px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-black text-gray-600 hover:border-tlp-pink hover:text-tlp-pink transition uppercase tracking-tighter"
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlayerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase">Select Your Discipline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPORTS_OPTIONS.map(option => (
                <button key={option.id} onClick={() => { updateBooking({ sport: option.id as Sport }); nextStep(); }}
                  className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${booking.sport === option.id ? 'border-tlp-pink bg-pink-50 shadow-inner' : 'border-gray-100 hover:border-pink-200 hover:bg-gray-50'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl ${option.id === 'baseball' ? 'bg-slate-900' : 'bg-tlp-pink'} shadow-lg shadow-gray-200`}>
                    <i className={`fas ${option.icon}`}></i>
                  </div>
                  <span className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase">Choose Curriculum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LESSONS.map(lesson => (
                <button key={lesson.id} onClick={() => { updateBooking({ lessonType: lesson.id as LessonType }); nextStep(); }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${booking.lessonType === lesson.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200 hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-tlp-pink text-xl"><i className={`fas ${lesson.icon}`}></i></div>
                    <span className="text-lg font-black text-tlp-pink">{lesson.price}</span>
                  </div>
                  <h3 className="font-black text-gray-800 mb-1 uppercase tracking-tight">{lesson.label}</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{lesson.description}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase">Lock In Training Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FACILITY CALENDAR</p><TextField id="booking-date" label="Training Date" type="date" min={getTodayString()} value={booking.date || ''} onChange={(e) => updateBooking({ date: e.target.value })} /></div>
              <div className={!booking.date ? 'opacity-50 pointer-events-none' : ''}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PRO SLOTS AVAILABLE</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} disabled={!booking.date} onClick={() => updateBooking({ time: slot })} className={`py-3 text-[10px] font-black rounded-xl border-2 transition-all ${booking.time === slot ? 'bg-tlp-pink text-white border-tlp-pink shadow-md' : 'bg-white text-gray-600 border-slate-100 hover:border-tlp-pink'}`}>{slot}</button>
                  ))}
                </div>
              </div>
            </div>
            {booking.date && booking.time && <div className="text-center animate-bounce mt-4"><button onClick={nextStep} className="bg-tlp-pink text-white px-8 py-3 rounded-full font-black uppercase tracking-tighter hover:brightness-110 shadow-lg shadow-pink-100">Continue to Athlete Profile</button></div>}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase">Final Authorization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-black text-sm text-gray-400 border-b pb-2 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-id-card text-tlp-pink"></i> Athlete Bio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <TextField id="p-first" label="First Name" value={booking.playerInfo.firstName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, firstName: e.target.value }})} />
                  <TextField id="p-last" label="Last Name" value={booking.playerInfo.lastName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, lastName: e.target.value }})} />
                </div>
                <TextField id="p-email" label="Parent/Guardian Email" type="email" value={booking.playerInfo.parentEmail} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentEmail: e.target.value }})} />
                <TextField id="p-phone" label="Contact Phone" type="tel" value={booking.playerInfo.parentPhone} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentPhone: e.target.value }})} />
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                  <h3 className="font-black text-sm text-pink-400 mb-4 uppercase tracking-widest flex items-center gap-2">Training Summary</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500 uppercase font-black">Discipline</span><span className="font-black uppercase italic">{booking.sport}</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500 uppercase font-black">Level</span><span className="font-black uppercase">{LESSONS.find(l => l.id === booking.lessonType)?.label}</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500 uppercase font-black">Slot</span><span className="font-black">{booking.date} @ {booking.time}</span></div>
                    <div className="flex justify-between pt-2"><span className="text-pink-400 uppercase font-black">Total</span><span className="font-black text-lg">{LESSONS.find(l => l.id === booking.lessonType)?.price}</span></div>
                  </div>
                </div>
                <button onClick={() => alert('Elite Training Authorized! Get ready to Train Like A Pro.')} className="w-full bg-tlp-pink text-white py-4 rounded-2xl font-black text-lg hover:brightness-110 shadow-xl shadow-pink-200 transition-all uppercase tracking-tighter italic">Confirm & Authorize</button>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderPlayerDrawer = () => {
    if (!selectedPlayer) return null;
    return (
      <>
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white z-[101] shadow-2xl transition-transform duration-500 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-xl font-black tracking-widest uppercase">Prospect Inspect</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-white transition"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 bg-slate-50/30">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 bg-tlp-pink rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-pink-100 italic">
                  {selectedPlayer.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase leading-none">{selectedPlayer.name}</h2>
                  <p className="text-tlp-pink font-black uppercase tracking-[0.2em] text-[10px] mt-2">TLP PREMIER ATHLETE</p>
                  <div className="flex gap-4 mt-4">
                    <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Age</p>
                      <p className="font-black text-gray-800 text-lg">{selectedPlayer.age}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Turns</p>
                      <p className="font-black text-tlp-pink text-lg">{selectedPlayer.sessions}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Parent / Emergency Bio</h4>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-tlp-pink"><i className="fas fa-user-shield"></i></div>
                      <p className="font-black text-gray-700 text-sm">{selectedPlayer.parent.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><i className="fas fa-envelope"></i></div>
                      <p className="font-bold text-gray-600 text-xs">{selectedPlayer.parent.email}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Training Syllabus History</h4>
                  <div className="space-y-2">
                    {selectedPlayer.history.map((lesson: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-50 rounded-xl hover:border-tlp-pink/30 transition">
                        <span className="font-black text-gray-700 text-xs uppercase italic tracking-tighter">{lesson}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase">LVL 1</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 border-t bg-white flex gap-3">
              <button className="flex-grow bg-tlp-pink text-white py-4 rounded-xl font-black uppercase italic tracking-tighter hover:brightness-110 shadow-lg shadow-pink-50 transition">
                Assign New Training
              </button>
              <button className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-tlp-pink transition"><i className="fas fa-ellipsis-h"></i></button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const AdminSidebar = () => (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col z-40">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <TLPLogo size="sm" />
        <h1 className="text-lg font-black text-white tracking-tight italic">TLP<span className="text-tlp-pink"> TERMINAL</span></h1>
      </div>
      
      <div className="flex-grow py-8 px-4 space-y-2">
        <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">COACH DASHBOARD</p>
        
        <button onClick={() => setAdminTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === 'dashboard' ? 'bg-tlp-pink text-white shadow-lg shadow-pink-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <i className="fas fa-chart-line w-5"></i>
          <span>Analytics</span>
        </button>

        <button onClick={() => setAdminTab('players')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === 'players' ? 'bg-tlp-pink text-white shadow-lg shadow-pink-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <i className="fas fa-user-graduate w-5"></i>
          <span>Roster</span>
        </button>

        <button onClick={() => setAdminTab('schedule')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === 'schedule' ? 'bg-tlp-pink text-white shadow-lg shadow-pink-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <i className="fas fa-calendar-check w-5"></i>
          <span>Schedule</span>
        </button>
      </div>

      <div className="p-6 border-t border-slate-800 space-y-4">
        <div className="px-4 py-3 bg-slate-800/50 rounded-2xl border border-slate-700">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">COACH ID</p>
          <p className="text-xs font-black text-white italic">TLP_MASTER_01</p>
        </div>
        <button onClick={handleBackToLogin} className="w-full flex items-center gap-4 px-4 py-2 font-black text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest">
          <i className="fas fa-sign-out-alt"></i>
          <span>Exit Terminal</span>
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
          <TLPLogo size="xl" />
        </div>
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10 animate-fade-in">
          {renderAuth()}
        </div>
        <div className="mt-8 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-sm">
          ELITE TRAINING INFRASTRUCTURE BY TRAIN LIKE PROS LLC
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />
        <div className="flex-grow flex flex-col h-screen overflow-hidden">
          <header className="bg-white/90 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center z-30">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] italic">{adminTab} view</h2>
            <div className="flex items-center gap-4">
              <span className="bg-tlp-pink text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full italic">LIVE_FEED</span>
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-tlp-pink font-black italic shadow-lg">TLP</div>
            </div>
          </header>
          <main className="flex-grow overflow-y-auto p-8 bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
              {adminTab === 'dashboard' && renderAdminDashboard()}
              {adminTab === 'players' && renderAdminPlayers()}
              {adminTab === 'schedule' && (
                <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-100">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 text-3xl"><i className="fas fa-calendar-alt"></i></div>
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Master Calendar</h3>
                  <p className="text-gray-400 mt-3 font-medium max-w-sm mx-auto">Drag-and-drop scheduling engine is initializing. Training slots are currently managed via Dashboard Analytics.</p>
                </div>
              )}
            </div>
          </main>
        </div>
        {renderPlayerDrawer()}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setStep(1)}>
            <TLPLogo size="sm" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight italic hidden sm:block">TRAIN LIKE <span className="text-tlp-pink">PROS</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleBackToLogin} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-tlp-pink hover:bg-pink-50 transition shadow-sm" title="Exit">
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-12">
        <div className="mb-16 flex justify-between relative max-w-4xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-tlp-pink -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step-1) * 33.33}%` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black transition-all duration-500 shadow-xl ${step === s ? 'bg-tlp-pink text-white scale-125 ring-8 ring-pink-50' : step > s ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                {step > s ? <i className="fas fa-check"></i> : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === s ? 'text-tlp-pink' : 'text-slate-400'}`}>
                {s === 1 ? 'DISCIPLINE' : s === 2 ? 'LEVEL' : s === 3 ? 'CALENDAR' : 'FINISH'}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
           <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-50 p-10 min-h-[550px] animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-tlp-pink opacity-[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
              {renderPlayerSteps()}
              <div className="mt-12 flex justify-between items-center border-t border-slate-50 pt-8">
                {step > 1 ? <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-tlp-pink transition"><i className="fas fa-chevron-left"></i> Previous Stage</button> : <div />}
                <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">PRO_SESSION_FLOW_{step}/4</div>
              </div>
           </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 mt-16 text-center">
        <div className="w-12 h-1 bg-slate-100 mx-auto mb-6 rounded-full"></div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">&copy; 2024 TRAIN LIKE PROS LLC. ALL RIGHTS RESERVED. ELITE CURRICULUM CERTIFIED.</p>
      </footer>
    </div>
  );
};

export default App;
