import React, { useState, useRef } from 'react';
import { BookingState, Sport, LessonType } from './types';
import { SPORTS_OPTIONS, LESSONS, TIME_SLOTS } from './constants';
import { getTrainingAdvice } from './services/geminiService';

type AuthView = 'login' | 'register' | 'forgot' | 'admin';
type AdminTab = 'dashboard' | 'players' | 'schedule';

/**
 * Logo component that uses the provided PNG logo.
 */
const TLPLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const heightClass = size === 'sm' ? 'h-10' : size === 'md' ? 'h-16' : size === 'lg' ? 'h-28' : 'h-40';
  const logoUrl = "https://drive.google.com/uc?export=view&id=1dwJCUL8BFnagGDjDPb42cdvkeqvxi02S";
  
  return (
    <div className={`${heightClass} flex items-center justify-center`}>
      <img 
        src={logoUrl} 
        alt="Train Like Pros" 
        className="h-full w-auto object-contain block drop-shadow-md"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "logo.png";
        }}
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

  const triggerPicker = () => {
    if (isDate && inputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          inputRef.current.showPicker();
        } catch (err) {
          console.debug("showPicker failed", err);
        }
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
        onClick={triggerPicker}
        onFocus={isDate ? triggerPicker : undefined}
        className={`block px-4 pt-6 pb-2 w-full text-base text-gray-900 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-tlp-pink peer transition-colors ${
          isDate ? 'cursor-pointer date-input-field' : 'appearance-none'
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
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 peer-focus:text-tlp-pink transition-colors pt-2 z-10">
          <i className="fas fa-calendar-alt"></i>
        </div>
      )}
    </div>
  );
};

/**
 * Material 3 inspired Primary Tab component
 */
const M3Tab: React.FC<{
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}> = ({ active, label, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center flex-1 h-14 transition-all duration-200 ${
        active ? 'text-tlp-pink' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-0.5">
        <i className={`fas ${icon} text-lg`}></i>
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-tlp-pink rounded-t-full shadow-[0_-2px_6px_rgba(235,50,138,0.3)]"></div>
      )}
    </button>
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
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
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

  const fetchAdvice = async () => {
    if (booking.lessonType) {
      setLoadingAdvice(true);
      const profile = `Interested in ${booking.sport} ${booking.lessonType}. Player age is ${booking.playerInfo.age || 'unknown'}. Additional notes: ${booking.playerInfo.notes}`;
      const advice = await getTrainingAdvice(profile);
      setAiAdvice(advice || '');
      setLoadingAdvice(false);
    }
  };

  const nextStep = () => {
    if (step === 3) fetchAdvice();
    setStep(prev => Math.min(prev + 1, 4));
  };
  
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
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          <p className="text-pink-200 text-sm mt-2 font-bold"><i className="fas fa-arrow-up mr-1"></i> +12% this month</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-tlp-pink transition" onClick={() => setAdminTab('players')}>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Athletes</p>
          <h3 className="text-4xl font-black text-gray-800">{adminData.players.length}</h3>
          <p className="text-green-500 text-sm mt-2 font-bold tracking-tight"><i className="fas fa-check-circle mr-1"></i> Manage Roster</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Session Volume</p>
          <h3 className="text-4xl font-black text-gray-800">82%</h3>
          <p className="text-gray-400 text-sm mt-2 font-bold">Facility utilization</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-gray-800 tracking-tight italic">TODAY'S LINEUP</h3>
          <button className="text-tlp-pink text-xs font-black uppercase tracking-widest hover:underline">View Advanced Analytics</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Athlete</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Training Type</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorization</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminData.todaySessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-4 font-black text-gray-800">{session.player}</td>
                  <td className="px-8 py-4 text-gray-600 font-bold">{session.time}</td>
                  <td className="px-8 py-4"><span className="px-3 py-1 bg-pink-50 text-tlp-pink rounded-full text-[10px] font-black uppercase italic tracking-tighter">{session.lesson}</span></td>
                  <td className="px-8 py-4">
                    <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${session.status === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${session.status === 'Confirmed' ? 'bg-green-600' : 'bg-orange-500'}`}></span>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button className="w-8 h-8 text-gray-400 hover:text-tlp-pink transition"><i className="fas fa-ellipsis-v"></i></button>
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
        <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Athlete Roster</h2>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search prospects..." 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pl-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-tlp-pink transition-all w-full md:w-64"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-black transition uppercase tracking-widest">
            Add Athlete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Athlete Profile</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Turns</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curriculum History</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency Bio</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminData.players.map(player => (
                <tr key={player.id} className="hover:bg-gray-50/50 transition align-top">
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-tlp-pink text-white rounded-xl flex items-center justify-center font-black shrink-0 italic shadow-lg shadow-pink-100">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 leading-none">{player.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Age {player.age} • Premier Tier</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-xl font-black text-tlp-pink leading-none">{player.sessions}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">TOTAL SESSIONS</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {Array.from(new Set(player.history)).map((lesson, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tight italic">
                          {lesson}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-700">{player.parent.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold tracking-tight">
                        <i className="fas fa-phone-alt text-[8px]"></i> {player.parent.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => openPlayerProfile(player)}
                      className="px-4 py-2 border-2 border-slate-50 rounded-xl text-[10px] font-black text-gray-500 hover:border-tlp-pink hover:text-tlp-pink transition uppercase tracking-widest"
                    >
                      Inspect
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
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Select Your Discipline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPORTS_OPTIONS.map(option => (
                <button key={option.id} onClick={() => { updateBooking({ sport: option.id as Sport }); nextStep(); }}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 ${booking.sport === option.id ? 'border-tlp-pink bg-pink-50 shadow-inner' : 'border-gray-100 hover:border-pink-200 hover:bg-gray-50'}`}>
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl ${option.id === 'baseball' ? 'bg-slate-900' : 'bg-tlp-pink'} shadow-xl shadow-gray-200`}>
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
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Choose Curriculum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LESSONS.map(lesson => (
                <button key={lesson.id} onClick={() => { updateBooking({ lessonType: lesson.id as LessonType }); nextStep(); }}
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all ${booking.lessonType === lesson.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200 hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-tlp-pink text-xl"><i className={`fas ${lesson.icon}`}></i></div>
                    <span className="text-lg font-black text-tlp-pink">{lesson.price}</span>
                  </div>
                  <h3 className="font-black text-gray-800 mb-1 uppercase tracking-tight">{lesson.label}</h3>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">{lesson.description}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Pick Training Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">FACILITY CALENDAR</p>
                <TextField 
                  id="booking-date" 
                  label="Training Date" 
                  type="date" 
                  min={getTodayString()} 
                  value={booking.date || ''} 
                  onChange={(e) => updateBooking({ date: e.target.value })} 
                />
              </div>
              <div className={!booking.date ? 'opacity-50 pointer-events-none' : ''}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">AVAILABLE SESSIONS</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button 
                      key={slot} 
                      disabled={!booking.date} 
                      onClick={() => updateBooking({ time: slot })} 
                      className={`py-3 text-[10px] font-black rounded-xl border-2 transition-all ${booking.time === slot ? 'bg-tlp-pink text-white border-tlp-pink shadow-lg shadow-pink-100' : 'bg-white text-gray-600 border-slate-100 hover:border-tlp-pink'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {booking.date && booking.time && (
              <div className="text-center animate-bounce mt-4">
                <button 
                  onClick={nextStep} 
                  className="bg-tlp-pink text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-pink-200"
                >
                  Athlete Identification
                </button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Verify & Secure Training</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Athlete & Parent Profile Column */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-black text-[10px] text-gray-400 border-b pb-2 uppercase tracking-[0.3em] flex items-center gap-2"><i className="fas fa-id-card text-tlp-pink"></i> Athlete Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <TextField id="p-first" label="First Name" value={booking.playerInfo.firstName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, firstName: e.target.value }})} />
                    <TextField id="p-last" label="Last Name" value={booking.playerInfo.lastName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, lastName: e.target.value }})} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <TextField id="p-age" label="Age" type="number" value={booking.playerInfo.age} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, age: e.target.value }})} />
                    <div className="col-span-2">
                      <TextField id="p-parent-name" label="Parent/Guardian Name" value={booking.playerInfo.parentName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentName: e.target.value }})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextField id="p-email" label="Parent Email" type="email" value={booking.playerInfo.parentEmail} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentEmail: e.target.value }})} />
                    <TextField id="p-phone" label="Parent Phone" type="tel" value={booking.playerInfo.parentPhone} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentPhone: e.target.value }})} />
                  </div>
                  <TextField id="p-notes" label="Training Notes / Injuries" value={booking.playerInfo.notes} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, notes: e.target.value }})} />
                </div>
                
                {/* AI Advice Display */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1.5 shadow-sm">
                   <div className="flex items-center gap-2 text-blue-600">
                      <i className="fas fa-sparkles text-xs"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Training Pro-Tip</span>
                   </div>
                   {loadingAdvice ? (
                      <div className="h-10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div></div>
                   ) : (
                      <p className="text-[11px] text-blue-800 italic leading-tight font-medium">{aiAdvice || "Ready to upgrade your game? Complete authorization for a specialized drill."}</p>
                   )}
                </div>
              </div>

              {/* Payment & Summary Column */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-black text-[10px] text-gray-400 border-b pb-2 uppercase tracking-[0.3em] flex items-center gap-2"><i className="fas fa-credit-card text-tlp-pink"></i> Payment Information</h3>
                  <TextField id="card-num" label="Card Number" placeholder="0000 0000 0000 0000" />
                  <div className="grid grid-cols-2 gap-4">
                    <TextField id="card-exp" label="Expiry (MM/YY)" placeholder="MM / YY" />
                    <TextField id="card-cvv" label="CVV" placeholder="123" type="password" />
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-tlp-pink/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-tlp-pink/20 transition-all"></div>
                  <h3 className="font-black text-xs text-tlp-pink mb-8 uppercase tracking-[0.3em] flex items-center gap-2">Investment Summary</h3>
                  <div className="space-y-5 text-xs font-bold">
                    <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-500 uppercase tracking-widest text-[9px]">Sport Discipline</span><span className="uppercase italic">{booking.sport}</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-500 uppercase tracking-widest text-[9px]">Training Path</span><span className="uppercase">{LESSONS.find(l => l.id === booking.lessonType)?.label}</span></div>
                    <div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-500 uppercase tracking-widest text-[9px]">Confirmed Slot</span><span className="text-tlp-pink">{booking.date} @ {booking.time}</span></div>
                    <div className="flex justify-between items-end pt-6">
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest text-[8px] mb-1">Total Fee</p>
                        <span className="text-4xl font-black italic tracking-tighter text-white">{LESSONS.find(l => l.id === booking.lessonType)?.price}</span>
                      </div>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Pre-paid Securely</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Booking Authorized! Welcome to the Elite Roster. Check your email for facility entrance details.')} 
                  className="w-full bg-tlp-pink text-white py-5 rounded-2xl font-black text-lg hover:brightness-110 shadow-2xl shadow-pink-200 transition-all uppercase tracking-widest italic flex items-center justify-center gap-3"
                >
                  <i className="fas fa-lock text-sm"></i>
                  Complete Authorization
                </button>
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
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white z-[101] shadow-2xl transition-transform duration-500 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-lg font-black tracking-[0.4em] uppercase italic">Athlete dossier</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-white transition-all"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-10 bg-slate-50/20">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-28 h-28 bg-tlp-pink rounded-[3rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-pink-100 italic">
                  {selectedPlayer.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase leading-none italic">{selectedPlayer.name}</h2>
                  <p className="text-tlp-pink font-black uppercase tracking-[0.4em] text-[10px] mt-4">TLP elite ATHLETE</p>
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Age</p>
                      <p className="font-black text-gray-800 text-2xl">{selectedPlayer.age}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Turns</p>
                      <p className="font-black text-tlp-pink text-2xl">{selectedPlayer.sessions}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-6 border-b pb-2">Emergency Identification</h4>
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-tlp-pink shadow-inner"><i className="fas fa-shield-halved"></i></div>
                      <p className="font-black text-gray-800 uppercase italic tracking-tight">{selectedPlayer.parent.name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><i className="fas fa-phone-alt"></i></div>
                      <p className="font-black text-gray-600 text-sm tracking-tight">{selectedPlayer.parent.phone}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-6 border-b pb-2">Curriculum Progress</h4>
                  <div className="space-y-3">
                    {selectedPlayer.history.map((lesson: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-5 bg-white border border-slate-50 rounded-2xl hover:border-tlp-pink/40 transition-all group">
                        <span className="font-black text-gray-800 text-xs uppercase italic tracking-widest group-hover:text-tlp-pink">{lesson}</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300">#{selectedPlayer.history.length - idx}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="p-8 border-t bg-white flex gap-4">
              <button className="flex-grow bg-tlp-pink text-white py-5 rounded-2xl font-black uppercase italic tracking-[0.2em] hover:brightness-110 shadow-2xl shadow-pink-100 transition-all">
                Update training
              </button>
              <button className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><i className="fas fa-trash-alt"></i></button>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="mb-10 transform hover:scale-110 transition-all duration-700 cursor-pointer">
          <TLPLogo size="xl" />
        </div>
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 p-12 animate-fade-in relative overflow-hidden">
          {renderAuth()}
        </div>
        <div className="mt-12 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] max-w-sm leading-relaxed">
          ELITE TRAINING PLATFORM AUTHORIZED BY TRAIN LIKE PROS LLC. NO UNAUTHORIZED ACCESS.
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Admin Header */}
        <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center z-50 shadow-2xl">
          <div className="flex items-center gap-4">
            <TLPLogo size="sm" />
            <h1 className="text-xl font-black tracking-[0.2em] uppercase italic hidden sm:block">Coach <span className="text-tlp-pink">Terminal</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status</span>
              <span className="text-xs font-black text-green-500 uppercase tracking-widest italic">Live Feed Connected</span>
            </div>
            <button onClick={handleBackToLogin} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-tlp-pink hover:bg-pink-900/20 transition-all shadow-inner">
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-slate-100 flex px-8 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto w-full flex">
            <M3Tab 
              active={adminTab === 'dashboard'} 
              label="Dashboard" 
              icon="fa-chart-pie" 
              onClick={() => setAdminTab('dashboard')} 
            />
            <M3Tab 
              active={adminTab === 'players'} 
              label="Players" 
              icon="fa-user-graduate" 
              onClick={() => setAdminTab('players')} 
            />
            <M3Tab 
              active={adminTab === 'schedule'} 
              label="Schedule" 
              icon="fa-calendar-alt" 
              onClick={() => setAdminTab('schedule')} 
            />
          </div>
        </nav>

        {/* Main Admin Content */}
        <main className="flex-grow overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto">
            {adminTab === 'dashboard' && renderAdminDashboard()}
            {adminTab === 'players' && renderAdminPlayers()}
            {adminTab === 'schedule' && (
              <div className="bg-white rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-100 animate-fade-in">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200 text-5xl shadow-inner transition-transform hover:scale-110 duration-500"><i className="fas fa-calendar-check"></i></div>
                <h3 className="text-3xl font-black text-gray-800 uppercase tracking-widest italic">Facility Master Grid</h3>
                <p className="text-gray-400 mt-6 font-bold max-w-md mx-auto leading-relaxed">
                  Real-time facility grid is initializing. The terminal is synchronizing across all academy locations. Use Analytics for current session flow.
                </p>
                <div className="mt-12 h-1.5 w-48 bg-slate-100 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-tlp-pink w-1/3 animate-[loading_2s_infinite_linear]"></div>
                </div>
              </div>
            )}
          </div>
        </main>

        {renderPlayerDrawer()}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-white selection:bg-tlp-pink/20">
      <header className="bg-white border-b border-slate-50 sticky top-0 z-50 py-4 px-8 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 group cursor-pointer" onClick={() => setStep(1)}>
            <TLPLogo size="sm" />
            <div className="h-10 w-[2px] bg-slate-100 hidden sm:block"></div>
            <h1 className="text-xl font-black text-slate-900 tracking-[0.2em] italic hidden sm:block uppercase">TRAIN LIKE <span className="text-tlp-pink">PROS</span></h1>
          </div>
          <button onClick={handleBackToLogin} className="px-6 py-2.5 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-tlp-pink hover:bg-pink-50 transition-all border border-transparent hover:border-pink-100 shadow-sm italic">
            Terminate Session
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-16">
        <div className="mb-20 flex justify-between relative max-w-4xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-tlp-pink -translate-y-1/2 z-0 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(235,50,138,0.4)]" style={{ width: `${(step-1) * 33.33}%` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-4">
              <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black transition-all duration-700 shadow-2xl ${
                step === s ? 'bg-tlp-pink text-white scale-125 ring-8 ring-pink-50' : step > s ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'
              }`}>
                {step > s ? <i className="fas fa-check"></i> : s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${step === s ? 'text-tlp-pink' : 'text-slate-300'}`}>
                {s === 1 ? 'discipline' : s === 2 ? 'level' : s === 3 ? 'calendar' : 'verify'}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
           <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/60 border border-slate-50 p-12 min-h-[600px] animate-fade-in relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-80 h-80 bg-tlp-pink opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>
              {renderPlayerSteps()}
              <div className="mt-16 flex justify-between items-center border-t border-slate-50 pt-10">
                {step > 1 ? (
                  <button onClick={prevStep} className="flex items-center gap-3 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-tlp-pink transition-all group">
                    <i className="fas fa-chevron-left group-hover:-translate-x-1 transition-transform"></i> Return to previous
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-200 font-black tracking-widest">STEP_{step}/4</span>
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-tlp-pink transition-all duration-700" style={{ width: `${(step/4)*100}%` }}></div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-8 mt-24 text-center pb-12">
        <div className="w-16 h-1 bg-slate-100 mx-auto mb-10 rounded-full"></div>
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] leading-relaxed italic">
          &copy; 2024 TRAIN LIKE PROS LLC. PROFESSIONAL TRAINING INFRASTRUCTURE. ALL ATHLETE DATA SECURED VIA TLP COREALIGN.
        </p>
      </footer>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        /* CSS Hack to make the native date picker indicator cover the entire input */
        .date-input-field::-webkit-calendar-picker-indicator {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          cursor: pointer;
          opacity: 0;
          z-index: 20;
        }
      `}</style>
    </div>
  );
};

export default App;