"use client"

import MonthSelector from "@/components/month-selector"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Check, ChevronDown, ChevronUp, Loader2, RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type TeamData = {
  team: string
  // department: string | null
  monthData: {
    month: string
    avgTotalCallMinutes: number
    tcmScore: { level: number; score: number | string }
    avgCallEfficiency: number
    ceScore: { level: number; score: number | string }
    avgTotalSales: number
    tsScore: { level: number; score: number | string }
    avgRatioBetweenSkadeAndLiv: number
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
  column: Column<TeamData, unknown>
  title: string
}

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

const TeamsDashboard = () => {
  const [data, setData] = useState<TeamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Avg Total Call Minutes",
    "TCM Score",
    "Avg Call Efficiency",
    "CE Score",
    "Avg Total Sales",
    "TS Score",
    "Avg Ratio Between Skade & Liv",
    "RBSL Score",
  ])

  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    setSelectedMonths([months[previousMonth]])
  }, [])

  console.log(error)

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const getMonthColor = (month: string) => {
    const colors = [
      "bg-red-400 dark:bg-red-500",
      "bg-orange-400 dark:bg-orange-500",
      "bg-amber-400 dark:bg-amber-500",
      "bg-yellow-400 dark:bg-yellow-500",
      "bg-lime-400 dark:bg-lime-500",
      "bg-green-400 dark:bg-green-500",
      "bg-emerald-400 dark:bg-emerald-500",
      "bg-teal-400 dark:bg-teal-500",
      "bg-cyan-400 dark:bg-cyan-500",
      "bg-sky-400 dark:bg-sky-500",
      "bg-blue-400 dark:bg-blue-500",
      "bg-indigo-400 dark:bg-indigo-500",
    ]
    const monthIndex = months.indexOf(month)
    return colors[monthIndex]
  }

  const getColumns = useCallback((): ColumnDef<TeamData>[] => {
    const baseColumns: ColumnDef<TeamData>[] = [
      {
        id: "team",
        accessorKey: "team",
        header: ({ column }) => <SortableHeader column={column} title="Team" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("team")}</div>,
      },
      // {
      //   id: "department",
      //   accessorKey: "department",
      //   header: ({ column }) => <SortableHeader column={column} title="Department" />,
      //   cell: ({ row }) => row.getValue("department"),
      // },
    ]

    const sortedSelectedMonths = selectedMonths.sort((a, b) => months.indexOf(a) - months.indexOf(b))

    const monthColumns: ColumnDef<TeamData>[] = sortedSelectedMonths.map((month) => ({
      id: month,
      header: month,
      columns: [
        ...(selectedColumns.includes("Avg Total Call Minutes")
          ? [
              {
                id: `${month}-avgTotalCallMinutes`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.avgTotalCallMinutes ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`Avg Total Call Minutes - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{formatValue(getValue())}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("TCM Score")
          ? [
              {
                id: `${month}-tcmScore`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.tcmScore.level ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`TCM Score - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{getValue() || "-"}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("Avg Call Efficiency")
          ? [
              {
                id: `${month}-avgCallEfficiency`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.avgCallEfficiency ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`Avg Call Efficiency - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{formatPercentage(getValue())}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("CE Score")
          ? [
              {
                id: `${month}-ceScore`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.ceScore.level ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`CE Score - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{getValue() || "-"}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("Avg Total Sales")
          ? [
              {
                id: `${month}-avgTotalSales`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.avgTotalSales ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`Avg Total Sales - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{formatValue(getValue())}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("TS Score")
          ? [
              {
                id: `${month}-tsScore`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.tsScore.level ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`TS Score - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{getValue() || "-"}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("Avg Ratio Between Skade & Liv")
          ? [
              {
                id: `${month}-avgRatioBetweenSkadeAndLiv`,
                accessorFn: (row: TeamData) =>
                  row.monthData.find((md) => md.month === month)?.avgRatioBetweenSkadeAndLiv ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`Avg Ratio Between Skade & Liv - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{formatPercentage(getValue())}</div>
                ),
              },
            ]
          : []),
        ...(selectedColumns.includes("RBSL Score")
          ? [
              {
                id: `${month}-rbslScore`,
                accessorFn: (row: TeamData) => row.monthData.find((md) => md.month === month)?.rbslScore.level ?? 0,
                header: ({
                  column,
                }: {
                  column: Column<TeamData, unknown>
                }) => (
                  <div className="text-center dark:text-white">
                    <SortableHeader column={column} title={`RBSL Score - ${month}`} />
                  </div>
                ),
                cell: ({ getValue }: { getValue: () => number }) => (
                  <div className="text-center">{getValue() || "-"}</div>
                ),
              },
            ]
          : []),
      ],
    }))

    return [...baseColumns, ...monthColumns]
  }, [selectedMonths, selectedColumns])

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

      const response = await fetch(`/api/merged-names-teams?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      const transformedData = transformApiResponse(result.teams)
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

  const formatValue = (value: number) => {
    if (value === 0) return "-"
    return new Intl.NumberFormat("en-US").format(value)
  }

  const formatPercentage = (value: number) => {
    if (value === 0) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  interface ApiResponseItem {
    team: string
    department: string | null
    month: string
    avgTotalCallMinutes: string
    tcmScore: { level: number; score: number | string }
    avgCallEfficiency: string
    ceScore: { level: number; score: number | string }
    avgTotalSales: string
    tsScore: { level: number; score: number | string }
    avgRatioBetweenSkadeAndLiv: string
    rbslScore: { level: number; score: number | string }
  }

  const transformApiResponse = (apiData: ApiResponseItem[]): TeamData[] => {
    const dataMap = new Map<string, TeamData>()

    apiData.forEach((item) => {
      const existingEntry = dataMap.get(item.team)

      const monthData = {
        month: item.month,
        avgTotalCallMinutes: Number.parseInt(item.avgTotalCallMinutes.replace(/,/g, "")),
        tcmScore: item.tcmScore,
        avgCallEfficiency: Number.parseFloat(item.avgCallEfficiency) / 100,
        ceScore: item.ceScore,
        avgTotalSales: Number.parseInt(item.avgTotalSales.replace(/,/g, "")),
        tsScore: item.tsScore,
        avgRatioBetweenSkadeAndLiv: Number.parseFloat(item.avgRatioBetweenSkadeAndLiv) / 100,
        rbslScore: item.rbslScore,
      }

      if (existingEntry) {
        existingEntry.monthData.push(monthData)
      } else {
        dataMap.set(item.team, {
          team: item.team,
          // department: item.department,
          monthData: [monthData],
        })
      }
    })

    return Array.from(dataMap.values())
  }

  const renderHeader = (header: Header<TeamData, unknown>) => {
    const monthHeader = header.column.parent
    if (monthHeader && monthHeader.id !== "team" && monthHeader.id !== "department") {
      return (
        <th
          key={header.id}
          colSpan={header.colSpan}
          className={`${getMonthColor(
            monthHeader.id,
          )} px-4 py-2 text-center font-semibold transition-colors duration-200`}
        >
          {monthHeader.id === header.column.id ? (
            <div className="text-lg font-bold mb-2 text-primary-foreground">{monthHeader.id}</div>
          ) : (
            <div className="text-primary-foreground">
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          )}
        </th>
      )
    }
    return (
      <TableHead key={header.id} colSpan={header.colSpan}>
        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      </TableHead>
    )
  }

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]))
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
                <BreadcrumbPage>Teams</BreadcrumbPage>
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
                  placeholder="Search by team..."
                  className="max-w-64"
                  value={(table.getColumn("team")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("team")?.setFilterValue(event.target.value)}
                />

                <div className="flex items-center gap-2">
                  <MonthSelector selectedMonths={selectedMonths} onChange={setSelectedMonths} disabled={isRefreshing} />

                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={isRefreshing}>
                  <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

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
                          <TableRow key={headerGroup.id}>{headerGroup.headers.map(renderHeader)}</TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {isRefreshing ? (
                          <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-96 text-center">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="animate-spin">
                                  <Loader2 className="h-16 w-16 text-primary" />
                                </div>
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

              <div className="fixed bottom-8 left-0 right-0 flex justify-center z-10 transition-all duration-150">
                <div className="flex items-center justify-between py-2 rounded-full shadow-lg bg-background border-t gap-20 px-5 w-fit">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {table.getCoreRowModel().rows.length} records found
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
                              "Avg Total Call Minutes",
                              "TCM Score",
                              "Avg Call Efficiency",
                              "CE Score",
                              "Avg Total Sales",
                              "TS Score",
                              "Avg Ratio Between Skade & Liv",
                              "RBSL Score",
                            ].map((column) => (
                              <CommandItem
                                key={column}
                                onSelect={() => handleColumnSelection(column)}
                                className="cursor-pointer"
                              >
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

export default TeamsDashboard
