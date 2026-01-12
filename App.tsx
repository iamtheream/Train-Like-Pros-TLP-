import React, { useState, useRef, useEffect } from 'react';
import { BookingState, Sport, LessonType } from './types.ts';
import { SPORTS_OPTIONS, LESSONS, TIME_SLOTS } from './constants.ts';
import { getTrainingAdvice } from './services/geminiService.ts';

type AuthView = 'login' | 'register' | 'forgot' | 'admin';
type AdminTab = 'dashboard' | 'players' | 'schedule' | 'staff';

/**
 * Storage Keys for our "Database"
 */
const STORAGE_KEYS = {
  PLAYERS: 'tlp_database_players',
  BOOKINGS: 'tlp_database_bookings',
  BLOCKED: 'tlp_database_blocked_slots',
  COACHES: 'tlp_database_coaches',
};

/**
 * Logo component that uses the provided PNG logo.
 */
const TLPLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; light?: boolean }> = ({ size = 'md', light = false }) => {
  const heightClass = size === 'sm' ? 'h-10' : size === 'md' ? 'h-16' : size === 'lg' ? 'h-24' : 'h-40';
  const logoUrl = "https://drive.google.com/uc?export=view&id=1dwJCUL8BFnagGDjDPb42cdvkeqvxi02S";
  
  return (
    <div className={`${heightClass} flex items-center justify-center ${light ? 'brightness-0 invert' : ''}`}>
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
 * Reusable Google Login Button
 */
const GoogleLoginButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    {label}
  </button>
);

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
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (onChange) onChange(e);
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
        onChange={handleInputChange}
        onClick={triggerPicker}
        onFocus={isDate ? triggerPicker : undefined}
        className={`block px-4 pt-6 pb-2 w-full text-base text-gray-900 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-tlp-pink peer transition-colors placeholder-transparent focus:placeholder-gray-400 ${
          isDate ? 'cursor-pointer date-input-field' : 'appearance-none'
        }`}
        placeholder={placeholder}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm duration-200 transform origin-[0] left-4 font-medium pointer-events-none transition-all
          ${isDate || internalValue !== '' 
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
 * Material 3 inspired Side Nav Item
 */
const M3SideNavItem: React.FC<{
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}> = ({ active, label, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group ${
        active 
          ? 'text-white bg-white/5' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-tlp-pink rounded-r-full shadow-[2px_0_8px_rgba(235,50,138,0.5)]"></div>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
        active ? 'bg-tlp-pink text-white shadow-lg shadow-pink-100/40' : 'bg-slate-800 text-slate-400'
      }`}>
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCoach, setActiveCoach] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [step, setStep] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Login form state
  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminLoginKey, setAdminLoginKey] = useState('');

  // Admin Schedule State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');

  // Admin Staff State
  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', role: '', idCode: '', securityKey: '' });

  // Persistent "Database" State
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [dbCoaches, setDbCoaches] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[] | boolean>>({});

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load initial data from localStorage
  useEffect(() => {
    const today = getTodayString();
    setSelectedCalendarDate(today);

    try {
      const storedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      const storedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED);
      const storedCoaches = localStorage.getItem(STORAGE_KEYS.COACHES);
      
      if (storedPlayers) setDbPlayers(JSON.parse(storedPlayers));
      if (storedBookings) setDbBookings(JSON.parse(storedBookings));
      if (storedBlocked) setBlockedSlots(JSON.parse(storedBlocked));
      
      if (storedCoaches) {
        setDbCoaches(JSON.parse(storedCoaches));
      } else {
        const initialCoaches = [
          { id: 'c1', name: 'Rodriguez', role: 'Facility Director', idCode: 'COACH1', securityKey: 'admin123' }
        ];
        setDbCoaches(initialCoaches);
        localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(initialCoaches));
      }

      if (!storedPlayers) {
        const initialPlayers = [
          { id: 'p1', name: 'Alex Rodriguez', age: 14, sessions: 12, history: ['Hitting', 'Fielding'], parent: { name: 'Enrique Rodriguez', email: 'enrique.r@email.com', phone: '(555) 123-4567' } },
          { id: 'p2', name: 'Babe Ruth', age: 12, sessions: 8, history: ['Pitching'], parent: { name: 'George Ruth Sr.', email: 'george.ruth@email.com', phone: '(555) 987-6543' } }
        ];
        setDbPlayers(initialPlayers);
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(initialPlayers));
      }

      if (!storedBookings) {
        const initialBookings = [
          { id: 1, player: 'Alex Rodriguez', time: '09:00 AM', date: '2024-05-20', lesson: 'Hitting', status: 'Confirmed' }
        ];
        setDbBookings(initialBookings);
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings));
      }
    } catch (e) {
      console.error("Critical: Failed to load persistent data", e);
    }
  }, []);
  
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

  const handleCompleteAuthorization = () => {
    const fullName = `${booking.playerInfo.firstName} ${booking.playerInfo.lastName}`;
    const newId = `p_${Date.now()}`;
    
    // Check if player exists
    const existingPlayerIndex = dbPlayers.findIndex(p => p.name.toLowerCase() === fullName.toLowerCase());
    
    let updatedPlayers = [...dbPlayers];
    if (existingPlayerIndex >= 0) {
      updatedPlayers[existingPlayerIndex] = {
        ...updatedPlayers[existingPlayerIndex],
        sessions: updatedPlayers[existingPlayerIndex].sessions + 1,
        history: [...updatedPlayers[existingPlayerIndex].history, LESSONS.find(l => l.id === booking.lessonType)?.label || 'Training']
      };
    } else {
      updatedPlayers.push({
        id: newId,
        name: fullName,
        age: parseInt(booking.playerInfo.age),
        sessions: 1,
        history: [LESSONS.find(l => l.id === booking.lessonType)?.label || 'Training'],
        parent: {
          name: booking.playerInfo.parentName,
          email: booking.playerInfo.parentEmail,
          phone: booking.playerInfo.parentPhone
        }
      });
    }

    const newBooking = {
      id: Date.now(),
      player: fullName,
      time: booking.time,
      date: booking.date,
      lesson: LESSONS.find(l => l.id === booking.lessonType)?.label || 'Training',
      status: 'Confirmed'
    };

    const updatedBookings = [...dbBookings, newBooking];

    setDbPlayers(updatedPlayers);
    setDbBookings(updatedBookings);
    
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));

    alert('Booking Authorized! Welcome to the Elite Roster. Your athlete profile has been synchronized.');
    setStep(1);
    setBooking({
      sport: null,
      lessonType: null,
      date: null,
      time: null,
      playerInfo: { firstName: '', lastName: '', age: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }
    });
  };

  const toggleBlockedDay = (date: string) => {
    const updated = { ...blockedSlots };
    if (updated[date] === true) {
      delete updated[date];
    } else {
      updated[date] = true;
    }
    setBlockedSlots(updated);
    localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify(updated));
  };

  const toggleBlockedSlot = (date: string, slot: string) => {
    const updated = { ...blockedSlots };
    const current = updated[date];
    
    if (current === true) return; 

    if (!current || !Array.isArray(current)) {
      updated[date] = [slot];
    } else {
      if (current.includes(slot)) {
        const filtered = current.filter(s => s !== slot);
        if (filtered.length === 0) {
          delete updated[date];
        } else {
          updated[date] = filtered;
        }
      } else {
        updated[date] = [...current, slot];
      }
    }
    setBlockedSlots(updated);
    localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify(updated));
  };

  const handleLogin = (e: React.FormEvent, type: 'user' | 'admin' = 'user') => {
    e.preventDefault();
    if (type === 'admin') {
      const cleanId = adminLoginId.trim().toUpperCase();
      const cleanKey = adminLoginKey.trim();

      const coach = dbCoaches.find(c => 
        c.idCode.trim().toUpperCase() === cleanId && 
        c.securityKey.trim() === cleanKey
      );
      
      if (coach) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setActiveCoach(coach);
        setIsGuest(false);
        setAdminLoginId('');
        setAdminLoginKey('');
      } else {
        alert('Access Denied. Please verify your Coach ID and Security Key. Check for typos or extra spaces.');
      }
    } else {
      setIsAuthenticated(true);
      setIsAdmin(false);
      setIsGuest(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsAuthenticated(true);
    setIsAdmin(false);
    setIsGuest(false);
  };

  const handleBackToLogin = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setActiveCoach(null);
    setIsGuest(false);
    setAuthView('login');
    setAdminTab('dashboard');
    setIsDrawerOpen(false);
    setIsAccountOpen(false);
    setStep(1); 
  };

  const getAvailableTimeSlots = () => {
    if (!booking.date) return [];
    if (blockedSlots[booking.date] === true) return [];

    const dateObj = new Date(booking.date + 'T00:00:00');
    const day = dateObj.getDay();
    const isWeekend = day === 0 || day === 6;
    const isSmallGroup = booking.lessonType === 'small-group';

    let defaultSlots = [];
    if (isWeekend) {
      defaultSlots = ['01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'];
    } else {
      if (isSmallGroup) {
        defaultSlots = ['04:30 PM', '06:30 PM'];
      } else {
        defaultSlots = ['01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
      }
    }

    const dayBlockedSlots = blockedSlots[booking.date];
    if (Array.isArray(dayBlockedSlots)) {
      defaultSlots = defaultSlots.filter(s => !dayBlockedSlots.includes(s));
    }

    return defaultSlots;
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
            <div className="text-left mb-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase italic">TRAIN LIKE PROS</h2>
              <p className="text-gray-500 mt-3 font-medium text-lg">Log in to your elite member portal</p>
            </div>
            <form onSubmit={(e) => handleLogin(e, 'user')} className="space-y-5">
              <TextField id="login-email" label="Email Address" type="email" required />
              <TextField id="login-password" label="Password" type="password" required />
              <button type="submit" className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black text-lg hover:brightness-110 shadow-lg shadow-pink-100 transition-all uppercase tracking-widest italic">
                Sign In
              </button>
            </form>
            <div className="pt-2">
              <GoogleLoginButton label="Continue with Google" onClick={handleGoogleLogin} />
            </div>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>
            <button onClick={() => { setIsAuthenticated(true); setIsGuest(true); }} className="w-full border-2 border-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-user-clock text-gray-300"></i> Continue as Guest
            </button>
            <div className="text-left pt-6 border-t border-gray-100 space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 font-medium">New athlete? <button onClick={() => setAuthView('register')} className="font-black text-tlp-pink hover:underline uppercase tracking-tight">Create Account</button></p>
                <button onClick={() => setAuthView('admin')} className="w-fit text-[11px] font-black text-slate-400 hover:text-tlp-pink uppercase tracking-[0.25em] transition-colors flex items-center gap-2">
                   <i className="fas fa-user-shield"></i> Coach Terminal Entry
                </button>
              </div>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="text-left mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-50 text-tlp-pink rounded-3xl mb-6 shadow-inner">
                <i className="fas fa-user-shield text-2xl"></i>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase italic">COACH ACCESS</h2>
              <p className="text-gray-500 mt-3 font-medium text-lg">Authorize TLP Coaching Terminal</p>
            </div>
            <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-5">
              <TextField 
                id="admin-id" 
                label="Coach ID" 
                required 
                value={adminLoginId} 
                onChange={(e) => setAdminLoginId(e.target.value)} 
              />
              <TextField 
                id="admin-password" 
                label="Security Key" 
                type="password" 
                required 
                value={adminLoginKey} 
                onChange={(e) => setAdminLoginKey(e.target.value)} 
              />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-black shadow-lg transition-all uppercase tracking-widest italic">
                Authorize Session
              </button>
              <button type="button" onClick={() => setAuthView('login')} className="w-full text-slate-500 font-black py-2 hover:text-tlp-pink transition text-xs uppercase tracking-[0.2em] text-left flex items-center gap-2">
                <i className="fas fa-arrow-left"></i> Back to Player Site
              </button>
            </form>
            <div className="text-left mt-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                 <i className="fas fa-info-circle text-slate-400 text-[10px]"></i>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Development Access</p>
               </div>
               <p className="text-[11px] text-slate-600 font-bold uppercase tracking-tight">ID: COACH1 • Key: admin123</p>
            </div>
          </div>
        );
      case 'register':
        return (
          <div className="space-y-6">
            <div className="text-left mb-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase italic">JOIN TLP ELITE</h2>
              <p className="text-gray-500 mt-3 font-medium text-lg">Start your professional training path</p>
            </div>
            <div className="space-y-5">
              <GoogleLoginButton label="Sign up with Google" onClick={handleGoogleLogin} />
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">OR MANUAL ENTRY</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="grid grid-cols-2 gap-4"><TextField id="reg-first" label="First Name" required /><TextField id="reg-last" label="Last Name" required /></div>
                <TextField id="reg-email" label="Email Address" type="email" required />
                <button type="submit" className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black text-lg hover:brightness-110 shadow-lg transition-all uppercase tracking-widest italic">Sign Up</button>
                <button type="button" onClick={() => setAuthView('login')} className="w-full text-slate-500 font-black py-2 text-xs uppercase tracking-widest text-left hover:text-tlp-pink transition">Return to Login</button>
              </form>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tlp-pink rounded-3xl p-6 text-white shadow-xl shadow-pink-100">
          <p className="text-pink-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Pro-Turns</p>
          <h3 className="text-4xl font-black">{dbPlayers.reduce((acc, p) => acc + p.sessions, 0)}</h3>
          <p className="text-pink-200 text-sm mt-2 font-bold"><i className="fas fa-arrow-up mr-1"></i> Lifetime activity</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-tlp-pink transition" onClick={() => setAdminTab('players')}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Athletes</p>
          <h3 className="text-4xl font-black text-gray-800">{dbPlayers.length}</h3>
          <p className="text-green-500 text-sm mt-2 font-bold tracking-tight"><i className="fas fa-check-circle mr-1"></i> Manage Roster</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Session Volume</p>
          <h3 className="text-4xl font-black text-gray-800">{dbBookings.filter(b => b.date === getTodayString()).length}</h3>
          <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest text-[10px]">Active Today</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-gray-800 tracking-tight italic">RECENT ACTIVITY</h3>
          <button className="text-tlp-pink text-xs font-black uppercase tracking-widest hover:underline">Advanced Analytics</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Athlete</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Date / Time</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Curriculum</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Authorization</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbBookings.slice().reverse().slice(0, 5).map(session => (
                <tr key={session.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-4 font-black text-gray-800">{session.player}</td>
                  <td className="px-8 py-4 text-gray-600 font-bold text-xs">{session.date} @ {session.time}</td>
                  <td className="px-8 py-4"><span className="px-3 py-1 bg-pink-50 text-tlp-pink rounded-full text-[10px] font-black uppercase italic tracking-tighter">{session.lesson}</span></td>
                  <td className="px-8 py-4">
                    <span className={`flex items-center gap-2 text-slate-500 font-black uppercase tracking-wider text-[10px] ${session.status === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>
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
            <input type="text" placeholder="Search prospects..." className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pl-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-tlp-pink transition-all w-full md:w-64" />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Athlete Profile</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Turns</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Curriculum History</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Emergency Bio</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbPlayers.map(player => (
                <tr key={player.id} className="hover:bg-gray-50/50 transition align-top">
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-tlp-pink text-white rounded-xl flex items-center justify-center font-black shrink-0 italic shadow-lg shadow-pink-100">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 leading-none">{player.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight mt-1">Age {player.age} • Premier Tier</p>
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
                      {Array.from(new Set(player.history)).map((lesson: any, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tight italic">
                          {lesson}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-700">{player.parent.name}</p>
                      <div className="flex items-center gap-2 text-slate-500 font-bold tracking-tight text-[10px]">
                        <i className="fas fa-phone-alt text-[8px]"></i> {player.parent.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => openPlayerProfile(player)} className="px-4 py-2 border-2 border-slate-50 rounded-xl text-slate-500 font-black text-[10px] hover:border-tlp-pink hover:text-tlp-pink transition uppercase tracking-widest">
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

  const renderAdminSchedule = () => {
    const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();
    const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });
    const year = currentCalendarDate.getFullYear();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-32 border-slate-50 border bg-slate-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedCalendarDate === dateStr;
      const isBlocked = blockedSlots[dateStr] === true;
      const hasPartiallyBlocked = Array.isArray(blockedSlots[dateStr]);
      const dailyBookings = dbBookings.filter(b => b.date === dateStr);

      calendarDays.push(
        <div 
          key={d} 
          onClick={() => setSelectedCalendarDate(dateStr)}
          className={`h-32 border border-slate-100 p-3 cursor-pointer transition-all relative group
            ${isSelected ? 'ring-2 ring-inset ring-tlp-pink bg-pink-50/20' : 'hover:bg-slate-50'}
            ${isBlocked ? 'bg-red-50/30' : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-black ${isSelected ? 'text-tlp-pink' : 'text-slate-900'}`}>{d}</span>
            {isBlocked && <span className="text-[8px] bg-red-500 text-white px-1 rounded font-black uppercase tracking-tighter">OFF</span>}
            {hasPartiallyBlocked && <span className="text-[8px] bg-orange-400 text-white px-1 rounded font-black uppercase tracking-tighter">LIMITED</span>}
          </div>
          <div className="mt-2 space-y-1">
            {dailyBookings.slice(0, 2).map(b => (
              <div key={b.id} className="text-[9px] font-black text-slate-600 truncate bg-white border border-slate-100 rounded px-1 flex items-center gap-1 uppercase italic">
                <span className="w-1 h-1 rounded-full bg-tlp-pink"></span> {b.player.split(' ')[0]}
              </div>
            ))}
            {dailyBookings.length > 2 && <div className="text-[8px] text-slate-400 font-black">+ {dailyBookings.length - 2} more</div>}
          </div>
        </div>
      );
    }

    const selectedDateBookings = dbBookings.filter(b => b.date === selectedCalendarDate);
    const isSelectedDateBlocked = blockedSlots[selectedCalendarDate] === true;

    return (
      <div className="space-y-8 animate-fade-in pb-20">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-grow">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">{monthName} {year}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() - 1))} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-400 border border-transparent hover:border-slate-100 transition-all"><i className="fas fa-chevron-left"></i></button>
                  <button onClick={() => setCurrentCalendarDate(new Date())} className="px-3 h-8 rounded-lg hover:bg-white text-[9px] font-black uppercase tracking-widest text-slate-500 border border-transparent hover:border-slate-100 transition-all">Today</button>
                  <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() + 1))} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-400 border border-transparent hover:border-slate-100 transition-all"><i className="fas fa-chevron-right"></i></button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center py-4 bg-slate-50/30 border-b border-slate-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays}
            </div>
          </div>

          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/20 p-8">
            <div className="mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Selected Date</p>
              <h4 className="text-2xl font-black text-slate-900 italic uppercase leading-none">{selectedCalendarDate}</h4>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex justify-between items-center mb-6">
                   <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-tlp-pink pb-1 italic">Availability</h5>
                   <button 
                     onClick={() => toggleBlockedDay(selectedCalendarDate)}
                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                        ${isSelectedDateBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}
                     `}
                   >
                     {isSelectedDateBlocked ? 'Unlock Day' : 'Block Entire Day'}
                   </button>
                </div>

                {!isSelectedDateBlocked && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {TIME_SLOTS.map(slot => {
                      const dayBlocked = blockedSlots[selectedCalendarDate];
                      const isSlotBlocked = Array.isArray(dayBlocked) && dayBlocked.includes(slot);
                      const isSlotBooked = selectedDateBookings.some(b => b.time === slot);
                      return (
                        <div key={slot} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">{slot}</span>
                            {isSlotBooked && <span className="text-[8px] text-tlp-pink font-black uppercase">Booked</span>}
                          </div>
                          <button 
                            disabled={isSlotBooked}
                            onClick={() => toggleBlockedSlot(selectedCalendarDate, slot)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSlotBlocked ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400'} ${isSlotBooked ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            <i className={`fas ${isSlotBlocked ? 'fa-ban' : 'fa-circle-check'}`}></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminStaff = () => {
    const handleAddCoach = (e: React.FormEvent) => {
      e.preventDefault();
      const updated = [...dbCoaches, { ...newCoach, id: `c_${Date.now()}` }];
      setDbCoaches(updated);
      localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(updated));
      setIsAddingCoach(false);
      setNewCoach({ name: '', role: '', idCode: '', securityKey: '' });
    };

    const handleRemoveCoach = (id: string) => {
      if (dbCoaches.length <= 1) {
        alert("At least one terminal administrator is required.");
        return;
      }
      if (confirm("Revoke access for this individual?")) {
        const updated = dbCoaches.filter(c => c.id !== id);
        setDbCoaches(updated);
        localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(updated));
      }
    };

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Coaching Staff</h2>
          </div>
          <button 
            onClick={() => setIsAddingCoach(true)}
            className="bg-tlp-pink text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest"
          >
            Onboard Coach
          </button>
        </div>

        {isAddingCoach && (
          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-tlp-pink shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 italic">New Personnel Authorization</h3>
            <form onSubmit={handleAddCoach} className="space-y-6">
              <TextField id="coach-name" label="Legal Name" value={newCoach.name} onChange={e => setNewCoach({...newCoach, name: e.target.value})} required />
              <TextField id="coach-role" label="Staff Role" value={newCoach.role} onChange={e => setNewCoach({...newCoach, role: e.target.value})} required />
              <div className="grid grid-cols-2 gap-6">
                <TextField id="coach-id" label="Coach Access ID" value={newCoach.idCode} onChange={e => setNewCoach({...newCoach, idCode: e.target.value})} required />
                <TextField id="coach-key" label="Security Key" type="password" value={newCoach.securityKey} onChange={e => setNewCoach({...newCoach, securityKey: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Authorize Staff</button>
                <button type="button" onClick={() => setIsAddingCoach(false)} className="px-8 border-2 border-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {dbCoaches.map(coach => (
                <tr key={coach.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6 font-black text-slate-900 italic uppercase">{coach.name}</td>
                  <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{coach.role}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleRemoveCoach(coach.id)} className="text-slate-300 hover:text-red-500"><i className="fas fa-user-minus"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPlayerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Select Your Discipline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPORTS_OPTIONS.map(option => (
                <button key={option.id} onClick={() => { updateBooking({ sport: option.id as Sport }); nextStep(); }}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 ${booking.sport === option.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl ${option.id === 'baseball' ? 'bg-slate-900' : 'bg-tlp-pink'}`}>
                    <i className={`fas ${option.icon}`}></i>
                  </div>
                  <span className="text-xl font-black text-gray-800 uppercase italic">{option.label}</span>
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
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all ${booking.lessonType === lesson.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
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
        const availableSlots = getAvailableTimeSlots();
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Pick Training Slot</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <TextField id="booking-date" label="Training Date" type="date" min={getTodayString()} value={booking.date || ''} onChange={(e) => updateBooking({ date: e.target.value })} />
              </div>
              <div className={!booking.date ? 'opacity-30 pointer-events-none' : ''}>
                <div className="grid grid-cols-2 gap-4">
                  {availableSlots.length > 0 ? availableSlots.map(slot => (
                    <button key={slot} disabled={!booking.date} onClick={() => updateBooking({ time: slot })} className={`py-8 text-sm font-black rounded-2xl border-2 ${booking.time === slot ? 'bg-tlp-pink text-white border-tlp-pink shadow-xl' : 'bg-white text-gray-600 border-slate-100'}`}>{slot}</button>
                  )) : (
                    <div className="col-span-2 py-12 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-3xl">
                      No availability for this date.
                    </div>
                  )}
                </div>
              </div>
            </div>
            {booking.date && booking.time && (
              <div className="text-center mt-8">
                <button onClick={nextStep} className="bg-tlp-pink text-white px-10 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl">Confirm Athlete Profile</button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Verify & Secure Training</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <TextField id="p-first" label="First Name" value={booking.playerInfo.firstName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, firstName: e.target.value }})} />
                  <TextField id="p-last" label="Last Name" value={booking.playerInfo.lastName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, lastName: e.target.value }})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <TextField id="p-age" label="Age" type="number" value={booking.playerInfo.age} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, age: e.target.value }})} />
                  <div className="col-span-2"><TextField id="p-parent-name" label="Parent/Guardian" value={booking.playerInfo.parentName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentName: e.target.value }})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField id="p-email" label="Parent Email" type="email" value={booking.playerInfo.parentEmail} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentEmail: e.target.value }})} />
                  <TextField id="p-phone" label="Parent Phone" type="tel" value={booking.playerInfo.parentPhone} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentPhone: e.target.value }})} />
                </div>
                {aiAdvice && (
                  <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100">
                    <p className="text-[10px] font-black text-tlp-pink uppercase tracking-widest mb-2">Trainer Recommendation</p>
                    <p className="text-xs text-slate-700 font-medium italic">"{aiAdvice}"</p>
                  </div>
                )}
                <button onClick={handleCompleteAuthorization} className="w-full bg-tlp-pink text-white py-5 rounded-2xl font-black text-lg hover:brightness-110 shadow-2xl transition-all uppercase tracking-widest italic">
                  Authorize & Book Session
                </button>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl">
                <h3 className="font-black text-xs text-tlp-pink mb-8 uppercase tracking-[0.3em]">Session Summary</h3>
                <div className="space-y-4 text-xs font-bold uppercase tracking-tight">
                  <div className="flex justify-between border-b border-slate-800 pb-3"><span>Program</span><span>{LESSONS.find(l => l.id === booking.lessonType)?.label}</span></div>
                  <div className="flex justify-between border-b border-slate-800 pb-3"><span>Date</span><span>{booking.date}</span></div>
                  <div className="flex justify-between border-b border-slate-800 pb-3"><span>Time</span><span>{booking.time}</span></div>
                  <div className="flex justify-between pt-6">
                    <span className="text-4xl font-black italic tracking-tighter text-white">{LESSONS.find(l => l.id === booking.lessonType)?.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPlayerDrawer = () => {
    if (!selectedPlayer) return null;
    return (
      <>
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white z-[101] shadow-2xl transition-transform duration-500 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8">
            <button onClick={() => setIsDrawerOpen(false)} className="self-end text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            <div className="mt-8">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase italic">{selectedPlayer.name}</h2>
              <p className="text-tlp-pink font-black uppercase tracking-widest text-xs mt-2">Athlete Dossier</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAccountPortal = () => {
    return (
      <>
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isAccountOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsAccountOpen(false)} />
        <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white z-[101] transition-transform duration-500 transform ${isAccountOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8">
            <button onClick={() => setIsAccountOpen(false)} className="self-end text-slate-400 hover:text-slate-900"><i className="fas fa-times"></i></button>
            <div className="mt-8 flex-grow">
              <h3 className="text-lg font-black tracking-widest uppercase italic mb-8">My TLP Profile</h3>
              <p className="text-xs font-bold text-slate-500">Authorized as Guest Athlete</p>
            </div>
            <button onClick={handleBackToLogin} className="w-full border-t pt-8 flex items-center justify-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <i className="fas fa-sign-out-alt"></i> End Session
            </button>
          </div>
        </div>
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden border-r border-slate-900">
          <img src="https://images.unsplash.com/photo-1601613583279-d2b5160be1cc?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-transparent"></div>
          <div className="relative z-10 flex flex-col justify-end p-20 text-white w-full">
             <div className="mb-12">
               <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">Build Your<br /><span className="text-tlp-pink text-7xl">Legacy</span><br />Today</h2>
             </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-16 lg:p-24 overflow-y-auto bg-white min-h-screen">
           <div className="mb-20 self-start"><TLPLogo size="lg" /></div>
           <div className="max-w-md w-full animate-fade-in">{renderAuth()}</div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <aside className="w-72 bg-slate-950 flex flex-col h-screen sticky top-0 z-50">
          <div className="p-8 border-b border-slate-900"><TLPLogo size="sm" light={true} /></div>
          <nav className="flex-grow py-6 flex flex-col">
            <M3SideNavItem active={adminTab === 'dashboard'} label="Overview" icon="fa-chart-pie" onClick={() => setAdminTab('dashboard')} />
            <M3SideNavItem active={adminTab === 'players'} label="Athletes" icon="fa-user-graduate" onClick={() => setAdminTab('players')} />
            <M3SideNavItem active={adminTab === 'schedule'} label="Calendar" icon="fa-calendar-alt" onClick={() => setAdminTab('schedule')} />
            <M3SideNavItem active={adminTab === 'staff'} label="Staff" icon="fa-user-shield" onClick={() => setAdminTab('staff')} />
          </nav>
          <div className="p-6 border-t border-slate-900">
             <button onClick={handleBackToLogin} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-white transition-colors">
                <i className="fas fa-power-off text-sm"></i><span className="text-[10px] font-black uppercase tracking-widest">End Session</span>
             </button>
          </div>
        </aside>
        <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="bg-white border-b border-slate-100 px-10 py-6 flex justify-between items-center shrink-0">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Authorized Terminal / {adminTab}</h2>
             <div className="flex items-center gap-4">
                <p className="text-[10px] font-black text-slate-900 uppercase">Coach {activeCoach?.name || 'User'}</p>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic">{(activeCoach?.name || 'U').charAt(0)}</div>
             </div>
          </header>
          <main className="flex-grow overflow-y-auto p-10">
            <div className="max-w-7xl mx-auto">
              {adminTab === 'dashboard' && renderAdminDashboard()}
              {adminTab === 'players' && renderAdminPlayers()}
              {adminTab === 'schedule' && renderAdminSchedule()}
              {adminTab === 'staff' && renderAdminStaff()}
            </div>
          </main>
        </div>
        {renderPlayerDrawer()}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-white">
      <header className="bg-white border-b border-slate-50 sticky top-0 z-50 py-4 px-8 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setStep(1)}>
            <TLPLogo size="sm" />
            <h1 className="text-xl font-black text-slate-900 italic hidden sm:block uppercase">TRAIN LIKE <span className="text-tlp-pink">PROS</span></h1>
          </div>
          <button onClick={() => setIsAccountOpen(true)} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black italic">G</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-16">
        <div className="mb-20 flex justify-between relative max-w-4xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-tlp-pink -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step-1) * 33.33}%` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-4">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black transition-all ${step === s ? 'bg-tlp-pink text-white scale-110 shadow-xl' : step > s ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>{step > s ? <i className="fas fa-check"></i> : s}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-slate-50 p-12 min-h-[500px] animate-fade-in relative">
          {renderPlayerSteps()}
          <div className="mt-16 flex justify-between items-center border-t border-slate-50 pt-8">
            {step > 1 ? (
              <button onClick={prevStep} className="text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-tlp-pink">Return</button>
            ) : <div />}
            <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Step {step}/4</span>
          </div>
        </div>
      </main>

      {renderAccountPortal()}
      {renderPlayerDrawer()}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .date-input-field::-webkit-calendar-picker-indicator { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; cursor: pointer; opacity: 0; z-index: 20; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;