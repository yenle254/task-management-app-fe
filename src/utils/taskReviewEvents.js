const listeners = new Set();
export const subscribeTaskReview = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const emitTaskReview = () => listeners.forEach(listener => listener());
