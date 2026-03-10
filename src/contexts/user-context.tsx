"use client";

import React, { createContext, useContext } from "react";

export interface UserData {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
    firstName: string;
    lastName: string;
    role?: string;
    volunteerEnabled?: boolean;
    publicMetadata?: any;
}

const UserContext = createContext<UserData | null>(null);

export function UserProvider({
    user,
    children,
}: {
    user: UserData | null;
    children: React.ReactNode;
}) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}

/**
 * Returns server-fetched user data from context.
 * This does NOT trigger any network requests — data is resolved once on the server
 * and passed down via the layout. No re-fetches on navigation.
 */
export function useUserContext(): UserData | null {
    return useContext(UserContext);
}
