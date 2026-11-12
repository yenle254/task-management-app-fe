import ToDo from '../../assets/icons/todo.svg';
import InProgress from '../../assets/icons/inprogress.svg';
import Done from '../../assets/icons/done.svg';
// Reuse the established outline icon family; labels distinguish review from work.
export const taskStatusMap = {
  todo: { label: 'To Do', text: 'To Do', color: '#667085', bgColor: '#F2F4F7', icon: ToDo },
  in_progress: { label: 'In Progress', text: 'In Progress', color: '#0284C7', bgColor: '#E0F2FE', icon: InProgress },
  in_review: { label: 'In Review', text: 'In Review', color: '#6941C6', bgColor: '#F4EBFF', icon: InProgress },
  done: { label: 'Done', text: 'Done', color: '#16A34A', bgColor: '#DCFCE7', icon: Done },
};
export const getTaskStatus = status => taskStatusMap[status] || taskStatusMap.todo;
