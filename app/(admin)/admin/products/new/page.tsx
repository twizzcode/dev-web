"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string; isActive: boolean };

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    imageUrl: "",
    soldCount: 0,
    isActive: true,
    categoryId: "",
    // Optional: quick link input
    linkUrl: "",
    linkLabel: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function loadCats() {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error(await res.text());
        const data: Category[] = await res.json();
        if (!stop) setCategories(data);
      } catch (e:any) {
        if (!stop) setCategories([]);
      } finally {
        if (!stop) setLoadingCats(false);
      }
    }
    loadCats();
    return () => { stop = true; };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const selectedCat = categories.find(c => c.id === form.categoryId);
      const payload: any = {
        title: form.title.trim(),
        description: form.description,
        price: Number(form.price) || 0,
        imageUrl: form.imageUrl,
        soldCount: Number(form.soldCount) || 0,
        isActive: !!form.isActive,
        categoryId: form.categoryId,
        categorySlug: selectedCat?.slug,
      };
      const cleanedSlug = form.slug.trim();
      if (cleanedSlug) {
        payload.slug = cleanedSlug;
      }
      if (!payload.categoryId) {
        throw new Error("Please select a category");
      }
      // one optional link
      if (form.linkUrl) {
        payload.links = { create: [{ url: form.linkUrl, label: form.linkLabel || null, position: 1 }] };
      }
      const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.error || j.message || msg; } catch {}
        throw new Error(msg || `Request failed (${res.status})`);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err:any) {
      setError(err.message || "Failed to create product");
    } finally { setSaving(false); }
  }

  const activeCategories = useMemo(() => categories.filter(c => c.isActive), [categories]);
  const hasCategories = activeCategories.length > 0;

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">New Product</h2>
      <form onSubmit={onSubmit} className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className="border rounded-md px-3 py-2"
              required
              value={form.title}
              onChange={e=>{
                const title = e.target.value;
                setForm(f=>{
                  const next: typeof f = { ...f, title };
                  if (!slugTouched) {
                    next.slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g,'-')
                      .replace(/(^-|-$)/g,'');
                  }
                  return next;
                });
              }}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Slug</span>
            <input
              className="border rounded-md px-3 py-2"
              value={form.slug}
              onChange={e=>{
                setSlugTouched(true);
                setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}))
              }}
              placeholder="Auto-generated from Title"
            />
            <span className="text-xs text-muted-foreground">Dikosongkan juga boleh — akan otomatis dibuat dari Title.</span>
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
            <select className="border rounded-md px-3 py-2" required disabled={loadingCats || !hasCategories} value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))}>
              <option value="">{loadingCats?"Loading...": hasCategories?"Select Category":"No active categories"}</option>
              {activeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!hasCategories && !loadingCats && (
              <p className="text-xs text-muted-foreground mt-1">No active categories found. <a className="underline" href="/admin/categories/new">Add a category</a>.</p>
            )}
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
          <button disabled={saving} className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50">{saving?"Saving...":"Create"}</button>
          <button type="button" onClick={()=>router.back()} className="inline-flex items-center px-4 py-2 rounded-md border">Cancel</button>
        </div>
      </form>
    </div>
  );
}
