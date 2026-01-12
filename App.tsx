import React, { useState, useRef, useEffect } from 'react';
import { BookingState, Sport, LessonType } from './types.ts';
import { SPORTS_OPTIONS, LESSONS, TIME_SLOTS } from './constants.ts';
import { getTrainingAdvice } from './services/geminiService.ts';

type AuthView = 'login' | 'register' | 'forgot' | 'admin';
type AdminTab = 'dashboard' | 'players' | 'schedule' | 'staff';

const STORAGE_KEYS = {
  PLAYERS: 'tlp_database_players',
  BOOKINGS: 'tlp_database_bookings',
  BLOCKED: 'tlp_database_blocked_slots',
  COACHES: 'tlp_database_coaches',
};

const TLPLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; light?: boolean }> = ({ size = 'md', light = false }) => {
  const heightClass = size === 'sm' ? 'h-10' : size === 'md' ? 'h-16' : size === 'lg' ? 'h-24' : 'h-40';
  const logoUrl = "https://drive.google.com/uc?export=view&id=1dwJCUL8BFnagGDjDPb42cdvkeqvxi02S";
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className={`${heightClass} flex items-center justify-center ${light ? 'brightness-0 invert' : ''}`}>
      {!imgError ? (
        <img 
          src={logoUrl} 
          alt="Train Like Pros" 
          className="h-full w-auto object-contain block drop-shadow-md"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="font-black italic text-xl tracking-tighter text-tlp-pink">TRAIN LIKE PROS</div>
      )}
    </div>
  );
};

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

  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminLoginKey, setAdminLoginKey] = useState('');

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');

  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', role: '', idCode: '', securityKey: '' });

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

    alert('Booking Authorized! Your athlete profile has been synchronized.');
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
        alert('Access Denied. Check ID and Key.');
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
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-tlp-pink transition" onClick={() => setAdminTab('players')}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Athletes</p>
          <h3 className="text-4xl font-black text-gray-800">{dbPlayers.length}</h3>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Session Volume</p>
          <h3 className="text-4xl font-black text-gray-800">{dbBookings.filter(b => b.date === getTodayString()).length}</h3>
        </div>
      </div>
    </div>
  );

  const renderAdminPlayers = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Athlete Roster</h2>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Athlete</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Turns</th>
                <th className="px-8 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Bio</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbPlayers.map(player => (
                <tr key={player.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-6 font-black text-gray-800">{player.name}</td>
                  <td className="px-8 py-6 font-black text-tlp-pink">{player.sessions}</td>
                  <td className="px-8 py-6 text-xs text-slate-500">{player.parent.name} • {player.parent.phone}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => openPlayerProfile(player)} className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-tlp-pink transition">Inspect</button>
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
      calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedCalendarDate === dateStr;
      const isBlocked = blockedSlots[dateStr] === true;

      calendarDays.push(
        <div 
          key={d} 
          onClick={() => setSelectedCalendarDate(dateStr)}
          className={`h-24 border border-slate-100 p-2 cursor-pointer transition-all ${isSelected ? 'bg-pink-50 ring-1 ring-inset ring-tlp-pink' : 'hover:bg-slate-50'} ${isBlocked ? 'bg-red-50' : ''}`}
        >
          <span className={`text-xs font-black ${isSelected ? 'text-tlp-pink' : 'text-slate-900'}`}>{d}</span>
          {isBlocked && <div className="text-[8px] bg-red-500 text-white px-1 mt-1 rounded text-center font-black">OFF</div>}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-grow">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-black italic uppercase">{monthName} {year}</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() - 1))} className="p-2"><i className="fas fa-chevron-left"></i></button>
              <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() + 1))} className="p-2"><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 text-[10px] font-black text-center text-slate-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays}
          </div>
        </div>
        <div className="w-full lg:w-80 bg-slate-50/30 p-8 border-l border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Date: {selectedCalendarDate}</p>
           <button onClick={() => toggleBlockedDay(selectedCalendarDate)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">
             {blockedSlots[selectedCalendarDate] === true ? 'Unlock Day' : 'Block Facility'}
           </button>
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
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-black uppercase italic">Personnel</h2>
          <button onClick={() => setIsAddingCoach(true)} className="bg-tlp-pink text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Onboard Staff</button>
        </div>
        {isAddingCoach && (
          <div className="bg-white p-8 rounded-3xl border-2 border-tlp-pink">
            <form onSubmit={handleAddCoach} className="space-y-4">
              <TextField id="n-name" label="Name" value={newCoach.name} onChange={e => setNewCoach({...newCoach, name: e.target.value})} required />
              <TextField id="n-id" label="Access ID" value={newCoach.idCode} onChange={e => setNewCoach({...newCoach, idCode: e.target.value})} required />
              <TextField id="n-key" label="Key" value={newCoach.securityKey} onChange={e => setNewCoach({...newCoach, securityKey: e.target.value})} required />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase">Authorize</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Select Discipline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPORTS_OPTIONS.map(option => (
                <button key={option.id} onClick={() => { updateBooking({ sport: option.id as Sport }); nextStep(); }}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${booking.sport === option.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                  <i className={`fas ${option.icon} text-3xl ${option.id === 'baseball' ? 'text-slate-900' : 'text-tlp-pink'}`}></i>
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
                    <i className={`fas ${lesson.icon} text-xl text-tlp-pink`}></i>
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
            <TextField id="booking-date" label="Training Date" type="date" min={getTodayString()} value={booking.date || ''} onChange={(e) => updateBooking({ date: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              {availableSlots.map(slot => (
                <button key={slot} onClick={() => updateBooking({ time: slot })} className={`py-4 text-xs font-black rounded-xl border-2 ${booking.time === slot ? 'bg-tlp-pink text-white border-tlp-pink shadow-lg' : 'bg-white text-gray-600 border-slate-100'}`}>{slot}</button>
              ))}
            </div>
            {booking.date && booking.time && (
              <div className="text-center mt-8">
                <button onClick={nextStep} className="bg-tlp-pink text-white px-10 py-4 rounded-full font-black uppercase tracking-widest shadow-xl">Confirm Athlete Profile</button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Verify & Secure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField id="p-first" label="Athlete First Name" value={booking.playerInfo.firstName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, firstName: e.target.value }})} />
              <TextField id="p-last" label="Athlete Last Name" value={booking.playerInfo.lastName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, lastName: e.target.value }})} />
            </div>
            {aiAdvice && (
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 italic text-[10px] text-slate-700">
                "{aiAdvice}"
              </div>
            )}
            <button onClick={handleCompleteAuthorization} className="w-full bg-tlp-pink text-white py-5 rounded-2xl font-black text-lg hover:brightness-110 shadow-xl transition-all uppercase tracking-widest italic">
              Authorize Training
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden border-r border-slate-900">
          <img src="https://images.unsplash.com/photo-1601613583279-d2b5160be1cc?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-transparent"></div>
          <div className="relative z-10 flex flex-col justify-end p-20 text-white">
             <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">Build Your<br /><span className="text-tlp-pink text-7xl">Legacy</span></h2>
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
        <aside className="w-64 bg-slate-950 flex flex-col h-screen sticky top-0 z-50">
          <div className="p-6 border-b border-slate-900"><TLPLogo size="sm" light={true} /></div>
          <nav className="flex-grow py-6">
            <M3SideNavItem active={adminTab === 'dashboard'} label="Overview" icon="fa-chart-pie" onClick={() => setAdminTab('dashboard')} />
            <M3SideNavItem active={adminTab === 'players'} label="Athletes" icon="fa-user-graduate" onClick={() => setAdminTab('players')} />
            <M3SideNavItem active={adminTab === 'schedule'} label="Calendar" icon="fa-calendar-alt" onClick={() => setAdminTab('schedule')} />
            <M3SideNavItem active={adminTab === 'staff'} label="Personnel" icon="fa-user-shield" onClick={() => setAdminTab('staff')} />
          </nav>
          <div className="p-6">
             <button onClick={handleBackToLogin} className="w-full text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition">Sign Out</button>
          </div>
        </aside>
        <div className="flex-grow overflow-y-auto p-10">
          {adminTab === 'dashboard' && renderAdminDashboard()}
          {adminTab === 'players' && renderAdminPlayers()}
          {adminTab === 'schedule' && renderAdminSchedule()}
          {adminTab === 'staff' && renderAdminStaff()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-white">
      <header className="bg-white border-b border-slate-50 sticky top-0 z-50 py-4 px-8 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setStep(1)}>
            <TLPLogo size="sm" />
            <h1 className="text-xl font-black text-slate-900 italic hidden sm:block uppercase">TRAIN LIKE <span className="text-tlp-pink">PROS</span></h1>
          </div>
          <button onClick={() => setIsAccountOpen(true)} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black italic">G</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-16">
        <div className="mb-20 flex justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-tlp-pink -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step-1) * 33.33}%` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${step === s ? 'bg-tlp-pink text-white scale-110 shadow-lg' : step > s ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>{step > s ? <i className="fas fa-check"></i> : s}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 p-10 min-h-[400px] animate-fade-in">
          {renderPlayerSteps()}
          <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50">
            {step > 1 ? <button onClick={prevStep} className="text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-tlp-pink">Return</button> : <div />}
            <span className="text-[10px] text-slate-500 font-black uppercase">Step {step}/4</span>
          </div>
        </div>
      </main>

      {isAccountOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsAccountOpen(false)}></div>
          <div className="relative w-80 bg-white h-full p-8 shadow-2xl animate-fade-in">
            <button onClick={() => setIsAccountOpen(false)} className="mb-8"><i className="fas fa-times"></i></button>
            <h3 className="text-lg font-black uppercase italic mb-8">Account</h3>
            <button onClick={handleBackToLogin} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Sign Out</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .date-input-field::-webkit-calendar-picker-indicator { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; cursor: pointer; opacity: 0; z-index: 20; }
      `}</style>
    </div>
  );
};

export default App;