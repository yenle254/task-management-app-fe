export function notificationTarget(data = {}, role) {
  const relatedId = typeof data.relatedId === 'object' ? data.relatedId?._id : data.relatedId;
  const type = data.type || '';
  if (role === 'system_admin') return null;
  if (data.target === 'task_review_inbox' || ['task_submitted_for_review', 'task_review_reminder', 'task_review_withdrawn'].includes(type)) return ['team_lead', 'hr_manager'].includes(role) ? { screen: 'Approvals', params: {} } : { screen: 'Notification' };
  if ((data.target === 'task_detail' || type.startsWith('task_') || ['comment_added', 'deadline_reminder'].includes(type)) && relatedId)
    return { screen: 'TaskDetail', params: { taskId: relatedId } };
  if (data.target === 'leave' || type.startsWith('leave_'))
    return { screen: type === 'leave_pending' && ['team_lead', 'hr_manager'].includes(role) ? 'LeaveInbox' : 'MyLeaves' };
  if (data.target === 'attendance' || type.startsWith('attendance_'))
    return role === 'hr_manager' ? { screen: 'Attendance' } : { screen: 'Main', params: { screen: 'clockin' } };
  return { screen: 'Notification' };
}
export function inAppEnabled(preferences, type = '') {
  const group = preferences?.categories?.[categoryFor(type)];
  return !!preferences?.master && !!group?.inApp && (group.types?.[type]?.inApp ?? true);
}
export function categoryFor(type = '') {
  return type.startsWith('leave_') ? 'leave' : type.startsWith('attendance_') ? 'attendance' : 'task';
}
