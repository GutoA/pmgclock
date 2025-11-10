import React, { useState, useEffect } from 'react';
import { City } from '../types';
import { getGmtOffsetInMinutes, formatTime, formatDate, getDayDiff } from '../utils';

interface CityClockCardProps {
  city: City;
  index: number;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  isFeatured?: boolean;
  baseTime: Date;
  mode: 'live' | 'select';
  referenceTimezone?: string;
  timeFormat: '12h' | '24h';
}

const timezoneAbbrOverrides: { [key: string]: string } = {
    'Asia/Kolkata': 'IST'
};


export const CityClockCard: React.FC<CityClockCardProps> = ({ city, index, onDragStart, onDragEnter, onDragEnd, isFeatured = false, baseTime, mode, referenceTimezone, timeFormat }) => {
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    if (mode === 'live') {
      const timerId = setInterval(() => {
        setLiveTime(new Date());
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [mode]);

  const timeToDisplay = mode === 'live' ? liveTime : baseTime;

  const { hour, minute, second, dayPeriod } = formatTime(timeToDisplay, city.timezone, timeFormat === '12h');
  const dateString = isFeatured ? formatDate(timeToDisplay, city.timezone) : '';

  let timezoneAbbr = '';
  try {
    timezoneAbbr = timezoneAbbrOverrides[city.timezone] || new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: city.timezone }).formatToParts(timeToDisplay).find(p => p.type === 'timeZoneName')?.value || '';
  } catch (e) {
    console.error(`Error getting timezone abbreviation for ${city.timezone}`, e);
    timezoneAbbr = '---';
  }
  
  let offsetString = '';
  let dayDiff = 0;

  if (referenceTimezone && city.timezone !== referenceTimezone) {
    const cityOffset = getGmtOffsetInMinutes(city.timezone, timeToDisplay);
    const refOffset = getGmtOffsetInMinutes(referenceTimezone, timeToDisplay);
    const diffHours = (cityOffset - refOffset) / 60;
    if (diffHours !== 0 && !isFeatured) {
        offsetString = `, ${diffHours > 0 ? '+' : ''}${diffHours}h`;
    }
    dayDiff = getDayDiff(timeToDisplay, city.timezone, referenceTimezone);
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const cardClasses = isFeatured ? "p-4 md:p-6" : "p-6";
  const cityNameClasses = isFeatured ? "text-4xl md:text-5xl" : "text-3xl";
  const countryClasses = isFeatured ? "text-lg" : "text-base";
  const flagClasses = isFeatured ? "text-6xl md:text-7xl" : "text-5xl";
  const timeContainerClasses = isFeatured
    ? "font-mono text-center tracking-wider bg-gray-200/50 dark:bg-slate-900/50 rounded-lg p-3 md:p-4 text-[clamp(3.5rem,12vw,6rem)]"
    : "font-mono text-center tracking-wider bg-gray-200/50 dark:bg-slate-900/50 rounded-lg p-4 text-[clamp(2.25rem,9vw,3.5rem)]";
  const isDraggable = mode === 'live';

  return (
    <div
      draggable={isDraggable}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-300 dark:border-slate-700 ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105 hover:border-cyan-500 dark:hover:border-cyan-400' : ''} transition-all duration-300 ease-in-out h-full flex flex-col justify-between ${cardClasses}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
                <h2 className={`${cityNameClasses} font-bold text-slate-800 dark:text-slate-100`}>{city.name}</h2>
                <p className={`${countryClasses} text-slate-500 dark:text-slate-400`}>
                    {city.country} 
                    <span className="text-slate-400 dark:text-slate-500 ml-2">({timezoneAbbr}{offsetString})</span>
                </p>
            </div>
            <span className={flagClasses}>{city.flag}</span>
        </div>
        <div className={`${timeContainerClasses} relative flex items-baseline justify-center`}>
            <div>
                <span className="text-cyan-600 dark:text-cyan-400">{hour}</span>
                <span className={`text-slate-400 dark:text-slate-500 ${mode === 'live' ? 'animate-pulse' : ''}`}>:</span>
                <span className="text-cyan-600 dark:text-cyan-400">{minute}</span>
                {isFeatured && (
                  <>
                    <span className={`text-slate-400 dark:text-slate-500 ${mode === 'live' ? 'animate-pulse' : ''}`}>:</span>
                    <span className="text-cyan-600 dark:text-cyan-400">{second}</span>
                  </>
                )}
            </div>
            {timeFormat === '12h' && <span className={`text-slate-400 dark:text-slate-500 ml-2 font-sans ${isFeatured ? 'text-4xl' : 'text-2xl'}`}>{dayPeriod}</span>}
        </div>
        {!isFeatured && dayDiff !== 0 && (
            <div className="text-center mt-2">
                {dayDiff === 1 && <p className="text-green-500 dark:text-green-400 font-semibold text-lg">+1 day</p>}
                {dayDiff === -1 && <p className="text-red-500 dark:text-red-400 font-semibold text-lg">-1 day</p>}
            </div>
        )}
      </div>
      {isFeatured && (
        <div className="text-center mt-4">
            <p className="text-slate-600 dark:text-slate-300 text-2xl md:text-3xl">{dateString}</p>
        </div>
      )}
    </div>
  );
};
