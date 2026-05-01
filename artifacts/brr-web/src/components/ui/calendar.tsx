import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(d: Date) {
  return isSameDay(d, new Date())
}

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  fromDate?: Date
  toDate?: Date
  showOutsideDays?: boolean
  className?: string
  initialFocus?: boolean
  defaultMonth?: Date
  /** Accepted for API compatibility — always treated as "single". */
  mode?: string
  [key: string]: unknown
}

function Calendar({
  selected,
  onSelect,
  disabled,
  showOutsideDays = true,
  className,
  defaultMonth,
}: CalendarProps) {
  const startDate = defaultMonth ?? selected ?? new Date()
  const [viewYear, setViewYear] = React.useState(startDate.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(startDate.getMonth())

  // Keep view in sync when selected changes externally (e.g. page loads with a pre-set date)
  React.useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = startOfMonth(viewYear, viewMonth).getDay() // 0=Sun
  const totalDays = daysInMonth(viewYear, viewMonth)
  const prevMonthDays = daysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  )

  // Build 6 rows × 7 cols grid
  const cells: Array<{ date: Date; outside: boolean }> = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ date: new Date(y, m, d), outside: true })
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), outside: false })
  }
  let nd = 1
  while (cells.length < 42) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ date: new Date(y, m, nd++), outside: true })
  }

  function handleSelect(date: Date, outside: boolean) {
    if (outside) {
      setViewYear(date.getFullYear())
      setViewMonth(date.getMonth())
    }
    if (disabled?.(date)) return
    onSelect?.(date)
  }

  return (
    <div className={cn("p-3 select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div
            key={d}
            className="h-9 w-9 flex items-center justify-center text-[0.8rem] font-normal text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, outside }, idx) => {
          const sel = selected ? isSameDay(date, selected) : false
          const dis = disabled?.(date) ?? false
          const tod = isToday(date)
          const hide = outside && !showOutsideDays

          return (
            <div key={idx} className="h-9 w-9 flex items-center justify-center">
              {hide ? null : (
                <button
                  type="button"
                  onClick={() => handleSelect(date, outside)}
                  disabled={dis}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    sel && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    !sel && tod && "bg-accent text-accent-foreground",
                    outside && !sel && "text-muted-foreground opacity-50",
                    dis && "opacity-30 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {date.getDate()}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"
export { Calendar }
