"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { ChevronDown, Trash2, Loader2 } from "lucide-react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { RefreshCw } from "lucide-react";

type ActivityLogEntry = {
  id: number;
  name: string;
  team: string;
  activity: string;
  verdi: number;
  department: string;
  year: number;
  monthName: string;
  createdAt: string;
  updatedAt: string;
};

const columns: ColumnDef<ActivityLogEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "team",
    header: "Team",
    cell: ({ row }) => <div>{row.getValue("team")}</div>,
  },
  {
    accessorKey: "activity",
    header: "Activity",
    cell: ({ row }) => <div>{row.getValue("activity")}</div>,
  },
  {
    accessorKey: "verdi",
    header: () => <div className="text-right">Verdi</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("verdi")}</div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => <div>{row.getValue("department")}</div>,
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => <div>{row.getValue("year")}</div>,
  },
  {
    accessorKey: "monthName",
    header: "Month Name",
    cell: ({ row }) => <div>{row.getValue("monthName")}</div>,
  },
];

const ActivityLog = () => {
  const [data, setData] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCount, setDeletingCount] = useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchData = async () => {
    try {
      const response = await fetch("/api/get-activityLogs");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null); // Clear any previous errors
      } else {
        throw new Error("Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [setData]); // Added setData to dependencies

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
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 30,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);
    setDeletingCount(selectedIds.length);

    for (const id of selectedIds) {
      try {
        const response = await fetch("/api/delete-activityLog", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activityLogId: id }),
        });

        const result = await response.json();

        if (!result.success) {
          console.error(
            `Failed to delete activity log with ID ${id}:`,
            result.message
          );
        } else {
          setDeletingCount((prev) => prev - 1);
        }
      } catch (error) {
        console.error(`Error deleting activity log with ID ${id}:`, error);
      }
    }

    // Refresh the data after deletion
    await fetchData();
    // Clear selection
    setRowSelection({});
    setIsDeleting(false);
    setDeletingCount(0);
  };

  const LoadingState = () => (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 animate-pulse">
        <div className="flex items-center gap-2 px-4">
          <div className="h-8 w-8 rounded-md bg-muted dark:bg-muted/40" />
          <div className="h-4 w-32 rounded-md bg-muted dark:bg-muted/40" />
        </div>
      </header>
  
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full">
          <div className="flex items-center justify-between py-4">
            <div className="h-9 w-72 rounded-md bg-muted dark:bg-muted/40 animate-pulse" />
            <div className="h-9 w-24 rounded-md bg-muted dark:bg-muted/40 animate-pulse" />
          </div>
  
          <div className="rounded-md border dark:border-muted/50">
            <div className="h-10 bg-muted/5 dark:bg-muted/20 animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex border-t dark:border-muted/50">
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="flex-1 p-4">
                    <div className="h-4 w-full rounded bg-muted dark:bg-muted/40 animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
  
  const ErrorState = ({ error }: { error: string }) => (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="relative overflow-hidden rounded-xl border bg-card dark:bg-muted/30 dark:border-muted/50 p-8 shadow-lg">
        <div className="relative z-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
            <ExclamationTriangleIcon className="h-8 w-8 text-destructive dark:text-red-400" />
          </div>
          <h3 className="mb-3 text-xl font-semibold dark:text-white">
            Failed to Load Data
          </h3>
          <p className="mb-6 text-sm text-muted-foreground dark:text-gray-300">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="dark:text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
        <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/5 dark:via-destructive/10 to-transparent blur-3xl" />
        </div>
      </div>
    </div>
  );
  

  // Usage:
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <>
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
                <BreadcrumbPage>Activity Log</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 dark:text-white">
        <div className="w-full relative">
          {" "}
          {/* Add margin for footer */}
          <div className="flex items-center justify-between py-4">
            <Input
              placeholder="Filter names..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm dark:text-white"
            />
            <div className="flex items-center space-x-2">
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting ({deletingCount})
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({table.getFilteredSelectedRowModel().rows.length})
                    </>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto dark:text-white">
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
          <div className="w-full overflow-x-auto rounded-md border scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
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
          {/* Bottom Footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-background border-t">
            <div className="container flex items-center justify-between py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </div>
              <div className="space-x-2">
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

export default ActivityLog;
