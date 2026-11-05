import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuditFilterSelect from '../../components/audit/auditFilterSelect';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import { AuditButton, AuditCard, AuditState, actionLabels, styles } from '../../components/audit/auditUI';
import useAuditStore from '../../../store/auditStore';

const choices = {
  action: Object.keys(actionLabels), category: ['auth', 'user', 'admin', 'team', 'task', 'leave', 'attendance', 'office', 'security', 'system'],
  outcome: ['success', 'failure', 'denied'], severity: ['info', 'warning', 'critical'],
};
export default function AuditLogScreen({ navigation }) {
  const store = useAuditStore();
  const [filters, setFilters] = useState(store.filters);
  useEffect(() => { useAuditStore.getState().fetchAuditLogs(); }, []);
  const apply = () => { store.setFilters(filters); store.fetchAuditLogs(); };
  return <SafeAreaView style={styles.root}>
    <HeaderWithBackButton title="Audit Log" onBackPress={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Filters</Text>
        {[['from', 'From (ISO date/time)'], ['to', 'To (exclusive, ISO date/time)'], ['actorId', 'Actor ID']].map(([key, label]) => <View key={key} style={styles.filter}>
          <Text style={styles.text}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} autoCapitalize="none"
            placeholder={key === 'actorId' ? 'ObjectId' : '2026-11-03T00:00:00Z'} value={filters[key] || ''} onChangeText={value => setFilters({ ...filters, [key]: value.trim() })} />
        </View>)}
        {Object.entries(choices).map(([key, values]) => (
          <AuditFilterSelect
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={filters[key] || ''}
            options={[{ value: '', label: 'All' }, ...values.map(value => ({ value, label: actionLabels[value] || value }))]}
            onChange={value => setFilters(current => ({ ...current, [key]: value }))}
          />
        ))}
        <AuditButton text="Apply filters" onPress={apply} disabled={store.isLoading} />
        <AuditButton text="Clear filters" onPress={() => { setFilters({}); store.setFilters({}); store.fetchAuditLogs(); }} disabled={store.isLoading} />
      </View>
      <Text style={styles.text}>{store.total} records · Page {store.page} / {store.pages}</Text>
      {store.records.map(entry => <AuditCard key={entry._id} entry={entry} onPress={() => navigation.navigate('AuditLogDetail', { id: entry._id })} />)}
      <AuditState loading={store.isLoading} error={store.error} empty={!store.records.length} retry={() => store.fetchAuditLogs(store.requestedPage)} />
      {!store.error && store.page < store.pages && <AuditButton text="Load next" disabled={store.isLoading} onPress={() => store.fetchAuditLogs(store.page + 1)} />}
    </ScrollView>
  </SafeAreaView>;
}
