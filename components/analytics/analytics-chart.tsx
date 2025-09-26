"use client"

import { useTheme } from "next-themes"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type SeriesPoint = { date: string; cutter: number; reels: number }

export default function AnalyticsChart({ data }: { data: SeriesPoint[] }) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  const cutterColor = dark ? "#ffffff" : "#2563eb" // blue-600 light
  const reelsColor = dark ? "#ffffffcc" : "#16a34a" // green-600 light

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
          <CartesianGrid stroke={dark ? "#333" : "#e5e7eb"} strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tick={{ fill: dark ? "#ddd" : "#374151", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: dark ? "#555" : "#d1d5db" }}
          />
          <YAxis
            tick={{ fill: dark ? "#ddd" : "#374151", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: dark ? "#555" : "#d1d5db" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: dark ? "#1f2937" : "#ffffff",
              border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: dark ? "#f3f4f6" : "#111827" }}
          />
          <Line
            type="monotone"
            dataKey="cutter"
            stroke={cutterColor}
            strokeWidth={2}
            dot={false}
            name="Cutter"
          />
          <Line
            type="monotone"
            dataKey="reels"
            stroke={reelsColor}
            strokeWidth={2}
            dot={false}
            name="Reels"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
