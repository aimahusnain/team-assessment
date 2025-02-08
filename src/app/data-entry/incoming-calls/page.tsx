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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileUpload } from "@/components/ui/file-upload"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
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
} from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown, ChevronDown, ChevronUp, Loader2, Plus, RefreshCcw, SlidersHorizontal, Trash2 } from "lucide-react"
import Papa from "papaparse"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Label } from "@/components/ui/label"

type IncomingCall = {
  id: number
  navn: string
  min: string
  year: number
  monthName: string
  createdAt: string
  updatedAt: string
}

type FailedRecord = {
  id: number
  error: string
}

const formSchema = z.object({
  navn: z.string().min(2, "Name must be at least 2 characters"),
  min: z.string().min(1, "Minutes is required"),
  year: z.string().min(1, "Year is required"),
  monthName: z.string().min(1, "Month is required"),
})

const IncomingCalls = () => {
  const [data, setData] = useState<IncomingCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingCount, setDeletingCount] = useState(0)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [fileData, setFileData] = useState<IncomingCall[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([])

  console.log(isBackgroundUploading)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      navn: "",
      min: "",
      year: new Date().getFullYear().toString(),
      monthName: format(new Date(), "MMMM"),
    },
  })

  const columns: ColumnDef<IncomingCall>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      accessorKey: "navn",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
      accessorKey: "min",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Minutes
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("min")}</div>,
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Year
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
      accessorKey: "monthName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Month
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
  ]

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/get-incomingCalls")
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setData([])
        setError(null)
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while fetching data")
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

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
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true)
      if (fileData.length > 0) {
        await uploadIndividualRecords(fileData)
      } else {
        const response = await fetch("/api/add-incomingCall", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: "Incoming call added successfully",
          })
        } else {
          throw new Error(result.message || "Failed to add incoming call")
        }
      }
      setIsAddDialogOpen(false)
      form.reset()
      setFileData([])
      fetchData()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsBackgroundUploading(false)
    }
  }

  const uploadIndividualRecords = async (records: IncomingCall[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    setFailedRecords([])
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < records.length; i++) {
      try {
        const response = await fetch("/api/add-incomingCall", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(records[i]),
        })
        const result = await response.json()
        if (result.success) {
          successCount++
        } else {
          failCount++
          setFailedRecords((prev) => [...prev, { id: records[i].id, error: result.message || "Unknown error" }])
        }
      } catch (error) {
        console.error("Error uploading record:", error)
        failCount++
        setFailedRecords((prev) => [...prev, { id: records[i].id, error: "Network error" }])
      }
      setUploadProgress(Math.round(((i + 1) / records.length) * 100))
    }

    setIsUploading(false)
    toast({
      title: "Upload Complete",
      description: `Successfully added ${successCount} records. Failed to add ${failCount} records.`,
      variant: successCount > 0 ? "default" : "destructive",
    })
    fetchData()
  }

  const handleFileUpload = (files: File[]) => {
    const file = files[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setFileData(results.data as IncomingCall[])
          form.handleSubmit(onSubmit)()
        },
      })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map((row) => row.original.id)
    setDeletingCount(selectedIds.length)

    for (const id of selectedIds) {
      try {
        const response = await fetch("/api/delete-incomingCall", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ incomingCallId: id }),
        })

        const result = await response.json()

        if (!result.success) {
          console.error(`Failed to delete incoming call with ID ${id}:`, result.message)
        } else {
          setDeletingCount((prev) => prev - 1)
        }
      } catch (error) {
        console.error(`Error deleting incoming call with ID ${id}:`, error)
      }
    }

    await fetchData()
    setRowSelection({})
    setIsDeleting(false)
    setDeletingCount(0)
  }

  const handleDateChange = (year: string, month: string) => {
    setSelectedYear(year)
    setSelectedMonth(month)

    if (year && year !== "all") {
      table.getColumn("year")?.setFilterValue(Number(year))
    } else {
      table.getColumn("year")?.setFilterValue(undefined)
    }

    if (month && month !== "all") {
      table.getColumn("monthName")?.setFilterValue(month)
    } else {
      table.getColumn("monthName")?.setFilterValue(undefined)
    }
  }

  const clearFilters = () => {
    table.resetColumnFilters()
    setSelectedYear("all")
    setSelectedMonth("all")
    setIsFilterOpen(false)
  }

  const activeFiltersCount = columnFilters.length + (selectedYear !== "all" ? 1 : 0) + (selectedMonth !== "all" ? 1 : 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4 dark:text-white">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold">Error Loading Data</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchData()} className="mt-4 dark:text-black">
            Try Again
          </Button>
        </div>
      </div>
    )
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
                <BreadcrumbLink href="/">Data Entry</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Incoming Calls</BreadcrumbPage>
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
                    <Button variant="outline" size="sm" className="relative">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto dark:text-white">
                    <SheetHeader className="space-y-4">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Apply filters to the incoming calls data</SheetDescription>
                      <Separator />
                    </SheetHeader>
                    <div className="mt-8 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name-filter">Name</Label>
                        <Input
                          id="name-filter"
                          placeholder="Filter by name..."
                          value={(table.getColumn("navn")?.getFilterValue() as string) ?? ""}
                          onChange={(event) => table.getColumn("navn")?.setFilterValue(event.target.value)}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="year-filter">Year</Label>
                          <Select value={selectedYear} onValueChange={(year) => handleDateChange(year, selectedMonth)}>
                            <SelectTrigger id="year-filter">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Years</SelectItem>
                              {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="month-filter">Month</Label>
                          <Select
                            value={selectedMonth}
                            onValueChange={(month) => handleDateChange(selectedYear, month)}
                          >
                            <SelectTrigger id="month-filter">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Months</SelectItem>
                              {Array.from({ length: 12 }, (_, i) => ({
                                value: format(new Date(2000, i), "MMMM"),
                                label: format(new Date(2000, i), "MMMM"),
                              })).map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {activeFiltersCount > 0 && (
                        <Button variant="outline" onClick={clearFilters} className="w-full mt-6">
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                <span className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} total rows
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
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
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={(open) => {
                    if (!open && isUploading) {
                      setIsBackgroundUploading(true)
                      toast({
                        title: "Upload Continuing",
                        description:
                          "Upload is running in the background. You can reopen this dialog to view progress.",
                      })
                    }
                    setIsAddDialogOpen(open)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="dark:text-white" variant="secondary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Incoming Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] dark:text-white">
                    <DialogHeader>
                      <DialogTitle>Add Incoming Call</DialogTitle>
                      <DialogDescription>Create a new incoming call entry or upload a CSV file</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="add-new-entry" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add-new-entry">Add New Entry</TabsTrigger>
                        <TabsTrigger value="upload-csv">Upload CSV</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add-new-entry">
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="navn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minutes</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter minutes" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(
                                          (year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                              {year}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="monthName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Month</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => ({
                                          value: format(new Date(2000, i), "MMMM"),
                                          label: format(new Date(2000, i), "MMMM"),
                                        })).map(({ value, label }) => (
                                          <SelectItem key={value} value={value}>
                                            {label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {isUploading && (
                              <div className="space-y-2">
                                <Progress value={uploadProgress} className="w-full" />
                                <p className="text-sm text-muted-foreground">
                                  Uploading: {Math.round(uploadProgress)}%
                                </p>
                              </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsAddDialogOpen(false)
                                  form.reset()
                                }}
                                disabled={isUploading}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" className="dark:text-black" disabled={isUploading}>
                                Add Incoming Call
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </TabsContent>
                      <TabsContent value="upload-csv">
                        <div className="space-y-2">
                          <FileUpload onChange={handleFileUpload} accept=".csv" />
                          {fileData.length > 0 && (
                            <div className="mt-4">
                              <p>{fileData.length} records ready to upload</p>
                              <Button
                                onClick={() => onSubmit(form.getValues())}
                                disabled={isUploading || fileData.length === 0}
                                className="mt-2"
                              >
                                {isUploading ? `Uploading... (${Math.round(uploadProgress)}%)` : "Upload CSV Data"}
                              </Button>
                              {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                              {failedRecords.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-semibold">Failed Records:</h4>
                                  <ul className="list-disc list-inside">
                                    {failedRecords.map((record, index) => (
                                      <li key={index}>
                                        ID {record.id}: {record.error}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
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
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 border rounded-md">
                <h3 className="text-lg font-semibold">No Incoming Calls Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by adding your first incoming call using the &quot;Add Incoming Call&quot; button above.
                </p>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 dark:text-black">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Incoming Call
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              The filters applied have returned no results
                            </p>
                            <Button variant="outline" onClick={clearFilters} className="mt-2">
                              Remove all filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between py-4 bg-background border-t">
              <Button variant="outline" size="sm" className="mr-4" onClick={() => fetchData()} disabled={isRefreshing}>
                <RefreshCcw className={`h-2 w-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                selected
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
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default IncomingCalls

