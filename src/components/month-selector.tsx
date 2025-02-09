"use client"

import React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

interface MonthSelectorProps {
  selectedMonths: string[]
  onChange: (months: string[]) => void
  disabled?: boolean
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonths, onChange, disabled }) => {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (month: string) => {
    const updatedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter((m) => m !== month)
      : [...selectedMonths, month]
    onChange(updatedMonths)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={disabled}
        >
          {selectedMonths.length > 0 ? `${selectedMonths.length} selected` : "Select months..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search month..." />
          <CommandList>
            <CommandEmpty>No month found.</CommandEmpty>
            <CommandGroup>
              {months.map((month) => (
                <CommandItem key={month} onSelect={() => handleSelect(month)}>
                  <Check className={cn("mr-2 h-4 w-4", selectedMonths.includes(month) ? "opacity-100" : "opacity-0")} />
                  {month}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default MonthSelector

