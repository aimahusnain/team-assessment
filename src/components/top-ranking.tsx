"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  CalendarIcon,
  Crown,
  Loader2,
  Medal,
  SendHorizontal,
  Trophy,
  Users,
  User,
  Building,
  LayoutGrid,
  List,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { MonthPicker } from "@/components/ui/monthpicker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, abbreviateMonth } from "@/lib/utils"

interface TeamScore {
  team: string
  avgTotalScore: number
  month: string
  department: string | null
}

interface IndividualScore {
  name: string
  team: string | null
  department: string | null
  avgTotalScore: number
  month: string
}

// Add DepartmentScore interface
interface DepartmentScore {
  department: string
  avgTotalScore: number
  month: string
}

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
]

export default function TopRankings() {
  const [topTeams, setTopTeams] = useState<TeamScore[]>([])
  const [topIndividuals, setTopIndividuals] = useState<IndividualScore[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasFilterChanges, setHasFilterChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("teams")
  const [weightages, setWeightages] = useState({
    tcm: 0,
    ce: 0,
    ts: 0,
    rbsl: 0,
  })

  // Filter states
  const [filterValues, setFilterValues] = useState({
    months: [] as string[],
    year: new Date().getFullYear(),
  })

  // Applied filter states
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Previous state remains the same, add:
  const [topDepartments, setTopDepartments] = useState<DepartmentScore[]>([])
  const [viewMode, setViewMode] = useState<"block" | "list">("block")

  // Initialize with previous month
  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const initialMonth = months[previousMonth]
    setFilterValues((prev) => ({
      ...prev,
      months: [initialMonth],
    }))
    setSelectedMonths([initialMonth])
  }, [])

  useEffect(() => {
    const fetchWeightages = async () => {
      try {
        const response = await fetch("/api/get-inputs")
        const data = await response.json()
        if (data.success && data.data[0]) {
          const weights = {
            tcm: Number.parseFloat(data.data[0].score_tcm_weightage),
            ce: Number.parseFloat(data.data[0].score_ce_weightage),
            ts: Number.parseFloat(data.data[0].score_ts_weightage),
            rbsl: Number.parseFloat(data.data[0].score_rbsl_weightage),
          }
          setWeightages(weights)
        }
      } catch (error) {
        console.error("Error fetching weightages:", error)
      }
    }
    fetchWeightages()
  }, [])

  const handleFilterChange = (months: string[], year: number) => {
    setFilterValues((prev) => {
      const newValues = { months, year }
      const changed =
        prev.year !== year || prev.months.length !== months.length || !prev.months.every((m) => months.includes(m))
      setHasFilterChanges(changed)
      return newValues
    })
  }

  const applyFilters = () => {
    setSelectedMonths(filterValues.months)
    setSelectedYear(filterValues.year)
    setHasFilterChanges(false)
  }

  const getMonthColor = (month: string) => {
    const colors = {
      January: "bg-red-500 text-white border-red-600",
      February: "bg-orange-500 text-white border-orange-600",
      March: "bg-amber-500 text-white border-amber-600",
      April: "bg-yellow-500 text-white border-yellow-600",
      May: "bg-lime-500 text-white border-lime-600",
      June: "bg-green-500 text-white border-green-600",
      July: "bg-emerald-500 text-white border-emerald-600",
      August: "bg-teal-500 text-white border-teal-600",
      September: "bg-cyan-500 text-white border-cyan-600",
      October: "bg-sky-500 text-white border-sky-600",
      November: "bg-blue-500 text-white border-blue-600",
      December: "bg-indigo-500 text-white border-indigo-600",
    }
    return colors[month as keyof typeof colors] || "bg-gray-500 text-white border-gray-600"
  }

  const fetchTeamsData = useCallback(async () => {
    if (selectedMonths.length === 0) {
      setTopTeams([])
      return
    }

    try {
      setIsRefreshing(true)
      const params = new URLSearchParams()
      selectedMonths.forEach((month) => params.append("months", month))
      params.append("year", selectedYear.toString())

      const response = await fetch(`/api/merged-names-teams?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch teams data")
      }

      // Process the data to calculate average total score for each team
      const teamsWithScores: TeamScore[] = []

      result.teams.forEach((team: any) => {
        if (team.team === "Total (All Teams)") return

        const tcmScore = team.tcmScore.level
        const ceScore = team.ceScore.level
        const tsScore = team.tsScore.level
        const rbslScore = team.rbslScore.level

        // Calculate weighted average score
        const avgTotalScore =
          tcmScore * (weightages.tcm / 100) +
          ceScore * (weightages.ce / 100) +
          tsScore * (weightages.ts / 100) +
          rbslScore * (weightages.rbsl / 100)

        teamsWithScores.push({
          team: team.team,
          avgTotalScore: Number(avgTotalScore.toFixed(2)),
          month: team.month,
          department: team.department,
        })
      })

      // Sort by average total score in descending order and take top 10
      const sortedTeams = teamsWithScores.sort((a, b) => b.avgTotalScore - a.avgTotalScore).slice(0, 10)

      setTopTeams(sortedTeams)
    } catch (err) {
      console.error(err)
    } finally {
      if (activeTab === "teams") {
        setIsRefreshing(false)
        setLoading(false)
      }
    }
  }, [selectedMonths, selectedYear, weightages, activeTab])

  const fetchIndividualsData = useCallback(async () => {
    if (selectedMonths.length === 0) {
      setTopIndividuals([])
      return
    }

    try {
      setIsRefreshing(true)
      const params = new URLSearchParams()
      selectedMonths.forEach((month) => params.append("months", month))
      params.append("year", selectedYear.toString())

      const response = await fetch(`/api/merged-names-individual?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch individuals data")
      }

      // Process the data to calculate average total score for each individual
      const individualsWithScores: IndividualScore[] = []

      result.names.forEach((individual: any) => {
        const tcmScore = individual.tcmScore.level
        const ceScore = individual.ceScore.level
        const tsScore = individual.tsScore.level
        const rbslScore = individual.rbslScore.level

        // Calculate weighted average score
        const avgTotalScore =
          tcmScore * (weightages.tcm / 100) +
          ceScore * (weightages.ce / 100) +
          tsScore * (weightages.ts / 100) +
          rbslScore * (weightages.rbsl / 100)

        individualsWithScores.push({
          name: individual.name,
          team: individual.team,
          department: individual.department,
          avgTotalScore: Number(avgTotalScore.toFixed(2)),
          month: individual.month,
        })
      })

      // Sort by average total score in descending order and take top 10
      const sortedIndividuals = individualsWithScores.sort((a, b) => b.avgTotalScore - a.avgTotalScore).slice(0, 10)

      setTopIndividuals(sortedIndividuals)
    } catch (err) {
      console.error(err)
    } finally {
      if (activeTab === "individuals") {
        setIsRefreshing(false)
        setLoading(false)
      }
    }
  }, [selectedMonths, selectedYear, weightages, activeTab])

  // Add fetchDepartmentsData function
  const fetchDepartmentsData = useCallback(async () => {
    if (selectedMonths.length === 0) {
      setTopDepartments([])
      return
    }

    try {
      setIsRefreshing(true)
      const params = new URLSearchParams()
      selectedMonths.forEach((month) => params.append("months", month))
      params.append("year", selectedYear.toString())

      const response = await fetch(`/api/merged-names-departments?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch departments data")
      }

      // Process the data to get departments with scores
      const departmentsWithScores: DepartmentScore[] = result.departments.map((dept: any) => ({
        department: dept.department,
        avgTotalScore: Number(
          (
            dept.tcmScore.level * (weightages.tcm / 100) +
            dept.ceScore.level * (weightages.ce / 100) +
            dept.tsScore.level * (weightages.ts / 100) +
            dept.rbslScore.level * (weightages.rbsl / 100)
          ).toFixed(2),
        ),
        month: dept.month,
      }))

      // Sort by average total score in descending order and take top 10
      const sortedDepartments = departmentsWithScores.sort((a, b) => b.avgTotalScore - a.avgTotalScore).slice(0, 10)

      setTopDepartments(sortedDepartments)
    } catch (err) {
      console.error(err)
    } finally {
      if (activeTab === "departments") {
        setIsRefreshing(false)
        setLoading(false)
      }
    }
  }, [selectedMonths, selectedYear, weightages, activeTab])

  // Modify the useEffect to include departments
  useEffect(() => {
    if (activeTab === "teams") {
      fetchTeamsData()
    } else if (activeTab === "individuals") {
      fetchIndividualsData()
    } else {
      fetchDepartmentsData()
    }
  }, [activeTab, fetchTeamsData, fetchIndividualsData, fetchDepartmentsData])

  useEffect(() => {
    // Fetch both data sets when filters change
    const fetchData = async () => {
      setLoading(true)
      setIsRefreshing(true)

      if (activeTab === "teams") {
        await fetchTeamsData()
      } else if (activeTab === "individuals") {
        await fetchIndividualsData()
      } else {
        await fetchDepartmentsData()
      }

      setIsRefreshing(false)
      setLoading(false)
    }

    fetchData()
  }, [activeTab, fetchTeamsData, fetchIndividualsData, fetchDepartmentsData])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setLoading(true)
  }

  // Add new function to render list view cards
  const renderListViewCard = (
    title: string,
    icon: React.ReactNode,
    data: (TeamScore | IndividualScore | DepartmentScore)[],
    type: "teams" | "individuals" | "departments",
  ) => {
    return (
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {data.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No data available</div>
          ) : (
            <div className="space-y-4">
              {data.map((item, index) => {
                const isTop3 = index < 3
                const name =
                  type === "teams"
                    ? (item as TeamScore).team
                    : type === "individuals"
                      ? (item as IndividualScore).name
                      : (item as DepartmentScore).department

                return (
                  <div
                    key={`${name}-${item.month}-${type}`}
                    className={cn("flex items-center gap-4 p-3 rounded-lg transition-colors", isTop3 && "bg-primary/5")}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      {type === "individuals" && (
                        <div className="text-xs text-muted-foreground truncate">
                          {(item as IndividualScore).team || "No Team"} •{" "}
                          {(item as IndividualScore).department || "No Department"}
                        </div>
                      )}
                      {type === "teams" && (item as TeamScore).department && (
                        <div className="text-xs text-muted-foreground truncate">{(item as TeamScore).department}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(getMonthColor(item.month), "px-2 py-1 rounded-md text-xs font-bold")}>
                        {abbreviateMonth(item.month)}
                      </div>
                      <div className="font-bold tabular-nums">{item.avgTotalScore}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-6">
          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <Link href={`/${type}`}>View All</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "block" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("block")}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !filterValues.months.length && "text-muted-foreground",
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
              hasFilterChanges && "border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]",
            )}
          >
            <SendHorizontal className={cn("transition-colors", hasFilterChanges && "text-yellow-400")} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div>Weightages:</div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-md bg-primary/10">TCM: {weightages.tcm.toFixed(0)}%</span>
          <span className="px-2 py-1 rounded-md bg-primary/10">CE: {weightages.ce.toFixed(0)}%</span>
          <span className="px-2 py-1 rounded-md bg-primary/10">TS: {weightages.ts.toFixed(0)}%</span>
          <span className="px-2 py-1 rounded-md bg-primary/10">RBSL: {weightages.rbsl.toFixed(0)}%</span>
        </div>
      </div>

      {isRefreshing ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading data...</p>
        </div>
      ) : selectedMonths.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
          Please select a month to see the data.
        </div>
      ) : viewMode === "block" ? (
        // Block View (Current Tab View)
        <Tabs defaultValue="teams" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="individuals" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Individuals
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Departments
            </TabsTrigger>
          </TabsList>

          <Card className="border-none shadow-sm mt-6">
            <CardContent className="p-6">
              <TabsContent value="teams" className="mt-0">
                {isRefreshing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Loading data...</p>
                  </div>
                ) : selectedMonths.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    Please select a month to see the data.
                  </div>
                ) : topTeams.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    No team data available for the selected period.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {topTeams.map((team, index) => {
                      // Special styling for top 3 teams
                      const isTop3 = index < 3
                      const rankIcon =
                        index === 0 ? (
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="h-6 w-6 text-amber-700" />
                        ) : null

                      return (
                        <motion.div
                          key={`${team.team}-${team.month}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card
                            className={cn(
                              "overflow-hidden transition-all duration-300 hover:shadow-md",
                              isTop3 && "border-2",
                              index === 0 && "border-yellow-500",
                              index === 1 && "border-gray-400",
                              index === 2 && "border-amber-700",
                            )}
                          >
                            <CardHeader
                              className={cn("pb-2", isTop3 && "bg-gradient-to-r from-primary/5 to-transparent")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-8 h-8 rounded-full font-bold",
                                      index === 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : index === 1
                                          ? "bg-gray-100 text-gray-800"
                                          : index === 2
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {index + 1}
                                  </div>
                                  <CardTitle className="text-lg">{team.team}</CardTitle>
                                </div>
                                {rankIcon}
                              </div>
                              <CardDescription>{team.department || "No Department"}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(getMonthColor(team.month), "px-2 py-1 rounded-md text-xs font-bold")}
                                  >
                                    {abbreviateMonth(team.month)}
                                  </div>
                                </div>
                                <div className="text-2xl font-bold">{team.avgTotalScore}</div>
                              </div>
                       
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="individuals" className="mt-0">
                {isRefreshing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Loading data...</p>
                  </div>
                ) : selectedMonths.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    Please select a month to see the data.
                  </div>
                ) : topIndividuals.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    No individual data available for the selected period.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {topIndividuals.map((individual, index) => {
                      // Special styling for top 3 individuals
                      const isTop3 = index < 3
                      const rankIcon =
                        index === 0 ? (
                          <Crown className="h-6 w-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="h-6 w-6 text-amber-700" />
                        ) : null

                      return (
                        <motion.div
                          key={`${individual.name}-${individual.month}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card
                            className={cn(
                              "overflow-hidden transition-all duration-300 hover:shadow-md",
                              isTop3 && "border-2",
                              index === 0 && "border-yellow-500",
                              index === 1 && "border-gray-400",
                              index === 2 && "border-amber-700",
                            )}
                          >
                            <CardHeader
                              className={cn("pb-2", isTop3 && "bg-gradient-to-r from-primary/5 to-transparent")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-8 h-8 rounded-full font-bold",
                                      index === 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : index === 1
                                          ? "bg-gray-100 text-gray-800"
                                          : index === 2
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {index + 1}
                                  </div>
                                  <CardTitle className="text-lg">{individual.name}</CardTitle>
                                </div>
                                {rankIcon}
                              </div>
                              <CardDescription className="flex flex-col gap-1">
                                <span>{individual.team || "No Team"}</span>
                                <span className="text-xs opacity-70">{individual.department || "No Department"}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      getMonthColor(individual.month),
                                      "px-2 py-1 rounded-md text-xs font-bold",
                                    )}
                                  >
                                    {abbreviateMonth(individual.month)}
                                  </div>
                                </div>
                                <div className="text-2xl font-bold">{individual.avgTotalScore}</div>
                              </div>
                       
                      
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Add new TabsContent for departments */}
              <TabsContent value="departments" className="mt-0">
                {isRefreshing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Loading data...</p>
                  </div>
                ) : selectedMonths.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    Please select a month to see the data.
                  </div>
                ) : topDepartments.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                    No department data available for the selected period.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {topDepartments.map((department, index) => {
                      const isTop3 = index < 3
                      const rankIcon =
                        index === 0 ? (
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="h-6 w-6 text-amber-700" />
                        ) : null

                      return (
                        <motion.div
                          key={`${department.department}-${department.month}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card
                            className={cn(
                              "overflow-hidden transition-all duration-300 hover:shadow-md",
                              isTop3 && "border-2",
                              index === 0 && "border-yellow-500",
                              index === 1 && "border-gray-400",
                              index === 2 && "border-amber-700",
                            )}
                          >
                            <CardHeader
                              className={cn("pb-2", isTop3 && "bg-gradient-to-r from-primary/5 to-transparent")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-8 h-8 rounded-full font-bold",
                                      index === 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : index === 1
                                          ? "bg-gray-100 text-gray-800"
                                          : index === 2
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {index + 1}
                                  </div>
                                  <CardTitle className="text-lg">{department.department}</CardTitle>
                                </div>
                                {rankIcon}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      getMonthColor(department.month),
                                      "px-2 py-1 rounded-md text-xs font-bold",
                                    )}
                                  >
                                    {abbreviateMonth(department.month)}
                                  </div>
                                </div>
                                <div className="text-2xl font-bold">{department.avgTotalScore}</div>
                              </div>
                              <Separator className="my-4" />
                              <div className="flex justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href="/departments">View Details</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      ) : (
        // List View (New Three Column Layout)
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderListViewCard("Top Teams", <Users className="h-5 w-5" />, topTeams, "teams")}
          {renderListViewCard("Top Individuals", <User className="h-5 w-5" />, topIndividuals, "individuals")}
          {renderListViewCard("Top Departments", <Building className="h-5 w-5" />, topDepartments, "departments")}
        </div>
      )}
    </div>
  )
}