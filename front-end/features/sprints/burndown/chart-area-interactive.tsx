"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", atual: 5, planejada: 3 },
  { date: "2024-04-02", atual: 2, planejada: 4 },
  { date: "2024-04-03", atual: 7, planejada: 1 },
  { date: "2024-04-04", atual: 4, planejada: 2 },
  { date: "2024-04-05", atual: 6, planejada: 3 },
  { date: "2024-04-06", atual: 1, planejada: 4 },
  { date: "2024-04-07", atual: 3, planejada: 4 },
  { date: "2024-04-08", atual: 8, planejada: 8 },
  { date: "2024-04-09", atual: 2, planejada: 1 },
  { date: "2024-04-10", atual: 5, planejada: 2 },
  { date: "2024-04-11", atual: 7, planejada: 4 },
  { date: "2024-04-12", atual: 3, planejada: 5 },
  { date: "2024-04-13", atual: 6, planejada: 7 },
  { date: "2024-04-14", atual: 1, planejada: 2 },
  { date: "2024-04-15", atual: 4, planejada: 8 },
  { date: "2024-04-16", atual: 2, planejada: 2 },
  { date: "2024-04-17", atual: 8, planejada: 5 },
  { date: "2024-04-18", atual: 3, planejada: 6 },
  { date: "2024-04-19", atual: 5, planejada: 4 },
  { date: "2024-04-20", atual: 7, planejada: 3 },
  { date: "2024-04-21", atual: 2, planejada: 1 },
  { date: "2024-04-22", atual: 6, planejada: 7 },
  { date: "2024-04-23", atual: 4, planejada: 2 },
  { date: "2024-04-24", atual: 8, planejada: 3 },
  { date: "2024-04-25", atual: 1, planejada: 5 },
  { date: "2024-04-26", atual: 3, planejada: 8 },
  { date: "2024-04-27", atual: 5, planejada: 4 },
  { date: "2024-04-28", atual: 2, planejada: 4 },
  { date: "2024-04-29", atual: 7, planejada: 6 },
  { date: "2024-04-30", atual: 4, planejada: 7 },
  { date: "2024-05-01", atual: 1, planejada: 2 },
  { date: "2024-05-02", atual: 6, planejada: 3 },
  { date: "2024-05-03", atual: 8, planejada: 2 },
  { date: "2024-05-04", atual: 3, planejada: 5 },
  { date: "2024-05-05", atual: 5, planejada: 8 },
  { date: "2024-05-06", atual: 2, planejada: 4 },
  { date: "2024-05-07", atual: 7, planejada: 1 },
  { date: "2024-05-08", atual: 4, planejada: 5 },
  { date: "2024-05-09", atual: 1, planejada: 4 },
  { date: "2024-05-10", atual: 6, planejada: 2 },
  { date: "2024-05-11", atual: 8, planejada: 7 },
  { date: "2024-05-12", atual: 3, planejada: 3 },
  { date: "2024-05-13", atual: 5, planejada: 6 },
  { date: "2024-05-14", atual: 2, planejada: 8 },
  { date: "2024-05-15", atual: 7, planejada: 7 },
  { date: "2024-05-16", atual: 4, planejada: 1 },
  { date: "2024-05-17", atual: 1, planejada: 5 },
  { date: "2024-05-18", atual: 6, planejada: 4 },
  { date: "2024-05-19", atual: 8, planejada: 4 },
  { date: "2024-05-20", atual: 3, planejada: 2 },
  { date: "2024-05-21", atual: 5, planejada: 8 },
  { date: "2024-05-22", atual: 2, planejada: 1 },
  { date: "2024-05-23", atual: 7, planejada: 3 },
  { date: "2024-05-24", atual: 4, planejada: 2 },
  { date: "2024-05-25", atual: 1, planejada: 6 },
  { date: "2024-05-26", atual: 6, planejada: 7 },
  { date: "2024-05-27", atual: 8, planejada: 4 },
  { date: "2024-05-28", atual: 3, planejada: 2 },
  { date: "2024-05-29", atual: 5, planejada: 1 },
  { date: "2024-05-30", atual: 2, planejada: 8 },
  { date: "2024-05-31", atual: 7, planejada: 3 },
  { date: "2024-06-01", atual: 4, planejada: 5 },
  { date: "2024-06-02", atual: 1, planejada: 4 },
  { date: "2024-06-03", atual: 6, planejada: 2 },
  { date: "2024-06-04", atual: 8, planejada: 7 },
  { date: "2024-06-05", atual: 3, planejada: 1 },
  { date: "2024-06-06", atual: 5, planejada: 6 },
  { date: "2024-06-07", atual: 2, planejada: 3 },
  { date: "2024-06-08", atual: 7, planejada: 8 },
  { date: "2024-06-09", atual: 4, planejada: 4 },
  { date: "2024-06-10", atual: 1, planejada: 2 },
  { date: "2024-06-11", atual: 6, planejada: 3 },
  { date: "2024-06-12", atual: 8, planejada: 5 },
  { date: "2024-06-13", atual: 3, planejada: 1 },
  { date: "2024-06-14", atual: 5, planejada: 7 },
  { date: "2024-06-15", atual: 2, planejada: 4 },
  { date: "2024-06-16", atual: 7, planejada: 3 },
  { date: "2024-06-17", atual: 4, planejada: 8 },
  { date: "2024-06-18", atual: 1, planejada: 2 },
  { date: "2024-06-19", atual: 6, planejada: 3 },
  { date: "2024-06-20", atual: 8, planejada: 5 },
  { date: "2024-06-21", atual: 3, planejada: 5 },
  { date: "2024-06-22", atual: 5, planejada: 7 },
  { date: "2024-06-23", atual: 2, planejada: 4 },
  { date: "2024-06-24", atual: 7, planejada: 4 },
  { date: "2024-06-25", atual: 4, planejada: 2 },
  { date: "2024-06-26", atual: 1, planejada: 7 },
  { date: "2024-06-27", atual: 6, planejada: 1 },
  { date: "2024-06-28", atual: 8, planejada: 3 },
  { date: "2024-06-29", atual: 3, planejada: 6 },
  { date: "2024-06-30", atual: 5, planejada: 2 },
];

const chartConfig = {
  tarefas: {
    label: "Tarefas",
  },
  planejada: {
    label: "Planejada",
    color: "#A5ACB4",
  },
  atual: {
    label: "Atual",
    color: "#960005",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Análise da Sprint</CardTitle>
          <CardDescription>
            Tarefas planejadas e feitas durante os dias
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-40 rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Sprint 1
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Sprint 2
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Sprint 3
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-100 w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillatual" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-atual)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-atual)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillplanejada" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-planejada)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-planejada)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="planejada"
              type="natural"
              fill="url(#fillplanejada)"
              stroke="var(--color-planejada)"
              stackId="a"
            />
            <Area
              dataKey="atual"
              type="natural"
              fill="url(#fillatual)"
              stroke="var(--color-atual)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
