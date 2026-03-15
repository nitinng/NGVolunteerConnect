"use client";

import { useState } from "react";
import { Users, Activity, UserMinus, UserX } from "lucide-react";
import {
    XAxis,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { ReadUser } from "./types";

export function UsersTrendsClient({ initialUsers }: { initialUsers: ReadUser[] }) {
    const [timeRange, setTimeRange] = useState("90d");

    const getTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? "+100%" : "0%";
        const p = ((curr - prev) / prev) * 100;
        return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
    }

    const timeLabel = timeRange === "90d" ? "last 3 months" : (timeRange === "30d" ? "last 30 days" : "last 7 days");

    const areaChartConfig = {
        signups: {
            label: "Signups",
            color: "hsl(var(--primary))",
        }
    } satisfies ChartConfig;

    // Aggregate signup data
    const chartDataMap = new Map<string, number>();
    initialUsers.forEach(user => {
        const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
        chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + 1);
    });

    const chartData = Array.from(chartDataMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, signups]) => ({ date, signups }));

    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;

    const filteredData = chartData.filter((item) => {
        if (!item?.date) return false;
        const date = new Date(item.date);
        const referenceDate = new Date(); // Today
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
    });

    // Compute Metric Cards
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    let totalVolunteers = 0, prevTotalVolunteers = 0;
    let activeUsers = 0, prevActiveUsers = 0;
    let droppingOffUsers = 0, prevDroppingOffUsers = 0;
    let inactiveUsers = 0, prevInactiveUsers = 0;

    initialUsers.forEach(user => {
        if (user.role === "Volunteer") {
            totalVolunteers++;
            if (user.createdAt < (now - daysToSubtract * msInDay)) prevTotalVolunteers++;
        }

        const lastActivity = user.lastSignInAt ? user.lastSignInAt : user.createdAt;
        const daysSinceActivity = (now - lastActivity) / msInDay;

        if (daysSinceActivity <= daysToSubtract) activeUsers++;
        else if (daysSinceActivity > daysToSubtract && daysSinceActivity <= 90) droppingOffUsers++;
        else inactiveUsers++;

        const prevDaysSinceActivity = daysSinceActivity - daysToSubtract;

        if (prevDaysSinceActivity >= 0 && prevDaysSinceActivity <= daysToSubtract) prevActiveUsers++;
        else if (prevDaysSinceActivity > daysToSubtract && prevDaysSinceActivity <= 90) prevDroppingOffUsers++;
        else if (prevDaysSinceActivity > 90) prevInactiveUsers++;
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-end">
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[160px] rounded-lg border shadow-sm h-10 bg-card">
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                        <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                        <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVolunteers}</div>
                        <p className="text-xs text-muted-foreground">{getTrend(totalVolunteers, prevTotalVolunteers)} from previous {timeLabel}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers}</div>
                        <p className="text-xs text-muted-foreground">{getTrend(activeUsers, prevActiveUsers)} active within {timeLabel}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dropping Off</CardTitle>
                        <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{droppingOffUsers}</div>
                        <p className="text-xs text-muted-foreground">{getTrend(droppingOffUsers, prevDroppingOffUsers)} inactive 30-90 days</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inactiveUsers}</div>
                        <p className="text-xs text-muted-foreground">{getTrend(inactiveUsers, prevInactiveUsers)} inactive &gt; 90 days</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="pt-0 flex flex-col justify-between shadow-sm">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Signups Trend</CardTitle>
                            <CardDescription>
                                Showing total signups over time
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        <ChartContainer
                            config={areaChartConfig}
                            className="aspect-auto h-[250px] w-full"
                        >
                            <AreaChart data={filteredData}>
                                <defs>
                                    <linearGradient id="fillSignups" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-signups)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-signups)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    stroke="hsl(var(--muted-foreground))"
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(value) => {
                                                return new Date(value).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                            }}
                                            indicator="dot"
                                        />
                                    }
                                />
                                <Area
                                    dataKey="signups"
                                    type="natural"
                                    fill="url(#fillSignups)"
                                    stroke="var(--color-signups)"
                                    stackId="a"
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
