'use client';

import { useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

const initialProducts: Product[] = [
  { id: 'p1', name: 'Hambúrguer', price: 12.5, stock: 20 },
  { id: 'p2', name: 'Suco Natural', price: 7, stock: 32 },
  { id: 'p3', name: 'Fruta do Dia', price: 5, stock: 14 },
  { id: 'p4', name: 'Wrap Integral', price: 10, stock: 8 },
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

  function identifyWithNfc() {
    setConsumer('Aluno #RFID-8821');
    setAlert({ kind: 'success', text: 'NFC identificado com sucesso.' });
  }

  function identifyWithFace() {
    setConsumer('Aluno #FACE-2044');
    setAlert({ kind: 'success', text: 'Face reconhecida com sucesso.' });
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
      prev.map((product) => ({
        ...product,
        stock: Math.max(0, product.stock - (cart[product.id] ?? 0)),
      })),
    );

    setCart({});
    setAlert({ kind: 'success', text: `Checkout concluído para ${consumer}.` });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-3xl font-black">Totem PDV • Tap & Go</h1>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700 p-4 bg-slate-900">
          <h2 className="font-bold text-xl">Identificação</h2>
          <div className="flex gap-3 mt-3">
            <button className="px-4 py-2 rounded bg-indigo-600" onClick={identifyWithNfc}>
              Ler NFC
            </button>
            <button className="px-4 py-2 rounded bg-emerald-600" onClick={identifyWithFace}>
              Reconhecer Face
            </button>
          </div>
          <p className="mt-3 text-slate-300">Usuário: {consumer ?? 'não identificado'}</p>
        </div>

        <div className="rounded-xl border border-slate-700 p-4 bg-slate-900">
          <h2 className="font-bold text-xl">Carrinho rápido</h2>
          <p className="text-2xl font-extrabold mt-3">R$ {total.toFixed(2)}</p>
          <button className="mt-3 px-4 py-2 rounded bg-blue-600" onClick={checkout}>
            Finalizar compra
          </button>
        </div>
      </section>

      {alert && (
        <div className={`mt-5 rounded p-3 font-semibold ${alert.kind === 'success' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
          {alert.text}
        </div>
      )}

      <section className="mt-7">
        <h2 className="font-bold text-xl mb-3">Produtos</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product.id)}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-left hover:border-blue-500"
            >
              <p className="font-bold">{product.name}</p>
              <p className="text-slate-300">R$ {product.price.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Estoque: {product.stock}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
