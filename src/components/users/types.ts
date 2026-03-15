export interface ReadUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddress: string;
    createdAt: number;
    lastSignInAt?: number | null;
    role: string;
    departments: string[];
    imageUrl: string;
    isMaster?: boolean;
    volunteerEnabled?: boolean;
    userManagementEnabled?: boolean;
}
