"use client";
import { useEffect, useState, useMemo } from "react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CartItemApi {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    slug: string;
  };
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CartItemApi[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data);
      // auto select all on open
      setSelected(new Set(data.map((d:CartItemApi)=>d.id)));
    } catch (e:any) { setError(e.message || 'Failed to load cart'); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ if (open) { load(); } },[open]);

  function toggle(id: string) {
    setSelected(s => { const ns = new Set(s); ns.has(id)?ns.delete(id):ns.add(id); return ns; });
  }
  const allChecked = useMemo(()=> items.length>0 && items.every(i=>selected.has(i.id)),[items,selected]);
  function toggleAll() {
    if (allChecked) setSelected(new Set()); else setSelected(new Set(items.map(i=>i.id)));
  }
  const selectedItems = items.filter(i=>selected.has(i.id));
  const total = selectedItems.reduce((sum,i)=> sum + i.product.price * i.quantity, 0);

  async function checkout() {
    if (selectedItems.length === 0) return;
    setCheckingOut(true); setError(null);
    try {
      const payload = { items: selectedItems.map(i=>({ productId: i.productId, quantity: i.quantity })) };
      const res = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Checkout failed');
      // If real snapToken later, we can open Snap here. For now redirectUrl mock
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e:any) {
      setError(e.message || 'Checkout failed');
    } finally { setCheckingOut(false); }
  }

  async function removeItem(id: string) {
    const prev = items;
    setItems(list=>list.filter(i=>i.id!==id));
    try {
      const res = await fetch(`/api/cart/${id}`,{method:'DELETE'});
      if (!res.ok) throw new Error(await res.text());
      setSelected(s=>{const ns=new Set(s); ns.delete(id); return ns;});
    } catch (e:any) {
      setError(e.message || 'Failed to remove');
      setItems(prev); // rollback
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          Cart
          {items.length>0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded-full leading-none">
              {items.length}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Keranjang</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Cart kosong.</p>}
          {!loading && items.length>0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Checkbox checked={allChecked} onCheckedChange={()=>toggleAll()} />
                <span className="text-sm font-medium">Pilih Semua</span>
              </div>
              {items.map(i=>{
                return (
                  <div key={i.id} className={cn("border rounded-md p-3 flex gap-3 items-start relative")}> 
                    <Checkbox checked={selected.has(i.id)} onCheckedChange={()=>toggle(i.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{i.product.title}</p>
                      <p className="text-xs text-muted-foreground">Qty {i.quantity} • Rp {i.product.price.toLocaleString()}</p>
                      <p className="text-xs font-semibold mt-1">Subtotal: Rp {(i.product.price * i.quantity).toLocaleString()}</p>
                    </div>
                    <button onClick={()=>removeItem(i.id)} className="text-xs text-red-500 hover:underline">hapus</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Total</span>
            <span>Rp {total.toLocaleString()}</span>
          </div>
          <Button disabled={checkingOut || selectedItems.length===0} onClick={checkout}>
            {checkingOut? 'Memproses...' : 'Bayar'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Tutup</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
