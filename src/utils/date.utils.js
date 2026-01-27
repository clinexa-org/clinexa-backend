
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

