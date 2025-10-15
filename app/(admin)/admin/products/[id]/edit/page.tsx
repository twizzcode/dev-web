"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Category = { id: string; name: string; isActive: boolean };

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", description: "", price: 0, imageUrl: "", soldCount: 0, isActive: true, categoryId: "",
    linkUrl: "", linkLabel: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const [prd, cats] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch(`/api/admin/categories`),
        ]);
        if (!prd.ok) throw new Error(await prd.text());
        if (!cats.ok) throw new Error(await cats.text());
        const product = await prd.json();
        const categories = await cats.json();
        if (!product) throw new Error("Not found");
        if (!stop) {
          setCategories(categories);
          setForm({
            title: product.title ?? "",
            slug: product.slug ?? "",
            description: product.description ?? "",
            price: product.price ?? 0,
            imageUrl: product.imageUrl ?? "",
            soldCount: product.soldCount ?? 0,
            isActive: !!product.isActive,
            categoryId: product.categoryId ?? "",
            linkUrl: product.links?.[0]?.url ?? "",
            linkLabel: product.links?.[0]?.label ?? "",
          });
        }
      } catch (e:any) { if (!stop) setError(e.message || "Failed to load"); }
      finally { if (!stop) setLoading(false); }
    }
    load();
    return () => { stop = true; };
  }, [id]);

  const activeCategories = useMemo(() => categories.filter(c => c.isActive), [categories]);
  const hasCategories = activeCategories.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const payload: any = {
      title: form.title.trim(), description: form.description, price: Number(form.price)||0, imageUrl: form.imageUrl, soldCount: Number(form.soldCount)||0, isActive: !!form.isActive, categoryId: form.categoryId,
    };
    const cleanedSlug = form.slug.trim();
    if (cleanedSlug) payload.slug = cleanedSlug;
    if (!payload.categoryId) { setError("Please select a category"); return; }
    // For simplicity, treat link as replace-first if provided
    if (form.linkUrl) {
      payload.links = { deleteMany: {}, create: [{ url: form.linkUrl, label: form.linkLabel || null, position: 1 }] };
    }
  const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)});
  if (!res.ok) {
    let msg = await res.text();
    try { const j = JSON.parse(msg); msg = j.error || j.message || msg; } catch {}
    setError(msg || `Request failed (${res.status})`);
    return;
  }
    router.push("/admin/products"); router.refresh();
  }

  async function onDelete() {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      let msg = await res.text();
      try { const j = JSON.parse(msg); msg = j.error || j.message || msg; } catch {}
      setError(msg);
      return;
    }
    router.push("/admin/products"); router.refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Edit Product</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input className="border rounded-md px-3 py-2" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Slug</span>
            <input className="border rounded-md px-3 py-2" value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}))} placeholder="Kosongkan untuk otomatis" />
          </label>
          <label className="md:col-span-2 grid gap-1">
            <span className="text-sm font-medium">Description</span>
            <textarea className="border rounded-md px-3 py-2" rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Price (IDR)</span>
            <input type="number" className="border rounded-md px-3 py-2" required value={form.price} onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Image URL</span>
            <input className="border rounded-md px-3 py-2" required value={form.imageUrl} onChange={e=>setForm(f=>({...f,imageUrl:e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Sold Count</span>
            <input type="number" className="border rounded-md px-3 py-2" value={form.soldCount} onChange={e=>setForm(f=>({...f,soldCount:Number(e.target.value)}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Active</span>
            <select className="border rounded-md px-3 py-2" value={form.isActive?"true":"false"} onChange={e=>setForm(f=>({...f,isActive:e.target.value==="true"}))}>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Category</span>
            <select className="border rounded-md px-3 py-2" required disabled={!hasCategories} value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))}>
              <option value="">{hasCategories?"Select Category":"No active categories"}</option>
              {activeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Optional: First Link</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Link URL</span>
                <input className="border rounded-md px-3 py-2" value={form.linkUrl} onChange={e=>setForm(f=>({...f,linkUrl:e.target.value}))} placeholder="https://..." />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Link Label</span>
                <input className="border rounded-md px-3 py-2" value={form.linkLabel} onChange={e=>setForm(f=>({...f,linkLabel:e.target.value}))} placeholder="Preview / 3x1 / etc" />
              </label>
            </div>
          </div>
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
