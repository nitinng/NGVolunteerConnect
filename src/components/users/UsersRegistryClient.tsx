"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Trash, Shield, ShieldAlert, ShieldCheck, Users, UserMinus, UserX, UserCog, Building, Search } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getDepartments, Department } from "@/app/actions/general-onboarding-actions";
import { deleteUserAction, updateUserRoleAction, inviteUserAction, toggleVolunteeringProfileAction, toggleUserManagementAction } from "@/app/(dashboard)/users/actions";
import { ReadUser } from "./types";
import { LoadingSpinner } from "@/components/loading-view";

export function UsersRegistryClient({ initialUsers, currentUserId, actorRole, actorDepartments, isRootActor }: {
    initialUsers: ReadUser[];
    currentUserId: string;
    actorRole: string;
    actorDepartments: string[];
    isRootActor: boolean;
}) {
    const [users, setUsers] = useState<ReadUser[]>(initialUsers);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Volunteer");
    const [inviteSelectedDepts, setInviteSelectedDepts] = useState<string[]>([]);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // -- Role/Dept Editing State --
    const [editingUser, setEditingUser] = useState<ReadUser | null>(null);
    const [editRole, setEditRole] = useState("");
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
    const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

    useEffect(() => {
        getDepartments().then(setAvailableDepartments).catch(console.error);
    }, []);

    // -- Permission Checkers --
    const isActorOrgManager = actorRole === "Program" && actorDepartments.includes("ORG");

    const assignableRoles = isRootActor
        ? ["Admin", "Program", "Operations", "Volunteer"]
        : (actorRole === "Admin" || isActorOrgManager)
            ? ["Program", "Operations", "Volunteer"]
            : actorRole === "Program"
                ? ["Program", "Operations"]
                : [];

    const invitableRoles = isRootActor
        ? ["Admin", "Program", "Operations", "Volunteer"]
        : actorRole === "Admin"
            ? ["Program", "Operations", "Volunteer"]
            : actorRole === "Program"
                ? ["Volunteer"]
                : [];

    const canChangeRole = (target: ReadUser) => {
        if (target.isMaster) return false;
        if (isRootActor) return true;
        if (isActorOrgManager) return target.emailAddress !== 'nitin@navgurukul.org';
        if (assignableRoles.length === 0) return false;
        if (actorRole === "Program" && target.role !== "Volunteer") return false; 
        if (actorRole === "Admin" && target.role === "Admin") return false;
        return true;
    };

    const canDelete = (target: ReadUser) => {
        if (target.isMaster) return false;
        if (target.id === currentUserId) return false;
        if (isRootActor) return true;
        if (actorRole === "Admin" && target.role !== "Admin") return true;
        return false;
    };

    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = users.filter((u) => {
        const full = `${u.firstName} ${u.lastName} ${u.emailAddress} ${u.role}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
    });

    const handleInvite = async () => {
        const isProgOrOps = ["Program", "Operations"].includes(inviteRole);
        if (isProgOrOps && inviteSelectedDepts.length === 0) {
            toast.error("At least one department is required for Program/Operations roles.");
            return;
        }

        setLoadingAction("invite");
        const res = await inviteUserAction(inviteEmail, inviteRole, inviteSelectedDepts);
        if (res.success) {
            toast.success("Invitation sent successfully!");
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteRole("Volunteer");
            setInviteSelectedDepts([]);
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
        const user = users.find(u => u.id === userId);
        if (user) {
            setEditingUser(user);
            setEditRole(newRole);
            setSelectedDepts(user.departments || []);
        }
    };

    const handleSaveRoleAndDepts = async () => {
        if (!editingUser) return;
        
        const isProgOrOps = ["Program", "Operations"].includes(editRole);
        if (isProgOrOps && selectedDepts.length === 0) {
            toast.error("At least one department is required for Program/Operations roles.");
            return;
        }

        setLoadingAction(`role-${editingUser.id}`);
        const res = await updateUserRoleAction(editingUser.id, editRole, selectedDepts);
        if (res.success) {
            toast.success("User role and departments updated successfully!");
            setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, role: editRole, departments: selectedDepts } : u)));
            setEditingUser(null);
        } else {
            toast.error(res.error || "Failed to update user");
        }
        setLoadingAction(null);
    };

    const handleToggleVolunteer = async (userId: string, currentStatus: boolean) => {
        setLoadingAction(`vol-${userId}`);
        const res = await toggleVolunteeringProfileAction(userId, !currentStatus);
        if (res.success) {
            toast.success(`Volunteer profile ${!currentStatus ? 'enabled' : 'disabled'}!`);
            setUsers(users.map((u) => (u.id === userId ? { ...u, volunteerEnabled: !currentStatus } : u)));
        } else {
            toast.error(res.error || "Failed to update profile setting");
        }
        setLoadingAction(null);
    };

    const handleToggleUserManagement = async (userId: string, currentStatus: boolean) => {
        setLoadingAction(`um-${userId}`);
        const res = await toggleUserManagementAction(userId, !currentStatus);
        if (res.success) {
            toast.success(`User management ${!currentStatus ? 'enabled' : 'disabled'}!`);
            setUsers(users.map((u) => (u.id === userId ? { ...u, userManagementEnabled: !currentStatus } : u)));
        } else {
            toast.error(res.error || "Failed to update user management setting");
        }
        setLoadingAction(null);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Banner Section */}
            <div className="relative overflow-hidden rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">User Registry</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Manage your organization's members and assign roles.
                            </p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white"
                        onClick={() => setIsInviteOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite User
                    </Button>
                </div>
            </div>

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User Role & Access</DialogTitle>
                        <DialogDescription>
                            Assign a role and departments to <strong>{editingUser?.firstName} {editingUser?.lastName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Role</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignableRoles.map((r) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {["Program", "Operations"].includes(editRole) && (
                            <div className="grid gap-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Departments <span className="text-rose-500">*</span></Label>
                                <div className="border rounded-lg p-4 bg-muted/20 max-h-[200px] overflow-y-auto space-y-3">
                                    {availableDepartments.map((dept) => (
                                        <div key={dept.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`dept-${dept.id}`}
                                                checked={selectedDepts.includes(dept.name)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedDepts([...selectedDepts, dept.name]);
                                                    } else {
                                                        setSelectedDepts(selectedDepts.filter(d => d !== dept.name));
                                                    }
                                                }}
                                            />
                                            <Label 
                                                htmlFor={`dept-${dept.id}`} 
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {dept.name}
                                                {dept.name === 'ORG' && <Badge variant="secondary" className="ml-2 text-[10px] h-4">Management</Badge>}
                                            </Label>
                                        </div>
                                    ))}
                                    {availableDepartments.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">No departments available. Create them in management.</p>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    Departments define which modules and volunteers this user can manage.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <div className="w-full flex justify-between gap-3">
                            <Button variant="ghost" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
                            <Button 
                                onClick={handleSaveRoleAndDepts} 
                                disabled={loadingAction?.startsWith('role-') || (["Program", "Operations"].includes(editRole) && selectedDepts.length === 0)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                {loadingAction?.startsWith('role-') ? (
                                    <div className="mr-2 h-4 w-4 flex items-center justify-center">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : null}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search users by name, email, or role..." 
                            className="pl-9 h-10" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Invite external user</DialogTitle>
                                <DialogDescription>
                                    Send an email invitation to grant dashboard access with a specific role.
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
                                    <Select value={inviteRole} onValueChange={(val) => {
                                        setInviteRole(val);
                                        if (!["Program", "Operations"].includes(val)) {
                                            setInviteSelectedDepts([]);
                                        }
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {invitableRoles.map((r: string) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {["Program", "Operations"].includes(inviteRole) && (
                                    <div className="grid gap-3">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Departments <span className="text-rose-500">*</span></Label>
                                        <div className="border rounded-lg p-4 bg-muted/20 max-h-[160px] overflow-y-auto space-y-3">
                                            {availableDepartments.map((dept) => (
                                                <div key={dept.id} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`invite-dept-${dept.id}`}
                                                        checked={inviteSelectedDepts.includes(dept.name)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setInviteSelectedDepts([...inviteSelectedDepts, dept.name]);
                                                            } else {
                                                                setInviteSelectedDepts(inviteSelectedDepts.filter(d => d !== dept.name));
                                                            }
                                                        }}
                                                    />
                                                    <Label 
                                                        htmlFor={`invite-dept-${dept.id}`} 
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {dept.name}
                                                        {dept.name === 'ORG' && <Badge variant="secondary" className="ml-2 text-[10px] h-4">Management</Badge>}
                                                    </Label>
                                                </div>
                                            ))}
                                            {availableDepartments.length === 0 && (
                                                <p className="text-xs text-muted-foreground italic">No departments available.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <div className="w-full flex justify-between gap-3">
                                    <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={handleInvite} disabled={loadingAction === "invite" || !inviteEmail} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                                        {loadingAction === "invite" ? (
                                            <div className="mr-2 h-4 w-4 flex items-center justify-center">
                                                <LoadingSpinner size="sm" />
                                            </div>
                                        ) : null}
                                        Send Invite
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-md bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[80px] text-center px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Image</TableHead>
                                <TableHead className="px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Name</TableHead>
                                <TableHead className="px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Email</TableHead>
                                <TableHead className="px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Role & Access</TableHead>
                                <TableHead className="hidden md:table-cell px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Joined</TableHead>
                                <TableHead className="w-[80px] text-right px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((user) => (
                                <TableRow key={user.id} className="border-b transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 group">
                                    <TableCell className="px-4 md:px-6 py-2 text-center">
                                        <Avatar className="h-9 w-9 mx-auto border shadow-sm ring-2 ring-white dark:ring-zinc-950">
                                            <AvatarImage src={user.imageUrl} alt="avatar" />
                                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold text-xs transition-colors group-hover:bg-indigo-100">
                                                {user.firstName?.[0] || user.emailAddress[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="px-4 md:px-6 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell className="px-4 md:px-6 py-2 text-sm text-slate-500 dark:text-zinc-400">
                                        {user.emailAddress}
                                    </TableCell>
                                    <TableCell className="px-4 md:px-6 py-2">
                                        <div className="flex flex-col gap-1">
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    w-fit
                                                    ${user.role === 'Admin' ? 'border-primary text-primary bg-primary/10' : ''}
                                                    ${user.role === 'Volunteer' ? 'border-muted-foreground text-muted-foreground bg-muted' : ''}
                                                    ${user.role === 'Program' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : ''}
                                                    ${user.role === 'Operations' ? 'border-amber-500 text-amber-600 bg-amber-50' : ''}
                                                `}
                                            >
                                                {user.role}
                                            </Badge>
                                            {user.departments && user.departments.length > 0 && (
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {user.departments.map(d => (
                                                        <span key={d} className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell px-4 md:px-6 py-2 text-sm text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="px-4 md:px-6 py-2 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                                    <span className="sr-only">Open menu</span>
                                                    {loadingAction === `role-${user.id}` || loadingAction === user.id ? (
                                                        <div className="h-4 w-4 flex items-center justify-center">
                                                            <LoadingSpinner size="sm" />
                                                        </div>
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {user.isMaster ? (
                                                    <div className="px-2 py-4 text-xs text-muted-foreground whitespace-normal w-48 text-center bg-muted/50 rounded-sm italic">
                                                        Root Admin · roles are immutable.
                                                    </div>
                                                ) : (
                                                    <>
                                                        {canChangeRole(user) && (
                                                            <>
                                                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Manage Permissions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setEditingUser(user);
                                                                        setEditRole(user.role);
                                                                        setSelectedDepts(user.departments || []);
                                                                    }}
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    <Building className="h-4 w-4" />
                                                                    Edit Role & Depts
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Quick Role Change</DropdownMenuLabel>
                                                                {assignableRoles.map((role) => (
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
                                                            </>
                                                        )}

                                                        {['Program', 'Operations'].includes(user.role) && (isRootActor || actorRole === 'Admin') && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleVolunteer(user.id, !!user.volunteerEnabled)}
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    {user.volunteerEnabled ? <UserMinus className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                                                    {user.volunteerEnabled ? 'Disable Volunteer Profile' : 'Enable Volunteer Profile'}
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleUserManagement(user.id, !!user.userManagementEnabled)}
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    <UserCog className="h-4 w-4" />
                                                                    {user.userManagementEnabled ? 'Disable User Management' : 'Enable User Management'}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}

                                                        {canDelete(user) && (
                                                            <>
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

                                                        {!canChangeRole(user) && !canDelete(user) && !['Program', 'Operations'].includes(user.role) && (
                                                            <div className="px-2 py-3 text-xs text-muted-foreground text-center italic">
                                                                No actions available.
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-3 px-4 md:px-6 border-t bg-slate-50 dark:bg-zinc-900/50">
                    <div className="flex-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-wider h-8 px-3" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-wider h-8 px-3" onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / usersPerPage), p + 1))} disabled={currentPage * usersPerPage >= filteredUsers.length}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

