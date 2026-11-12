import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AppButton from '../appButton';
import Colors from '../../styles/color';

export const actionLabels = {
  'auth.register': 'Đăng ký tài khoản', 'auth.login_success': 'Đăng nhập thành công', 'auth.login_failed': 'Đăng nhập thất bại',
  'auth.password_reset_requested': 'Yêu cầu đặt lại mật khẩu', 'auth.otp_verify_failed': 'Xác thực OTP thất bại',
  'auth.password_reset_completed': 'Đặt lại mật khẩu', 'auth.password_changed': 'Đổi mật khẩu',
  'admin.hr_account_created': 'Tạo tài khoản HR', 'user.updated': 'Cập nhật nhân viên', 'user.role_changed': 'Đổi vai trò nhân viên',
  'user.deactivated': 'Vô hiệu hóa nhân viên', 'security.access_denied': 'Từ chối truy cập', 'security.auth_rejected': 'Từ chối xác thực',
  'team.created': 'Tạo nhóm', 'team.updated': 'Cập nhật nhóm', 'team.deleted': 'Xóa nhóm', 'team.member_added': 'Thêm thành viên',
  'team.member_removed': 'Xóa thành viên', 'team.lead_assigned': 'Đổi trưởng nhóm', 'leave.submitted': 'Gửi đơn nghỉ phép',
  'leave.approved': 'Duyệt nghỉ phép', 'leave.rejected': 'Từ chối nghỉ phép', 'leave.cancelled': 'Hủy nghỉ phép',
  'leave.balance_deducted': 'Trừ ngày phép', 'leave.balance_refunded': 'Hoàn ngày phép', 'attendance.manual_updated': 'Sửa chấm công',
  'office.created': 'Tạo văn phòng', 'office.updated': 'Cập nhật văn phòng', 'office.activated': 'Kích hoạt văn phòng',
  'office.deleted': 'Xóa văn phòng', 'task.created': 'Tạo công việc', 'task.updated': 'Cập nhật công việc',
  'task.assigned': 'Giao công việc', 'task.deleted': 'Xóa công việc',
};
export const formatAuditTime = value => value ? `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString()}` : '—';
export const formatAuditValue = value => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
export const AuditButton = props => <AppButton {...props} style={[styles.button, props.style]} textStyle={styles.buttonText} />;
export function AuditState({ loading, error, empty, retry }) {
  return <View accessibilityLiveRegion="polite">
    {loading && <ActivityIndicator size="large" color={Colors.button} accessibilityLabel="Loading audit logs" />}
    {!!error && <View style={styles.card}><Text style={styles.error}>{error}</Text><AuditButton text="Retry" onPress={retry} /></View>}
    {!loading && !error && empty && <Text style={styles.text}>No audit records match</Text>}
  </View>;
}
export function AuditCard({ entry, onPress, history = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
    <Text style={styles.title}>{actionLabels[entry.action] || entry.action}</Text>
    <Text style={styles.text}>{entry.target?.label || entry.target?.type || '—'}</Text>
    <Text style={styles.text}>{entry.actor?.name || entry.actor?.email || entry.actor?.role || 'Anonymous'} · {formatAuditTime(entry.at)}</Text>
    <View style={styles.badges}>
      <Text style={[styles.badge, { color: { info: '#175CD3', warning: '#93370D', critical: '#B42318' }[entry.severity] || Colors.black }]}>{entry.severity}</Text>
      <Text style={styles.badge}>{entry.outcome}</Text>
    </View>
    {(history || entry.reason != null) && <Text style={styles.reason} numberOfLines={history ? undefined : 2}>Lý do: {history ? entry.reason ?? 'No reason recorded' : entry.reason.length > 60 ? `${entry.reason.slice(0, 60)}…` : entry.reason}</Text>}
  </Pressable>;
}
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 32 },
  card: { padding: 16, borderRadius: 12, backgroundColor: Colors.secondary, gap: 8, minHeight: 44 },
  title: { fontSize: 17, fontWeight: '600', color: Colors.black },
  text: { fontSize: 14, color: Colors.black, lineHeight: 21 },
  reason: { fontSize: 15, fontWeight: '600', color: Colors.black, lineHeight: 23 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: Colors.white, fontSize: 13 },
  button: { minHeight: 44, height: 'auto', width: '100%', padding: 12, borderRadius: 12 },
  buttonText: { fontSize: 15, color: Colors.white },
  error: { fontSize: 14, color: '#B42318' },
  input: { minHeight: 44, borderWidth: 1, borderColor: Colors.borderGray, borderRadius: 12, padding: 12, color: Colors.black, backgroundColor: Colors.white },
  filter: { gap: 6 }, row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  cell: { flex: 1, padding: 8, fontSize: 13, color: Colors.black },
});
