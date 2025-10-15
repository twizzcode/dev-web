"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCategoryPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "", color: "", position: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: form.name.trim(), slug: form.slug.trim(), description: form.description || null, imageUrl: form.imageUrl || null, color: form.color || null, position: Number(form.position)||0, isActive: !!form.isActive,
      })});
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/categories");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to create category';
      setError(message);
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">New Category</h2>
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
            <input className="border rounded-md px-3 py-2" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} placeholder="#7c3aed or violet-500" />
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
          <button disabled={saving} className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50">{saving?"Saving...":"Create"}</button>
          <button type="button" onClick={()=>router.back()} className="inline-flex items-center px-4 py-2 rounded-md border">Cancel</button>
        </div>
      </form>
    </div>
  );
}
