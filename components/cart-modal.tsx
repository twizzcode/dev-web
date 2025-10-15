"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Checkbox } from "@/components/ui/checkbox";

type CartItemApi = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    imageUrl: string;
    slug: string;
  };
};

export function CartModal() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItemApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<CartItemApi | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Load cart on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch('/api/cart');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) {
          setItems(data);
          setSelected(new Set(data.map((d:CartItemApi)=>d.id))); // auto select all
        }
      } catch (e:any) {
        if (!cancelled) setError(e.message || 'Failed to load cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent){ if (e.key === 'Escape') setOpen(false); }
    if (open) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = 'auto';
    };
  }, [open]);
  // Checkbox logic
  function toggle(id: string) {
    setSelected(s => { const ns = new Set(s); ns.has(id)?ns.delete(id):ns.add(id); return ns; });
  }
  const allChecked = useMemo(()=> items.length>0 && items.every(i=>selected.has(i.id)),[items,selected]);
  function toggleAll() {
    if (allChecked) setSelected(new Set()); else setSelected(new Set(items.map(i=>i.id)));
  }
  const selectedItems = items.filter(i=>selected.has(i.id));
  const total = selectedItems.reduce((sum,i)=> sum + i.product.price * i.quantity, 0);

  const count = items.length;

  async function removeItem(id: string) {
    const prev = items;
    // optimistic UI
    setItems(list => list.filter(i => i.id !== id));
    setSelected(s=>{ const ns = new Set(s); ns.delete(id); return ns; });
    try {
      const res = await fetch(`/api/cart/${id}`, { method: 'DELETE' });
  if (res.status === 401) { window.location.href = '/login'; return; }
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      // rollback
      setItems(prev);
      setError((e as any)?.message || 'Gagal menghapus');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 h-8 px-3 rounded-md border text-sm hover:bg-muted/60"
      >
        Cart
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded-full leading-none">
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              ref={panelRef}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative z-[101] w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border bg-background shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-base font-semibold">Keranjang</h2>
                <button onClick={() => setOpen(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted">
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-56px)]">
                {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!loading && !error && items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Cart kosong.</p>
                )}
                {!loading && !error && items.length > 0 && (
                  <>
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <Checkbox checked={allChecked} onCheckedChange={()=>toggleAll()} />
                    <span className="text-sm font-medium">Pilih Semua</span>
                  </div>
                  <ul className="w-full gap-3">
                    {items.map((it) => (
                      <motion.div
                        key={it.id}
                        layoutId={`card-${it.id}`}
                        className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer min-h-[96px]"
                      >
                        <div className="flex gap-4 flex-col md:flex-row ">
                          <Checkbox checked={selected.has(it.id)} onCheckedChange={()=>toggle(it.id)} />
                          <motion.div layoutId={`image-${it.id}`} onClick={() => setActive(it)}>
                            <img
                              width={100}
                              height={100}
                              src={it.product.imageUrl}
                              alt={it.product.title}
                              className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                            />
                          </motion.div>
                          <div onClick={() => setActive(it)}>
                            <motion.h3 layoutId={`title-${it.id}`} className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left">
                              {it.product.title}
                            </motion.h3>
                            <motion.p layoutId={`description-${it.id}`} className="text-neutral-600 dark:text-neutral-400 text-center md:text-left text-sm">
                              Rp {it.product.price.toLocaleString('id-ID')}
                            </motion.p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <motion.button layoutId={`button-${it.id}`} className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-primary hover:text-primary-foreground text-black" onClick={() => setActive(it)}>
                            Detail
                          </motion.button>
                          <button
                            onClick={() => removeItem(it.id)}
                            className="text-xs text-red-600 hover:underline"
                            title="Hapus dari cart"
                          >
                            Hapus
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </ul>
                  </>
                )}
      {/* Checkout bar */}
      {open && !loading && !error && items.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full flex justify-center z-[120] pointer-events-none">
          <div className="pointer-events-auto bg-white dark:bg-neutral-900 border-t w-full max-w-2xl mx-auto flex items-center justify-between px-4 py-3 gap-4 shadow-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-bold text-lg">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <button
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold text-base disabled:opacity-50"
              disabled={selectedItems.length === 0}
              onClick={async()=>{
                if(selectedItems.length===0) return;
                try {
                  const payload = { items: selectedItems.map(i=>({ productId: i.productId, quantity: 1 })) };
                  const res = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'Checkout failed');
                  if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                  }
                } catch (e:any) {
                  alert(e.message || 'Checkout failed');
                }
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
              </div>
            </motion.div>

            {/* Expandable modal for active item (standard style) */}
            <AnimatePresence>
              {active && (
                <motion.div
                  key={`overlay-${active.id}`}
                  className="fixed inset-0 z-[110] grid place-items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-black/20" onClick={() => setActive(null)} />
                  <motion.div
                    layoutId={`card-${active.id}`}
                    className="relative z-[111] w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
                  >
                    <button
                      className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
                      onClick={() => setActive(null)}
                    >
                      <span className="sr-only">Close</span>
                      ×
                    </button>
                    <motion.div layoutId={`image-${active.id}`}>
                      <img
                        width={200}
                        height={200}
                        src={active.product.imageUrl}
                        alt={active.product.title}
                        className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                      />
                    </motion.div>
                    <div>
                      <div className="flex justify-between items-start p-4">
                        <div>
                          <motion.h3 layoutId={`title-${active.id}`} className="font-bold text-neutral-700 dark:text-neutral-200">
                            {active.product.title}
                          </motion.h3>
                          <motion.p layoutId={`description-${active.id}`} className="text-neutral-600 dark:text-neutral-400 text-sm">
                            {active.product.description || '—'}
                          </motion.p>
                          <div className="mt-2 text-neutral-800 dark:text-neutral-100 font-semibold">
                            Rp {active.product.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <motion.div layoutId={`button-${active.id}`} className="px-4 py-3 text-sm rounded-full font-bold bg-primary text-primary-foreground">
                          Lihat
                        </motion.div>
                      </div>
                      <div className="pt-4 relative px-4">
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                        >
                          <p>Gunakan tombol Bayar di header untuk checkout semua item yang dipilih di Cart Drawer, atau lanjutkan belanja.</p>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
