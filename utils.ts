export const getGmtOffsetInMinutes = (timeZone: string, date: Date): number => {
    try {
        const longOffset = new Intl.DateTimeFormat("en-US", {
            timeZone,
            timeZoneName: "longOffset",
        }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value;
        
        if (!longOffset) return 0;

        const match = longOffset.match(/GMT([+-])(\d+)(?::(\d+))?/);
        if (!match) return 0;
        
        const [, sign, hoursStr, minutesStr] = match;
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr || '0', 10);
        const totalMinutes = hours * 60 + minutes;

        return sign === '+' ? totalMinutes : -totalMinutes;
    } catch (e) {
        console.error(`Invalid timezone provided: ${timeZone}`, e);
        return 0;
    }
};

export const formatTime = (date: Date, timezone: string, hour12: boolean) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: hour12,
    });

    const parts = formatter.formatToParts(date);
    const timeParts = { hour: '--', minute: '--', second: '--', dayPeriod: '' };

    for (const part of parts) {
      if (part.type === 'hour') timeParts.hour = part.value;
      if (part.type === 'minute') timeParts.minute = part.value;
      if (part.type === 'second') timeParts.second = part.value;
      if (part.type === 'dayPeriod') timeParts.dayPeriod = part.value.toUpperCase();
    }
    
    return timeParts;
  } catch (e) {
    console.error(`Error formatting time for timezone: ${timezone}`, e);
    return { hour: '--', minute: '--', second: '--', dayPeriod: '' };
  }
};

export const formatDate = (date: Date, timezone: string | undefined) => {
    try {
      const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: timezone }).format(date);
      const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: timezone }).format(date);
      const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: timezone }).format(date);
      let suffix = 'th';
      if (day.endsWith('1') && !day.endsWith('11')) suffix = 'st';
      else if (day.endsWith('2') && !day.endsWith('12')) suffix = 'nd';
      else if (day.endsWith('3') && !day.endsWith('13')) suffix = 'rd';
      return `${day}${suffix} ${month} ${year}`;
    } catch (e) {
      console.error(`Error formatting date for timezone: ${timezone}`, e);
      return "Invalid Date";
    }
};

export const getDayDiff = (baseTime: Date, cityTimezone: string, refTimezone: string): number => {
    try {
      const options: Intl.DateTimeFormatOptions = { timeZone: cityTimezone, year: 'numeric', month: '2-digit', day: '2-digit' };
      const cityDateStr = new Intl.DateTimeFormat('en-CA', options).format(baseTime);
      
      options.timeZone = refTimezone;
      const refDateStr = new Intl.DateTimeFormat('en-CA', options).format(baseTime);

      if (cityDateStr > refDateStr) return 1;
      if (cityDateStr < refDateStr) return -1;
      return 0;
    } catch (e) {
      console.error(`Error calculating day diff for timezones: ${cityTimezone}, ${refTimezone}`, e);
      return 0;
    }
};