"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { deleteMonthData } from "../../actions/delete-month"

export default function Dashboard() {
  // Initial months data
  const [months, setMonths] = useState([
    { id: 1, name: "January" },
    { id: 2, name: "February" },
    { id: 3, name: "March" },
    { id: 4, name: "April" },
    { id: 5, name: "May" },
    { id: 6, name: "June" },
    { id: 7, name: "July" },
    { id: 8, name: "August" },
    { id: 9, name: "September" },
    { id: 10, name: "October" },
    { id: 11, name: "November" },
    { id: 12, name: "December" },
  ])

  // Track which month is currently being deleted
  const [deletingMonthId, setDeletingMonthId] = useState<number | null>(null)

  // Current year - you might want to make this configurable
  const currentYear = new Date().getFullYear()

  // Function to delete a month and its associated data
  const deleteMonth = async (id: number, monthName: string) => {
    try {
      setDeletingMonthId(id)

      // Call the server action to delete data from the database
      const result = await deleteMonthData(monthName, currentYear)

      if (result.success) {
        // Remove the month from the UI state
        setMonths(months.filter((month) => month.id !== id))
      } else {
      }
    } catch (error) {
      console.error("Error deleting month:", error)
    } finally {
      setDeletingMonthId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background dark">
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Months Overview</CardTitle>
            <CardDescription>
              View and manage all months of the year. Click the trash icon to delete a month and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        onClick={() => deleteMonth(month.id, month.name)}
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

            {months.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                All months have been deleted. Refresh the page to reset.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

