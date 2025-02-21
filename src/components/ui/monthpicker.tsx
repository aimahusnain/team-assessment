import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

type Month = {
    number: number;
    name: string;
    full: string;
};

const MONTHS: Month[][] = [
    [
        { number: 0, name: "Jan", full: "January" },
        { number: 1, name: "Feb", full: "February" },
        { number: 2, name: "Mar", full: "March" },
        { number: 3, name: "Apr", full: "April" },
    ],
    [
        { number: 4, name: "May", full: "May" },
        { number: 5, name: "Jun", full: "June" },
        { number: 6, name: "Jul", full: "July" },
        { number: 7, name: "Aug", full: "August" },
    ],
    [
        { number: 8, name: "Sep", full: "September" },
        { number: 9, name: "Oct", full: "October" },
        { number: 10, name: "Nov", full: "November" },
        { number: 11, name: "Dec", full: "December" },
    ],
];

type ButtonVariant = "default" | "outline" | "ghost" | "link" | "destructive" | "secondary" | null | undefined;

interface MonthPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    selectedMonths?: string[];
    selectedYear?: number;
    onSelect?: (months: string[], year: number) => void;
    callbacks?: {
        yearLabel?: (year: number) => string;
        monthLabel?: (month: Month) => string;
    };
    variant?: {
        calendar?: {
            main?: ButtonVariant;
            selected?: ButtonVariant;
        };
        chevrons?: ButtonVariant;
    };
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
}

function MonthPicker({
    onSelect,
    selectedMonths = [],
    selectedYear = new Date().getFullYear(),
    minDate,
    maxDate,
    disabledDates,
    callbacks,
    variant,
    className,
    ...props
}: MonthPickerProps) {
    const [menuYear, setMenuYear] = React.useState<number>(selectedYear);

    if (minDate && maxDate && minDate > maxDate) minDate = maxDate;

    const disabledDatesMapped = disabledDates?.map((d) => {
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    const handleMonthClick = (month: Month) => {
        if (!onSelect) return;
        
        const monthName = month.full;
        let newSelectedMonths: string[];
        
        if (selectedMonths.includes(monthName)) {
            newSelectedMonths = selectedMonths.filter(m => m !== monthName);
        } else {
            newSelectedMonths = [...selectedMonths, monthName];
        }
        
        onSelect(newSelectedMonths, menuYear);
    };

    const handleYearChange = (newYear: number) => {
        setMenuYear(newYear);
        if (onSelect) {
            onSelect(selectedMonths, newYear);
        }
    };

    return (
        <div className={cn("min-w-[200px] w-[280px] p-3", className)} {...props}>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-center pt-1 relative items-center">
                    <div className="text-sm font-medium">{callbacks?.yearLabel ? callbacks?.yearLabel(menuYear) : menuYear}</div>
                    <div className="space-x-1 flex items-center">
                        <button
                            onClick={() => handleYearChange(menuYear - 1)}
                            className={cn(
                                buttonVariants({ variant: variant?.chevrons ?? "outline" }), 
                                "inline-flex items-center justify-center h-7 w-7 p-0 absolute left-1"
                            )}
                        >
                            <ChevronLeft className="opacity-50 h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleYearChange(menuYear + 1)}
                            className={cn(
                                buttonVariants({ variant: variant?.chevrons ?? "outline" }), 
                                "inline-flex items-center justify-center h-7 w-7 p-0 absolute right-1"
                            )}
                        >
                            <ChevronRight className="opacity-50 h-4 w-4" />
                        </button>
                    </div>
                </div>
                <table className="w-full border-collapse space-y-1">
                    <tbody>
                        {MONTHS.map((monthRow, a) => (
                            <tr key={"row-" + a} className="flex w-full mt-2 gap-2">
                                {monthRow.map((m) => {
                                    const isSelected = selectedMonths.includes(m.full);
                                    const isDisabled = 
                                        (maxDate ? menuYear > maxDate?.getFullYear() || (menuYear === maxDate?.getFullYear() && m.number > maxDate.getMonth()) : false) ||
                                        (minDate ? menuYear < minDate?.getFullYear() || (menuYear === minDate?.getFullYear() && m.number < minDate.getMonth()) : false) ||
                                        (disabledDatesMapped?.some((d) => d.year === menuYear && d.month === m.number));
                                    
                                    return (
                                        <td
                                            key={m.number}
                                            className="h-10 w-1/4 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                                        >
                                            <button
                                                onClick={() => handleMonthClick(m)}
                                                disabled={isDisabled}
                                                className={cn(
                                                    buttonVariants({ 
                                                        variant: isSelected 
                                                            ? variant?.calendar?.selected ?? "default" 
                                                            : variant?.calendar?.main ?? "ghost" 
                                                    }),
                                                    "h-full w-full p-0 font-normal aria-selected:opacity-100"
                                                )}
                                            >
                                                {callbacks?.monthLabel ? callbacks.monthLabel(m) : m.name}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

MonthPicker.displayName = "MonthPicker";

export { MonthPicker };