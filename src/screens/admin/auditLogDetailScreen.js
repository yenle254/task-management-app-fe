import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import { AuditButton, AuditCard, AuditState, actionLabels, formatAuditTime, formatAuditValue, styles } from '../../components/audit/auditUI';
import auditService from '../../services/auditService';
import { auditError } from '../../../store/auditStore';

const historyTypes = ['user', 'team', 'task', 'leave', 'attendance', 'office'];
export default function AuditLogDetailScreen({ navigation, route }) {
  const { id, type, targetId } = route.params || {};
  const history = !!type && !!targetId;
  const version = useRef(0);
  const [state, setState] = useState({ records: [], entry: null, page: 0, pages: 0, loading: true, error: null, requestedPage: 1 });
  const load = async (page = 1) => {
    const request = ++version.current;
    setState(old => ({ ...old, loading: true, error: null, requestedPage: page }));
    try {
      const response = history ? await auditService.getTargetAuditLogs(type, targetId, { page, limit: 10 }) : await auditService.getAuditLogById(id);
      if (request !== version.current) return;
      setState(old => ({ ...old, loading: false, entry: history ? null : response.data,
        records: history ? (page === 1 ? response.data : [...old.records, ...response.data.filter(item => !old.records.some(record => record._id === item._id))]) : [],
        page: response.page || 1, pages: response.pages || 0 }));
    } catch (error) {
      if (request === version.current) setState(old => ({ ...old, loading: false, error: auditError(error) }));
    }
  };
  useEffect(() => {
    setState({ records: [], entry: null, page: 0, pages: 0, loading: true, error: null, requestedPage: 1 });
    load();
    const requestVersion = version;
    return () => { requestVersion.current++; };
    // Route identity invalidates requests when navigating between entry and target modes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, targetId]);
  const entry = state.entry;
  return <SafeAreaView style={styles.root}>
    <HeaderWithBackButton title={history ? 'Target history' : 'Audit detail'} onBackPress={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content}>
      {history && <>
        <Text style={styles.badge}>History of {state.records[0]?.target?.label || targetId}</Text>
        <Text style={styles.text}>Không có thay đổi được ghi trước đó: lịch sử chỉ bắt đầu từ sự kiện audit đầu tiên.</Text>
        {state.records.map(item => <AuditCard key={item._id} entry={item} history onPress={() => navigation.push('AuditLogDetail', { id: item._id })} />)}
        <Text style={styles.text}>Page {state.page} / {state.pages}</Text>
      </>}
      {entry && <>
        <View style={styles.card}>
          <Text style={styles.title}>{actionLabels[entry.action] || entry.action}</Text>
          {[['Actor', entry.actor?.name || entry.actor?.email || 'Anonymous'], ['Role', entry.actor?.role], ['Actor ID', entry.actor?.id],
            ['Target', entry.target?.label], ['Target ID', entry.target?.id], ['Time', formatAuditTime(entry.at)], ['Severity', entry.severity], ['Outcome', entry.outcome],
            ['Request ID', entry.context?.requestId], ['IP', entry.context?.ip], ['Method', entry.context?.method], ['Route', entry.context?.route]].map(([label, value]) =>
            <Text key={label} selectable style={styles.text}>{label}: {formatAuditValue(value)}</Text>)}
        </View>
        <View style={styles.card}><Text style={styles.title}>Lý do thay đổi</Text><Text selectable style={styles.reason}>{entry.reason ?? 'No reason recorded'}</Text></View>
        <View style={styles.card}>
          <View style={styles.row}>{['Field', 'Trước', 'Sau'].map(label => <Text key={label} style={styles.cell}>{label}</Text>)}</View>
          {entry.changes?.length ? entry.changes.map((change, index) => <View style={styles.row} key={`${change.field}-${index}`}>
            {[change.field, change.from, change.to].map((value, cell) => <Text key={cell} selectable style={styles.cell}>{formatAuditValue(value)}</Text>)}
          </View>) : <Text style={styles.text}>No field changes</Text>}
        </View>
        {!!entry.metadata && <View style={styles.card}><Text style={styles.title}>Metadata</Text><Text selectable style={styles.text}>{JSON.stringify(entry.metadata, null, 2)}</Text></View>}
        {entry.target?.id && historyTypes.includes(entry.target.type) && <AuditButton text="View target history" onPress={() => navigation.push('AuditLogDetail', { type: entry.target.type, targetId: entry.target.id })} />}
      </>}
      <AuditState loading={state.loading} error={state.error} empty={history ? !state.records.length : !entry} retry={() => load(state.requestedPage)} />
      {history && !state.error && state.page < state.pages && <AuditButton text="Load next" disabled={state.loading} onPress={() => load(state.page + 1)} />}
    </ScrollView>
  </SafeAreaView>;
}
