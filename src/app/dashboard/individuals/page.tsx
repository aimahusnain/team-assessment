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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
        columns: [
          {
            id: `${month}-totalCallMinutes`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.totalCallMinutes ?? 0;
            },
            header: () => <div className="text-center">Total Call Minutes - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{formatValue(getValue())}</div>
            ),
          },
          {
            id: `${month}-tcmScore`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.tcmScore.level ?? 0;
            },
            header: () => <div className="text-center">TCM Score - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{getValue() || "-"}</div>
            ),
          },
          {
            id: `${month}-callEfficiency`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.callEfficiency ?? 0;
            },
            header: () => <div className="text-center">Call Efficiency - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{formatPercentage(getValue())}</div>
            ),
          },
          {
            id: `${month}-ceScore`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.ceScore.level ?? 0;
            },
            header: () => <div className="text-center">CE Score - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{getValue() || "-"}</div>
            ),
          },
          {
            id: `${month}-totalSales`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.totalSales ?? 0;
            },
            header: () => <div className="text-center">Total Sales - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{formatValue(getValue())}</div>
            ),
          },
          {
            id: `${month}-tsScore`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.tsScore.level ?? 0;
            },
            header: () => <div className="text-center">TS Score - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{getValue() || "-"}</div>
            ),
          },
          {
            id: `${month}-livRatio`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.livRatio ?? 0;
            },
            header: () => <div className="text-center">LIV Ratio - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{formatPercentage(getValue())}</div>
            ),
          },
          {
            id: `${month}-rbslScore`,
            accessorFn: (row: IndividualData) => {
              const monthData = row.monthData.find((md) => md.month === month);
              return monthData?.rbslScore.level ?? 0;
            },
            header: () => <div className="text-center">RBSL Score - {month}</div>,
            cell: ({ getValue }: { getValue: () => number }) => (
              <div className="text-center">{getValue() || "-"}</div>
            ),
          },
        ],
      })
    );

    return [...baseColumns, ...monthColumns];
  }, [selectedMonths]);

  // Update the fetchData function:
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

  // Also update the formatValue and formatPercentage functions:
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

  // First, modify the transformApiResponse function in IndividualsDashboard:
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

  const transformApiResponse = (apiData: ApiResponseItem[]): IndividualData[] => {
    // Create a map to group data by name
    const dataMap = new Map<string, IndividualData>();

    apiData.forEach((item) => {
      const existingEntry = dataMap.get(item.name);

      const monthData = {
        month: item.month, // Now using the month from API response
        totalCallMinutes: parseInt(item.totalCallMinutes.replace(/,/g, "")),
        tcmScore: item.tcmScore,
        callEfficiency: parseFloat(item.callEfficiency) / 100,
        ceScore: item.ceScore,
        totalSales: parseInt(item.totalSales.replace(/,/g, "")),
        tsScore: item.tsScore,
        livRatio: parseFloat(item.livRatio) / 100,
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

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
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

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 dark:text-white">
        <div className="w-full relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} total individuals
                  {selectedMonths.length > 0 &&
                    ` for ${selectedMonths.join(", ")} ${selectedYear}`}
                </span>
              </div>

              <div className="flex items-center space-x-2">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
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
                      <TableRow key={row.id}>
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

            <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between py-4 bg-background border-t">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} of{" "}
                {table.getCoreRowModel().rows.length} row(s) shown.
              </div>
              <div className="flex items-center justify-end space-x-2">
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
      </div>
    </>
  );
};

export default IndividualsDashboard;
