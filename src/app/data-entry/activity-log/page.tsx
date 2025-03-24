"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit,
  FileDown,
  Loader2,
  Plus,
  RefreshCcw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import Papa from "papaparse"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const downloadTemplate = () => {
  // Create template data with headers and one example row
  const templateData = [
    {
      name: "name here",
      team: "team here",
      activity: "activity column here",
      verdi: "verdi here",
      department: "department here",
      year: "year here",
      monthName: "month name here",
    },
  ]

  // Convert to CSV using Papa Parse
  const csv = Papa.unparse(templateData)

  // Create blob and download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", "activity-log-template.csv")
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

type ActivityLogEntry = {
  id: number
  name: string
  alternativeNames?: string
  team: string
  activity: string
  verdi: number
  department: string
  year: number
  monthName: string
  createdAt: string
  updatedAt: string
}

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  alternativeNames: z.string().optional(),
  team: z.string().min(1, "Team is required"),
  activity: z.string().min(1, "Activity is required"),
  verdi: z.string().min(1, "Verdi is required"),
  department: z.string().min(1, "Department is required"),
  year: z.string().min(1, "Year is required"),
  monthName: z.string().min(1, "Month is required"),
})

const ActivityLog = () => {
  // State
  const [data, setData] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingCount, setDeletingCount] = useState(0)
  const [uniqueActivities, setUniqueActivities] = useState<string[]>([])
  const [uniqueTeams, setUniqueTeams] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [fileData, setFileData] = useState<ActivityLogEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [teamInputType, setTeamInputType] = useState("existing")
  const [activityInputType, setActivityInputType] = useState("existing")
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isEditAltNameDialogOpen, setIsEditAltNameDialogOpen] = useState(false)
  const [newAlternativeName, setNewAlternativeName] = useState("")
  const [isUpdatingAltNames, setIsUpdatingAltNames] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  console.log(isBackgroundUploading) // No need now.

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      alternativeNames: "",
      team: "",
      activity: "",
      verdi: "",
      department: "",
      year: new Date().getFullYear().toString(),
      monthName: format(new Date(), "MMMM"),
    },
  })

  // Modify the onSubmit handler to handle new team
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

        // Handle file upload
        const response = await fetch("/api/upload-activity-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: fileData }),
        })
        const result = await response.json()
        if (result.success) {
          toast({
            title: "Success",
            description: `${result.count} activity logs added successfully`,
          })
          window.dispatchEvent(new Event("data-uploaded"))
        } else {
          throw new Error(result.message)
        }
      } else {
        const response = await fetch("/api/add-activityLog", {
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
            description: "Activity log added successfully",
          })
        } else {
          throw new Error(result.message)
        }
      }
      setIsAddDialogOpen(false)
      form.reset()
      setActivityInputType("existing")
      setFileData([])
      fetchData(true)
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to add activity log(s)",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsBackgroundUploading(false)
    }
  }

  const handleFileUpload = (files: File[]) => {
    const file = files[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          setIsUploading(true)
          setUploadProgress(0)
          const totalEntries = results.data.length
          let successfulUploads = 0
          const batchSize = 20

          // Process in batches of 20
          for (let i = 0; i < totalEntries; i += batchSize) {
            const batch = results.data.slice(i, i + batchSize)
            try {
              // Show current batch progress
              toast({
                title: "Processing Batch",
                description: `Uploading entries ${i + 1}-${Math.min(i + batchSize, totalEntries)} of ${totalEntries}`,
              })

              // First attempt: Try bulk upload for this batch
              const bulkResponse = await fetch("/api/upload-activity-logs", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ logs: batch }),
              })

              const bulkResult = await bulkResponse.json()

              if (bulkResult.success) {
                successfulUploads += bulkResult.count
                toast({
                  title: "Batch Complete",
                  description: `Successfully uploaded ${bulkResult.count} entries (${successfulUploads}/${totalEntries} total)`,
                })
              } else {
                // If bulk upload fails, try individual uploads for this batch
                let batchSuccessCount = 0
                for (const entry of batch) {
                  try {
                    const response = await fetch("/api/add-activityLog", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(entry),
                    })

                    if (response.ok) {
                      successfulUploads++
                      batchSuccessCount++
                    }
                  } catch (error) {
                    console.error("Error uploading entry:", error)
                  }
                }

                toast({
                  title: "Batch Complete (Individual Mode)",
                  description: `Successfully uploaded ${batchSuccessCount} entries (${successfulUploads}/${totalEntries} total)`,
                })
              }

              // Update progress after each batch
              setUploadProgress(Math.min(((i + batchSize) / totalEntries) * 100, 100))
            } catch (error) {
              console.error("Error processing batch:", error)
              toast({
                title: "Batch Failed",
                description: `Failed to upload batch ${Math.floor(i / batchSize) + 1}`,
                variant: "destructive",
              })
            }
          }

          setIsUploading(false)
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${successfulUploads} out of ${totalEntries} entries.`,
          })
          fetchData(true)
        },
      })
    }
  }

  // Column definition
  const columns: ColumnDef<ActivityLogEntry>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected()
        const isAllPagesSelected =
          table.getState().rowSelection &&
          Object.keys(table.getState().rowSelection).length === table.getFilteredRowModel().rows.length

        return (
          <div className="relative group">
            <Checkbox
              checked={isAllPagesSelected ? true : isAllSelected || false}
              onCheckedChange={() => {
                if (isAllPagesSelected || isAllSelected) {
                  // If all are selected, deselect all
                  table.resetRowSelection()
                } else {
                  // Select all filtered rows across all pages
                  const allRows: Record<string, boolean> = {}
                  table.getFilteredRowModel().rows.forEach((row) => {
                    allRows[row.id] = true
                  })
                  table.setRowSelection(allRows)
                }
              }}
              aria-label="Select all"
            />
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {isAllPagesSelected ? "Deselect all" : isAllSelected ? "Deselect all" : "Select all pages"}
            </div>
          </div>
        )
      },
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
      accessorKey: "name", // Example column, apply to all columns
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
      accessorKey: "alternativeNames",
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
          Alternative Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const altName = row.getValue("alternativeNames")
        return <div>{altName && String(altName).trim() !== "" ? String(altName) : String(row.getValue("name"))}</div>
      },
    },
    {
      accessorKey: "team",
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
          Team
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("team")}</div>,
    },
    {
      accessorKey: "activity",
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
          Activity
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("activity")}</div>,
    },
    {
      accessorKey: "verdi",
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
          Verdi
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4 inline" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4 inline" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 inline" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div className="text-right font-medium">{row.getValue("verdi")}</div>,
    },
    {
      accessorKey: "department",
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
          Department
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("department")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("year")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("monthName")}</div>,
    },
  ]

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
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater(table.getState().pagination)
        console.log("Page changed to:", newState.pageIndex)
        setCurrentPage(newState.pageIndex)
      } else {
        console.log("Page set directly to:", updater.pageIndex)
        setCurrentPage(updater.pageIndex)
      }
    },
    manualPagination: false,
    initialState: {
      pagination: {
        pageSize: 30,
        pageIndex: currentPage,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageSize: 30,
        pageIndex: currentPage,
      },
    },
  })

  const fetchData = useCallback(
    async (preservePage = false) => {
      try {
        setIsRefreshing(true)
        const response = await fetch("/api/get-activityLogs")
        const result = await response.json()
        if (result.success) {
          setData(result.data)
          setUniqueActivities([...new Set(result.data.map((item: ActivityLogEntry) => item.activity))] as string[])
          setUniqueTeams([...new Set(result.data.map((item: ActivityLogEntry) => item.team))] as string[])
          setError(null)

          // Always preserve the current page index
          if (!preservePage) {
            setCurrentPage(0)
          }

          // Make sure the table pagination state is updated
          if (preservePage && table) {
            table.setPagination((prev) => ({
              ...prev,
              pageIndex: currentPage,
            }))
          }
        } else {
          // Set empty data when success is false
          setData([])
          setUniqueActivities([])
          setUniqueTeams([])
          setError(null)
        }
      } catch (err) {
        console.error(err)
        setError("An error occurred while fetching data")
      } finally {
        setIsRefreshing(false)
        setLoading(false)
      }
    },
    [currentPage, table],
  )

  useEffect(() => {
    // Log the current page for debugging
    console.log("Current page:", currentPage)

    // Initial data load - only on first mount
    if (currentPage === 0) {
      fetchData(true)
    }

    // Set up event listeners for data changes
    const handleDataChange = () => {
      console.log("Data changed, refreshing...")
      fetchData(true)
    }

    // Add event listener for when data is uploaded or alt names are changed
    window.addEventListener("data-uploaded", handleDataChange)
    window.addEventListener("alt-name-changed", handleDataChange)

    return () => {
      // Clean up event listeners
      window.removeEventListener("data-uploaded", handleDataChange)
      window.removeEventListener("alt-name-changed", handleDataChange)
    }
  }, [fetchData]) // Remove currentPage from dependencies to prevent refresh on pagination changes

  // Handlers
  const handleDelete = async () => {
    setIsDeleting(true)
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map((row) => row.original.id)
    setDeletingCount(selectedIds.length)

    for (const id of selectedIds) {
      try {
        const response = await fetch("/api/delete-activityLog", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activityLogId: id }),
        })

        const result = await response.json()

        if (!result.success) {
          console.error(`Failed to delete activity log with ID ${id}:`, result.message)
        } else {
          setDeletingCount((prev) => prev - 1)
        }
      } catch (error) {
        console.error(`Error deleting activity log with ID ${id}:`, error)
      }
    }

    await fetchData(true) // Preserve page after deletion
    setRowSelection({})
    setIsDeleting(false)
    setDeletingCount(0)
  }

  const handleActivityChange = (value: string) => {
    table.getColumn("activity")?.setFilterValue(value === "all" ? undefined : value)
  }

  const handleTeamChange = (value: string) => {
    table.getColumn("team")?.setFilterValue(value === "all" ? undefined : value)
  }

  const handleDateChange = (year: string, month: string) => {
    setSelectedYear(year)
    setSelectedMonth(month)

    if (year && year !== "all") {
      table.getColumn("year")?.setFilterValue(Number.parseInt(year))
    } else {
      table.getColumn("year")?.setFilterValue(undefined)
    }

    if (month && month !== "all") {
      const monthName = format(new Date(2000, Number.parseInt(month)), "MMMM")
      table.getColumn("monthName")?.setFilterValue(monthName)
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

  const exportFilteredDataToCSV = () => {
    // Set up state for export process
    const handleExport = async () => {
      try {
        setIsExporting(true)

        // Show initial toast
        toast({
          title: "Preparing Export",
          description: "Getting your data ready for export...",
        })

        // Get the filtered data from the table
        const filteredData = table.getFilteredRowModel().rows.map((row) => row.original)

        // Simulate processing time for larger datasets
        if (filteredData.length > 1000) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }

        // Convert to CSV using Papa Parse
        const csv = Papa.unparse(filteredData)

        // Create blob and download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        // Set filename with current date
        const date = new Date()
        const filename = `activity-log-export-${date.toISOString().split("T")[0]}.csv`

        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Export Complete",
          description: `Successfully exported ${filteredData.length} records to CSV.`,
        })
      } catch (error) {
        console.error("Export error:", error)
        toast({
          title: "Export Failed",
          description: "There was a problem exporting your data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsExporting(false)
      }
    }

    return handleExport
  }

  // Update the handleUpdateAlternativeNames function to also update the AlternativeNames model
  const handleUpdateAlternativeNames = async () => {
    try {
      setIsUpdatingAltNames(true)
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const selectedIds = selectedRows.map((row) => row.original.id)

      // Get the primary name from the first selected row
      const primaryName = selectedRows[0]?.original.name || ""

      // Calculate total batches
      const batchSize = 10
      const totalBatches = Math.ceil(selectedIds.length / batchSize)
      let completedBatches = 0
      let totalUpdated = 0

      console.log(`Processing ${selectedIds.length} entries in ${totalBatches} batches of ${batchSize}`)

      // Process in batches of 10
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batchIds = selectedIds.slice(i, i + batchSize)

        console.log(`Sending batch ${completedBatches + 1} with ${batchIds.length} entries:`, batchIds)

        try {
          // Send a separate API request for each batch
          const response = await fetch("/api/update-alternative-names", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ids: batchIds,
              alternativeName: newAlternativeName,
              primaryName: primaryName, // Pass the primary name to the API
            }),
          })

          const result = await response.json()

          if (result.success) {
            completedBatches++
            totalUpdated += batchIds.length

            // Update progress toast for each batch
            toast({
              title: `Batch ${completedBatches} of ${totalBatches} Complete`,
              description: `Updated ${batchIds.length} entries (${totalUpdated}/${selectedIds.length} total)`,
            })
          } else {
            throw new Error(result.message)
          }
        } catch (error) {
          console.error(`Error updating batch ${completedBatches + 1}:`, error)
          toast({
            title: `Batch ${completedBatches + 1} Failed`,
            description: `Failed to update entries ${i + 1}-${Math.min(i + batchSize, selectedIds.length)}`,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Update Complete",
        description: `Updated alternative name for ${totalUpdated} of ${selectedIds.length} entries`,
      })

      setIsEditAltNameDialogOpen(false)
      setNewAlternativeName("")
      // Clear row selection after update
      setRowSelection({})
      await fetchData(true) // Preserve page after update
      window.dispatchEvent(new Event("alt-name-changed"))
    } catch (error) {
      console.error("Error updating alternative names:", error)
      toast({
        title: "Error",
        description: "Failed to update alternative names",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAltNames(false)
    }
  }

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
          <Button onClick={() => fetchData(true)} className="mt-4 dark:text-black">
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
                <BreadcrumbPage>Activity Log</BreadcrumbPage>
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
                      <SheetDescription>Apply filters to the activity log data</SheetDescription>
                      <Separator />
                    </SheetHeader>
                    <div className="mt-8 space-y-6">
                      {/* Name Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="name-filter">Name</Label>
                        <Input
                          id="name-filter"
                          placeholder="Filter by name..."
                          value={(table?.getColumn("name")?.getFilterValue() as string) ?? ""}
                          onChange={(event) => table?.getColumn("name")?.setFilterValue(event.target.value)}
                        />
                      </div>

                      {/* Alternative Name Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="alt-name-filter">Alternative Name</Label>
                        <Input
                          id="alt-name-filter"
                          placeholder="Filter by alternative name..."
                          value={(table?.getColumn("alternativeNames")?.getFilterValue() as string) ?? ""}
                          onChange={(event) => table?.getColumn("alternativeNames")?.setFilterValue(event.target.value)}
                        />
                      </div>

                      {/* Activity Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="activity-filter">Activity</Label>
                        <Select
                          value={(table?.getColumn("activity")?.getFilterValue() as string) ?? "all"}
                          onValueChange={handleActivityChange}
                        >
                          <SelectTrigger id="activity-filter">
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Activities</SelectItem>
                            {uniqueActivities.map((activity) => (
                              <SelectItem key={activity} value={activity}>
                                {activity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Team Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="team-filter">Team</Label>
                        <Select
                          value={(table?.getColumn("team")?.getFilterValue() as string) ?? "all"}
                          onValueChange={handleTeamChange}
                        >
                          <SelectTrigger id="team-filter">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {uniqueTeams.map((team) => (
                              <SelectItem key={team} value={team}>
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                                value: i.toString(),
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
                  {table?.getFilteredRowModel().rows.length} total rows
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {table?.getFilteredSelectedRowModel().rows.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditAltNameDialogOpen(true)}
                      className="flex items-center"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Alt. Name ({table?.getFilteredSelectedRowModel().rows.length})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting ({deletingCount})
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete ({table?.getFilteredSelectedRowModel().rows.length})
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={downloadTemplate} className="dark:text-white">
                  Download Template
                </Button>
                <div className="relative group">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportFilteredDataToCSV()}
                    className="dark:text-white w-10 h-10 p-0 group-hover:w-auto group-hover:px-4 transition-all duration-300 ease-in-out"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 group-hover:mr-2 transition-all duration-300" />
                        <span className="hidden group-hover:inline opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Export to CSV
                        </span>
                      </>
                    )}
                  </Button>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Export data to CSV
                  </div>
                </div>
                {/* Add Activity Log Dialog */}
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
                      Add Activity Log
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] dark:text-white">
                    <DialogHeader>
                      <DialogTitle>Add Activity Log</DialogTitle>
                      <DialogDescription>Create a new activity log entry or upload a CSV file</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="add-new-entry" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add-new-entry">Add New Entry</TabsTrigger>
                        <TabsTrigger value="upload-csv">Upload CSV</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add-new-entry">
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="name"
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
                                name="alternativeNames"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Alternative Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter alternative name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name="team"
                              render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <FormLabel>Team</FormLabel>
                                  <RadioGroup
                                    value={teamInputType}
                                    onValueChange={setTeamInputType}
                                    className="flex gap-6"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="existing" id="existing-team" />
                                      <Label htmlFor="existing-team">Choose Existing</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="new" id="new-team" />
                                      <Label htmlFor="new-team">Add New</Label>
                                    </div>
                                  </RadioGroup>

                                  {teamInputType === "existing" ? (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select existing team" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {uniqueTeams.map((team) => (
                                          <SelectItem key={team} value={team}>
                                            {team}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input placeholder="Enter new team name" {...field} />
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="activity"
                              render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <FormLabel>Activity</FormLabel>
                                  <RadioGroup
                                    value={activityInputType}
                                    onValueChange={setActivityInputType}
                                    className="flex gap-6"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="existing" id="existing-activity" />
                                      <Label htmlFor="existing-activity">Choose Existing</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="new" id="new-activity" />
                                      <Label htmlFor="new-activity">Add New</Label>
                                    </div>
                                  </RadioGroup>

                                  {activityInputType === "existing" ? (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select existing activity" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {uniqueActivities.map((activity) => (
                                          <SelectItem key={activity} value={activity}>
                                            {activity}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input placeholder="Enter new activity name" {...field} />
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="verdi"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Verdi</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Enter verdi" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter department" {...field} />
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
                                  Uploading: {Math.round(uploadProgress).toFixed(2)}%
                                </p>
                              </div>
                            )}

                            {fileData.length > 200 && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                  You are attempting to upload {fileData.length} entries. This may take some time and
                                  could impact performance.
                                </AlertDescription>
                              </Alert>
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
                                Add Activity Log
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
                            <p className="text-sm text-muted-foreground">Uploading: {uploadProgress.toFixed(2)}%</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {/* Edit Alternative Name Dialog */}
                <Dialog open={isEditAltNameDialogOpen} onOpenChange={setIsEditAltNameDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Alternative Name</DialogTitle>
                      <DialogDescription>
                        This will update the alternative name for all selected entries (
                        {table?.getFilteredSelectedRowModel().rows.length}).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="alternativeName">Alternative Name</Label>
                        <Input
                          id="alternativeName"
                          value={newAlternativeName}
                          onChange={(e) => setNewAlternativeName(e.target.value)}
                          placeholder="Enter alternative name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditAltNameDialogOpen(false)
                          setNewAlternativeName("")
                        }}
                        disabled={isUpdatingAltNames}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateAlternativeNames}
                        disabled={isUpdatingAltNames}
                        className="dark:text-black"
                      >
                        {isUpdatingAltNames ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating... ({Math.ceil(table?.getFilteredSelectedRowModel().rows.length / 10)} batches)
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </DialogFooter>
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
                      ?.getAllColumns()
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
                <h3 className="text-lg font-semibold">No Activity Logs Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start by adding your first activity log using the &quot;Add Activity Log&quot; button above.
                </p>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 dark:text-black">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Activity Log
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table?.getHeaderGroups().map((headerGroup) => (
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
                    {table?.getRowModel().rows?.length ? (
                      table?.getRowModel().rows.map((row) => (
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
                              The filters applied have returned no results from this table
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
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isRefreshing}>
                  <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <div className="text-sm text-muted-foreground">
                  {table?.getFilteredSelectedRowModel().rows.length} of {table?.getFilteredRowModel().rows.length}{" "}
                  row(s) selected
                </div>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table?.previousPage()}
                  disabled={!table?.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table?.nextPage()}
                  disabled={!table?.getCanNextPage()}
                >
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

export default ActivityLog

