"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import debounce from "lodash/debounce"

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

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

interface DateRangeFilterProps {
  onApplyFilter: (selectedMonths: string[], selectedYear: string) => void
}

export function DateRangeFilter({ onApplyFilter }: DateRangeFilterProps) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>(months)
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())

  const debouncedApplyFilter = useCallback(
    debounce((months: string[], year: string) => {
      onApplyFilter(months, year)
    }, 300),
    [],
  )

  const handleMonthChange = (month: string) => {
    const newSelectedMonths =
      selectedMonths.length === months.length && !selectedMonths.includes(month)
        ? [month]
        : selectedMonths.includes(month)
          ? selectedMonths.filter((m) => m !== month)
          : [...selectedMonths, month]
    setSelectedMonths(newSelectedMonths)
    debouncedApplyFilter(newSelectedMonths, selectedYear)
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    debouncedApplyFilter(selectedMonths, year)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Months</Label>
        <div className="flex flex-wrap gap-2">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonths.includes(month) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMonthChange(month)}
              className="rounded-full transition-all duration-200 hover:shadow-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {month.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Year</Label>
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[180px] bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()} className="text-gray-800 dark:text-gray-200">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

