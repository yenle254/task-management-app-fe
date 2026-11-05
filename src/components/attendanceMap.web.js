import React, { useMemo } from 'react';
import Colors from '../styles/color';
import { createAttendanceMapHtml } from '../utils/attendanceMapHtml';

export default function AttendanceMap({ location, office }) {
  const html = useMemo(() => createAttendanceMapHtml(location, office, Colors.primary), [location, office]);
  return <iframe
    title="Your location and permitted clock-in area"
    srcDoc={html}
    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    referrerPolicy="strict-origin-when-cross-origin"
    style={{ width: '100%', height: '100%', border: 0 }}
  />;
}
