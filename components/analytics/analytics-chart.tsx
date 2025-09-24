"use client"

import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AnalyticsChart({ data }: { data: { date: string; cutter: number; reels: number }[] }) {
  const config = {
    cutter: { label: "Cutter", color: "hsl(var(--primary))" },
    reels: { label: "Reels", color: "hsl(var(--secondary-foreground))" },
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillCutter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-cutter)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-cutter)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillReels" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-reels)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-reels)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis width={40} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Legend />
        <Area dataKey="cutter" name="Cutter" type="monotone" fill="url(#fillCutter)" stroke="var(--color-cutter)" />
        <Area dataKey="reels" name="Reels" type="monotone" fill="url(#fillReels)" stroke="var(--color-reels)" />
      </AreaChart>
    </ChartContainer>
  )
}
