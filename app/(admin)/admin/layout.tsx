import React from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="border-b lg:border-b-0 lg:border-r bg-background/60 backdrop-blur">
        <nav className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Catalog</div>
          <Link className="block px-3 py-2 rounded hover:bg-accent" href="/admin">Overview</Link>
          <Link className="block px-3 py-2 rounded hover:bg-accent" href="/admin/categories">Categories</Link>
          <Link className="block px-3 py-2 rounded hover:bg-accent" href="/admin/products">Products</Link>
        </nav>
      </aside>
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
}
