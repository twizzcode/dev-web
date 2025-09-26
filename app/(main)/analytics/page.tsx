import React, { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsChart from "../../../components/analytics/analytics-chart";

type SeriesPoint = { date: string; cutter: number; reels: number };

export const dynamic = "force-dynamic";

// Server function ambil data
async function getAnalytics() {
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<Array<{ day: Date; cutter: number; reels: number }>>`
    SELECT
      date_trunc('day', "createdAt")::date AS day,
      SUM(CASE WHEN "kind" = 'cutter_click' THEN 1 ELSE 0 END)::int AS cutter,
      SUM(CASE WHEN "kind" = 'reels_click' THEN 1 ELSE 0 END)::int AS reels
    FROM "AnalyticsEvent"
    WHERE "createdAt" >= ${start}
    GROUP BY day
    ORDER BY day
  `;

  const byKey = new Map<string, { cutter: number; reels: number }>();
  for (const r of rows) {
    const key = r.day.toISOString().slice(0, 10);
    byKey.set(key, { cutter: Number(r.cutter || 0), reels: Number(r.reels || 0) });
  }

  const points: SeriesPoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const v = byKey.get(key) || { cutter: 0, reels: 0 };
    points.push({ date: key, cutter: v.cutter, reels: v.reels });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCutter, todayReels] = await Promise.all([
    prisma.analyticsEvent.count({ where: { kind: "cutter_click", createdAt: { gte: today } } }),
    prisma.analyticsEvent.count({ where: { kind: "reels_click", createdAt: { gte: today } } }),
  ]);

  const [totalCutter, totalReels] = await Promise.all([
    prisma.analyticsEvent.count({ where: { kind: "cutter_click" } }),
    prisma.analyticsEvent.count({ where: { kind: "reels_click" } }),
  ]);

  // Unique users today by IP
  let todayUserCount = 0;
  try {
    const [{ count: ipCount } = { count: 0 }] = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "ip")::int AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${today} AND "ip" IS NOT NULL
    `;
    todayUserCount = ipCount;
  } catch {
    // silent
  }
  return { points, todayCutter, todayReels, totalCutter, totalReels, todayUserCount };
}

// Komponen server yang fetch data (dibungkus Suspense)
async function AnalyticsData() {
  try {
    const { points, todayCutter, todayReels, totalCutter, totalReels, todayUserCount } = await getAnalytics();
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader>
                <CardTitle>Today Cutter</CardTitle>
                <CardDescription>Jumlah klik hari ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{todayCutter.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today Reels</CardTitle>
                <CardDescription>Jumlah klik hari ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{todayReels.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Cutter</CardTitle>
                <CardDescription>Sejak awal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totalCutter.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Reels</CardTitle>
                <CardDescription>Sejak awal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totalReels.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today Users</CardTitle>
                <CardDescription>Total user hari ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{todayUserCount.toLocaleString()}</div>
              </CardContent>
            </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>30 Hari Terakhir</CardTitle>
            <CardDescription>Cutter vs Reels per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={points} />
          </CardContent>
        </Card>
      </>
    );
  } catch {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Tidak bisa mengambil data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gagal terhubung ke database. Periksa variabel environment.
          </p>
        </CardContent>
      </Card>
    );
  }
}

// Skeleton hanya untuk chart & cards ketika loading
function AnalyticsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-28 animate-pulse bg-muted" />
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>30 Hari Terakhir</CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    </>
  );
}

export default function AnalyticsPage() {
  // Page shell keluar dulu, data stream via Suspense
  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 md:p-8 space-y-6">
      <Suspense fallback={<AnalyticsSkeleton />}>
        {/* Server component with data */}
        <AnalyticsData />
      </Suspense>
    </div>
  );
}
