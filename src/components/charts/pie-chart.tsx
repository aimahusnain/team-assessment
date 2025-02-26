"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Sample Data (Updated as per your requirements)
const chartData = [
  { category: "Direct Traffic", visitors: 800, fill: "var(--color-direct)" },
  { category: "Organic Search", visitors: 1200, fill: "var(--color-organic)" },
  { category: "Paid Ads", visitors: 500, fill: "var(--color-paid)" },
  { category: "Social Media", visitors: 700, fill: "var(--color-social)" },
  { category: "Referral", visitors: 400, fill: "var(--color-referral)" },
  { category: "Other", visitors: 350, fill: "var(--color-other)" },
]

// Chart color configuration
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  direct: {
    label: "Direct Traffic",
    color: "hsl(var(--chart-1))",
  },
  organic: {
    label: "Organic Search",
    color: "hsl(var(--chart-2))",
  },
  paid: {
    label: "Paid Ads",
    color: "hsl(var(--chart-3))",
  },
  social: {
    label: "Social Media",
    color: "hsl(var(--chart-4))",
  },
  referral: {
    label: "Referral",
    color: "hsl(var(--chart-5))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-6))",
  },
} satisfies ChartConfig

export default function PieChartComponent() {
  // Calculate total visitors dynamically
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Visitor Traffic Sources</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]" // Bigger chart
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="category"
              innerRadius={80} // Adjusted for better spacing
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
