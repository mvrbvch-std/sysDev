'use client';

import { useEffect, useMemo, useState } from 'react';

type KitchenOrder = {
  id: string;
  studentName: string;
  studentPhoto: string;
  items: string[];
  status: 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP';
};

const mockSocketFeed: KitchenOrder[] = [
  {
    id: 'o-1001',
    studentName: 'Ana Souza',
    studentPhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&h=120&fit=crop',
    items: ['Hambúrguer', 'Suco Natural'],
    status: 'PENDING',
  },
  {
    id: 'o-1002',
    studentName: 'Pedro Lima',
    studentPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    items: ['Wrap Integral'],
    status: 'PREPARING',
  },
];

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>(mockSocketFeed);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.status === 'PENDING') return { ...order, status: 'PREPARING' };
          if (order.status === 'PREPARING') return { ...order, status: 'READY' };
          return order;
        }),
      );
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const columns = useMemo(
    () => ({
      PENDING: orders.filter((o) => o.status === 'PENDING'),
      PREPARING: orders.filter((o) => o.status === 'PREPARING'),
      READY: orders.filter((o) => o.status === 'READY'),
    }),
    [orders],
  );

  return (
    <section className="bg-black min-h-screen text-white p-6">
      <h1 className="text-4xl font-black mb-6">Kitchen Display System</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {(['PENDING', 'PREPARING', 'READY'] as const).map((status) => (
          <div key={status} className="rounded-xl bg-zinc-900 p-4 border border-zinc-700">
            <h2 className="text-2xl font-extrabold mb-4">{status}</h2>
            <div className="space-y-3">
              {columns[status].map((order) => (
                <article key={order.id} className="rounded-lg bg-zinc-800 p-3">
                  <div className="flex gap-3 items-center">
                    <img src={order.studentPhoto} alt={order.studentName} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-lg">{order.studentName}</p>
                      <p className="text-sm text-zinc-300">Pedido: {order.id}</p>
                    </div>
                  </div>
                  <ul className="mt-2 list-disc list-inside text-zinc-200">
                    {order.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
