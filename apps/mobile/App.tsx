import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from './src/screens/HomeScreen';
import SponsorDashboardScreen from './src/screens/SponsorDashboardScreen';

const queryClient = new QueryClient();

export default function App() {
  const [tab, setTab] = useState<'home' | 'sponsor'>('home');

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', padding: 8, gap: 8 }}>
          <TouchableOpacity onPress={() => setTab('home')} style={{ backgroundColor: '#2563EB', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Consumidor</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('sponsor')} style={{ backgroundColor: '#111827', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Responsável</Text>
          </TouchableOpacity>
        </View>
        {tab === 'home' ? <HomeScreen /> : <SponsorDashboardScreen />}
      </SafeAreaView>
    </QueryClientProvider>
  );
}
