'use client';

import { useMemo, useState } from 'react';
import { matchFaceDescriptor } from '@/lib/faceMatcher';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

const descriptorDb = [
  { consumerId: 'Aluno #FACE-2044', descriptor: [0.1, 0.08, 0.14, 0.22] },
  { consumerId: 'Aluno #FACE-9931', descriptor: [0.2, 0.05, 0.18, 0.3] },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'Hambúrguer', price: 12.5, stock: 20 },
  { id: 'p2', name: 'Suco Natural', price: 7, stock: 32 },
  { id: 'p3', name: 'Fruta do Dia', price: 5, stock: 14 },
  { id: 'p4', name: 'Wrap Integral', price: 10, stock: 8 },
  { id: 'p5', name: 'Salada Kids', price: 8.5, stock: 12 },
  { id: 'p6', name: 'Bolo de Banana', price: 6.5, stock: 18 },
];

export default function TotemPage() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [consumer, setConsumer] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const total = useMemo(
    () =>
      Object.entries(cart).reduce((acc, [productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        return acc + (product ? product.price * qty : 0);
      }, 0),
    [cart, products],
  );

  async function identifyWithNfc() {
    if (!(window as { NDEFReader?: new () => { scan: () => Promise<void> } }).NDEFReader) {
      setConsumer('Aluno #RFID-8821');
      setAlert({ kind: 'success', text: 'NFC simulado (browser sem Web NFC).' });
      return;
    }

    try {
      const reader = new (window as { NDEFReader: new () => { scan: () => Promise<void> } }).NDEFReader();
      await reader.scan();
      setConsumer('Aluno #RFID-LIVE');
      setAlert({ kind: 'success', text: 'Tag NFC lida com sucesso.' });
    } catch {
      setAlert({ kind: 'error', text: 'Falha ao iniciar leitura NFC.' });
    }
  }

  function identifyWithFace() {
    const currentFrameDescriptor = [0.11, 0.07, 0.14, 0.2];
    const match = matchFaceDescriptor(currentFrameDescriptor, descriptorDb);
    if (!match) {
      setAlert({ kind: 'error', text: 'Face não reconhecida.' });
      return;
    }

    setConsumer(match.consumerId);
    setAlert({ kind: 'success', text: `Face reconhecida (${match.score.toFixed(3)}).` });
  }

  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) {
      setAlert({ kind: 'error', text: 'Produto sem estoque.' });
      return;
    }

    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }

  function checkout() {
    if (!consumer) {
      setAlert({ kind: 'error', text: 'Identifique o aluno via NFC ou Face ID.' });
      return;
    }
    if (total <= 0) {
      setAlert({ kind: 'error', text: 'Adicione itens ao carrinho.' });
      return;
    }

    setProducts((prev) =>
      prev.map((product) => ({ ...product, stock: Math.max(0, product.stock - (cart[product.id] ?? 0)) })),
    );

    setCart({});
    setAlert({ kind: 'success', text: `Pedido pago e enviado para cozinha (${consumer}).` });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <h1 className="text-3xl font-black">Totem PDV • Tap & Go</h1>

      <section className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 p-4 bg-slate-900 lg:col-span-2">
          <h2 className="font-bold text-xl">Produtos (touch grid)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product.id)}
                className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-left min-h-28 active:scale-95 transition"
              >
                <p className="font-extrabold text-lg">{product.name}</p>
                <p className="text-slate-300">R$ {product.price.toFixed(2)}</p>
                <p className="text-sm text-slate-400">Estoque: {product.stock}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-700 p-4 bg-slate-900">
          <h2 className="font-bold text-xl">Identificação</h2>
          <div className="grid gap-2 mt-3">
            <button className="px-4 py-3 rounded bg-indigo-600 font-semibold" onClick={identifyWithNfc}>
              Ler NFC
            </button>
            <button className="px-4 py-3 rounded bg-emerald-600 font-semibold" onClick={identifyWithFace}>
              Reconhecer Face
            </button>
          </div>
          <p className="mt-3 text-slate-300">Usuário: {consumer ?? 'não identificado'}</p>

          <div className="mt-6 border-t border-slate-700 pt-4">
            <h3 className="font-bold">Carrinho rápido</h3>
            <p className="text-3xl font-extrabold mt-2">R$ {total.toFixed(2)}</p>
            <button className="mt-3 w-full px-4 py-3 rounded bg-blue-600 font-bold" onClick={checkout}>
              Finalizar compra
            </button>
          </div>
        </aside>
      </section>

      {alert && (
        <div className={`mt-5 rounded p-3 font-semibold ${alert.kind === 'success' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
          {alert.text}
        </div>
      )}
    </main>
  );
}
