
/**
 * Convert a Date object to a Timezone specific Date (as if it were local)
 * Note: This returns a Date object where the headers match the wall-clock time in the target timezone.
 * Use this only for extracting hours/days. Do NOT use this for calculating durations or intervals.
 */
export const toClinicTime = (date, timezone) => {
  if (!timezone) return date; // Fallback

  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  };

  // Format: "1/27/2026, 21:00:00" (en-US)
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
    
  const getPart = (type) => parts.find(p => p.type === type)?.value;

  const year = parseInt(getPart('year'));
  const month = parseInt(getPart('month')) - 1; // 0-indexed
  const day = parseInt(getPart('day'));
  const hour = parseInt(getPart('hour'));
  const minute = parseInt(getPart('minute'));
  
  // Return a new Date object representing this wall-clock time
  // We treat it as "Local" so getDay(), getHours() works as expected for that timezone
  return new Date(year, month, day, hour, minute);
};

export const getDayOfWeekInTimezone = (date, timezone) => {
    const d = toClinicTime(date, timezone);
    const dayMap = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    return dayMap[d.getDay()];
};

export const getTimeStringInTimezone = (date, timezone) => {
    const d = toClinicTime(date, timezone);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
};

export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minStr] = timeStr.split(":");
  let hour = parseInt(hourStr);
  const ampm = hour >= 12 ? "pm" : "am";
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  return `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
};

/**
 * Convert Clinic Wall Clock Time (YYYY-MM-DD + HH:mm) to a UTC Date object
 * Effectively: Reverse of toClinicTime
 */
export const createDateFromClinicTime = (dateStr, timeStr, timezone) => {
    if (!timezone) return new Date(`${dateStr}T${timeStr}:00`);

    // 1. Initial Guess: Treat inputs as UTC
    // e.g. Target: 09:00 Cairo. Guess: 09:00 UTC
    let guess = new Date(`${dateStr}T${timeStr}:00Z`); // Explicit Z to ensure UTC

    // 2. See what time that guess is in the Target Timezone
    // getHourInZone("09:00 UTC", Cairo) -> "11:00"
    // Difference is +2 hours.
    
    // We want the resulting Date, when formatted to timezone, to match `timeStr`.
    // We can use a binary search or iterative adjustment?
    // Iterative adjustment is usually enough for offsets.

    const getOffsetMs = (d) => {
         const options = { timeZone: timezone, hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
         const formatter = new Intl.DateTimeFormat('en-US', options);
         const parts = formatter.formatToParts(d);
         const p = (type) => parts.find(x => x.type === type).value;
         
         // Reconstruct 'wall clock' date from parts
         // Note: Assuming standard gregorian parts
         const wallDate = new Date(Date.UTC(p('year'), p('month') - 1, p('day'), p('hour'), p('minute'), p('second')));
         return wallDate.getTime() - d.getTime(); 
    };

    // "Offset" is roughly Timezone Offset.
    // wallDate = trueDate + offset
    // trueDate = wallDate - offset
    
    // We have "Target Wall Date" (from inputs)
    const targetWallDate = new Date(Date.UTC(
        parseInt(dateStr.split('-')[0]),
        parseInt(dateStr.split('-')[1]) - 1,
        parseInt(dateStr.split('-')[2]),
        parseInt(timeStr.split(':')[0]),
        parseInt(timeStr.split(':')[1])
    ));

    // We need 'd' such that d + getOffsetMs(d) ~= targetWallDate
    // Approximation: d ~= targetWallDate - getOffsetMs(targetWallDate)
    
    // Note: getOffsetMs(targetWallDate) uses targetWallDate as a point in time to check offset rules? 
    // Usually offset rules depend on the actual UTC time.
    // But offset doesn't change THAT often.
    
    const approxOffset = getOffsetMs(targetWallDate); // Check offset at that roughly instant
    let candidate = new Date(targetWallDate.getTime() - approxOffset);

    // Double check
    const actualOffset = getOffsetMs(candidate);
    if (actualOffset !== approxOffset) {
        // Refine
        candidate = new Date(targetWallDate.getTime() - actualOffset);
    }
    
    return candidate;
};


