'use client';

import { useState } from 'react';

export function SponsorPanel() {
  const [dailyLimit, setDailyLimit] = useState(30);
  const [isBlocked, setIsBlocked] = useState(false);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-3xl font-black text-slate-900">Sponsor Backoffice</h1>
      <section className="mt-4 grid gap-4 max-w-2xl">
        <div className="rounded-xl bg-white border p-4">
          <p className="font-bold">Limite diário</p>
          <input
            type="range"
            min={5}
            max={200}
            value={dailyLimit}
            onChange={(event) => setDailyLimit(Number(event.target.value))}
            className="w-full mt-3"
          />
          <p className="mt-1">R$ {dailyLimit.toFixed(0)}</p>
        </div>

        <div className="rounded-xl bg-white border p-4 flex items-center justify-between">
          <p className="font-bold">Bloquear produto (refrigerante)</p>
          <button
            onClick={() => setIsBlocked((v) => !v)}
            className={`px-3 py-2 rounded text-white ${isBlocked ? 'bg-rose-600' : 'bg-emerald-600'}`}
          >
            {isBlocked ? 'Bloqueado' : 'Liberado'}
          </button>
        </div>
      </section>
    </main>
  );
}
