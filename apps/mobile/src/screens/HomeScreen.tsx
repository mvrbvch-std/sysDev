import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';

const mockEvents = [
  { id: '1', text: 'Sanduíche + Suco comprado', amount: -14.5, time: '11:42' },
  { id: '2', text: 'Recarga Pix recebida', amount: 50, time: '08:10' },
];

export default function HomeScreen() {
  const [balance, setBalance] = useState(86.4);
  const [dailyLimit, setDailyLimit] = useState(35);
  const [snackBlocked, setSnackBlocked] = useState(false);

  const todaySpent = useMemo(() => mockEvents.filter((e) => e.amount < 0).reduce((acc, e) => acc + Math.abs(e.amount), 0), []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MenuPass</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Saldo em tempo real</Text>
        <Text style={styles.balance}>R$ {balance.toFixed(2)}</Text>
        <TouchableOpacity style={styles.pixButton} onPress={() => setBalance((v) => v + 25)}>
          <Text style={styles.pixButtonText}>Recarregar via Pix</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Limite diário</Text>
        <Text style={styles.limitText}>R$ {dailyLimit.toFixed(0)} (gasto hoje: R$ {todaySpent.toFixed(2)})</Text>
        <Slider minimumValue={5} maximumValue={150} step={1} value={dailyLimit} onValueChange={setDailyLimit} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Controle de blacklist</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Bloquear snacks açucarados</Text>
          <Switch value={snackBlocked} onValueChange={setSnackBlocked} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notificações de consumo</Text>
        {mockEvents.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <Text style={styles.eventText}>{event.text}</Text>
            <Text style={event.amount < 0 ? styles.debit : styles.credit}>
              {event.amount < 0 ? '-' : '+'}R$ {Math.abs(event.amount).toFixed(2)} • {event.time}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F9FAFB', gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 8 },
  label: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  balance: { fontSize: 34, fontWeight: '800', color: '#16A34A' },
  pixButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pixButtonText: { color: 'white', fontWeight: '700' },
  limitText: { color: '#4B5563', fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { color: '#374151', fontWeight: '500' },
  eventRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  eventText: { color: '#111827', fontWeight: '500' },
  debit: { color: '#DC2626', fontWeight: '700' },
  credit: { color: '#16A34A', fontWeight: '700' },
});
