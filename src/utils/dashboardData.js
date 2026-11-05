export function responseData(response) {
  if (response?.success !== true || response.data === null || typeof response.data !== 'object') {
    throw new Error(errorMessage(response, 'The server returned an incomplete response.'));
  }
  return response.data;
}

export function errorMessage(error, fallback = 'Unable to load this section. Please retry.') {
  return [error?.error, error?.message, error].find((value) => typeof value === 'string' && value.trim()) || fallback;
}

export const records = (rows) => Array.isArray(rows) && rows.every((row) => row && typeof row === 'object' && !Array.isArray(row)) ? rows : null;
export function responseRecords(response) {
  const rows = records(responseData(response));
  if (!rows) throw new Error('The server returned an incomplete list. Please retry.');
  return rows;
}

export function rankRows(rows, field, populationField) {
  if (!records(rows) || rows.some((row) => !isNumber(row[field]) || (populationField && !isNumber(row[populationField])))) return null;
  return rows.filter((row) => !populationField || row[populationField] > 0).sort((a, b) => b[field] - a[field]);
}

export const rateWithPopulation = (rate, population) => isNumber(population) && population > 0 && isNumber(rate) && rate <= 100 ? rate : undefined;

export function displayDate(value) {
  if (typeof value !== 'string' || !value) return 'Not available';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB') : 'Not available';
}

export function overduePage(response, requestedPage, limit) {
  const tasks = responseRecords(response);
  if (!Number.isInteger(response.total) || response.total < 0 || response.page !== requestedPage
    || response.pages !== Math.ceil(response.total / limit)
    || tasks.length !== Math.min(limit, Math.max(0, response.total - (requestedPage - 1) * limit))) {
    throw new Error('Incomplete overdue task pagination. Please retry.');
  }
  return { tasks, pages: response.pages, total: response.total };
}

export const isNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const displayNumber = (value, suffix = '') => isNumber(value)
  ? `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}` : 'Not available';

// Never present a single page as a complete aggregate.
export async function collectPages(fetchPage, teamPagination = false) {
  const result = [];
  let page = 1;
  let pages = 1;
  let expectedTotal;
  do {
    const response = await fetchPage(page);
    const rows = responseData(response);
    pages = teamPagination ? response.pagination?.total : response.pages;
    const total = teamPagination ? response.pagination?.totalRecords : response.total;
    const current = teamPagination ? response.pagination?.current : response.page;
    if (!records(rows) || rows.some((row) => typeof row._id !== 'string' || !row._id)
      || !Number.isInteger(pages) || pages < 0 || !Number.isInteger(total) || total < 0 || current !== page) {
      throw new Error('The server returned invalid pagination.');
    }
    if (expectedTotal !== undefined && total !== expectedTotal) throw new Error('The list changed while loading. Please retry.');
    expectedTotal = total;
    if (page < pages && !rows.length) throw new Error('The server returned an incomplete page.');
    result.push(...rows);
    page += 1;
  } while (page <= pages);
  if (result.length !== expectedTotal || new Set(result.map((row) => row._id)).size !== result.length) throw new Error('The list changed while loading. Please retry.');
  return result;
}

export function countTaskStatuses(tasks) {
  if (!records(tasks)) return null;
  const counts = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  for (const task of tasks) {
    if (!Object.prototype.hasOwnProperty.call(counts, task.status)) return null;
    counts[task.status] += 1;
  }
  return Object.entries(counts).map(([id, count]) => ({ _id: id, count }));
}

export function daysOverdue(task, now = new Date()) {
  if (!task || !['todo', 'in_progress', 'in_review'].includes(task.status) || !task.dueDate) return null;
  const due = new Date(task.dueDate).getTime();
  return Number.isFinite(due) && due < now.getTime() ? Math.floor((now.getTime() - due) / 86400000) : null;
}
