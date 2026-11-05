import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, TurboModuleRegistry, View } from 'react-native';
import Colors from '../styles/color';
import { createAttendanceMapHtml } from '../utils/attendanceMapHtml';

export default function AttendanceMap({ location, office }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const source = useMemo(() => ({ html: createAttendanceMapHtml(location, office, Colors.primary) }), [location, office]);
  // Old development APKs must not crash when they do not yet contain WebView.
  if (!TurboModuleRegistry.get('RNCWebViewModule')) {
    return <View style={styles.message}><Text>Update the app to display the map. GPS validation remains available.</Text></View>;
  }
  if (failed) return (
    <View style={styles.message}>
      <Text>Unable to display the map. GPS validation is unchanged.</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={() => { setFailed(false); setAttempt(attempt + 1); }}>
        <Text style={styles.retryText}>Retry map</Text>
      </TouchableOpacity>
    </View>
  );
  const { WebView } = require('react-native-webview');
  return <WebView
    key={attempt}
    style={styles.map}
    source={source}
    originWhitelist={['*']}
    applicationNameForUserAgent="EMSAttendance/1.0"
    cacheEnabled
    javaScriptEnabled
    domStorageEnabled={false}
    allowFileAccess={false}
    mixedContentMode="never"
    thirdPartyCookiesEnabled={false}
    setSupportMultipleWindows={false}
    onError={() => setFailed(true)}
    onRenderProcessGone={() => setFailed(true)}
    onContentProcessDidTerminate={() => setFailed(true)}
    onShouldStartLoadWithRequest={({ url }) => {
      if (url === 'about:blank') return true;
      if (/^https:\/\/(www\.openstreetmap\.org|leafletjs\.com)(\/|$)/.test(url)) {
        Linking.openURL(url).catch(() => {});
      }
      return false;
    }}
  />;
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: Colors.secondary },
  message: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.secondary },
  retry: { minHeight: 44, padding: 12, justifyContent: 'center' },
  retryText: { color: Colors.primary, fontWeight: '700' },
});
