import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, CalendarDays } from "lucide-react";

interface MonthSelectorProps {
  selectedMonths: string[];
  onChange: (months: string[]) => void;
  disabled?: boolean;
}

const MonthSelector = ({ selectedMonths, onChange, disabled }: MonthSelectorProps) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthToggle = (month: string) => {
    const newSelection = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month].sort((a, b) => months.indexOf(a) - months.indexOf(b));
    onChange(newSelection);
  };

  const removeMonth = (monthToRemove: string) => {
    onChange(selectedMonths.filter(month => month !== monthToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Select
          disabled={disabled}
          onValueChange={handleMonthToggle}
          value={selectedMonths[selectedMonths.length - 1] || ""}
        >
          <SelectTrigger className="w-[200px] bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select months" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <ScrollArea className="h-72">
                <div className="p-2">
                  {months.map((month) => (
                    <SelectItem
                      key={month}
                      value={month}
                      className="flex items-center gap-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex h-4 w-4 items-center justify-center rounded border">
                          {selectedMonths.includes(month) && (
                            <div className="h-2 w-2 rounded-sm bg-primary" />
                          )}
                        </div>
                        <span className="text-sm">{month}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </ScrollArea>
            </SelectGroup>
          </SelectContent>
        </Select>

        {selectedMonths.length > 0 && (
          <div className="absolute -top-3 -right-3">
            <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {selectedMonths.length}
            </Badge>
          </div>
        )}
      </div>

      {selectedMonths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMonths.map((month) => (
            <Badge
              key={month}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-3 rounded-full"
            >
              {month}
              <button
                onClick={() => removeMonth(month)}
                className="ml-1 rounded-full p-0.5 hover:bg-secondary/80 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthSelector;