"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = { id: string; title: string; slug: string; price: number; isActive: boolean; soldCount: number; category?: { name: string } };

export default function AdminProductsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/admin/products");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!stop) setRows(data);
      } catch (e:any) {
        if (!stop) setError(e.message || "Failed to load");
      } finally { if (!stop) setLoading(false); }
    }
    load();
    return () => { stop = true; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link href="/admin/products/new" className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">
          New Product
        </Link>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Sold</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={7}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={7}>No products</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.title}</td>
                <td className="p-3">{r.slug}</td>
                <td className="p-3">{r.category?.name || '-'}</td>
                <td className="p-3">Rp {r.price.toLocaleString('id-ID')}</td>
                <td className="p-3">{r.soldCount}</td>
                <td className="p-3">{r.isActive ? 'Yes' : 'No'}</td>
                <td className="p-3 flex gap-2">
                  <Link href={`/admin/products/${r.id}/edit`} className="text-primary underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
