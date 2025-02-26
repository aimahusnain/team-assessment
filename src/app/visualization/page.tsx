"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangeFilter } from "@/components/DateRangeFilter"
import { Trophy, User, Building2 } from "lucide-react"

export default function Dashboard() {
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState<string[]>(months)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const fetchDashboardData = useCallback(async (months: string[], year: string) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        months: months.join(","),
        year: year,
      }).toString()
      const response = await fetch(`/api/dashboard?${queryParams}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(months, new Date().getFullYear().toString())
  }, [fetchDashboardData])

  const handleApplyFilter = (months: string[], year: string) => {
    setSelectedMonths(months)
    setSelectedYear(year)
    fetchDashboardData(months, year)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-200 dark:text-gray-400">Loading...</div>
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-200 dark:text-gray-400">
        Error loading dashboard data
      </div>
    )
  }

  const { topTeams, topIndividuals, topDepartments } = dashboardData

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">Performance Dashboard</h1>

        <Card className="mb-8 bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">Date Range Filter</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Select months and year to filter data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateRangeFilter onApplyFilter={handleApplyFilter} />
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <TopList
            title="Top 10 Teams"
            data={topTeams}
            valueKey="_sum.verdi"
            nameKey="team"
            icon={<Trophy className="h-6 w-6 text-yellow-500" />}
          />
          <TopList
            title="Top 10 Individuals"
            data={topIndividuals}
            valueKey="_sum.verdi"
            nameKey="name"
            icon={<User className="h-6 w-6 text-blue-500" />}
          />
          <TopList
            title="Top 10 Departments"
            data={topDepartments}
            valueKey="_sum.verdi"
            nameKey="department"
            icon={<Building2 className="h-6 w-6 text-green-500" />}
          />
        </div>
      </main>
    </div>
  )
}

function TopList({ title, data, valueKey, nameKey, icon }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-xl text-gray-800 dark:text-gray-100">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="space-y-4">
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-white/20 dark:bg-gray-700/30 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md hover:scale-102"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {index + 1}. {item[nameKey]}
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {item._sum && typeof item._sum.verdi === "number"
                    ? item._sum.verdi.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : "N/A"}
                </span>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-500 dark:text-gray-400">No data available</li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}

