import { responseRecords } from './dashboardData';

export function localDay(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function homeTasks(response) {
  const tasks = responseRecords(response);
  if (tasks.some(task => typeof task._id !== 'string' || typeof task.title !== 'string')) {
    throw new Error('Task information is incomplete. Please retry.');
  }
  return tasks;
}

export function homeTaskPage(response, page, limit) {
  const tasks = homeTasks(response);
  if (!Number.isInteger(response.total) || response.total < 0 || response.page !== page ||
      response.pages !== Math.ceil(response.total / limit) ||
      tasks.length !== Math.min(limit, Math.max(0, response.total - (page - 1) * limit))) {
    throw new Error('Task pagination is incomplete. Please retry.');
  }
  return { tasks, total: response.total, pages: response.pages };
}

export function scheduleTime(task) {
  const format = value => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  };
  const start = format(task.startDate), end = format(task.dueDate);
  return start && end ? `${start} – ${end}` : end ? `Due ${end}` : start ? `Starts ${start}` : 'Time not set';
}
