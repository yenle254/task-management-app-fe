// Date-only values use local calendar dates, matching the server.
export const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const pickParams = (input = {}, keys = []) => Object.fromEntries(
  keys.filter((key) => input?.[key] !== undefined && input[key] !== null && input[key] !== '')
    .map((key) => [key, input[key]])
);

export function dateRange(input = {}, requirePair = true) {
  const result = pickParams(input, ['startDate', 'endDate']);
  for (const value of Object.values(result)) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use dates in YYYY-MM-DD format.');
    const [year, month, day] = value.split('-').map(Number);
    if (dateString(new Date(year, month - 1, day)) !== value) throw new Error('Enter a valid calendar date.');
  }
  if (requirePair && Boolean(result.startDate) !== Boolean(result.endDate)) throw new Error('Enter both start and end dates.');
  if (result.startDate && result.endDate && result.startDate > result.endDate) throw new Error('Start date must not be after end date.');
  return result;
}

export function calendarParams(input = {}) {
  const range = dateRange(input);
  if (range.startDate) return range;
  const params = pickParams(input, ['month', 'year']);
  for (const key of Object.keys(params)) {
    const value = Number(params[key]);
    const max = key === 'month' ? 12 : new Date().getFullYear() + 1;
    const min = key === 'month' ? 1 : 1970;
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}.`);
    params[key] = value;
  }
  return params;
}

export function taskParams(input = {}) {
  return { ...dateRange(input, false), ...pickParams(input, ['teamId', 'employeeId', 'status', 'priority']) };
}

export function trendParams(input = {}, period) {
  const params = { ...dateRange(input), ...pickParams(input, ['teamId', 'employeeId', 'period']) };
  if (period) params.period = period;
  if (params.period && !['week', 'month'].includes(params.period)) throw new Error('Choose weekly or monthly grouping.');
  return params;
}

export function presetRange(preset = 'month', now = new Date()) {
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (preset === 'week') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7);
    end = new Date(start); end.setDate(start.getDate() + 6);
  } else if (preset === 'previous') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  return { startDate: dateString(start), endDate: dateString(end) };
}

export const changeTeam = (filters, teamId) => ({ ...filters, teamId, employeeId: '' });

export function calendarDate(draft, applied) {
  let value = draft;
  try { if (!dateRange({ startDate: value }, false).startDate) value = applied; }
  catch { value = applied; }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
