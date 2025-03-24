"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { deleteMonthData } from "../../actions/delete-month"
import { getMonthsWithData, type MonthData } from "../../actions/get-months"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Dashboard() {
  // State for months data
  const [months, setMonths] = useState<MonthData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Track which month is currently being deleted
  const [deletingMonthId, setDeletingMonthId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // State for the selected year and dialog
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [monthToDelete, setMonthToDelete] = useState<{ id: number; name: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch months data when component mounts or year changes
  useEffect(() => {
    fetchMonthsData()
  }, [selectedYear])

  // Function to fetch months data
  const fetchMonthsData = async () => {
    setIsLoading(true)
    try {
      const result = await getMonthsWithData(selectedYear)
      if (result.success) {
        setMonths(result.data)
      } else {
        toast.error("Failed to fetch months data", {
          description: result.error || "An error occurred while fetching data.",
        })
        setMonths([])
      }
    } catch (error) {
      console.error("Error fetching months:", error)
      toast.error("Error loading data", {
        description: "An unexpected error occurred while loading months data.",
      })
      setMonths([])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to refresh data
  const refreshData = async () => {
    setRefreshing(true)
    await fetchMonthsData()
    setRefreshing(false)
    toast.success("Data refreshed", {
      description: `Months data for ${selectedYear} has been updated.`,
    })
  }

  // Function to open the confirmation dialog
  const confirmDelete = (id: number, name: string) => {
    setMonthToDelete({ id, name })
    setDialogOpen(true)
  }

  // Function to delete a month and its associated data
  const deleteMonth = async () => {
    if (!monthToDelete) return

    try {
      setDeletingMonthId(monthToDelete.id)
      setDialogOpen(false)

      // Call the server action to delete data from the database
      const result = await deleteMonthData(monthToDelete.name, selectedYear)

      if (result.success) {
        // Remove the month from the UI state
        setMonths(months.filter((month) => month.id !== monthToDelete.id))
        toast.success(`All data for ${monthToDelete.name} ${selectedYear} has been deleted.`, {
          description: `Database records have been removed successfully.`,
        })
      } else {
        toast.error(`Failed to delete ${monthToDelete.name} ${selectedYear} data`, {
          description: result.message || "An error occurred during the deletion process.",
        })
      }
    } catch (error) {
      console.error("Error deleting month:", error)
      toast.error("Error deleting month data", {
        description: "An unexpected error occurred while deleting the month data.",
      })
    } finally {
      setDeletingMonthId(null)
      setMonthToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background dark">
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={refreshData} disabled={refreshing} title="Refresh data">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Year:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Months with Data - {selectedYear}</CardTitle>
            <CardDescription>
              This table shows months that have data in the database for {selectedYear}. Click the trash icon to delete
              all data for a specific month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading months data...</span>
              </div>
            ) : (
              <>
                {months.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Month Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {months.map((month) => (
                        <TableRow key={month.id}>
                          <TableCell className="font-medium">{month.id}</TableCell>
                          <TableCell>{month.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(month.id, month.name)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingMonthId === month.id}
                            >
                              {deletingMonthId === month.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">Delete {month.name}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No data found for any month in {selectedYear}.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all data for {monthToDelete?.name} {selectedYear}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteMonth}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

