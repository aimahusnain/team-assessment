"use client"

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts"

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
  ChartTooltipContent,
} from "@/components/ui/chart"

// Sample data for activities by department
const chartData = [
  { department: "Sales", activities: 120 },
  { department: "Marketing", activities: 85 },
  { department: "HR", activities: 60 },
  { department: "Engineering", activities: 150 },
  { department: "Support", activities: 95 },
]

const chartConfig = {
  activities: {
    label: "Activities",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function ActivitiesByDepartmentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities by Department</CardTitle>
        <CardDescription>Number of activities per department</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart width={500} height={300} data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="department"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="activities" fill="hsl(var(--chart-1))" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
