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
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  type Row,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type CompanyData = {
  month: string;
  avgTotalCallMinutes: string;
  tcmScore: { level: number; score: number | string };
  avgCallEfficiency: string;
  ceScore: { level: number; score: number | string };
  avgTotalSales: string;
  tsScore: { level: number; score: number | string };
  avgRatioBetweenSkadeAndLiv: string;
  rbslScore: { level: number; score: number | string };
  avgTotalScore: number;
};

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

interface SortableHeaderProps<TData> {
  column: Column<TData>;
  title: string;
}

const SortableHeader = <TData,>({
  column,
  title,
}: SortableHeaderProps<TData>) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
  );
};

const CompanyDashboard = () => {
  const [data, setData] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const getColumns = useCallback((): ColumnDef<CompanyData>[] => {
    return [
      {
        id: "month",
        accessorKey: "month",
        header: ({ column }: { column: Column<CompanyData> }) => (
          <SortableHeader<CompanyData> column={column} title="Month" />
        ),
        cell: ({ row }: { row: Row<CompanyData> }) => (
          <div className="font-medium">{row.getValue("month")}</div>
        ),
      },
      ...(selectedColumns.includes("Avg Total Call Minutes")
        ? [
            {
              id: "avgTotalCallMinutes",
              accessorKey: "avgTotalCallMinutes",
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="Avg Total Call Minutes"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
                <div className="text-right">
                  {row.getValue("avgTotalCallMinutes")}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("TCM Score")
        ? [
            {
              id: "tcmScore",
              accessorFn: (row: CompanyData) => row.tcmScore.level,
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="TCM Score"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
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
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="Avg Call Efficiency"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
                <div className="text-right">
                  {row.getValue("avgCallEfficiency")}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("CE Score")
        ? [
            {
              id: "ceScore",
              accessorFn: (row: CompanyData) => row.ceScore.level,
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData> column={column} title="CE Score" />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
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
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="Avg Total Sales"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
                <div className="text-right">
                  {row.getValue("avgTotalSales")}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("TS Score")
        ? [
            {
              id: "tsScore",
              accessorFn: (row: CompanyData) => row.tsScore.level,
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData> column={column} title="TS Score" />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
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
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="Avg Ratio Between Skade & Liv"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
                <div className="text-right">
                  {row.getValue("avgRatioBetweenSkadeAndLiv")}
                </div>
              ),
            },
          ]
        : []),
      ...(selectedColumns.includes("RBSL Score")
        ? [
            {
              id: "rbslScore",
              accessorFn: (row: CompanyData) => row.rbslScore.level,
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="RBSL Score"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
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
              header: ({ column }: { column: Column<CompanyData> }) => (
                <SortableHeader<CompanyData>
                  column={column}
                  title="Avg Total Score"
                />
              ),
              cell: ({ row }: { row: Row<CompanyData> }) => (
                <div className="text-right">
                  {formatDecimal(row.getValue("avgTotalScore"))}
                </div>
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

      setData(result.company);
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

  const formatDecimal = (value: number | string) => {
    if (typeof value === "string") {
      return value;
    }
    if (value === 0) return "-";
    return new Intl.NumberFormat("en-US", {
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

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
                  variant="outline"
                  size="icon"
                  onClick={() => fetchData()}
                  disabled={isRefreshing}
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
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
                              className="h-24 text-center"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="animate-spin">
                                  <Loader2 className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
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
                              className="h-24 text-center"
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

              <div className="flex justify-end">
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CompanyDashboard;
