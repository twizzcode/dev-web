import React from "react";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">Products</div>
        <div className="rounded-lg border p-4">Categories</div>
        <div className="rounded-lg border p-4">Orders (soon)</div>
      </div>
    </div>
  );
}
