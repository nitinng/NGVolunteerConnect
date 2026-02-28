"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, MoreHorizontal, Trash, Shield, ShieldAlert, ShieldCheck, Users, Activity, UserMinus, UserX } from "lucide-react";
import {
    XAxis,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

import { deleteUserAction, updateUserRoleAction, inviteUserAction } from "./actions";

interface ReadUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddress: string;
    createdAt: number;
    lastSignInAt?: number | null;
    role: string;
    imageUrl: string;
    isMaster?: boolean;
}

const ROLES = ["Admin", "Program", "Operations", "Volunteer"];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function UsersClient({ initialUsers }: { initialUsers: ReadUser[] }) {
    const [users, setUsers] = useState<ReadUser[]>(initialUsers);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Volunteer");
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    // Area Chart configuration
    const [timeRange, setTimeRange] = useState("90d")

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
    users.forEach(user => {
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

    users.forEach(user => {
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

    const handleInvite = async () => {
        setLoadingAction("invite");
        const res = await inviteUserAction(inviteEmail, inviteRole);
        if (res.success) {
            toast.success("Invitation sent successfully!");
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteRole("Volunteer");
        } else {
            toast.error(res.error || "Failed to invite user");
        }
        setLoadingAction(null);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to completely remove this user?")) return;
        setLoadingAction(userId);
        const res = await deleteUserAction(userId);
        if (res.success) {
            toast.success("User deleted successfully!");
            setUsers(users.filter((u) => u.id !== userId));
        } else {
            toast.error(res.error || "Failed to delete user");
        }
        setLoadingAction(null);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoadingAction(`role-${userId}`);
        const res = await updateUserRoleAction(userId, newRole);
        if (res.success) {
            toast.success("User role updated successfully!");
            setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        } else {
            toast.error(res.error || "Failed to update role");
        }
        setLoadingAction(null);
    };

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

            {/* GRAPHS */}
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

            {/* TABLE AND ACTIONS */}
            <Card className="flex flex-col border shadow-sm rounded-lg">
                <div className="p-4 flex items-center justify-between border-b">
                    <Input placeholder="Filter users..." className="max-w-sm h-10" />

                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-10 px-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Invite User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Invite external user</DialogTitle>
                                <DialogDescription>
                                    Send an email invitation securely via Clerk to grant dashboard access with a specific role.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label htmlFor="email" className="text-sm font-semibold">Email address</label>
                                    <Input
                                        id="email"
                                        placeholder="teammate@navgurukul.org"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold">Initial Role</label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <div className="w-full flex justify-between">
                                    <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                                    <Button onClick={handleInvite} disabled={loadingAction === "invite" || !inviteEmail}>
                                        {loadingAction === "invite" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Send Invite
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="w-full overflow-auto rounded-b-lg">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[80px] text-center p-4">Image</TableHead>
                                <TableHead className="p-4">Name</TableHead>
                                <TableHead className="p-4">Email</TableHead>
                                <TableHead className="p-4">Role</TableHead>
                                <TableHead className="hidden md:table-cell p-4">Joined</TableHead>
                                <TableHead className="w-[80px] text-center p-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((user) => (
                                <TableRow key={user.id} className="border-b transition-colors hover:bg-muted/20 data-[state=selected]:bg-muted">
                                    <TableCell className="p-4 text-center">
                                        <Avatar className="h-10 w-10 mx-auto border shadow-sm">
                                            <AvatarImage src={user.imageUrl} alt="avatar" />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {user.firstName?.[0] || user.emailAddress[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="p-4 font-medium text-sm">
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell className="p-4 text-sm text-muted-foreground">
                                        {user.emailAddress}
                                    </TableCell>
                                    <TableCell className="p-4">
                                        <Badge
                                            variant="outline"
                                            className={`
                        ${user.role === 'Admin' ? 'border-primary text-primary bg-primary/10' : ''}
                        ${user.role === 'Volunteer' ? 'border-muted-foreground text-muted-foreground bg-muted' : ''}
                      `}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell p-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {new Date(user.createdAt).toLocaleDateString('en-US')}
                                    </TableCell>
                                    <TableCell className="p-4 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    {loadingAction === `role-${user.id}` || loadingAction === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {user.isMaster ? (
                                                    <div className="px-2 py-4 text-xs text-muted-foreground whitespace-normal w-48 text-center bg-muted/50 rounded-sm italic">
                                                        Master Admin roles are strictly immutable.
                                                    </div>
                                                ) : (
                                                    <>
                                                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Change Role</DropdownMenuLabel>
                                                        {ROLES.map((role) => (
                                                            <DropdownMenuItem
                                                                key={role}
                                                                disabled={user.role === role}
                                                                onClick={() => handleRoleChange(user.id, role)}
                                                                className="flex items-center gap-2 cursor-pointer"
                                                            >
                                                                {role === 'Admin' ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                                                                Make {role}
                                                            </DropdownMenuItem>
                                                        ))}

                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t bg-muted/20 rounded-b-lg">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing {users.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, users.length)} of {users.length} users
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.ceil(users.length / usersPerPage), p + 1))} disabled={currentPage * usersPerPage >= users.length}>Next</Button>
                </div>
            </Card>
        </div >
    );
}
