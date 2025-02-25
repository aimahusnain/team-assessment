"use client";

import {
  Activity,
  Brain,
  Phone,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type * as React from "react";

import BarChartComponent from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-8 p-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your business metrics and performance indicators
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Activities"
            value="9,458,980"
            trend={5.2}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Users"
            value="30,987"
            trend={-2.1}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Call Minutes"
            value="42,890"
            trend={8.4}
            icon={<Phone className="h-4 w-4" />}
          />
          <MetricCard
            title="Skills Progress"
            value="87%"
            trend={3.2}
            icon={<Brain className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <div>
          <BarChartComponent />
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-2 flex items-center text-xs">
          {trend > 0 ? (
            <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
          )}
          <span className={trend > 0 ? "text-emerald-500" : "text-red-500"}>
            {Math.abs(trend)}%
          </span>
          <span className="ml-1 text-muted-foreground">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
