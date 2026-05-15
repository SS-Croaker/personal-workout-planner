function pad(value) {
  return String(value).padStart(2, '0');
}

function createLocalDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return createLocalDate(year, month - 1, day);
}

function addDays(date, days) {
  return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getMondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

export function isValidDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeActivityDates(values) {
  const unique = new Set();

  (Array.isArray(values) ? values : []).forEach((value) => {
    if (isValidDateKey(value)) {
      unique.add(value);
    }
  });

  return Array.from(unique).sort();
}

export function toggleDateKey(values, dateKey) {
  const nextValues = new Set(normalizeActivityDates(values));

  if (nextValues.has(dateKey)) {
    nextValues.delete(dateKey);
  } else {
    nextValues.add(dateKey);
  }

  return Array.from(nextValues).sort();
}

export function ensureDateKey(values, dateKey) {
  const nextValues = new Set(normalizeActivityDates(values));
  nextValues.add(dateKey);
  return Array.from(nextValues).sort();
}

export function getMonthLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function getMonthActivityCount(activityDates, visibleMonth) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  return normalizeActivityDates(activityDates).filter((dateKey) => {
    const [keyYear, keyMonth] = dateKey.split('-').map(Number);
    return keyYear === year && keyMonth === month + 1;
  }).length;
}

export function getCalendarDays(visibleMonth) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = createLocalDate(year, month, 1);
  const startDayOffset = getMondayIndex(firstOfMonth);
  const calendarStart = addDays(firstOfMonth, -startDayOffset);
  const todayKey = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(calendarStart, index);

    return {
      date: day,
      dateKey: toDateKey(day),
      isCurrentMonth: day.getMonth() === month,
      isToday: toDateKey(day) === todayKey,
    };
  });
}

function startOfWeek(dateKey) {
  const date = parseDateKey(dateKey);
  return toDateKey(addDays(date, -getMondayIndex(date)));
}

export function getConsistencyStats(activityDates) {
  const normalizedDates = normalizeActivityDates(activityDates);
  const uniqueWeeks = Array.from(new Set(normalizedDates.map((dateKey) => startOfWeek(dateKey)))).sort();

  let longestStreak = 0;
  let currentStreak = 0;
  let runningStreak = 0;

  uniqueWeeks.forEach((weekKey, index) => {
    if (index === 0) {
      runningStreak = 1;
    } else {
      const previousWeek = addDays(parseDateKey(uniqueWeeks[index - 1]), 7);
      runningStreak = toDateKey(previousWeek) === weekKey ? runningStreak + 1 : 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
  });

  const thisWeekKey = startOfWeek(toDateKey(new Date()));
  const thisWeekIndex = uniqueWeeks.indexOf(thisWeekKey);

  if (thisWeekIndex !== -1) {
    currentStreak = 1;
    for (let index = thisWeekIndex; index > 0; index -= 1) {
      const previousWeek = addDays(parseDateKey(uniqueWeeks[index]), -7);
      if (toDateKey(previousWeek) !== uniqueWeeks[index - 1]) {
        break;
      }
      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}
