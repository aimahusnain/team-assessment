"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { MonthPicker } from "@/components/ui/monthpicker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { abbreviateMonth, cn, formatPercentage, formatValue } from "@/lib/utils"
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, CalendarIcon, Check, ChevronDown, ChevronUp, Loader2, SendHorizontal } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type IndividualData = {
  name: string
  team: string | null
  department: string | null
  monthData: {
    month: string
    totalCallMinutes: number
    tcmScore: { level: number; score: number | string }
    callEfficiency: number
    ceScore: { level: number; score: number | string }
    totalSales: number
    tsScore: { level: number; score: number | string }
    livRatio: number
    rbslScore: { level: number; score: number | string }
  }[]
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

interface SortableHeaderProps {
  column: Column<IndividualData, unknown>
  title: string
}

// Add SortableHeader component
const SortableHeader = ({ column, title }: SortableHeaderProps) => {
  return (
    <Button
      variant="ghost"
      onClick={() => {
        const currentSort = column.getIsSorted()
        if (currentSort === false) {
          column.toggleSorting(false)
        } else if (currentSort === "asc") {
          column.toggleSorting(true)
        } else {
          column.clearSorting()
        }
      }}
      className="p-0 hover:bg-transparent hover:text-white"
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}

const IndividualsDashboard = () => {
  const [data, setData] = useState<IndividualData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasFilterChanges, setHasFilterChanges] = useState(false)

  const [weightages, setWeightages] = useState({
    tcm: 0,
    ce: 0,
    ts: 0,
    rbsl: 0,
  })

  useEffect(() => {
    const fetchWeightages = async () => {
      try {
        const response = await fetch("/api/get-inputs")
        const data = await response.json()
        if (data.success && data.data[0]) {
          const weights = {
            tcm: Number.parseFloat(data.data[0].score_tcm_weightage),
            ce: Number.parseFloat(data.data[0].score_ce_weightage),
            ts: Number.parseFloat(data.data[0].score_ts_weightage),
            rbsl: Number.parseFloat(data.data[0].score_rbsl_weightage),
          }
          setWeightages(weights)
        }
      } catch (error) {
        console.error("Error fetching weightages:", error)
      }
    }
    fetchWeightages()
  }, [])

  // Modify the filter values state setter to track changes
  const handleFilterChange = (months: string[], year: number) => {
    setFilterValues((prev) => {
      const newValues = { months, year }
      // Check if values actually changed
      const changed =
        prev.year !== year || prev.months.length !== months.length || !prev.months.every((m) => months.includes(m))

      setHasFilterChanges(changed)
      return newValues
    })
  }

  console.log(error)

  // Filter states
  const [filterValues, setFilterValues] = useState({
    months: [] as string[],
    year: new Date().getFullYear(),
  })

  // Applied filter states
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Total Call Minutes",
    "TCM Score",
    "Call Efficiency",
    "CE Score",
    "Total Sales",
    "TS Score",
    "LIV Ratio",
    "RBSL Score",
  ])

  // Initialize with previous month
  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const initialMonth = months[previousMonth]
    setFilterValues((prev) => ({
      ...prev,
      months: [initialMonth],
    }))
    setSelectedMonths([initialMonth])
  }, [])

  const getColumns = useCallback((): ColumnDef<IndividualData>[] => {
    const baseColumns: ColumnDef<IndividualData>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <div className="font-medium min-w-[200px]">{row.getValue("name")}</div>,
      },
      {
        id: "team",
        accessorKey: "team",
        header: ({ column }) => <SortableHeader column={column} title="Team" />,
        cell: ({ row }) => row.getValue("team"),
      },
      {
        id: "department",
        accessorKey: "department",
        header: ({ column }: { column: Column<IndividualData, unknown> }) => (
          <SortableHeader column={column} title="Department" />
        ),
        cell: ({ row }) => row.getValue("department"),
      },
    ]

    const sortedSelectedMonths = selectedMonths.sort((a, b) => months.indexOf(a) - months.indexOf(b))

    const monthColumns: ColumnDef<IndividualData>[] = sortedSelectedMonths.flatMap((month) => [
      ...(selectedColumns.includes("Total Call Minutes")
        ? [
            {
              id: `${month}-totalCallMinutes`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.totalCallMinutes ?? 0,
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="TCM" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Total Call Minutes</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => <div className="text-center">{formatValue(getValue())}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("TCM Score")
        ? [
            {
              id: `${month}-tcmScore`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.tcmScore.level ?? 0, // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="Score" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>TCM Score</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ), // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{getValue() || "-"}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("Call Efficiency")
        ? [
            {
              id: `${month}-callEfficiency`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.callEfficiency ?? 0, // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="CE" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Call Efficiency</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ), // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => <div className="text-center">{formatPercentage(getValue())}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("CE Score")
        ? [
            {
              id: `${month}-ceScore`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.ceScore.level ?? 0, // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="Score" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>CE Score</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ), // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{getValue() || "-"}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("Total Sales")
        ? [
            {
              id: `${month}-totalSales`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.totalSales ?? 0, // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="TS" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Total Sales</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ), // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{formatValue(getValue())}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("TS Score")
        ? [
            {
              id: `${month}-tsScore`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.tsScore.level ?? 0, // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="Score" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>TS Score</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ), // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{getValue() || "-"}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("LIV Ratio")
        ? [
            {
              id: `${month}-livRatio`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.livRatio ?? 0,
              // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="LIV" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>LIV Ratio</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ),
              // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{formatPercentage(getValue())}</div>,
            },
          ]
        : []),
      ...(selectedColumns.includes("RBSL Score")
        ? [
            {
              id: `${month}-rbslScore`,
              accessorFn: (row: IndividualData) => row.monthData.find((md) => md.month === month)?.rbslScore.level ?? 0,
              // @ts-expect-error Type definition issue in table column configuration

              header: ({ column }) => (
                <div className="space-y-2 flex items-center justify-center flex-col gap-0">
                  <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
                    {month.substring(0, 3)}
                  </div>
                  <div className="text-center dark:text-white">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortableHeader column={column} title="Score" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>RBSL Score</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ),
              // @ts-expect-error Type definition issue in table column configuration

              cell: ({ getValue }) => <div className="text-center">{getValue() || "-"}</div>,
            },
          ]
        : []),
      {
        id: `${month}-totalScore`,
        accessorFn: (row: IndividualData) => {
          const monthData = row.monthData.find((md) => md.month === month)
          if (!monthData) return 0

          const tcmScore = monthData.tcmScore.level
          const ceScore = monthData.ceScore.level
          const tsScore = monthData.tsScore.level
          const rbslScore = monthData.rbslScore.level

          return (
            tcmScore * (weightages.tcm / 100) +
            ceScore * (weightages.ce / 100) +
            tsScore * (weightages.ts / 100) +
            rbslScore * (weightages.rbsl / 100)
          ).toFixed(2)
        },
        header: ({ column }) => (
          <div className="space-y-2 flex items-center justify-center flex-col gap-0">
            <div className={cn(getMonthColor(month), "px-2 py-1 rounded-md text-center text-xs font-bold")}>
              {month.substring(0, 3)}
            </div>
            <div className="text-center dark:text-white">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SortableHeader column={column} title="Avg. score" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Avg. Total Score</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ),
        cell: ({ getValue }) => <div className="text-center">{String(getValue()) || "-"}</div>,
      },
    ])

    return [...baseColumns, ...monthColumns]
  }, [selectedMonths, selectedColumns, weightages])

  const fetchData = useCallback(async () => {
    if (selectedMonths.length === 0) {
      setData([])
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    try {
      setIsRefreshing(true)
      const params = new URLSearchParams()
      selectedMonths.forEach((month) => params.append("months", month))
      params.append("year", selectedYear.toString())

      const response = await fetch(`/api/merged-names-individual?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      const transformedData = transformApiResponse(result.names)
      setData(transformedData)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An error occurred while fetching data")
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [selectedMonths, selectedYear])

  const table = useReactTable({
    data,
    columns: getColumns(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 30,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  const getMonthColor = (month: string) => {
    const colors = {
      January: "bg-red-500 text-white border-red-600",
      February: "bg-orange-500 text-white border-orange-600",
      March: "bg-amber-500 text-white border-amber-600",
      April: "bg-yellow-500 text-white border-yellow-600",
      May: "bg-lime-500 text-white border-lime-600",
      June: "bg-green-500 text-white border-green-600",
      July: "bg-emerald-500 text-white border-emerald-600",
      August: "bg-teal-500 text-white border-teal-600",
      September: "bg-cyan-500 text-white border-cyan-600",
      October: "bg-sky-500 text-white border-sky-600",
      November: "bg-blue-500 text-white border-blue-600",
      December: "bg-indigo-500 text-white border-indigo-600",
    }
    return colors[month as keyof typeof colors] || "bg-gray-500 text-white border-gray-600"
  }

  // Apply filters function - now only for month and year
  const applyFilters = useCallback(() => {
    setSelectedMonths(filterValues.months)
    setSelectedYear(filterValues.year)
    setHasFilterChanges(false)
  }, [filterValues])

  // Column selection is now immediate
  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]))
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData]) // Dependencies for when to fetch data

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  interface ApiResponseItem {
    name: string
    team: string | null
    department: string | null
    month: string
    totalCallMinutes: string
    tcmScore: { level: number; score: number | string }
    callEfficiency: string
    ceScore: { level: number; score: number | string }
    totalSales: string
    tsScore: { level: number; score: number | string }
    livRatio: string
    rbslScore: { level: number; score: number | string }
  }

  const transformApiResponse = (apiData: ApiResponseItem[]): IndividualData[] => {
    const dataMap = new Map<string, IndividualData>()

    apiData.forEach((item) => {
      const existingEntry = dataMap.get(item.name)

      const monthData = {
        month: item.month,
        totalCallMinutes: Number.parseInt(item.totalCallMinutes.replace(/,/g, "")),
        tcmScore: item.tcmScore,
        callEfficiency: Number.parseFloat(item.callEfficiency) / 100,
        ceScore: item.ceScore,
        totalSales: Number.parseInt(item.totalSales.replace(/,/g, "")),
        tsScore: item.tsScore,
        livRatio: Number.parseFloat(item.livRatio) / 100,
        rbslScore: item.rbslScore,
      }

      if (existingEntry) {
        existingEntry.monthData.push(monthData)
      } else {
        dataMap.set(item.name, {
          name: item.name,
          team: item.team,
          department: item.department,
          monthData: [monthData],
        })
      }
    })

    return Array.from(dataMap.values())
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Individuals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card className="border-none">
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-start gap-2">
                <Input
                  placeholder="Search by name..."
                  className="max-w-64"
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !filterValues.months.length && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterValues.months.length > 0 ? (
                        `${filterValues.months.length} month${
                          filterValues.months.length > 1 ? "s" : ""
                        } selected (${filterValues.year})`
                      ) : (
                        <span>Pick months</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <MonthPicker
                      selectedMonths={filterValues.months}
                      selectedYear={filterValues.year}
                      onSelect={handleFilterChange}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  size="icon"
                  variant="secondary"
                  onClick={applyFilters}
                  disabled={isRefreshing}
                  className={cn(
                    "transition-all duration-300",
                    hasFilterChanges && "border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]",
                  )}
                >
                  <SendHorizontal className={cn("transition-colors", hasFilterChanges && "text-yellow-400")} />
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div>Weightages:</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-primary/10">TCM: {weightages.tcm.toFixed(0)}%</span>
                  <span className="px-2 py-1 rounded-md bg-primary/10">CE: {weightages.ce.toFixed(0)}%</span>
                  <span className="px-2 py-1 rounded-md bg-primary/10">TS: {weightages.ts.toFixed(0)}%</span>
                  <span className="px-2 py-1 rounded-md bg-primary/10">RBSL: {weightages.rbsl.toFixed(0)}%</span>
                </div>
              </div>

              {/* Table Section */}
              <div className="rounded-md border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  {selectedMonths.length === 0 ? (
                    <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                      Please select a month to see the data.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              const monthHeader = header.column.parent
                              if (
                                monthHeader &&
                                monthHeader.id !== "name" &&
                                monthHeader.id !== "team" &&
                                monthHeader.id !== "department"
                              ) {
                                return (
                                  <th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    className={cn(
                                      getMonthColor(monthHeader.id),
                                      "px-4 py-2 text-center font-semibold transition-colors duration-200",
                                      "border-b-2",
                                    )}
                                  >
                                    {monthHeader.id === header.column.id ? (
                                      // Show abbreviated month name
                                      <div className="text-xl font-bold mb-3 text-white tracking-wide">
                                        {abbreviateMonth(monthHeader.id)}
                                      </div>
                                    ) : (
                                      <div className="text-white">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                      </div>
                                    )}
                                  </th>
                                )
                              }
                              return (
                                <TableHead key={header.id} colSpan={header.colSpan} className="bg-muted/50">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {isRefreshing ? (
                          <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-96 text-center">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <p className="text-lg text-muted-foreground">Loading data...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-96 text-center">
                              No results found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {/* Footer Section */}
              <div className="fixed bottom-8 left-0 right-0 flex justify-center z-10 transition-all duration-150">
                <div className="flex items-center justify-between py-2 rounded-full shadow-lg bg-background border-t gap-20 px-5 w-fit">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} records found
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="secondary" size="sm">
                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search columns..." />
                        <CommandList>
                          <CommandEmpty>No column found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              "Total Call Minutes",
                              "TCM Score",
                              "Call Efficiency",
                              "CE Score",
                              "Total Sales",
                              "TS Score",
                              "LIV Ratio",
                              "RBSL Score",
                            ].map((column) => (
                              <CommandItem key={column} onSelect={() => handleColumnSelection(column)}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedColumns.includes(column) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {column}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default IndividualsDashboard