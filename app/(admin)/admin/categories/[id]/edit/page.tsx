"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "", color: "", position: 0, isActive: true });

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/categories/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data) throw new Error("Not found");
        if (!stop) setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          imageUrl: data.imageUrl ?? "",
          color: data.color ?? "",
          position: data.position ?? 0,
          isActive: !!data.isActive,
        });
      } catch (e:any) { if (!stop) setError(e.message || "Failed to load"); }
      finally { if (!stop) setLoading(false); }
    }
    load();
    return () => { stop = true; };
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form)});
    if (!res.ok) { setError(await res.text()); return; }
    router.push("/admin/categories"); router.refresh();
  }

  async function onDelete() {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) { setError(await res.text()); return; }
    router.push("/admin/categories"); router.refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Edit Category</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Name</span>
            <input className="border rounded-md px-3 py-2" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Slug</span>
            <input className="border rounded-md px-3 py-2" required value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/\s+/g,'_')}))} />
          </label>
          <label className="md:col-span-2 grid gap-1">
            <span className="text-sm font-medium">Description</span>
            <textarea className="border rounded-md px-3 py-2" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Image URL</span>
            <input className="border rounded-md px-3 py-2" value={form.imageUrl} onChange={e=>setForm(f=>({...f,imageUrl:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Color (accent)</span>
            <input className="border rounded-md px-3 py-2" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Position</span>
            <input type="number" className="border rounded-md px-3 py-2" value={form.position} onChange={e=>setForm(f=>({...f,position:Number(e.target.value)}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Active</span>
            <select className="border rounded-md px-3 py-2" value={form.isActive?"true":"false"} onChange={e=>setForm(f=>({...f,isActive:e.target.value==="true"}))}>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground">Save</button>
          <button type="button" onClick={onDelete} className="inline-flex items-center px-4 py-2 rounded-md border text-red-600">Delete</button>
        </div>
      </form>
    </div>
  );
}
