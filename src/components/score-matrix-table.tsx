import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ScoreMatrixProps {
  title: string
  benchmark: {
    tcm: number
    ce: string
    ts: number
    rbsl: string
  }
  interval: {
    tcm: number
    ce: string
    ts: number
    rbsl: string
  }
}

const formatNumber = (value: number | string) => {
  if (value === 0 || value === "-" || value === "") return "-"
  const num = Number(value)
  return !isNaN(num) ? num.toLocaleString() : value
}

export function ScoreMatrixTable({ title, benchmark, interval }: ScoreMatrixProps) {
  const calculateValue = (
    base: number | string,
    interval: number | string,
    level: number,
    isPercentage = false,
    isCE = false,
  ) => {
    if (level === 1) return "-"
    const baseNum = Number(base)
    const intervalNum = Number(interval)
    if (isNaN(baseNum) || isNaN(intervalNum)) return "-"

    let value: number

    if (!isCE) {
      // For TCM, TS, RBSL: Regular calculation
      const steps = level - 5
      value = baseNum + steps * intervalNum
    } else {
      // For CE: Special calculation
      if (level === 10) {
        value = 0 // Level 10 is always 0%
      } else if (level > 5) {
        // For levels 6-9: Calculate backwards from benchmark
        value = baseNum - (level - 5) * intervalNum
      } else if (level === 5) {
        value = baseNum // Benchmark value
      } else {
        // For levels 1-4: Calculate forwards from benchmark
        value = baseNum + (5 - level) * intervalNum
      }
    }

    return isPercentage ? `${value}%` : formatNumber(value)
  }

  // Generate CE scores with proper calculation
  const generateCEScores = () => {
    const scores = Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      const baseNum = Number(benchmark.ce)
      const intervalNum = Number(interval.ce)

      let value: number
      if (level === 10) {
        value = 0
      } else if (level > 5) {
        value = baseNum - (level - 5) * intervalNum
      } else if (level === 5) {
        value = baseNum
      } else {
        value = baseNum + (5 - level) * intervalNum
      }

      return {
        level,
        value: `${value}%`,
      }
    })

    return scores
  }

  const ceScores = generateCEScores()

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold text-primary">{title}</CardTitle>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="font-mono">
              TCM Interval: {formatNumber(interval.tcm)}
            </Badge>
            <Badge variant="outline" className="font-mono">
              CE Interval: {interval.ce}%
            </Badge>
            <Badge variant="outline" className="font-mono">
              TS Interval: {formatNumber(interval.ts)}
            </Badge>
            <Badge variant="outline" className="font-mono">
              RBSL Interval: {interval.rbsl}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score (TCM)</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Score (CE)</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Score (TS)</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Score (RBSL)</TableHead>
                <TableHead>Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((score) => {
                // Find the corresponding CE score by matching the level
                const ceScore = ceScores.find((ce) => ce.level === score)
                return (
                  <TableRow key={score} className={score === 5 ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">
                      {calculateValue(benchmark.tcm, interval.tcm, score)}
                    </TableCell>
                    <TableCell>{score}</TableCell>
                    <TableCell className="font-medium">
                      {ceScore?.value || "-"}
                    </TableCell>
                    <TableCell>{ceScore?.level || "-"}</TableCell>
                    <TableCell className="font-medium">
                      {calculateValue(benchmark.ts, interval.ts, score)}
                    </TableCell>
                    <TableCell>{score}</TableCell>
                    <TableCell className="font-medium">
                      {calculateValue(benchmark.rbsl, interval.rbsl, score, true)}
                    </TableCell>
                    <TableCell>{score}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
