import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BookingState, Sport, LessonType, TrainingSession, UserRole } from './types.ts';
import { SPORTS_OPTIONS, LESSONS, TIME_SLOTS } from './constants.ts';
import { getTrainingAdvice } from './services/geminiService.ts';

type AuthView = 'login' | 'register' | 'forgot' | 'admin';
type AdminTab = 'dashboard' | 'players' | 'schedule' | 'staff';
type PaymentMethod = 'card' | 'paypal' | 'venmo';

// Using provided Supabase credentials
const SUPABASE_URL = 'https://xtfovrhssnqshwsnkcew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Zm92cmhzc25xc2h3c25rY2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzk4MDYsImV4cCI6MjA4NDg1NTgwNn0.EA-9C81uFIQE0fZ9667TVlu00kZCmteaRmmz3pWbMU8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  id: string;
  min?: string;
  children?: React.ReactNode;
}> = ({ label, type = 'text', value, placeholder = ' ', required, onChange, id, min, children }) => {
  const isDate = type === 'date';
  const isSelect = type === 'select';
  const inputRef = useRef<any>(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInternalValue(e.target.value);
    if (onChange) onChange(e);
  };
  
  return (
    <div className="relative w-full group">
      {isSelect ? (
        <select
          id={id}
          value={value}
          required={required}
          onChange={handleInputChange}
          className="block px-4 pt-6 pb-2 w-full text-base text-gray-900 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-0 focus:border-tlp-pink peer transition-colors appearance-none"
        >
          {children}
        </select>
      ) : (
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
      )}
      <label
        htmlFor={id}
        className={`absolute text-sm duration-200 transform origin-[0] left-4 font-medium pointer-events-none transition-all
          ${isDate || isSelect || internalValue !== '' 
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
      {isSelect && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 pt-2 z-10">
          <i className="fas fa-chevron-down text-xs"></i>
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-tlp-pink rounded-r-full shadow-[2px_0_8_rgba(235,50,138,0.5)]"></div>
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
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminLoginKey, setAdminLoginKey] = useState('');

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [activeSchedulingDate, setActiveSchedulingDate] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [dbPlayers, setDbPlayers] = useState<any[]>([]);
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [dbCoaches, setDbCoaches] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[] | boolean>>({});
  const [customTimeSlots, setCustomTimeSlots] = useState<Record<string, string[]>>({});
  
  const [adminSelectedDate, setAdminSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [isAthleteDrawerOpen, setIsAthleteDrawerOpen] = useState(false);
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    playerId: '',
    time: '09:00 AM',
    lessonId: 'hitting' as LessonType
  });
  const [isAddingCustomSlot, setIsAddingCustomSlot] = useState(false);
  const [newCustomSlotTime, setNewCustomSlotTime] = useState('');

  const [newStaffData, setNewStaffData] = useState({
    name: '',
    role: '',
    idCode: '',
    securityKey: ''
  });

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDatabase = async () => {
    setIsDbLoading(true);
    setDbError(null);
    try {
      // 1. Fetch Coaches
      const { data: coaches, error: cErr } = await supabase.from('coaches').select('*');
      if (cErr) throw cErr;
      if (coaches) setDbCoaches(coaches);

      // 2. Fetch Players
      const { data: players, error: pErr } = await supabase.from('players').select('*');
      if (pErr) throw pErr;
      if (players) setDbPlayers(players.map(p => ({
        ...p,
        history: p.training_history || []
      })));

      // 3. Fetch Bookings
      const { data: bookings, error: bErr } = await supabase.from('bookings').select('*');
      if (bErr) throw bErr;
      if (bookings) setDbBookings(bookings.map(b => ({
        id: b.id,
        player: b.player_name,
        time: b.session_time,
        date: b.session_date,
        lesson: b.lesson_label,
        status: b.status
      })));

      // 4. Fetch Facility Closures
      const { data: closures, error: clErr } = await supabase.from('facility_closures').select('*');
      if (clErr) throw clErr;
      if (closures) {
        const blocked: Record<string, boolean> = {};
        closures.forEach(c => blocked[c.closed_date] = true);
        setBlockedSlots(blocked);
      }

      // 5. Fetch Custom Shifts
      const { data: shifts, error: sErr } = await supabase.from('custom_shifts').select('*');
      if (sErr) throw sErr;
      if (shifts) {
        const custom: Record<string, string[]> = {};
        shifts.forEach(s => {
          if (!custom[s.shift_date]) custom[s.shift_date] = [];
          custom[s.shift_date].push(s.shift_time);
        });
        setCustomTimeSlots(custom);
      }
    } catch (e: any) {
      console.error("Database sync error:", e);
      setDbError("Unable to synchronize with the training database. Please try again.");
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  useEffect(() => {
    if (step === 2 && !activeSchedulingDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      setActiveSchedulingDate(dateStr);
      setCurrentCalendarDate(tomorrow);
    }
  }, [step, activeSchedulingDate]);
  
  const [booking, setBooking] = useState<BookingState>({
    userType: null,
    sport: null,
    selectedSessions: [],
    playerInfo: { firstName: '', lastName: '', age: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }
  });

  const totalInvestment = useMemo(() => {
    return booking.selectedSessions.reduce((acc, s) => acc + s.price, 0);
  }, [booking.selectedSessions]);

  const fetchAdvice = async () => {
    if (booking.selectedSessions.length > 0) {
      setLoadingAdvice(true);
      const profile = `Interested in ${booking.sport}. Selected ${booking.selectedSessions.length} sessions. Player age is ${booking.playerInfo.age || 'unknown'}. Additional notes: ${booking.playerInfo.notes}`;
      await getTrainingAdvice(profile);
      setLoadingAdvice(false);
    }
  };

  const nextStep = () => {
    if (step === 2) fetchAdvice();
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const updateBooking = (updates: Partial<BookingState>) => {
    setBooking(prev => ({ ...prev, ...updates }));
  };

  const toggleSession = (date: string, time: string, type: '1:1' | 'Group', price: number, lessonId: LessonType) => {
    const exists = booking.selectedSessions.find(s => s.date === date && s.time === time);
    if (exists) {
      updateBooking({
        selectedSessions: booking.selectedSessions.filter(s => !(s.date === date && s.time === time))
      });
    } else {
      updateBooking({
        selectedSessions: [...booking.selectedSessions, { date, time, lessonType: lessonId, price }]
      });
    }
  };

  const handleCompleteAuthorization = async () => {
    if (!booking.playerInfo.firstName || !booking.playerInfo.lastName) {
      alert("Please enter the athlete's full name to authorize.");
      return;
    }
    const fullName = `${booking.playerInfo.firstName} ${booking.playerInfo.lastName}`;
    
    // DB Logic for Player
    let athleteId = '';
    const existingPlayer = dbPlayers.find(p => p.name.toLowerCase() === fullName.toLowerCase());
    
    if (existingPlayer) {
      athleteId = existingPlayer.id;
      const newHistory = [...existingPlayer.history, ...booking.selectedSessions.map(s => LESSONS.find(l => l.id === s.lessonType)?.label || 'Training')];
      await supabase.from('players').update({ 
        training_history: newHistory 
      }).eq('id', athleteId);
    } else {
      const { data: newPlayer } = await supabase.from('players').insert({
        name: fullName,
        age: parseInt(booking.playerInfo.age || '0'),
        parent_name: booking.playerInfo.parentName,
        parent_email: booking.playerInfo.parentEmail,
        parent_phone: booking.playerInfo.parentPhone,
        notes: booking.playerInfo.notes,
        training_history: booking.selectedSessions.map(s => LESSONS.find(l => l.id === s.lessonType)?.label || 'Training')
      }).select().single();
      if (newPlayer) athleteId = newPlayer.id;
    }

    // DB Logic for Bookings
    const bookingPayload = booking.selectedSessions.map(s => ({
      player_id: athleteId,
      player_name: fullName,
      session_date: s.date,
      session_time: s.time,
      lesson_type: s.lessonType,
      lesson_label: LESSONS.find(l => l.id === s.lessonType)?.label || 'Training',
      price: s.price
    }));
    await supabase.from('bookings').insert(bookingPayload);

    await fetchDatabase();
    alert(`Confirmed! ${booking.selectedSessions.length} training sessions have been added to the athlete's profile.`);
    setStep(1);
    setBooking({
      userType: null,
      sport: null,
      selectedSessions: [],
      playerInfo: { firstName: '', lastName: '', age: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }
    });
  };

  const toggleBlockedDay = async (date: string) => {
    if (blockedSlots[date] === true) {
      await supabase.from('facility_closures').delete().eq('closed_date', date);
    } else {
      await supabase.from('facility_closures').insert({ closed_date: date, reason: 'Staff Block' });
    }
    await fetchDatabase();
  };

  const addCustomTimeSlot = async (date: string, time: string) => {
    if (!time) return;
    await supabase.from('custom_shifts').insert({ shift_date: date, shift_time: time });
    await fetchDatabase();
    setNewCustomSlotTime('');
    setIsAddingCustomSlot(false);
  };

  const removeCustomTimeSlot = async (date: string, time: string) => {
    await supabase.from('custom_shifts').delete().eq('shift_date', date).eq('shift_time', time);
    await fetchDatabase();
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBookingData.playerId) return;
    const athlete = dbPlayers.find(p => p.id === manualBookingData.playerId);
    if (!athlete) return;

    await supabase.from('bookings').insert({
      player_id: athlete.id,
      player_name: athlete.name,
      session_date: adminSelectedDate,
      session_time: manualBookingData.time,
      lesson_type: manualBookingData.lessonId,
      lesson_label: LESSONS.find(l => l.id === manualBookingData.lessonId)?.label || 'Training',
      price: manualBookingData.lessonId === 'small-group' ? 60 : 50
    });

    const newHistory = [...(athlete.history || []), LESSONS.find(l => l.id === manualBookingData.lessonId)?.label || 'Training'];
    await supabase.from('players').update({ training_history: newHistory }).eq('id', athlete.id);

    await fetchDatabase();
    setShowManualBooking(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('coaches').insert({
      name: newStaffData.name,
      role: newStaffData.role,
      id_code: newStaffData.idCode.toUpperCase(),
      security_key: newStaffData.securityKey
    });
    await fetchDatabase();
    setNewStaffData({ name: '', role: '', idCode: '', securityKey: '' });
    setIsStaffDrawerOpen(false);
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to revoke access for ${staffName}?`)) {
      await supabase.from('coaches').delete().eq('id', staffId);
      await fetchDatabase();
    }
  };

  const handleLogin = (e: React.FormEvent, type: 'user' | 'admin' = 'user') => {
    e.preventDefault();
    if (type === 'admin') {
      const cleanId = adminLoginId.trim().toUpperCase();
      const cleanKey = adminLoginKey.trim();
      const coach = dbCoaches.find(c => c.id_code.trim().toUpperCase() === cleanId && c.security_key.trim() === cleanKey);
      if (coach) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setActiveCoach(coach);
        setIsGuest(false);
      } else {
        alert('Access Denied. Credentials not found in staff roster.');
      }
    } else {
      setIsAuthenticated(true);
      setIsAdmin(false);
      setIsGuest(false);
    }
  };

  const handleBackToLogin = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setStep(1); 
  };

  const getAvailableTimeSlots = (date: string) => {
    if (!date) return [];
    if (blockedSlots[date] === true) return [];
    
    const dateObj = new Date(date + 'T00:00:00');
    const day = dateObj.getDay();
    const isWeekend = day === 0 || day === 6;
    let slots = [];
    
    if (isWeekend) {
      slots = ['01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(t => ({
        time: t, type: '1:1' as const, price: 50, lessonId: 'hitting' as LessonType
      }));
    } else {
      const privateSlots = ['01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => ({
        time: t, type: '1:1' as const, price: 50, lessonId: 'hitting' as LessonType
      }));
      const groupSlots = ['04:30 PM', '06:00 PM'].map(t => ({
        time: t, type: 'Group' as const, price: 60, lessonId: 'small-group' as LessonType
      }));
      slots = [...privateSlots, ...groupSlots];
    }
    
    if (customTimeSlots[date]) {
      const customOnes = customTimeSlots[date].map(t => ({
        time: t, type: '1:1' as const, price: 50, lessonId: 'hitting' as LessonType
      }));
      const existingTimes = slots.map(s => s.time);
      const filteredCustoms = customOnes.filter(c => !existingTimes.includes(c.time));
      slots = [...slots, ...filteredCustoms];
    }

    const bookedTimesOnDate = dbBookings
      .filter(b => b.date === date)
      .map(b => b.time);

    return slots
      .filter(s => !bookedTimesOnDate.includes(s.time))
      .sort((a, b) => {
        const parseTime = (t: string) => {
          let [time, modifier] = t.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours !== 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        return parseTime(a.time) - parseTime(b.time);
      });
  };

  const renderPlayerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Tell us who you are</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {(['athlete', 'parent', 'coach'] as UserRole[]).map(role => (
                  <button key={role} onClick={() => updateBooking({ userType: role })} className={`px-8 py-4 rounded-2xl border-2 font-black uppercase tracking-widest italic transition-all ${booking.userType === role ? 'bg-tlp-pink text-white border-tlp-pink shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-tlp-pink/30'}`}>{role === 'athlete' ? 'Elite Athlete' : role === 'parent' ? 'Parent / Guardian' : 'Coach / Instructor'}</button>
                ))}
              </div>
            </div>
            {booking.userType && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Select Discipline</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SPORTS_OPTIONS.map(option => (
                    <button key={option.id} onClick={() => { updateBooking({ sport: option.id as Sport }); nextStep(); }} className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${booking.sport === option.id ? 'border-tlp-pink bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                      <i className={`fas ${option.icon} text-3xl ${option.id === 'softball' ? 'text-yellow-400' : 'text-slate-900'}`}></i>
                      <span className="text-xl font-black text-gray-800 uppercase italic">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay();
        const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });
        const year = currentCalendarDate.getFullYear();
        const slots = getAvailableTimeSlots(activeSchedulingDate || '');
        const calendarDays = [];
        for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(<div key={`empty-${i}`} className="h-16 bg-slate-50/30"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = activeSchedulingDate === dateStr;
          const hasSelectionOnDate = booking.selectedSessions.some(s => s.date === dateStr);
          const isPast = new Date(dateStr) < new Date(getTodayString());
          const isBlocked = blockedSlots[dateStr] === true;
          calendarDays.push(
            <button key={d} disabled={isBlocked || isPast} onClick={() => setActiveSchedulingDate(dateStr)} className={`h-16 border border-slate-50 flex flex-col items-center justify-center transition-all relative ${isSelected ? 'bg-tlp-pink text-white shadow-lg z-10 scale-105 rounded-xl' : isBlocked || isPast ? 'bg-slate-100/50 opacity-30 cursor-not-allowed' : 'bg-white hover:bg-slate-50'}`}>
              <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{d}</span>
              {hasSelectionOnDate && !isSelected && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tlp-pink"></div>}
            </button>
          );
        }
        return (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              <div className="w-full lg:flex-[7] space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                    <span className="text-sm font-black italic uppercase text-slate-700">{monthName} {year}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() - 1))} className="p-2 text-slate-400 hover:text-tlp-pink"><i className="fas fa-chevron-left text-xs"></i></button>
                      <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() + 1))} className="p-2 text-slate-400 hover:text-tlp-pink"><i className="fas fa-chevron-right text-xs"></i></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 border-b text-center py-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[9px] font-black text-slate-400">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7">{calendarDays}</div>
                </div>
              </div>
              <div className="w-full lg:flex-[5] space-y-8">
                {activeSchedulingDate && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[10px] font-black text-tlp-pink uppercase tracking-widest">{activeSchedulingDate}</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slots.length > 0 ? slots.map(slot => {
                        const isActive = booking.selectedSessions.some(s => s.date === activeSchedulingDate && s.time === slot.time);
                        return (
                          <button key={slot.time} onClick={() => toggleSession(activeSchedulingDate, slot.time, slot.type, slot.price, slot.lessonId)} className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${isActive ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-tlp-pink'}`}>
                            <div className="flex justify-between items-center"><span className="font-black text-sm italic">{slot.time}</span><span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isActive ? 'bg-tlp-pink text-white' : 'bg-slate-100 text-slate-400'}`}>${slot.price}</span></div>
                            <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-tlp-pink' : 'bg-slate-200 group-hover:bg-tlp-pink'}`}></div><span className="text-[9px] font-black uppercase tracking-widest">{slot.type === 'Group' ? 'Group (90m)' : 'Private (60m)'}</span></div>
                          </button>
                        );
                      }) : <div className="col-span-full py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center"><p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Facility Closed or Fully Booked</p></div>}
                    </div>
                  </div>
                )}
                {booking.selectedSessions.length > 0 && (
                  <div className="bg-slate-50 rounded-3xl p-6 space-y-5 border border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Selection Summary</h3><span className="text-[10px] font-black text-tlp-pink uppercase tracking-widest">{booking.selectedSessions.length} Sessions</span></div>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {booking.selectedSessions.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200/50">
                          <div><p className="text-[10px] font-black text-slate-900 uppercase italic">{s.date} @ {s.time}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{s.lessonType === 'small-group' ? 'Group Training' : 'Private Focus'}</p></div>
                          <span className="text-[10px] font-black text-slate-900">${s.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200"><span className="text-xs font-black text-slate-900 uppercase">Total Investment</span><span className="text-lg font-black text-tlp-pink">${totalInvestment}</span></div>
                    <button onClick={nextStep} className="w-full bg-tlp-pink text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all italic text-sm">Continue</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-black text-gray-800 text-center tracking-tight uppercase italic">Final Authorization</h2>
            <div className="space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Athlete Information</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField id="p-first" label="Athlete First Name" value={booking.playerInfo.firstName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, firstName: e.target.value }})} required />
                  <TextField id="p-last" label="Athlete Last Name" value={booking.playerInfo.lastName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, lastName: e.target.value }})} required />
                  <TextField id="p-age" label="Athlete Age" type="number" value={booking.playerInfo.age} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, age: e.target.value }})} required />
               </div>
               {booking.userType !== 'athlete' && (
                 <>
                   <div className="border-t border-slate-100 my-8"></div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Parent / Coach Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextField id="p-parent" label="Parent/Guardian Name" value={booking.playerInfo.parentName} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentName: e.target.value }})} required />
                      <TextField id="p-email" label="Contact Email" type="email" value={booking.playerInfo.parentEmail} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentEmail: e.target.value }})} required />
                      <TextField id="p-phone" label="Contact Phone" type="tel" value={booking.playerInfo.parentPhone} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, parentPhone: e.target.value }})} required />
                   </div>
                 </>
               )}
               <div className="pt-2"><TextField id="p-notes" label="Special Instructions / Training Notes" value={booking.playerInfo.notes} onChange={e => updateBooking({ playerInfo: { ...booking.playerInfo, notes: e.target.value }})} /></div>
            </div>
            <div className="border-t border-slate-100 my-8"></div>
            <div className="space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Information</h3>
               <div className="grid grid-cols-3 gap-3 mb-6">
                  <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-tlp-pink bg-pink-50 text-tlp-pink' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}><i className="fas fa-credit-card text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Credit Card</span></button>
                  <button onClick={() => setPaymentMethod('paypal')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'paypal' ? 'border-tlp-pink bg-pink-50 text-tlp-pink' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}><i className="fab fa-paypal text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">PayPal</span></button>
                  <button onClick={() => setPaymentMethod('venmo')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'venmo' ? 'border-tlp-pink bg-pink-50 text-tlp-pink' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}><i className="fas fa-mobile-alt text-xl"></i><span className="text-[9px] font-black uppercase tracking-widest">Venmo</span></button>
               </div>
               {paymentMethod === 'card' ? (
                 <div className="space-y-4 animate-fade-in"><TextField id="card-num" label="Card Number" placeholder="0000 0000 0000 0000" /><div className="grid grid-cols-2 gap-4"><TextField id="card-expiry" label="Expiration date" placeholder="MM/YY" /><TextField id="card-cvv" label="CVV" placeholder="123" /></div></div>
               ) : (
                 <div className="py-6 px-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center animate-fade-in">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-widest">{paymentMethod === 'paypal' ? 'Proceeding to Secure PayPal Terminal' : 'Proceeding to Venmo Verification'}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">You will be redirected to complete your authorization securely after clicking "Authorize Training" below.</p>
                 </div>
               )}
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200/60 pb-6">
                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Training Roster</p><h3 className="text-lg font-black text-slate-900 uppercase italic">{booking.sport} Elite Development</h3></div>
                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Investment</p><h3 className="text-xl font-black text-tlp-pink">${totalInvestment}</h3></div>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {booking.selectedSessions.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 bg-white px-4 rounded-xl border border-slate-100 shadow-sm">
                    <div><p className="text-[10px] font-black text-slate-900 uppercase italic">{s.date} @ {s.time}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{s.lessonType === 'small-group' ? 'Group Training' : 'Private Focus'}</p></div>
                    <span className="text-xs font-black text-tlp-pink">${s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleCompleteAuthorization} className="w-full bg-tlp-pink text-white py-6 rounded-2xl font-black text-xl hover:brightness-110 shadow-2xl transition-all uppercase tracking-widest italic flex items-center justify-center gap-3 mt-4"><i className="fas fa-lock text-sm opacity-50"></i> Authorize ${totalInvestment} Training</button>
          </div>
        );
      default: return null;
    }
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-tlp-pink rounded-3xl p-6 text-white shadow-xl shadow-pink-100"><p className="text-pink-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Pro-Turns</p><h3 className="text-4xl font-black">{dbPlayers.reduce((acc, p) => acc + (p.sessions || 0), 0)}</h3></div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-tlp-pink transition"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Athletes</p><h3 className="text-4xl font-black text-gray-800">{dbPlayers.length}</h3></div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Today's Sessions</p><h3 className="text-4xl font-black text-gray-800">{dbBookings.filter(b => b.date === getTodayString()).length}</h3></div>
      </div>
    </div>
  );

  const renderAdminPlayers = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Athlete Roster</h2>
        <div className="bg-slate-100 px-4 py-2 rounded-full"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dbPlayers.length} Members</span></div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50"><th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Athlete</th><th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Total Sessions</th><th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Parental Contact</th><th className="px-8 py-4 text-right"></th></tr></thead>
            <tbody className="divide-y divide-gray-100">{dbPlayers.map(p => (<tr key={p.id} className="hover:bg-gray-50/50 transition"><td className="px-8 py-6 font-black text-gray-800 uppercase italic text-sm">{p.name}</td><td className="px-8 py-6 font-black text-tlp-pink">{p.sessions || (p.history?.length || 0)}</td><td className="px-8 py-6 text-xs text-slate-500 font-medium uppercase tracking-tight">{p.parent_name} <br/><span className="text-[10px] opacity-70">{p.parent_phone}</span></td><td className="px-8 py-6 text-right"><button onClick={() => { setSelectedAthlete(p); setIsAthleteDrawerOpen(true); }} className="px-4 py-2 border-2 border-slate-900 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">View Details</button></td></tr>))}</tbody>
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
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(<div key={`empty-${i}`} className="min-h-[140px] bg-slate-50/30 border border-slate-100/50"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = adminSelectedDate === dateStr;
      const isBlocked = blockedSlots[dateStr] === true;
      const dayBookings = dbBookings.filter(b => b.date === dateStr);
      calendarDays.push(
        <button key={d} onClick={() => { setAdminSelectedDate(dateStr); setIsAdminDrawerOpen(true); }} className={`min-h-[140px] border border-slate-100 p-2 flex flex-col transition-all relative text-left group overflow-hidden ${isSelected ? 'bg-tlp-pink/10 border-tlp-pink z-10 shadow-sm' : isBlocked ? 'bg-red-50/70' : 'bg-white hover:bg-slate-50'}`}>
          <div className="flex justify-between items-start w-full mb-2"><span className={`text-sm font-black ${isSelected ? 'text-tlp-pink' : 'text-slate-900'}`}>{d}</span>{isBlocked && <div className="text-[7px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Closed</div>}</div>
          <div className="flex-grow space-y-1 w-full overflow-hidden">
            {dayBookings.slice(0, 3).map(b => (<div key={b.id} className="text-[7px] leading-tight font-bold text-slate-700 bg-white/60 backdrop-blur-sm px-1 py-0.5 rounded border border-slate-200 truncate w-full flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-tlp-pink shrink-0"></div><span className="shrink-0 font-black">{b.time.split(' ')[0]}</span><span className="truncate">{b.player.split(' ')[0]} {b.player.split(' ')[1]?.[0] || ''}.</span></div>))}
            {dayBookings.length > 3 && <div className="text-[7px] font-black text-tlp-pink uppercase italic pt-1 pl-1">+ {dayBookings.length - 3} more</div>}
            {!isBlocked && dayBookings.length === 0 && <div className="text-[7px] font-bold text-slate-300 uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">Empty Slot</div>}
          </div>
          <div className="mt-auto pt-1 flex gap-1 items-center">{customTimeSlots[dateStr] && customTimeSlots[dateStr].length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Custom Hours Added"></div>}</div>
        </button>
      );
    }

    return (
      <div className="relative h-full animate-fade-in">
        <div className="w-full">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-10 border-b flex justify-between items-center bg-white">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Facility Workload Overview</p>
                <h3 className="text-4xl font-black italic uppercase text-slate-900 leading-none">{monthName} <span className="text-tlp-pink">{year}</span></h3>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() - 1))} className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-tlp-pink hover:bg-white flex items-center justify-center transition-all shadow-sm"><i className="fas fa-chevron-left"></i></button>
                <button onClick={() => setCurrentCalendarDate(new Date(year, currentCalendarDate.getMonth() + 1))} className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-tlp-pink hover:bg-white flex items-center justify-center transition-all shadow-sm"><i className="fas fa-chevron-right"></i></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center py-6 border-b bg-slate-50/30">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-slate-50/10">
              {calendarDays}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminStaff = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Facility Staff Terminal</h2>
        <button onClick={() => setIsStaffDrawerOpen(true)} className="px-6 py-3 bg-tlp-pink text-white rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-lg shadow-pink-100/50 hover:brightness-110 transition-all flex items-center gap-2">
          <i className="fas fa-plus-circle"></i> Onboard New Instructor
        </button>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Coach / Professional</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Designation</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Terminal Access ID</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-500">Access Security Key</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbCoaches.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-6 font-black text-gray-800 uppercase italic text-sm">{c.name}</td>
                  <td className="px-8 py-6 text-xs text-slate-500 font-bold uppercase tracking-widest">{c.role}</td>
                  <td className="px-8 py-6 font-mono text-[11px] text-tlp-pink font-bold bg-pink-50/30">{c.id_code}</td>
                  <td className="px-8 py-6 font-mono text-[11px] text-slate-600 font-bold italic">{c.security_key}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="w-8 h-8 rounded-lg text-slate-300 hover:text-tlp-pink transition-colors flex items-center justify-center">
                        <i className="fas fa-cog"></i>
                      </button>
                      <button 
                        onClick={() => handleRemoveStaff(c.id, c.name)}
                        className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"
                        title="Revoke Access"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuth = () => {
    switch (authView) {
      case 'login':
        return (
          <div className="space-y-8 animate-fade-in"><div className="space-y-2"><h1 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase leading-none">Welcome Back</h1><p className="text-slate-500 font-medium">Step into your training dashboard.</p></div>
            <form className="space-y-4" onSubmit={(e) => handleLogin(e, 'user')}><TextField id="email" label="Email Address" type="email" required /><TextField id="password" label="Password" type="password" required /><div className="flex items-center justify-between pt-2"><button type="button" onClick={() => setAuthView('forgot')} className="text-xs font-black text-tlp-pink uppercase tracking-widest hover:underline">Forgot Password?</button></div><button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all italic text-lg mt-4">Enter Clubhouse</button></form>
            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-300"><span className="bg-white px-4 italic">Or continue with</span></div></div>
            <div className="space-y-4"><GoogleLoginButton label="Continue with Google" onClick={() => setIsAuthenticated(true)} /><button onClick={() => { setIsAuthenticated(true); setIsGuest(true); }} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-tlp-pink transition">Enter as Guest Athlete</button></div>
            <div className="pt-8 flex flex-col items-center gap-4"><button onClick={() => setAuthView('register')} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-tlp-pink transition">Need an account? <span className="text-tlp-pink">Register</span></button><button onClick={() => setAuthView('admin')} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition border-t border-slate-50 pt-4 w-full text-center">Staff & Directorship Access</button></div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-8 animate-fade-in"><div className="space-y-2"><h1 className="text-4xl font-black italic tracking-tight text-tlp-pink uppercase leading-none">Admin Entry</h1><p className="text-slate-500 font-medium">Verify credentials for staff access.</p></div>
            <form className="space-y-4" onSubmit={(e) => handleLogin(e, 'admin')}><TextField id="adminId" label="Coach ID Code" value={adminLoginId} onChange={e => setAdminLoginId(e.target.value)} required /><TextField id="adminKey" label="Security Key" type="password" value={adminLoginKey} onChange={e => setAdminLoginKey(e.target.value)} required /><button type="submit" className="w-full bg-tlp-pink text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all italic text-lg mt-4">Verify Identity</button><button type="button" onClick={() => setAuthView('login')} className="w-full py-2 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition">Back to Athlete Portal</button></form>
          </div>
        );
      case 'register':
        return (
          <div className="space-y-8 animate-fade-in"><div className="space-y-2"><h1 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase leading-none">Join the Pros</h1><p className="text-slate-500 font-medium">Create your elite athlete profile.</p></div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }}><TextField id="reg-name" label="Full Name" required /><TextField id="reg-email" label="Email Address" type="email" required /><TextField id="reg-password" label="Create Password" type="password" required /><button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all italic text-lg mt-4">Create Account</button><button type="button" onClick={() => setAuthView('login')} className="w-full py-2 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition">Already have an account? Sign In</button></form>
          </div>
        );
      case 'forgot':
        return (
          <div className="space-y-8 animate-fade-in"><div className="space-y-2"><h1 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase leading-none">Account Recovery</h1><p className="text-slate-500 font-medium">Enter your email to receive recovery link.</p></div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Recovery link sent!'); setAuthView('login'); }}><TextField id="rec-email" label="Email Address" type="email" required /><button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all italic text-lg mt-4">Send Recovery Link</button><button type="button" onClick={() => setAuthView('login')} className="w-full py-2 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-950 transition">Back to Sign In</button></form>
          </div>
        );
      default: return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden border-r border-slate-900"><img src="https://images.unsplash.com/photo-1601613583279-d2b5160be1cc?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-transparent"></div><div className="relative z-10 flex flex-col justify-end p-20 text-white"><h2 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">Build Your<br /><span className="text-tlp-pink text-7xl">Legacy</span></h2></div></div>
        <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-16 lg:p-24 overflow-y-auto bg-white min-h-screen"><div className="mb-20 self-start"><TLPLogo size="lg" /></div><div className="max-w-md w-full animate-fade-in">{renderAuth()}</div></div>
      </div>
    );
  }

  if (isAdmin) {
    const isDateBlocked = blockedSlots[adminSelectedDate] === true;
    const currentCustomSlots = customTimeSlots[adminSelectedDate] || [];
    const selectedDateSessions = dbBookings.filter(b => b.date === adminSelectedDate);

    return (
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        <aside className="w-64 bg-slate-950 flex flex-col h-screen sticky top-0 z-50"><div className="p-6 border-b border-slate-900"><TLPLogo size="sm" light={true} /></div><nav className="flex-grow py-6">
            <M3SideNavItem active={adminTab === 'dashboard'} label="Overview" icon="fa-chart-pie" onClick={() => setAdminTab('dashboard')} />
            <M3SideNavItem active={adminTab === 'players'} label="Athletes" icon="fa-user-graduate" onClick={() => setAdminTab('players')} />
            <M3SideNavItem active={adminTab === 'schedule'} label="Calendar" icon="fa-calendar-alt" onClick={() => setAdminTab('schedule')} />
            <M3SideNavItem active={adminTab === 'staff'} label="Staff" icon="fa-users-cog" onClick={() => setAdminTab('staff')} />
          </nav><div className="p-6"><button onClick={handleBackToLogin} className="w-full text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition">Sign Out</button></div></aside>
        
        <div className="flex-grow overflow-y-auto p-12 relative">
          {adminTab === 'dashboard' && renderAdminDashboard()}
          {adminTab === 'players' && renderAdminPlayers()}
          {adminTab === 'schedule' && renderAdminSchedule()}
          {adminTab === 'staff' && renderAdminStaff()}

          {/* Admin Schedule Drawer */}
          {isAdminDrawerOpen && adminTab === 'schedule' && (
            <>
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] animate-backdrop-fade" onClick={() => setIsAdminDrawerOpen(false)} />
              <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.2)] z-[70] animate-drawer-slide-in overflow-y-auto custom-scrollbar border-l border-slate-100">
                <div className="p-10 flex flex-col gap-8">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily Workload</p>
                      <h3 className="text-2xl font-black italic uppercase text-slate-900 leading-none">
                        {new Date(adminSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                      </h3>
                    </div>
                    <button onClick={() => setIsAdminDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-tlp-pink flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrative Tools</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => toggleBlockedDay(adminSelectedDate)} className={`py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] italic transition-all border-2 flex flex-col items-center justify-center gap-2 ${isDateBlocked ? 'bg-white border-green-500 text-green-600' : 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100'}`}><i className={`fas ${isDateBlocked ? 'fa-door-open' : 'fa-door-closed'} text-sm`}></i>{isDateBlocked ? 'Open Day' : 'Block Day'}</button>
                      <button onClick={() => setShowManualBooking(!showManualBooking)} className={`py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] italic transition-all border-2 flex flex-col items-center justify-center gap-2 ${showManualBooking ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-tlp-pink'}`}><i className="fas fa-user-plus text-sm"></i>{showManualBooking ? 'Close Form' : 'Book Athlete'}</button>
                    </div>
                  </div>

                  {showManualBooking && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-fade-in space-y-4">
                      <p className="text-[10px] font-black text-tlp-pink uppercase tracking-widest mb-2 italic">Schedule Athlete</p>
                      <form onSubmit={handleManualBookingSubmit} className="space-y-4">
                        <TextField id="m-player" label="Select Athlete" type="select" value={manualBookingData.playerId} onChange={e => setManualBookingData({...manualBookingData, playerId: e.target.value})} required><option value="">Choose an athlete...</option>{dbPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</TextField>
                        <TextField id="m-time" label="Session Time" value={manualBookingData.time} placeholder="e.g. 09:00 AM" onChange={e => setManualBookingData({...manualBookingData, time: e.target.value})} required />
                        <TextField id="m-lesson" label="Lesson Focus" type="select" value={manualBookingData.lessonId} onChange={e => setManualBookingData({...manualBookingData, lessonId: e.target.value as LessonType})} required>{LESSONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</TextField>
                        <button type="submit" className="w-full bg-tlp-pink text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] italic shadow-lg shadow-pink-100">Confirm Booking</button>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Added Shifts</p>
                      <button onClick={() => setIsAddingCustomSlot(!isAddingCustomSlot)} className="text-[9px] font-black text-tlp-pink uppercase hover:underline">{isAddingCustomSlot ? 'Cancel' : 'Add Shift'}</button>
                    </div>
                    {isAddingCustomSlot && (<div className="flex gap-2 animate-fade-in"><input type="text" value={newCustomSlotTime} onChange={e => setNewCustomSlotTime(e.target.value)} placeholder="e.g. 07:00 AM" className="flex-grow text-[10px] p-2 rounded-lg border border-slate-200 focus:border-tlp-pink focus:outline-none uppercase font-black italic" /><button onClick={() => addCustomTimeSlot(adminSelectedDate, newCustomSlotTime)} className="bg-tlp-pink text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase">Save</button></div>)}
                    <div className="grid grid-cols-2 gap-2">
                      {currentCustomSlots.length > 0 ? currentCustomSlots.map(t => (<div key={t} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-700 italic">{t}</span><button onClick={() => removeCustomTimeSlot(adminSelectedDate, t)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times text-[10px]"></i></button></div>)) : <div className="col-span-2 py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl"><p className="text-[9px] text-slate-400 font-bold uppercase italic tracking-widest">No custom shifts</p></div>}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booked Roster ({selectedDateSessions.length})</p>
                    <div className="space-y-3">
                      {selectedDateSessions.length > 0 ? selectedDateSessions.map(b => (
                        <div key={b.id} className="p-4 bg-slate-950 rounded-2xl shadow-xl shadow-slate-200 group border-l-4 border-tlp-pink">
                          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-black text-tlp-pink uppercase italic tracking-widest">{b.time}</p><i className="fas fa-id-card text-white/20 text-xs"></i></div>
                          <p className="text-sm font-black text-white uppercase leading-tight">{b.player}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{b.lesson}</p>
                        </div>
                      )) : <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200"><i className="fas fa-calendar-day text-slate-200 text-3xl mb-3"></i><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No athletes rostered.</p></div>}
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Athlete Detail Drawer */}
          {isAthleteDrawerOpen && selectedAthlete && adminTab === 'players' && (
            <>
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] animate-backdrop-fade" onClick={() => setIsAthleteDrawerOpen(false)} />
              <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.2)] z-[70] animate-drawer-slide-in overflow-y-auto custom-scrollbar border-l border-slate-100">
                <div className="p-10 space-y-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-tlp-pink uppercase tracking-[0.2em] italic">Athlete Dossier</p>
                      <h3 className="text-3xl font-black italic uppercase text-slate-950 leading-none">{selectedAthlete.name}</h3>
                      <div className="flex gap-2 pt-2">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">Age {selectedAthlete.age}</span>
                        <span className="text-[9px] font-black bg-pink-50 text-tlp-pink px-2 py-0.5 rounded-full uppercase">{(selectedAthlete.sessions || selectedAthlete.history?.length || 0)} Sessions Total</span>
                      </div>
                    </div>
                    <button onClick={() => setIsAthleteDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-tlp-pink flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Parent / Guardian Information</p>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div><p className="text-[9px] font-black text-slate-400 uppercase">Full Name</p><p className="font-bold text-slate-900">{selectedAthlete.parent_name}</p></div>
                      <div><p className="text-[9px] font-black text-slate-400 uppercase">Contact Email</p><p className="font-bold text-slate-900 truncate">{selectedAthlete.parent_email}</p></div>
                      <div><p className="text-[9px] font-black text-slate-400 uppercase">Phone Line</p><p className="font-bold text-slate-900">{selectedAthlete.parent_phone}</p></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Training Performance History</p>
                    <div className="space-y-3">
                      {selectedAthlete.history && selectedAthlete.history.length > 0 ? selectedAthlete.history.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-tlp-pink transition-colors">
                          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-tlp-pink text-[10px] font-black">{idx + 1}</div>
                          <div>
                            <p className="text-xs font-black uppercase text-slate-900 italic">{item}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Verified Session</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl">No historical data found.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <button className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest italic text-xs hover:bg-tlp-pink transition-all shadow-xl">Initiate Performance Log</button>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Staff Onboarding Drawer */}
          {isStaffDrawerOpen && adminTab === 'staff' && (
            <>
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] animate-backdrop-fade" onClick={() => setIsStaffDrawerOpen(false)} />
              <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.2)] z-[70] animate-drawer-slide-in overflow-y-auto custom-scrollbar border-l border-slate-100">
                <div className="p-10 space-y-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-tlp-pink uppercase tracking-[0.2em] italic">Human Resources</p>
                      <h3 className="text-3xl font-black italic uppercase text-slate-950 leading-none">Onboard Staff</h3>
                      <p className="text-xs text-slate-500 font-medium pt-2">Create secure terminal access for new instructors.</p>
                    </div>
                    <button onClick={() => setIsStaffDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-tlp-pink flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
                  </div>

                  <form onSubmit={handleAddStaff} className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Instructor Identity</p>
                      <TextField id="s-name" label="Full Name" value={newStaffData.name} onChange={e => setNewStaffData({...newStaffData, name: e.target.value})} required />
                      <TextField id="s-role" label="Professional Designation" placeholder="e.g. Lead Hitting Coach" value={newStaffData.role} onChange={e => setNewStaffData({...newStaffData, role: e.target.value})} required />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Terminal Access Logic</p>
                      <TextField id="s-id" label="Access ID Code (Unique)" placeholder="COACH2" value={newStaffData.idCode} onChange={e => setNewStaffData({...newStaffData, idCode: e.target.value})} required />
                      <TextField id="s-key" label="Secret Terminal Key" type="password" value={newStaffData.securityKey} onChange={e => setNewStaffData({...newStaffData, securityKey: e.target.value})} required />
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                      <button type="submit" className="w-full py-4 bg-tlp-pink text-white rounded-2xl font-black uppercase tracking-widest italic text-xs hover:brightness-110 transition-all shadow-xl shadow-pink-100/50">Authorize Terminal Access</button>
                    </div>
                  </form>
                </div>
              </aside>
            </>
          )}
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
          {!isGuest && (<button onClick={() => setIsAccountOpen(true)} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black italic">G</button>)}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 mt-16">
        <div className="mb-20 flex justify-between relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-tlp-pink -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step-1) * 50}%` }}></div>
          {[1, 2, 3].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${step === s ? 'bg-tlp-pink text-white scale-110 shadow-lg' : step > s ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                {step > s ? <i className="fas fa-check"></i> : s}
              </div>
              <span className={`text-[9px] font-black uppercase mt-3 tracking-widest ${step === s ? 'text-tlp-pink' : 'text-slate-400'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Schedule' : 'Finish'}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 p-6 md:p-12 min-h-[400px] animate-fade-in overflow-hidden">
          {dbError ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl shadow-sm">
                 <i className="fas fa-exclamation-triangle"></i>
               </div>
               <div className="space-y-2">
                 <h2 className="text-lg font-black uppercase italic text-slate-900 tracking-tight">Sync Error</h2>
                 <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{dbError}</p>
               </div>
               <button onClick={fetchDatabase} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-tlp-pink transition-all">Retry Sync</button>
            </div>
          ) : isDbLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
               <div className="w-12 h-12 border-4 border-tlp-pink border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Syncing with Facility Database...</p>
            </div>
          ) : renderPlayerSteps()}
          <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50">
            {step > 1 ? <button onClick={prevStep} className="text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-tlp-pink">go back</button> : <div />}
            <span className="text-[10px] text-slate-500 font-black uppercase">Step {step}/3</span>
          </div>
        </div>
      </main>
      <style>{`
        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes backdrop-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawer-slide-in { 
          from { transform: translateX(100%); } 
          to { transform: translateX(0); } 
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-backdrop-fade { animation: backdrop-fade 0.3s ease-out forwards; }
        .animate-drawer-slide-in { 
          animation: drawer-slide-in 0.45s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; 
          will-change: transform;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #eb328a; }
      `}</style>
    </div>
  );
};

export default App;