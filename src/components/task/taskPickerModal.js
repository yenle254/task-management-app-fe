import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const PRIMARY = '#5B4EF8';

// Status chip styling; label text comes from the real task status.
const STATUS_META = {
  todo: { label: 'To Do', color: '#2563EB', bg: '#E0EAFF', icon: 'dot' },
  in_progress: { label: 'In Progress', color: '#9333EA', bg: '#F3E8FF', icon: 'flag' },
  in_review: { label: 'In Review', color: '#16A34A', bg: '#DCFCE7', icon: 'clock' },
  done: { label: 'Done', color: '#4F46E5', bg: '#E0E7FF', icon: 'dot' },
};
const statusMeta = status => STATUS_META[status] || { label: status || 'Unknown', color: '#64748B', bg: '#F1F5F9', icon: 'dot' };

// No sequential task number exists in the model; derive a short, stable code from the real id.
export const shortTaskCode = id => `#T-${String(id || '').slice(-4).toUpperCase()}`;

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M11 18l-6-6 6-6" stroke={PRIMARY} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke="#64748B" strokeWidth={2} />
      <Path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatusIcon({ type, color }) {
  if (type === 'flag') {
    return (
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
        <Path d="M5 3v18" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
        <Path d="M5 4h13l-2.6 4.2L18 12.5H5V4z" fill={color} />
      </Svg>
    );
  }
  if (type === 'clock') {
    return (
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={2.6} />
        <Path d="M12 7.5V12l3 1.8" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      </Svg>
    );
  }
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

/**
 * Full-screen task picker used for selecting a parent task or a dependency.
 * Tapping a row selects it; the bottom button confirms the selection.
 */
export default function TaskPickerModal({
  visible,
  title,
  subtitle,
  confirmLabel = 'Select task',
  search,
  onSearchChange,
  tasks,
  loading,
  error,
  onRetry,
  hasMore,
  onLoadMore,
  busy,
  onClose,
  onConfirm,
}) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!visible) setSelectedId(null);
  }, [visible]);

  const selectedTask = tasks.find(item => item._id === selectedId) || null;

  const renderItem = ({ item }) => {
    const selected = item._id === selectedId;
    const meta = statusMeta(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.8}
        onPress={() => setSelectedId(selected ? null : item._id)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${item.title}, ${meta.label}`}
      >
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <CheckIcon />}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
              <StatusIcon type={meta.icon} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.codeText}>•  {shortTaskCode(item._id)}</Text>
          </View>
        </View>
        <ChevronRightIcon />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
            <BackIcon />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search tasks..."
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Search tasks"
          />
        </View>

        {!!error && (
          <TouchableOpacity onPress={onRetry} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error} · Retry</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={tasks}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasMore && !loading) onLoadMore?.(); }}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No matching accessible tasks</Text> : null}
          ListFooterComponent={loading ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 12 }} /> : null}
        />

        <TouchableOpacity
          style={[styles.confirmButton, (!selectedTask || busy) && styles.confirmButtonDisabled]}
          disabled={!selectedTask || busy}
          onPress={() => selectedTask && onConfirm(selectedTask)}
          accessibilityRole="button"
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECEDFF', alignItems: 'center', justifyContent: 'center' },
  backButtonSpacer: { width: 40 },
  headerText: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, height: 46, borderRadius: 14, backgroundColor: '#EEF0FA',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 0 },
  errorBanner: { marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 10, backgroundColor: '#FEE2E2' },
  errorText: { color: '#B42318', fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ECEEF8',
  },
  cardSelected: { borderColor: PRIMARY, backgroundColor: '#F5F3FF' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  cardBody: { flex: 1, marginHorizontal: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '600' },
  codeText: { fontSize: 11.5, color: '#64748B' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 32, fontSize: 14 },
  confirmButton: {
    marginHorizontal: 16, marginBottom: 12, height: 50, borderRadius: 25, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 5,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

