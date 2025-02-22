"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  SendHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type CompanyData = {
  month: string;
  avgTotalCallMinutes: number;
  tcmScore: { level: number; score: number | string };
  avgCallEfficiency: number;
  ceScore: { level: number; score: number | string };
  avgTotalSales: number;
  tsScore: { level: number; score: number | string };
  avgRatioBetweenSkadeAndLiv: number;
  rbslScore: { level: number; score: number | string };
  avgTotalScore: number;
};

interface SortableHeaderProps {
  column: Column<CompanyData, unknown>;
  title: string;
}

const SortableHeader = ({ column, title }: SortableHeaderProps) => {
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
      {title}
      {column.getIsSorted() === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
};

const CompanyDashboard = () => {
  const [data, setData] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFilterChanges, setHasFilterChanges] = useState(false);

  // Filter states
  const [filterValues, setFilterValues] = useState({
    months: [] as string[],
    year: new Date().getFullYear(),
  });

  // Applied filter states
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Avg Total Call Minutes",
    "TCM Score",
    "Avg Call Efficiency",
    "CE Score",
    "Avg Total Sales",
    "TS Score",
    "Avg Ratio Between Skade & Liv",
    "RBSL Score",
    "Avg Total Score",
  ]);

  // Initialize with previous month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
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
    ];
    const initialMonth = months[previousMonth];
    setFilterValues((prev) => ({
      ...prev,
      months: [initialMonth],
    }));
    setSelectedMonths([initialMonth]);
  }, []);

  const handleFilterChange = (months: string[], year: number) => {
    setFilterValues((prev) => {
      const newValues = { months, year };
      const changed =
        prev.year !== year ||
        prev.months.length !== months.length ||
        !prev.months.every((m) => months.includes(m));
      setHasFilterChanges(changed);
      return newValues;
    });
  };

  const getColumns = useCallback((): ColumnDef<CompanyData>[] => {
    return [
      {
        id: "month",
        accessorKey: "month",
        header: ({ column }) => (
          <SortableHeader column={column} title="Month" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("month")}</div>
        ),
      },
      ...(selectedColumns.includes("Avg Total Call Minutes")
        ? [
            {
              id: "avgTotalCallMinutes",
              accessorKey: "avgTotalCallMinutes",
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="TCM" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Avg Total Call Minutes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => (
                <div className="text-right">{formatValue(getValue())}</div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("TCM Score")
        ? [
            {
              id: "tcmScore",
              // @ts-expect-error Type definition issue in table column configuration
              accessorFn: (row) => row.tcmScore.level,
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="Score" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>TCM Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ row }) => (
                <div className="text-center">
                  {row.original.tcmScore.level || "-"}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("Avg Call Efficiency")
        ? [
            {
              id: "avgCallEfficiency",
              accessorKey: "avgCallEfficiency",
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="CE" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Avg Call Efficiency</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => (
                <div className="text-right">{formatPercentage(getValue())}</div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("CE Score")
        ? [
            {
              id: "ceScore",
              // @ts-expect-error Type definition issue in table column configuration
              accessorFn: (row) => row.ceScore.level,
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="Score" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>CE Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ row }) => (
                <div className="text-center">
                  {row.original.ceScore.level || "-"}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("Avg Total Sales")
        ? [
            {
              id: "avgTotalSales",
              accessorKey: "avgTotalSales",
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="TS" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Avg Total Sales</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => (
                <div className="text-right">{formatValue(getValue())}</div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("TS Score")
        ? [
            {
              id: "tsScore",
              // @ts-expect-error Type definition issue in table column configuration
              accessorFn: (row) => row.tsScore.level,
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="Score" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>TS Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ row }) => (
                <div className="text-center">
                  {row.original.tsScore.level || "-"}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("Avg Ratio Between Skade & Liv")
        ? [
            {
              id: "avgRatioBetweenSkadeAndLiv",
              accessorKey: "avgRatioBetweenSkadeAndLiv",
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="RBSL" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Avg Ratio Between Skade & Liv
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => (
                <div className="text-right">{formatPercentage(getValue())}</div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("RBSL Score")
        ? [
            {
              id: "rbslScore",
              // @ts-expect-error Type definition issue in table column configuration
              accessorFn: (row) => row.rbslScore.level,
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="Score" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>RBSL Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ row }) => (
                <div className="text-center">
                  {row.original.rbslScore.level || "-"}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("Avg Total Score")
        ? [
            {
              id: "avgTotalScore",
              accessorKey: "avgTotalScore",
              // @ts-expect-error Type definition issue in table column configuration
              header: ({ column }) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SortableHeader column={column} title="Total" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Avg Total Score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
              // @ts-expect-error Type definition issue in table column configuration
              cell: ({ getValue }) => (
                <div className="text-right">{formatDecimal(getValue())}</div>
              ),
            },
          ]
        : []),
    ];
  }, [selectedColumns]);

  const fetchData = useCallback(async () => {
    if (selectedMonths.length === 0) {
      setData([]);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      selectedMonths.forEach((month) => params.append("months", month));
      params.append("year", selectedYear.toString());

      const response = await fetch(
        `/api/merged-names-company?${params.toString()}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      const transformedData = result.company.map((item: any) => ({
        ...item,
        avgTotalCallMinutes: Number.parseInt(
          item.avgTotalCallMinutes.replace(/,/g, "")
        ),
        avgCallEfficiency: Number.parseFloat(item.avgCallEfficiency) / 100,
        avgTotalSales: Number.parseInt(item.avgTotalSales.replace(/,/g, "")),
        avgRatioBetweenSkadeAndLiv:
          Number.parseFloat(item.avgRatioBetweenSkadeAndLiv) / 100,
      }));

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

  const formatDecimal = (value: number) => {
    if (value === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = useCallback(() => {
    setSelectedMonths(filterValues.months);
    setSelectedYear(filterValues.year);
    setHasFilterChanges(false);
  }, [filterValues]);

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

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

  return (
    <TooltipProvider>
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
                  <BreadcrumbPage>Company</BreadcrumbPage>
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
                    placeholder="Search by month..."
                    className="max-w-64"
                    value={
                      (table.getColumn("month")?.getFilterValue() as string) ??
                      ""
                    }
                    onChange={(event) =>
                      table
                        .getColumn("month")
                        ?.setFilterValue(event.target.value)
                    }
                  />

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !filterValues.months.length && "text-muted-foreground"
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
                      hasFilterChanges &&
                        "border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    )}
                  >
                    <SendHorizontal
                      className={cn(
                        "transition-colors",
                        hasFilterChanges && "text-yellow-400"
                      )}
                    />
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
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  colSpan={header.colSpan}
                                  className="bg-muted/50"
                                >
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
                                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                  <p className="text-lg text-muted-foreground">
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
                    )}
                  </div>
                </div>

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
                                "Avg Total Call Minutes",
                                "TCM Score",
                                "Avg Call Efficiency",
                                "CE Score",
                                "Avg Total Sales",
                                "TS Score",
                                "Avg Ratio Between Skade & Liv",
                                "RBSL Score",
                                "Avg Total Score",
                              ].map((column) => (
                                <CommandItem
                                  key={column}
                                  onSelect={() => handleColumnSelection(column)}
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
    </TooltipProvider>
  );
};

export default CompanyDashboard;
