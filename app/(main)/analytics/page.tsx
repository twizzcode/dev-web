import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsChart from "../../../components/analytics/analytics-chart";

type SeriesPoint = { date: string; cutter: number; reels: number };

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29); // inclusive last 30 days
  start.setHours(0, 0, 0, 0);

  // Timeseries aggregated by day for both kinds
  // Using Postgres date_trunc to bucket by day
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

  // Map rows to a full 30-day array (fill missing days with 0)
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

  // Today counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCutter, todayReels] = await Promise.all([
    prisma.analyticsEvent.count({ where: { kind: "cutter_click", createdAt: { gte: today } } }),
    prisma.analyticsEvent.count({ where: { kind: "reels_click", createdAt: { gte: today } } }),
  ]);

  // Total counts
  const [totalCutter, totalReels] = await Promise.all([
    prisma.analyticsEvent.count({ where: { kind: "cutter_click" } }),
    prisma.analyticsEvent.count({ where: { kind: "reels_click" } }),
  ]);

  return { points, todayCutter, todayReels, totalCutter, totalReels };
}

export default async function AnalyticsPage() {
  try {
    const { points, todayCutter, todayReels, totalCutter, totalReels } = await getAnalytics();
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    );
  } catch (e) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Tidak bisa mengambil data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gagal terhubung ke database. Pastikan DATABASE_URL dan DIRECT_URL benar dan database aktif.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
