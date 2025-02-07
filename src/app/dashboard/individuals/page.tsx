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
  totalCallMinutes: number;
  tcmScore: { level: number; score: number | string };
  callEfficiency: number;
  ceScore: { level: number; score: number | string };
  totalSales: number;
  tsScore: { level: number; score: number | string };
  livRatio: number;
  rbslScore: { level: number; score: number | string };
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

  const columns: ColumnDef<IndividualData>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
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
      ),
    },
    {
      accessorKey: "team",
      header: "Team",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "totalCallMinutes",
      header: "Total Call Minutes",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("totalCallMinutes")}</div>
      ),
    },
    {
      accessorKey: "tcmScore",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("tcmScore") as {
          level: number;
          score: number | string;
        };
        return <div className="text-center">{score.level}</div>;
      },
    },
    {
      accessorKey: "callEfficiency",
      header: "Call Efficiency",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("callEfficiency")}</div>
      ),
    },
    {
      accessorKey: "ceScore",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("ceScore") as {
          level: number;
          score: number | string;
        };
        return <div className="text-center">{score.level}</div>;
      },
    },
    {
      accessorKey: "totalSales",
      header: "Total Sales",
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("totalSales")}</div>
      ),
    },
    {
      accessorKey: "tsScore",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("tsScore") as {
          level: number;
          score: number | string;
        };
        return <div className="text-center">{score.level}</div>;
      },
    },
    {
      accessorKey: "livRatio",
      header: "LIV Ratio",
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("livRatio")}</div>
      ),
    },
    {
      accessorKey: "rbslScore",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("rbslScore") as {
          level: number;
          score: number | string;
        };
        return <div className="text-center">{score.level}</div>;
      },
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/merged-names");
      const result = await response.json();
      if (result.names) {
        setData(result.names);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching data");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
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

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4 dark:text-white">
        <div className="text-center">
          <h3 className="mt-4 text-lg font-semibold">Error Loading Data</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchData()} className="mt-4 dark:text-black">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
                <span className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} total individuals
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

            <div className="rounded-md border">
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
                  {table.getRowModel().rows?.length ? (
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
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </>
  );
};

export default IndividualsDashboard;
