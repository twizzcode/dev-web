"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string; isActive: boolean; position: number };

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/admin/categories");
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
        <h2 className="text-xl font-semibold">Categories</h2>
        <Link href="/admin/categories/new" className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">
          New Category
        </Link>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Position</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>No categories</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.slug}</td>
                <td className="p-3">{r.position}</td>
                <td className="p-3">{r.isActive ? 'Yes' : 'No'}</td>
                <td className="p-3 flex gap-2">
                  <Link href={`/admin/categories/${r.id}/edit`} className="text-primary underline">Edit</Link>
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
