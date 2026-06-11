"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartArea,
  MessageSquare,
  TrendingUp,
  Eye,
  Repeat,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/widgets/widget";
import { AnimatedNumber } from "@/components/widgets/animated-number";
import { useHQ } from "@/store/hq-store";
import { PLATFORMS, PLATFORM_ORDER } from "@/lib/config";
import { GROWTH_30D, ENGAGEMENT_BY_HOUR, RETENTION } from "@/lib/data/history";
import { formatCompact } from "@/lib/utils";
import type { ReactNode } from "react";

const tooltipStyle = {
  background: "hsl(264 18% 95% / 0.97)",
  border: "1px solid hsl(258 7% 58%)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "hsl(260 10% 13%)",
  boxShadow: "0 12px 40px -12px hsl(260 20% 20% / 0.4)",
};
const GRID = "hsl(258 7% 58% / 0.45)";
const axisProps = {
  tick: { fill: "hsl(258 7% 36%)", fontSize: 11 },
  axisLine: false,
  tickLine: false,
};

function ChartFrame({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between p-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="px-2 pb-3">{children}</div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const stats = useHQ((s) => s.stats);
  const timeseries = useHQ((s) => s.timeseries);

  const firstMembers = GROWTH_30D[0].members;
  const lastMembers = GROWTH_30D[GROWTH_30D.length - 1].members;
  const growthPct = Math.round(((lastMembers - firstMembers) / firstMembers) * 100);

  const distribution = stats.platformBreakdown.map((p) => ({
    name: PLATFORMS[p.platform].label,
    value: Math.round(p.share * 100),
    color: PLATFORMS[p.platform].hex,
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Market Pulse"
        description="The heartbeat of the Market Bubble community, measured in real time."
        icon={<ChartArea className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total Messages"
          value={<AnimatedNumber value={stats.totalMessages} format={formatCompact} />}
          icon={<MessageSquare className="h-4 w-4" />}
          sub={<span className="text-emerald-600">↑ 18.2% this week</span>}
        />
        <StatTile
          label="Community Growth"
          value={`+${growthPct}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="text-emerald-600"
          sub={<span className="text-muted-foreground">{formatCompact(lastMembers)} members</span>}
        />
        <StatTile
          label="Avg Concurrent"
          value={<AnimatedNumber value={stats.currentViewers} />}
          icon={<Eye className="h-4 w-4" />}
          accent="text-bubble"
          sub={<span className="text-muted-foreground">peak {formatCompact(stats.peakViewers)}</span>}
        />
        <StatTile
          label="Wk-4 Retention"
          value="55%"
          icon={<Repeat className="h-4 w-4" />}
          accent="text-violet-600"
          sub={<span className="text-emerald-600">above benchmark</span>}
        />
      </div>

      {/* Growth + distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartFrame
          title="Community Growth"
          subtitle="Members over the last 30 days"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={GROWTH_30D} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g-members" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PLATFORMS.hq.hex} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PLATFORMS.hq.hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={28} />
              <YAxis {...axisProps} tickFormatter={(v) => formatCompact(v as number)} width={44} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCompact(v), "Members"]} />
              <Area
                type="monotone"
                dataKey="members"
                stroke={PLATFORMS.hq.hex}
                strokeWidth={2}
                fill="url(#g-members)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Platform Distribution" subtitle="Share of messages">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                strokeWidth={0}
              >
                {distribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 pb-2">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="tabular font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </ChartFrame>
      </div>

      {/* Live velocity + platform stacked */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartFrame title="Live Message Velocity" subtitle="Messages per minute, this session">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeseries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g-vel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={40} />
              <YAxis {...axisProps} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "msg/min"]} />
              <Area type="monotone" dataKey="messages" stroke="#0f766e" strokeWidth={2} fill="url(#g-vel)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Messages by Platform" subtitle="Daily volume, last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={GROWTH_30D} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {PLATFORM_ORDER.map((p) => (
                  <linearGradient key={p} id={`g-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PLATFORMS[p].hex} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={PLATFORMS[p].hex} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={28} />
              <YAxis {...axisProps} tickFormatter={(v) => formatCompact(v as number)} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCompact(v)} />
              {PLATFORM_ORDER.map((p) => (
                <Area
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stackId="1"
                  stroke={PLATFORMS[p].hex}
                  strokeWidth={1.5}
                  fill={`url(#g-${p})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      {/* Hourly + retention */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartFrame title="Engagement by Hour" subtitle="When the community is most active (UTC)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ENGAGEMENT_BY_HOUR} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="hour" {...axisProps} minTickGap={24} />
              <YAxis {...axisProps} tickFormatter={(v) => formatCompact(v as number)} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(0 0% 100% / 0.04)" }} />
              <Bar dataKey="activity" fill={PLATFORMS.hq.hex} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Viewer Retention" subtitle="% of cohort returning each week">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={RETENTION} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Retention"]} />
              <Line
                type="monotone"
                dataKey="retention"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#7c3aed" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  );
}
