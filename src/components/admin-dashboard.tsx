"use client"

import * as React from "react"
import { TrendingUp, Users, UserCheck, BarChart3, CheckSquare, Percent, ShieldCheck } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { getSkillDistribution, getSubcategoryDistribution, getDashboardMetrics } from "@/app/actions/admin-stats-actions"
import { useUserContext } from "@/contexts/user-context"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const areaChartConfig = {
  registered: {
    label: "Registered",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
  avgCompletion: {
    label: "Avg Completion (%)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const weeklyConfig = {
  value: {
    label: "Count",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

const distConfig = {
  count: {
    label: "Volunteer Count",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function AdminDashboard() {
  const user = useUserContext()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [skillDist, setSkillDist] = React.useState<{category: string, primary: number, secondary: number, total: number}[]>([])
  const [subDist, setSubDist] = React.useState<{subcategory: string, count: number}[]>([])
  const [metrics, setMetrics] = React.useState<{
    summaryCards: {
      totalRegistered: number;
      completedProfiles: number;
      avgProfileCompletion: number;
      onboardingCompletedCount: number;
      avgOnboardingCompletion: number;
    },
    areaChartData: any[],
    weeklyData: any[]
  } | null>(null)
  const [isStatsLoading, setIsStatsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadStats() {
      setIsStatsLoading(true)
      try {
        const [skillData, subData, dashboardData] = await Promise.all([
          getSkillDistribution(),
          getSubcategoryDistribution(),
          getDashboardMetrics()
        ])
        setSkillDist(skillData)
        setSubDist(subData)
        setMetrics(dashboardData)
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setIsStatsLoading(false)
      }
    }
    loadStats()
  }, [])

  const filteredAreaContent = (metrics?.areaChartData || []).filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date() // Use today for live data
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[12px] bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm group transition-all hover:bg-slate-100 dark:hover:bg-zinc-900/80">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                {user?.firstName ? `Hi ${user.firstName} 👋` : 'Admin Control Center'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Welcome to NavGurukul's Administrative Hub. Oversee volunteer lifecycles, track system metrics, and manage the movement.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1 px-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">System Status</div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              OPERATIONAL
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteers Registered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summaryCards.totalRegistered.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Total users in database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completed</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summaryCards.completedProfiles.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Volunteers with 80%+ profile</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profile Completion</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summaryCards.avgProfileCompletion || 0}%</div>
            <p className="text-xs text-muted-foreground">Average across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summaryCards.onboardingCompletedCount.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Volunteers through onboarding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Onboarding Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summaryCards.avgOnboardingCompletion || 0}%</div>
            <p className="text-xs text-muted-foreground">Success rate per signup</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Area Chart */}
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Volunteer Engagement - Interactive</CardTitle>
            <CardDescription>
              Showing registration and completion trends
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={areaChartConfig} className="aspect-auto h-[350px] w-full">
            <AreaChart data={filteredAreaContent}>
              <defs>
                <linearGradient id="fillRegistered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-registered)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-registered)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAvgCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-avgCompletion)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-avgCompletion)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="registered" type="natural" fill="url(#fillRegistered)" stroke="var(--color-registered)" stackId="a" />
              <Area dataKey="completed" type="natural" fill="url(#fillCompleted)" stroke="var(--color-completed)" stackId="a" />
              <Area dataKey="avgCompletion" type="natural" fill="url(#fillAvgCompletion)" stroke="var(--color-avgCompletion)" stackId="a" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Weekly Charts Group */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Volunteer Signups</CardTitle>
            <CardDescription>Stats for the last 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyConfig}>
              <BarChart accessibilityLayer data={metrics?.weeklyData || []} layout="vertical" margin={{ right: 16 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="week" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                <XAxis dataKey="signups" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="signups" layout="vertical" fill="var(--color-value)" radius={4}>
                  <LabelList dataKey="week" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                  <LabelList dataKey="signups" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
            <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 5.2% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>

        {/* Weekly Profile Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Profile Completed</CardTitle>
            <CardDescription>Stats for the last 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyConfig}>
              <BarChart accessibilityLayer data={metrics?.weeklyData || []} layout="vertical" margin={{ right: 16 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="week" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                <XAxis dataKey="completed" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="completed" layout="vertical" fill="var(--chart-3)" radius={4}>
                  <LabelList dataKey="week" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                  <LabelList dataKey="completed" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
            <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 3.1% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>

        {/* Weekly Onboarding Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Onboarding Completed</CardTitle>
            <CardDescription>Stats for the last 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyConfig}>
              <BarChart accessibilityLayer data={metrics?.weeklyData || []} layout="vertical" margin={{ right: 16 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="week" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                <XAxis dataKey="onboarding" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="onboarding" layout="vertical" fill="var(--chart-4)" radius={4}>
                  <LabelList dataKey="week" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                  <LabelList dataKey="onboarding" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
             <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 4.5% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>
      </div>


      {/* Skills Distribution Charts - 3 Column Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Primary Categories Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Primary Skill Categories</CardTitle>
            <CardDescription>Primary expertise area selections</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isStatsLoading ? (
               <div className="flex h-full items-center justify-center py-20">
                 <i className="fa-solid fa-spinner fa-spin text-2xl text-muted-foreground" />
               </div>
            ) : (
              <ChartContainer config={distConfig}>
                <BarChart
                  accessibilityLayer
                  data={skillDist}
                  layout="vertical"
                  margin={{ right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis dataKey="primary" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="primary"
                    layout="vertical"
                    fill="var(--chart-1)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="category"
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={11}
                    />
                    <LabelList
                      dataKey="primary"
                      position="right"
                      offset={8}
                      className="fill-foreground font-medium"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
             <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 5.2% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>

        {/* Secondary Categories Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Secondary Skill Categories</CardTitle>
            <CardDescription>Secondary expertise area selections</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isStatsLoading ? (
               <div className="flex h-full items-center justify-center py-20">
                 <i className="fa-solid fa-spinner fa-spin text-2xl text-muted-foreground" />
               </div>
            ) : (
              <ChartContainer config={distConfig}>
                <BarChart
                  accessibilityLayer
                  data={skillDist}
                  layout="vertical"
                  margin={{ right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis dataKey="secondary" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="secondary"
                    layout="vertical"
                    fill="var(--chart-2)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="category"
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={11}
                    />
                    <LabelList
                      dataKey="secondary"
                      position="right"
                      offset={8}
                      className="fill-foreground font-medium"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
             <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 3.8% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>

        {/* Subcategories Breakdown Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Subcategories Breakdown</CardTitle>
            <CardDescription>Frequency of specific skills</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[400px]">
             {isStatsLoading ? (
               <div className="flex h-full items-center justify-center py-20">
                 <i className="fa-solid fa-spinner fa-spin text-2xl text-muted-foreground" />
               </div>
            ) : (
              <ChartContainer config={distConfig}>
                <BarChart
                  accessibilityLayer
                  data={subDist}
                  layout="vertical"
                  margin={{ right: 16 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="subcategory"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis dataKey="count" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="count"
                    layout="vertical"
                    fill="var(--chart-4)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="subcategory"
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={11}
                    />
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={8}
                      className="fill-foreground font-medium"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground border-t bg-muted/20">
             <div className="flex gap-2 leading-none font-medium text-foreground">Trending up by 4.5% <TrendingUp className="h-4 w-4" /></div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
