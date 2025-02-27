import type { Metadata } from "next"
import TopRankings from "@/components/top-ranking"

export const metadata: Metadata = {
  title: "Top 10 Rankings | Performance Dashboard",
  description: "View the highest performing teams and individuals based on average total score",
}

export default function TopTeamsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Top 10 Rankings</h1>
          <p className="text-muted-foreground">Highest ranked teams and individuals based on average total score</p>
        </div>
        <TopRankings />
      </main>
    </div>
  )
}