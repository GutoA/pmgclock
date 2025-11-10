import React, { useState, useRef, useCallback, useEffect } from 'react';
import { City } from './types';
import { CityClockCard } from './components/CityClockCard';
import { getGmtOffsetInMinutes, formatDate } from './utils';

type Mode = 'live' | 'select';
type Theme = 'light' | 'dark';
type TimeFormat = '12h' | '24h';

const INITIAL_CITIES: City[] = [
  { id: 1, name: 'Cardiff', country: 'Wales', timezone: 'Europe/London', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { id: 2, name: 'New York', country: 'USA', timezone: 'America/New_York', flag: '🇺🇸' },
  { id: 3, name: 'Mountain View', country: 'USA', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 4, name: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
];

const TimeSelector = ({ selectedDateTime, onDateTimeChange, selectedCityId, onCityChange, cities, timeFormat }) => {
    const [openPopup, setOpenPopup] = useState<'time' | 'city' | null>(null);
    const timePopupRef = useRef<HTMLDivElement>(null);
    const cityPopupRef = useRef<HTMLDivElement>(null);
    const selectedCity = cities.find(c => c.id === selectedCityId)!;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                timePopupRef.current && !timePopupRef.current.contains(event.target as Node) &&
                cityPopupRef.current && !cityPopupRef.current.contains(event.target as Node)
            ) {
                setOpenPopup(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Helper to create a new Date object representing a local time in a specific timezone
    const createDateInTimezone = (components: { year: number, month: number, day: number, hour: number, minute: number }) => {
        const { year, month, day, hour, minute } = components;
        
        // Create a string that represents the desired local time.
        const localDateTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

        // Create a temporary Date object. JS will parse this in the browser's local timezone.
        const tempDate = new Date(localDateTimeString);
        if (isNaN(tempDate.getTime())) return selectedDateTime; // Return original date if invalid

        // Get the offset (in minutes) for the browser's current timezone and the target city's timezone.
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserOffset = getGmtOffsetInMinutes(browserTimezone, tempDate);
        const targetOffset = getGmtOffsetInMinutes(selectedCity.timezone, tempDate);
        
        // Calculate the difference. This is how many minutes we need to adjust the timestamp by.
        const offsetDifferenceInMinutes = browserOffset - targetOffset;
        
        // Adjust the timestamp of our temporary date to get the correct UTC timestamp.
        const finalTimestamp = tempDate.getTime() - (offsetDifferenceInMinutes * 60 * 1000);

        return new Date(finalTimestamp);
    };

    // Helper to get the current date/time components in the selected city's timezone
    const getCurrentLocalComponents = useCallback(() => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: selectedCity.timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric',
            hour12: false,
        }).formatToParts(selectedDateTime);

        return {
            year: parseInt(parts.find(p => p.type === 'year')!.value, 10),
            month: parseInt(parts.find(p => p.type === 'month')!.value, 10),
            day: parseInt(parts.find(p => p.type === 'day')!.value, 10),
            hour: parseInt(parts.find(p => p.type === 'hour')!.value, 10) % 24,
            minute: parseInt(parts.find(p => p.type === 'minute')!.value, 10),
        };
    }, [selectedDateTime, selectedCity.timezone]);

    const localComponents = getCurrentLocalComponents();

    const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const components = { ...localComponents };
        
        if (name === 'hour') {
            components.hour = parseInt(value, 10);
        } else if (name === 'minute') {
            components.minute = parseInt(value, 10);
        }
        
        onDateTimeChange(createDateInTimezone(components));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (!dateString) return;

        const components = { ...localComponents };
        const [year, month, day] = dateString.split('-').map(Number);
        
        components.year = year;
        components.month = month; // month from input is 1-based
        components.day = day;

        onDateTimeChange(createDateInTimezone(components));
    };
    
    const formatDateToInput = (date: Date, timezone: string): string => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(date);
        
        const year = parts.find(p => p.type === 'year')!.value;
        const month = parts.find(p => p.type === 'month')!.value;
        const day = parts.find(p => p.type === 'day')!.value;
        
        return `${year}-${month}-${day}`;
    };

    const timeString = selectedDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat === '12h',
        timeZone: selectedCity.timezone,
    });
    
    const dateDisplayString = formatDate(selectedDateTime, selectedCity.timezone);
    const selectedDateInput = formatDateToInput(selectedDateTime, selectedCity.timezone);

    return (
        <div className="w-full max-w-7xl text-center bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg p-4 md:p-6 mb-4 text-slate-600 dark:text-slate-300 text-lg md:text-xl relative">
            What time will it be everywhere when it's {' '}
            <div className="inline-block relative" ref={timePopupRef}>
                <button onClick={() => setOpenPopup(openPopup === 'time' ? null : 'time')} className="bg-cyan-500/20 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300 font-bold px-3 py-1 rounded-md cursor-pointer hover:bg-cyan-500/30 dark:hover:bg-cyan-400/30 transition-colors">{timeString}</button>
                {openPopup === 'time' && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-10 shadow-lg flex gap-2">
                        <select name="hour" value={localComponents.hour} onChange={handleTimeChange} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white p-2 rounded">
                            {[...Array(24).keys()].map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
                        </select>
                        <select name="minute" value={localComponents.minute} onChange={handleTimeChange} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white p-2 rounded">
                             {[...Array(60).keys()].map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                        </select>
                    </div>
                )}
            </div>
            {' '} in {' '}
             <div className="inline-block relative" ref={cityPopupRef}>
                <button onClick={() => setOpenPopup(openPopup === 'city' ? null : 'city')} className="bg-cyan-500/20 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300 font-bold px-3 py-1 rounded-md cursor-pointer hover:bg-cyan-500/30 dark:hover:bg-cyan-400/30 transition-colors">{selectedCity?.name}</button>
                 {openPopup === 'city' && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 z-10 shadow-lg min-w-max">
                        {cities.map(city => <button key={city.id} onClick={() => { onCityChange(city.id); setOpenPopup(null); }} className="block w-full text-left p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded whitespace-nowrap">{city.name}</button>)}
                    </div>
                 )}
            </div>
            {' '} on {' '}
             <div className="inline-block">
                <label className="relative bg-cyan-500/20 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300 font-bold px-3 py-1 rounded-md cursor-pointer hover:bg-cyan-500/30 dark:hover:bg-cyan-400/30 transition-colors">
                    {dateDisplayString}
                    <input 
                        type="date" 
                        value={selectedDateInput} 
                        onChange={handleDateChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        aria-label="Select Date"
                    />
                </label>
            </div>
            ?
        </div>
    );
};

const ModeSwitcher = ({ mode, onModeChange }) => {
    return (
        <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full p-1 shadow-lg">
            <button onClick={() => onModeChange('live')} className={`px-6 py-2 rounded-full transition-colors ${mode === 'live' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Live Time</button>
            <button onClick={() => onModeChange('select')} className={`px-6 py-2 rounded-full transition-colors ${mode === 'select' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Select Time</button>
        </div>
    );
};

const TimeFormatSwitcher = ({ format, onFormatChange }) => {
    return (
        <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full p-1 shadow-sm">
            <button onClick={() => onFormatChange('12h')} className={`px-4 py-1 text-sm rounded-full transition-colors ${format === '12h' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>12 Hour</button>
            <button onClick={() => onFormatChange('24h')} className={`px-4 py-1 text-sm rounded-full transition-colors ${format === '24h' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>24 Hour</button>
        </div>
    );
};

const ThemeSwitcher = ({ theme, onThemeChange }) => {
    return (
        <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full p-1 shadow-sm">
            <button onClick={() => onThemeChange('light')} className={`px-4 py-1 text-sm rounded-full transition-colors ${theme === 'light' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Light</button>
            <button onClick={() => onThemeChange('dark')} className={`px-4 py-1 text-sm rounded-full transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Dark</button>
        </div>
    );
};

const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [mode, setMode] = useState<Mode>('live');
  const [theme, setTheme] = useState<Theme>('dark');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  const defaultSelectedDate = new Date();
  defaultSelectedDate.setHours(9, 0, 0, 0);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(defaultSelectedDate);
  const [selectedCityId, setSelectedCityId] = useState<number>(INITIAL_CITIES[0].id);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const userOffset = getGmtOffsetInMinutes(userTimezone, now);

    const citiesWithOffsets = INITIAL_CITIES.map(city => ({
      ...city,
      offset: getGmtOffsetInMinutes(city.timezone, now),
      diff: Math.abs(getGmtOffsetInMinutes(city.timezone, now) - userOffset),
    }));

    citiesWithOffsets.sort((a, b) => a.diff - b.diff);

    const featuredCity = citiesWithOffsets[0];
    const otherCities = INITIAL_CITIES.filter(c => c.id !== featuredCity.id);

    otherCities.sort((a, b) => getGmtOffsetInMinutes(a.timezone, now) - getGmtOffsetInMinutes(b.timezone, now));

    const featuredCityFromInitial = INITIAL_CITIES.find(c => c.id === featuredCity.id);
    if (!featuredCityFromInitial) return;

    const finalCityOrder = [
        featuredCityFromInitial,
        ...otherCities
    ];
    
    setCities(finalCityOrder);
  }, []);

  const handleDragStart = (index: number) => {
    if (mode === 'select') return;
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    if (mode === 'select') return;
    dragOverItem.current = index;
  };

  const handleDragEnd = useCallback(() => {
    if (mode === 'select' || dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    
    setCities(prevCities => {
      const newCities = [...prevCities];
      const draggedItemContent = newCities.splice(dragItem.current!, 1)[0];
      newCities.splice(dragOverItem.current!, 0, draggedItemContent);
      return newCities;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  }, [mode]);
  
  const handleModeChange = (newMode: Mode) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMode(newMode);
  };
  
  const handleCityChange = (newCityId: number) => {
    const oldCity = INITIAL_CITIES.find(c => c.id === selectedCityId)!;
    const newCity = INITIAL_CITIES.find(c => c.id === newCityId)!;

    if (oldCity.id === newCity.id) return;

    // Preserve the local time by adjusting the UTC timestamp based on the timezone offset difference.
    const dateForOffset = new Date(selectedDateTime.getTime());
    const oldOffset = getGmtOffsetInMinutes(oldCity.timezone, dateForOffset);
    const newOffset = getGmtOffsetInMinutes(newCity.timezone, dateForOffset);
    const offsetDifferenceInMinutes = newOffset - oldOffset;

    const newTimestamp = selectedDateTime.getTime() - (offsetDifferenceInMinutes * 60 * 1000);
    
    setSelectedDateTime(new Date(newTimestamp));
    setSelectedCityId(newCityId);
  };

  const selectedCity = INITIAL_CITIES.find(c => c.id === selectedCityId);

  if (!selectedCity) {
      return <div className="min-h-screen w-full bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-white flex justify-center items-center"><p>Error: Could not find selected city.</p></div>;
  }

  let baseTime: Date;

  if (mode === 'live') {
    baseTime = new Date();
  } else {
    baseTime = selectedDateTime;
  }
  
  let displayCities = cities;
  let referenceTimezone: string | undefined = cities.length > 0 ? cities[0].timezone : undefined;

  if (mode === 'select') {
    const featured = INITIAL_CITIES.find(c => c.id === selectedCityId)!;
    const others = INITIAL_CITIES.filter(c => c.id !== selectedCityId);
    others.sort((a, b) => getGmtOffsetInMinutes(a.timezone, baseTime) - getGmtOffsetInMinutes(b.timezone, baseTime));
    displayCities = [featured, ...others];
    referenceTimezone = featured.timezone;
  }
  
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="text-center mb-4 md:mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-600 dark:text-cyan-400">PMG Team Time</h1>
        {mode === 'live' && <p className="text-slate-500 dark:text-slate-400 mt-2">Drag and drop to reorder clocks</p>}
      </header>

      <div className="mb-4 md:mb-6">
        <ModeSwitcher mode={mode} onModeChange={handleModeChange} />
      </div>
      
      {mode === 'select' && (
          <TimeSelector 
              selectedDateTime={selectedDateTime}
              onDateTimeChange={setSelectedDateTime}
              selectedCityId={selectedCityId}
              onCityChange={handleCityChange}
              cities={INITIAL_CITIES}
              timeFormat={timeFormat}
          />
      )}
      <main className="w-full max-w-7xl flex-grow flex flex-col">
        {displayCities.length > 0 && (
            <div className="mb-4 md:mb-8">
                 <CityClockCard
                    key={displayCities[0].id}
                    city={displayCities[0]}
                    index={0}
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDragEnd={handleDragEnd}
                    isFeatured={true}
                    baseTime={baseTime}
                    mode={mode}
                    referenceTimezone={referenceTimezone}
                    timeFormat={timeFormat}
                />
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 flex-grow">
          {displayCities.slice(1).map((city, index) => (
            <CityClockCard
              key={city.id}
              city={city}
              index={index + 1}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              isFeatured={false}
              baseTime={baseTime}
              mode={mode}
              referenceTimezone={referenceTimezone}
              timeFormat={timeFormat}
            />
          ))}
        </div>
      </main>
       <footer className="w-full max-w-7xl mx-auto text-center p-4 mt-8 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center">
        <TimeFormatSwitcher format={timeFormat} onFormatChange={setTimeFormat} />
        <p className="text-slate-400 dark:text-slate-500 text-sm hidden sm:block">Built by Guto with Gemini</p>
        <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
      </footer>
    </div>
  );
};

export default App;