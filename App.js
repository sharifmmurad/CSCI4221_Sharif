import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Platform, Alert } from 'react-native';
import { Provider as PaperProvider, Card, Button, Switch, RadioButton, Appbar, Snackbar, Divider } from 'react-native-paper';

/**
 * Notification wrapper that works on Web (no-ops) and loads real
 * expo-notifications dynamically on native (Android/iOS).
 */
function useNotifications() {
  const modRef = useRef(null);
  const [ready, setReady] = useState(Platform.OS === 'web'); // web is "ready" immediately

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (Platform.OS === 'web') return; // no-op on web
      try {
        const m = await import('expo-notifications'); // dynamic import
        if (!isMounted) return;
        modRef.current = m;

        // Foreground behavior
        m.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        // Android channel
        if (Platform.OS === 'android') {
          await m.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: m.AndroidImportance.DEFAULT,
          });
        }

        setReady(true);
      } catch (e) {
        console.warn('Notifications unavailable:', e?.message || e);
        setReady(true);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const api = React.useMemo(() => {
    if (Platform.OS === 'web' || !modRef.current) {
      return {
        isNative: false,
        requestPermissionsAsync: async () => ({ status: 'granted' }),
        getPermissionsAsync: async () => ({ status: 'granted' }),
        scheduleNotificationAsync: async () => null,
        cancelAllScheduledNotificationsAsync: async () => {},
      };
    }
    const m = modRef.current;
    return {
      isNative: true,
      requestPermissionsAsync: m.requestPermissionsAsync,
      getPermissionsAsync: m.getPermissionsAsync,
      scheduleNotificationAsync: m.scheduleNotificationAsync,
      cancelAllScheduledNotificationsAsync: m.cancelAllScheduledNotificationsAsync,
    };
  }, [ready]);

  return { ready, ...api };
}

// -------------------------------------------------------

export default function App() {
  const { ready, isNative, requestPermissionsAsync, getPermissionsAsync, scheduleNotificationAsync, cancelAllScheduledNotificationsAsync } = useNotifications();
  const [index, setIndex] = useState(0);
  const [snack, setSnack] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [leadTime, setLeadTime] = useState('10');
  const [dailySummary, setDailySummary] = useState(false);
  const [title, setTitle] = useState('');
  const [timeInMinutes, setTimeInMinutes] = useState('30');
  const [events, setEvents] = useState([mkEvent('Team Standup', 45), mkEvent('Project Work Block', 120)]);

  useEffect(() => {
    (async () => {
      if (!ready) return;
      const { status } = await getPermissionsAsync();
      if (status !== 'granted') {
        const req = await requestPermissionsAsync();
        if (req.status !== 'granted') setSnack('Notifications permission not granted');
      }
    })();
  }, [ready, getPermissionsAsync, requestPermissionsAsync]);

  function mkEvent(t, minutesFromNow) {
    const when = new Date(Date.now() + minutesFromNow * 60 * 1000);
    return { id: Math.random().toString(36).slice(2), title: t, whenISO: when.toISOString() };
  }

  function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function scheduleForEvent(ev) {
    if (!notifEnabled) return null;
    const eventDate = new Date(ev.whenISO);
    const minutesLead = parseInt(leadTime, 10);
    const fireAt = new Date(eventDate.getTime() - minutesLead * 60 * 1000);
    if (fireAt.getTime() <= Date.now()) return null;
    const id = await scheduleNotificationAsync({
      content: { title: 'Upcoming event', body: `${ev.title} at ${fmtTime(ev.whenISO)} (${leadTime} min reminder)`, data: { eventId: ev.id } },
      trigger: fireAt,
    });
    return id;
  }

  async function clearAllScheduled() {
    await cancelAllScheduledNotificationsAsync();
    setSnack(isNative ? 'Cleared scheduled notifications' : 'Cleared (web mock)');
  }

  async function rescheduleAll() {
    await clearAllScheduled();
    for (const ev of events) await scheduleForEvent(ev);
    if (dailySummary && notifEnabled) {
      const now = new Date();
      const at = new Date(now);
      at.setHours(8, 0, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);
      await scheduleNotificationAsync({
        content: { title: 'Daily Summary', body: 'Your schedule and tasks for today are ready.' },
        trigger: at,
      });
    }
    setSnack(isNative ? 'Reminders scheduled' : 'Scheduled (web mock)');
  }

  useEffect(() => {
    if (ready) rescheduleAll();
  }, [ready, notifEnabled, leadTime, dailySummary, events]);

  const addEvent = async () => {
    const mins = Math.max(1, parseInt(timeInMinutes || '30', 10));
    const t = title.trim() || 'New Event';
    const ev = mkEvent(t, mins);
    setEvents((prev) => [ev, ...prev]);
    setTitle('');
    setTimeInMinutes('30');
    setSnack(`Event added for ${fmtTime(ev.whenISO)} ${isNative ? '' : '(web mock)'}`);
  };

  const deleteEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const tabs = useMemo(
    () => [
      {
        key: 'calendar',
        title: 'Calendar',
        content: (
          <View style={styles.screen}>
            <Text style={styles.h1}>Calendar</Text>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Quick Add Event (from now)</Text>
                <TextInput placeholder="Event title" value={title} onChangeText={setTitle} style={styles.input} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TextInput placeholder="Minutes from now" value={timeInMinutes} onChangeText={setTimeInMinutes} keyboardType="numeric" style={[styles.input, { width: 160 }]} />
                  <Button mode="contained" onPress={addEvent}>Add</Button>
                </View>
              </Card.Content>
            </Card>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <FlatList
              data={[...events].sort((a, b) => new Date(a.whenISO) - new Date(b.whenISO))}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider style={{ opacity: 0.2 }} />}
              renderItem={({ item }) => (
                <Card style={styles.eventCard}>
                  <Card.Content>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventTime}>{fmtTime(item.whenISO)}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Button mode="text" onPress={() => Alert.alert('Reminder', isNative ? 'A native reminder will fire based on your settings.' : 'Web preview: simulated reminder (no native notification).')}>Reminder</Button>
                      <Button mode="text" onPress={() => deleteEvent(item.id)} textColor="#c00">Delete</Button>
                    </View>
                  </Card.Content>
                </Card>
              )}
            />
          </View>
        ),
      },
      {
        key: 'settings',
        title: 'Notification Settings',
        content: (
          <View style={styles.screen}>
            <Text style={styles.h1}>Notification Settings</Text>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <Text style={styles.label}>Enable notifications</Text>
                  <Switch value={notifEnabled} onValueChange={setNotifEnabled} />
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <Text style={styles.label}>Reminder lead time</Text>
                <RadioButton.Group onValueChange={setLeadTime} value={leadTime}>
                  <RowRadio label="5 minutes before" value="5" />
                  <RowRadio label="10 minutes before" value="10" />
                  <RowRadio label="30 minutes before" value="30" />
                </RadioButton.Group>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.row}>
                  <Text style={styles.label}>Daily summary at 8:00 AM</Text>
                  <Switch value={dailySummary} onValueChange={setDailySummary} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Button mode="contained" onPress={rescheduleAll}>Apply</Button>
                  <Button mode="outlined" onPress={clearAllScheduled}>Clear Scheduled</Button>
                </View>
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.muted}>Web preview won’t show native notifications. Use Android/iOS to see them. All actions here are safely simulated on the web.</Text>
              </Card.Content>
            </Card>
          </View>
        ),
      },
    ],
    [events, notifEnabled, leadTime, dailySummary, title, timeInMinutes, isNative]
  );

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title={index === 0 ? 'Calendar' : 'Notification Settings'} />
        <Appbar.Action icon={index === 0 ? 'cog' : 'calendar'} onPress={() => setIndex(index === 0 ? 1 : 0)} />
      </Appbar.Header>
      {tabs[index].content}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </PaperProvider>
  );
}

function RowRadio({ label, value }) {
  return (
    <View style={rowStyles.row}>
      <RadioButton value={value} />
      <Text style={rowStyles.text}>{label}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  text: { fontSize: 16 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#f5f7fa' },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  card: { marginBottom: 12, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e1e5ea' },
  eventCard: { marginVertical: 6, borderRadius: 12 },
  eventTitle: { fontSize: 16, fontWeight: '600' },
  eventTime: { marginTop: 2, fontSize: 14, color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16 },
  muted: { color: '#666' },
});
