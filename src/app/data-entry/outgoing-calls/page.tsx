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
import { Label } from "@/components/ui/label"
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

type OutgoingCall = {
  id: number
  navn: string
  outgoing: string
  regular: string
  company: string
  regular_call_time_min: string
  company_call_time_min: string
  year: number
  monthName: string
  createdAt: string
  updatedAt: string
}

// Form schema
const formSchema = z.object({
  navn: z.string().min(2, "Name must be at least 2 characters"),
  outgoing: z.string().min(1, "Outgoing calls is required"),
  regular: z.string().min(1, "Regular calls is required"),
  company: z.string().min(1, "Company calls is required"),
  regular_call_time_min: z.string().min(1, "Regular call time is required"),
  company_call_time_min: z.string().min(1, "Company call time is required"),
  year: z.string().min(1, "Year is required"),
  monthName: z.string().min(1, "Month is required"),
})

const OutgoingCalls = () => {
  // State
  const [data, setData] = useState<OutgoingCall[]>([])
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
  const [fileData, setFileData] = useState<OutgoingCall[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress] = useState(0)
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  console.log(isBackgroundUploading) // No need now.

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      navn: "",
      outgoing: "",
      regular: "",
      company: "",
      regular_call_time_min: "",
      company_call_time_min: "",
      year: new Date().getFullYear().toString(),
      monthName: format(new Date(), "MMMM"),
    },
  })

  // Column definition
  const columns: ColumnDef<OutgoingCall>[] = [
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
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
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
      accessorKey: "outgoing",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Outgoing Calls
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("outgoing")}</div>,
    },
    {
      accessorKey: "regular",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Regular Calls
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("regular")}</div>,
    },
    {
      accessorKey: "company",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Company Calls
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("company")}</div>,
    },
    {
      accessorKey: "regular_call_time_min",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Regular Call Time (min)
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("regular_call_time_min")}</div>,
    },
    {
      accessorKey: "company_call_time_min",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
          className="p-0 hover:bg-transparent text-right w-full"
        >
          Company Call Time (min)
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("company_call_time_min")}</div>,
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
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
          onClick={() => {
            const currentSort = column.getIsSorted()
            if (currentSort === false) {
              column.toggleSorting(false) // Set to asc
            } else if (currentSort === "asc") {
              column.toggleSorting(true) // Set to desc
            } else {
              column.clearSorting() // Reset sorting
            }
          }}
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

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/get-outgoingCalls")
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
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Table initialization
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

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true)
      if (fileData.length > 0) {
        // If dialog is closed during upload, show toast
        if (!isAddDialogOpen) {
          setIsBackgroundUploading(true)
          toast({
            title: "Upload In Progress",
            description: "File upload is running in the background",
          })
        }

        const response = await fetch("/api/upload-outgoingCalls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ calls: fileData }),
        })
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: `${result.count} outgoing calls added successfully`,
          })
        } else {
          throw new Error(result.message)
        }
      } else {
        const response = await fetch("/api/add-outgoingCall", {
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
            description: "Outgoing call added successfully",
          })
        } else {
          throw new Error(result.message)
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
        description: "Failed to add outgoing call(s)",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsBackgroundUploading(false)
    }
  }

  // File upload handler
  const handleFileUpload = (files: File[]) => {
    const file = files[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setFileData(results.data as OutgoingCall[])
          form.handleSubmit(onSubmit)()
        },
      })
    }
  }

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true)
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map((row) => row.original.id)
    setDeletingCount(selectedIds.length)

    for (const id of selectedIds) {
      try {
        const response = await fetch("/api/delete-outgoingCall", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ outgoingCallId: id }),
        })

        const result = await response.json()

        if (!result.success) {
          console.error(`Failed to delete outgoing call with ID ${id}:`, result.message)
        } else {
          setDeletingCount((prev) => prev - 1)
        }
      } catch (error) {
        console.error(`Error deleting outgoing call with ID ${id}:`, error)
      }
    }

    await fetchData()
    setRowSelection({})
    setIsDeleting(false)
    setDeletingCount(0)
  }

  // Filter handlers
  const handleDateChange = (year: string, month: string) => {
    setSelectedYear(year)
    setSelectedMonth(month)

    if (year && year !== "all") {
      table.getColumn("year")?.setFilterValue(Number(year)) // Convert year to number
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

  // Loading and error states
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
                <BreadcrumbPage>Outgoing Calls</BreadcrumbPage>
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
                      <SheetDescription>Apply filters to the outgoing calls data</SheetDescription>
                      <Separator />
                    </SheetHeader>
                    <div className="mt-8 space-y-6">
                      {/* Name Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="name-filter">Name</Label>
                        <Input
                          id="name-filter"
                          placeholder="Filter by name..."
                          value={(table.getColumn("navn")?.getFilterValue() as string) ?? ""}
                          onChange={(event) => table.getColumn("navn")?.setFilterValue(event.target.value)}
                        />
                      </div>

                      {/* Date Filters */}
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
                {/* Add Outgoing Call Dialog */}
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={(open) => {
                    if (!open && isUploading) {
                      // If trying to close while uploading
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
                      Add Outgoing Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] dark:text-white">
                    <DialogHeader>
                      <DialogTitle>Add Outgoing Call</DialogTitle>
                      <DialogDescription>Create a new outgoing call entry or upload a CSV file</DialogDescription>
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
                              name="outgoing"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Outgoing Calls</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter number of outgoing calls" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="regular"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Regular Calls</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter number of regular calls" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Calls</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter number of company calls" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="regular_call_time_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Regular Call Time (min)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter regular call time in minutes" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="company_call_time_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Call Time (min)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter company call time in minutes" {...field} />
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
                                Add Outgoing Call
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </TabsContent>
                      <TabsContent value="upload-csv">
                        <div className="space-y-2">
                          <FileUpload onChange={handleFileUpload} accept=".csv" />
                        </div>
                        {isUploading && (
                          <div className="space-y-2">
                            <Progress value={uploadProgress} className="w-full" />
                            <p className="text-sm text-muted-foreground">Uploading: {Math.round(uploadProgress)}%</p>
                          </div>
                        )}
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

            {/* Table */}
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 border rounded-md">
                <h3 className="text-lg font-semibold">No Outgoing Calls Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by adding your first outgoing call using the &quot;Add Outgoing Call&quot; button above.
                </p>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 dark:text-black">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Outgoing Call
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

            {/* Pagination */}
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

export default OutgoingCalls

