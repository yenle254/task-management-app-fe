export const ROLE_LABELS = {
  employee: 'Nhân viên (Employee)',
  team_lead: 'Trưởng nhóm (Team Lead)',
  hr_manager: 'Quản lý Nhân sự (HR Manager)',
  system_admin: 'Quản trị Hệ thống'
};

export const getDefaultQuickPrompts = (role) => {
  if (role === 'team_lead' || role === 'hr_manager') {
    return [
      'Tôi có một task độ khó Hard cần làm gấp trong 2 ngày tới, nên giao cho ai trong team?',
      'Hôm nay tôi cần ưu tiên làm task nào trước?',
      'Năm nay tôi còn bao nhiêu ngày phép?',
      'Tháng này tôi đi làm đủ công chưa, có đi muộn ngày nào không?',
      'Quy định chấm công GPS của văn phòng tôi là gì?',
      'Tạo đơn xin nghỉ phép ngày mai vì lý do cá nhân'
    ];
  }
  return [
    'Hôm nay tôi cần ưu tiên làm task nào trước?',
    'Năm nay tôi còn bao nhiêu ngày phép?',
    'Tháng này tôi đi làm đủ công chưa, có đi muộn ngày nào không?',
    'Quy định chấm công GPS của văn phòng tôi là gì?',
    'Log giúp tôi 60 phút làm việc cho task hiện tại với ghi chú: Hoàn thành phần chính',
    'Tạo đơn xin nghỉ phép ngày mai vì lý do cá nhân'
  ];
};

export const buildWelcomeMessage = (user) => ({
  id: 'welcome-msg',
  role: 'assistant',
  content:
    `Xin chào **${user?.profile?.fullName || user?.email || 'bạn'}**! Tôi là **Trợ lý ảo Nội bộ (AI HR & Task Copilot)**.\n\n` +
    `Tôi kết nối trực tiếp với cơ sở dữ liệu hệ thống theo đúng quyền hạn **${ROLE_LABELS[user?.role] || user?.role}** của bạn để hỗ trợ:\n` +
    `• Tra cứu công việc ưu tiên, hạn chót & phụ thuộc (Dependencies)\n` +
    `• Kiểm tra quỹ phép năm, chấm công tháng & quy định GPS văn phòng\n` +
    (user?.role === 'team_lead' || user?.role === 'hr_manager'
      ? `• **Smart Workload Advisor**: Gợi ý giao việc theo lịch nghỉ phép & tải công việc thực tế của Team\n`
      : '') +
    `• **Chat-to-Action**: Thực thi nhanh Log thời gian làm việc hoặc Nộp đơn nghỉ phép ngay trong khung chat.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  proposedAction: null
});

