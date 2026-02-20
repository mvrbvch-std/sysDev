'use client';

import { useEffect, useMemo, useState } from 'react';

type KitchenOrder = {
  id: string;
  studentName: string;
  studentPhoto: string;
  items: string[];
  status: 'PENDING' | 'PREPARING' | 'READY';
};

const initialOrders: KitchenOrder[] = [];

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_KDS_WS_URL ?? 'ws://localhost:4000/ws/kds';
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(endpoint);
      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            event: 'order:paid' | 'order:status';
            data: KitchenOrder | { orderId: string; status: KitchenOrder['status'] };
          };

          if (payload.event === 'order:paid') {
            const paidOrder = payload.data as KitchenOrder;
            setOrders((prev) => [{ ...paidOrder, status: 'PENDING' }, ...prev]);
          }

          if (payload.event === 'order:status') {
            const statusPayload = payload.data as { orderId: string; status: KitchenOrder['status'] };
            setOrders((prev) =>
              prev.map((order) => (order.id === statusPayload.orderId ? { ...order, status: statusPayload.status } : order)),
            );
          }
        } catch {
          // ignore malformed messages
        }
      });
    } catch {
      // no-op, fallback timer below keeps demo usable
    }

    const fallback = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.status === 'PENDING') return { ...order, status: 'PREPARING' };
          if (order.status === 'PREPARING') return { ...order, status: 'READY' };
          return order;
        }),
      );
    }, 9000);

    return () => {
      socket?.close();
      clearInterval(fallback);
    };
  }, []);

  const columns = useMemo(
    () => ({
      PENDING: orders.filter((order) => order.status === 'PENDING'),
      PREPARING: orders.filter((order) => order.status === 'PREPARING'),
      READY: orders.filter((order) => order.status === 'READY'),
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
                    <img src={order.studentPhoto || '/student-avatar.png'} alt={order.studentName} className="w-16 h-16 rounded-full object-cover" />
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
