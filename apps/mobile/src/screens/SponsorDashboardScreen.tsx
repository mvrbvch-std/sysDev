import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type StatementResponse = {
  balance: number;
  dailySpendingLimit: number;
  productBlacklistIds: string[];
  ledger: Array<{ id: string; description: string | null; amount: number; type: 'DEBIT' | 'CREDIT'; createdAt: string }>;
};

const CONSUMER_ID = 'consumer-demo';

async function fetchStatement(): Promise<StatementResponse> {
  const response = await fetch(`/api/sponsor/${CONSUMER_ID}/statement`);
  if (!response.ok) throw new Error('Failed to load statement');
  return response.json();
}

async function updateGovernance(payload: { dailySpendingLimit?: number; productId?: string; blocked?: boolean }) {
  const response = await fetch(`/api/sponsor/${CONSUMER_ID}/governance`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Governance update failed');
  return response.json();
}

async function createPixRecharge() {
  const response = await fetch('/api/payments/asaas/pix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletId: 'wallet-demo', amount: 40 }),
  });
  if (!response.ok) throw new Error('Pix generation failed');
  return response.json();
}

export default function SponsorDashboardScreen() {
  const queryClient = useQueryClient();
  const [dailyLimitDraft, setDailyLimitDraft] = useState(30);
  const [blockedSnack, setBlockedSnack] = useState(false);

  const statementQuery = useQuery({
    queryKey: ['statement', CONSUMER_ID],
    queryFn: fetchStatement,
    refetchInterval: 10_000,
  });

  const governanceMutation = useMutation({
    mutationFn: updateGovernance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['statement', CONSUMER_ID] }),
  });

  const pixMutation = useMutation({ mutationFn: createPixRecharge });

  const statement = statementQuery.data;
  const limitProgress = useMemo(() => {
    if (!statement || statement.dailySpendingLimit <= 0) return 0;
    const debits = statement.ledger
      .filter((entry) => entry.type === 'DEBIT')
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    return Math.min(1, debits / statement.dailySpendingLimit);
  }, [statement]);

  if (statementQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sponsor App</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Saldo atual</Text>
        <Text style={styles.balance}>R$ {(statement?.balance ?? 0).toFixed(2)}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => pixMutation.mutate()}>
          <Text style={styles.primaryBtnText}>{pixMutation.isPending ? 'Gerando Pix...' : 'Recarregar via Pix'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Limite diário</Text>
        <Text>R$ {dailyLimitDraft.toFixed(0)} • uso: {(limitProgress * 100).toFixed(0)}%</Text>
        <Slider minimumValue={5} maximumValue={200} step={1} value={dailyLimitDraft} onValueChange={setDailyLimitDraft} />
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => governanceMutation.mutate({ dailySpendingLimit: dailyLimitDraft })}
        >
          <Text style={styles.secondaryBtnText}>Salvar limite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Bloquear produto</Text>
        <View style={styles.row}>
          <Text>Bloquear refrigerante (product-soda)</Text>
          <Switch
            value={blockedSnack}
            onValueChange={(enabled) => {
              setBlockedSnack(enabled);
              governanceMutation.mutate({ productId: 'product-soda', blocked: enabled });
            }}
          />
        </View>
      </View>

      <Text style={styles.subtitle}>Extrato em tempo real</Text>
      <FlatList
        data={statement?.ledger ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.ledgerItem}>
            <Text>{item.description ?? 'Movimentação'}</Text>
            <Text style={item.type === 'DEBIT' ? styles.debit : styles.credit}>
              {item.type === 'DEBIT' ? '-' : '+'}R$ {Math.abs(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', gap: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  balance: { fontSize: 30, fontWeight: '900', color: '#2563EB' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryBtn: { borderRadius: 10, backgroundColor: '#2563EB', padding: 10, alignItems: 'center' },
  secondaryBtn: { borderRadius: 10, backgroundColor: '#111827', padding: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
  ledgerItem: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginVertical: 4, flexDirection: 'row', justifyContent: 'space-between' },
  debit: { color: '#DC2626', fontWeight: '700' },
  credit: { color: '#16A34A', fontWeight: '700' },
});
