"use client";

import MonthSelector from "@/components/month-selector";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
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
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type IndividualData = {
  name: string;
  team: string | null;
  department: string | null;
  monthData: {
    month: string;
    totalCallMinutes: number;
    tcmScore: { level: number; score: number | string };
    callEfficiency: number;
    ceScore: { level: number; score: number | string };
    totalSales: number;
    tsScore: { level: number; score: number | string };
    livRatio: number;
    rbslScore: { level: number; score: number | string };
  }[];
};

const IndividualsDashboard = () => {
  const [data, setData] = useState<IndividualData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Total Call Minutes",
    "TCM Score",
    "Call Efficiency",
    "CE Score",
    "Total Sales",
    "TS Score",
    "LIV Ratio",
    "RBSL Score",
  ]);

  console.log(error);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const getColumns = useCallback((): ColumnDef<IndividualData>[] => {
    const baseColumns: ColumnDef<IndividualData>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const currentSort = column.getIsSorted();
                if (currentSort === false) {
                  column.toggleSorting(false);
                } else if (currentSort === "asc") {
                  column.toggleSorting(true);
                } else {
                  column.clearSorting();
                }
              }}
              className="p-0 hover:bg-transparent"
            >
              Name
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        id: "team",
        accessorKey: "team",
        header: "Team",
        cell: ({ row }) => row.getValue("team"),
      },
      {
        id: "department",
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => row.getValue("department"),
      },
    ];

    const monthColumns: ColumnDef<IndividualData>[] = selectedMonths.map(
      (month) => ({
        id: month,
        header: month,
        columns: selectedColumns.map((column) => {
          const columnConfig = {
            "Total Call Minutes": {
              id: `${month}-totalCallMinutes`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)
                  ?.totalCallMinutes ?? 0,
              header: "Total Call Minutes",
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{formatValue(getValue())}</div>
              ),
            },
            "TCM Score": {
              id: `${month}-tcmScore`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.tcmScore
                  .level ?? 0,
              header: "TCM Score",
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{getValue() || "-"}</div>
              ),
            },
            "Call Efficiency": {
              id: `${month}-callEfficiency`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)
                  ?.callEfficiency ?? 0,
              header: () => <div className="text-center">Call Efficiency</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">
                  {formatPercentage(getValue())}
                </div>
              ),
            },
            "CE Score": {
              id: `${month}-ceScore`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.ceScore.level ??
                0,
              header: () => <div className="text-center">CE Score</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{getValue() || "-"}</div>
              ),
            },
            "Total Sales": {
              id: `${month}-totalSales`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.totalSales ?? 0,
              header: () => <div className="text-center">Total Sales</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{formatValue(getValue())}</div>
              ),
            },
            "TS Score": {
              id: `${month}-tsScore`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.tsScore.level ??
                0,
              header: () => <div className="text-center">TS Score</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{getValue() || "-"}</div>
              ),
            },
            "LIV Ratio": {
              id: `${month}-livRatio`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.livRatio ?? 0,
              header: () => <div className="text-center">LIV Ratio</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">
                  {formatPercentage(getValue())}
                </div>
              ),
            },
            "RBSL Score": {
              id: `${month}-rbslScore`,
              accessorFn: (row: IndividualData) =>
                row.monthData.find((md) => md.month === month)?.rbslScore
                  .level ?? 0,
              header: () => <div className="text-center">RBSL Score</div>,
              cell: ({ getValue }: { getValue: () => number }) => (
                <div className="text-center">{getValue() || "-"}</div>
              ),
            },
          };
          return columnConfig[column as keyof typeof columnConfig];
        }),
      })
    );

    return [...baseColumns, ...monthColumns];
  }, [selectedMonths, selectedColumns]);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      selectedMonths.forEach((month) => params.append("months", month));
      params.append("year", selectedYear.toString());

      const response = await fetch(`/api/merged-names?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      const transformedData = transformApiResponse(result.names);
      setData(transformedData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching data"
      );
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [selectedMonths, selectedYear]);

  const formatValue = (value: number) => {
    if (value === 0) return "-";
    return new Intl.NumberFormat("en-US").format(value);
  };

  const formatPercentage = (value: number) => {
    if (value === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  interface ApiResponseItem {
    name: string;
    team: string | null;
    department: string | null;
    month: string;
    totalCallMinutes: string;
    tcmScore: { level: number; score: number | string };
    callEfficiency: string;
    ceScore: { level: number; score: number | string };
    totalSales: string;
    tsScore: { level: number; score: number | string };
    livRatio: string;
    rbslScore: { level: number; score: number | string };
  }

  const transformApiResponse = (
    apiData: ApiResponseItem[]
  ): IndividualData[] => {
    const dataMap = new Map<string, IndividualData>();

    apiData.forEach((item) => {
      const existingEntry = dataMap.get(item.name);

      const monthData = {
        month: item.month,
        totalCallMinutes: Number.parseInt(
          item.totalCallMinutes.replace(/,/g, "")
        ),
        tcmScore: item.tcmScore,
        callEfficiency: Number.parseFloat(item.callEfficiency) / 100,
        ceScore: item.ceScore,
        totalSales: Number.parseInt(item.totalSales.replace(/,/g, "")),
        tsScore: item.tsScore,
        livRatio: Number.parseFloat(item.livRatio) / 100,
        rbslScore: item.rbslScore,
      };

      if (existingEntry) {
        existingEntry.monthData.push(monthData);
      } else {
        dataMap.set(item.name, {
          name: item.name,
          team: item.team,
          department: item.department,
          monthData: [monthData],
        });
      }
    });

    return Array.from(dataMap.values());
  };

  // Update the getMonthColor function
  const getMonthColor = (month: string) => {
    const colors = [
      "bg-emerald-200 dark:bg-emerald-800",
      "bg-indigo-200 dark:bg-indigo-800",
      "bg-teal-200 dark:bg-teal-800",
      "bg-cyan-200 dark:bg-cyan-800",
      "bg-lime-200 dark:bg-lime-800",
      "bg-red-200 dark:bg-red-800",
      "bg-blue-200 dark:bg-blue-800",
      "bg-green-200 dark:bg-green-800",
      "bg-yellow-200 dark:bg-yellow-800",
      "bg-purple-200 dark:bg-purple-800",
      "bg-pink-200 dark:bg-pink-800",
      "bg-orange-200 dark:bg-orange-800",
    ];
    const monthIndex = selectedMonths.indexOf(month);
    return colors[monthIndex % colors.length];
  };

  // Update the renderHeader function
  const renderHeader = (header: Header<IndividualData, unknown>) => {
    const monthHeader = header.column.parent;
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
          className={`${getMonthColor(
            monthHeader.id
          )} px-4 py-2 text-center font-semibold transition-colors duration-200`}
        >
          {monthHeader.id === header.column.id ? (
            <div className="text-lg font-bold mb-2 text-primary-foreground">
              {monthHeader.id}
            </div>
          ) : (
            <div className="text-primary-foreground">
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          )}
        </th>
      );
    }
    return (
      <TableHead key={header.id} colSpan={header.colSpan}>
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </TableHead>
    );
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <SidebarTrigger className="mr-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Individuals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="flex-1 py-6 container">
        <Card>
          <CardHeader>
            <CardTitle>Individuals Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Apply filters to the individuals data
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Filter by name..."
                          value={
                            (table
                              .getColumn("name")
                              ?.getFilterValue() as string) ?? ""
                          }
                          onChange={(event) =>
                            table
                              .getColumn("name")
                              ?.setFilterValue(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2">
                  <MonthSelector
                    selectedMonths={selectedMonths}
                    onChange={setSelectedMonths}
                    disabled={isRefreshing}
                  />

                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(Number.parseInt(e.target.value))
                    }
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="default"
                  className="dark:text-black"
                  size="sm"
                  onClick={() => fetchData()}
                  disabled={isRefreshing}
                >
                  Apply Filters
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData()}
                  disabled={isRefreshing}
                >
                  <RefreshCcw
                    className={`mr-2 h-4 w-4 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>

                {selectedMonths.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMonths([]);
                      setSelectedYear(new Date().getFullYear());
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
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
                            <CommandItem
                              key={column}
                              onSelect={() => handleColumnSelection(column)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedColumns.includes(column)
                                    ? "opacity-100"
                                    : "opacity-0"
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
              </div>

              <div className="rounded-md border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map(renderHeader)}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {isRefreshing ? (
                        <TableRow>
                          <TableCell
                            colSpan={table.getAllColumns().length}
                            className="h-96 text-center"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="animate-spin">
                                <Loader2 className="h-16 w-16 animate-pulse text-primary" />
                              </div>
                              <p className="text-lg text-muted-foreground animate-pulse">
                                Loading data...
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={table.getAllColumns().length}
                            className="h-96 text-center"
                          >
                            No results found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center fixed justify-between py-2 bottom-5 rounded-full shadow-lg bg-background z-10 border-t gap-20 left-[35%] px-5">
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} row(s) shown.
                </div>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IndividualsDashboard;
