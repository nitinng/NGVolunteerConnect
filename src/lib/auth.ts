import { createServerClient, createAdminClient as _createAdminClient } from "@/lib/supabase-server";

export async function auth() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    return {
        userId: user?.id || null,
        sessionClaims: user ? ({
            metadata: {
                ...user.user_metadata,
                ...user.app_metadata,
                ...(user.email === 'nitin@navgurukul.org' ? { role: 'Admin' } : {})
            },
            role: user.email === 'nitin@navgurukul.org' ? 'Admin' : (user.app_metadata?.role || "Volunteer")
        } as any) : null
    };
}

export async function currentUser() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
        id: user.id,
        emailAddresses: [{ emailAddress: user.email || "" }],
        primaryEmailAddress: { emailAddress: user.email || "" },
        firstName: user.user_metadata?.full_name?.split(" ")[0] || "",
        lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        fullName: user.user_metadata?.full_name || "",
        imageUrl: user.user_metadata?.avatar_url || "",
        publicMetadata: {
            ...user.user_metadata,
            ...user.app_metadata,
            ...(user.email === 'nitin@navgurukul.org' ? { role: 'Admin' } : {})
        }
    };
}

export async function clerkClient() {
    const adminClient = _createAdminClient();
    return {
        users: {
            async updateUserMetadata(userId: string, data: { publicMetadata: any }) {
                const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
                if (!user) throw new Error("User not found");

                let publicMetadata = { ...data.publicMetadata };
                if (user.email === 'nitin@navgurukul.org') {
                    if (data.publicMetadata.role && data.publicMetadata.role !== 'Admin') {
                        throw new Error("Cannot downgrade the root admin user");
                    }
                    publicMetadata.role = 'Admin';
                }

                await adminClient.auth.admin.updateUserById(userId, {
                    app_metadata: {
                        ...user.app_metadata,
                        ...publicMetadata
                    }
                });
            },
            async getUser(userId: string) {
                const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
                if (!user) throw new Error("User not found");
                return {
                    id: user.id,
                    emailAddresses: [{ emailAddress: user.email || "" }],
                    primaryEmailAddress: { emailAddress: user.email || "" },
                    firstName: user.user_metadata?.full_name?.split(" ")[0] || "",
                    lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
                    fullName: user.user_metadata?.full_name || "",
                    imageUrl: user.user_metadata?.avatar_url || "",
                    createdAt: new Date(user.created_at).getTime(),
                    lastSignInAt: new Date(user.last_sign_in_at || user.created_at).getTime(),
                    publicMetadata: {
                        ...user.user_metadata,
                        ...user.app_metadata
                    }
                };
            },
            async deleteUser(userId: string) {
                const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
                if (user?.email === 'nitin@navgurukul.org') {
                    throw new Error("Cannot delete the root admin user");
                }
                await adminClient.auth.admin.deleteUser(userId);
            },
            async getUserList(params?: any) {
                const { data: { users } } = await adminClient.auth.admin.listUsers();
                return {
                    data: users.map(user => ({
                        id: user.id,
                        emailAddresses: [{ emailAddress: user.email || "" }],
                        primaryEmailAddress: { emailAddress: user.email || "" },
                        firstName: user.user_metadata?.full_name?.split(" ")[0] || "",
                        lastName: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
                        fullName: user.user_metadata?.full_name || "",
                        imageUrl: user.user_metadata?.avatar_url || "",
                        createdAt: new Date(user.created_at).getTime(),
                        lastSignInAt: new Date(user.last_sign_in_at || user.created_at).getTime(),
                        publicMetadata: {
                            ...user.user_metadata,
                            ...user.app_metadata
                        }
                    }))
                };
            }
        },
        invitations: {
            async createInvitation({ emailAddress, publicMetadata }: any) {
                await adminClient.auth.admin.inviteUserByEmail(emailAddress, {
                    data: { ...publicMetadata }
                });
            }
        }
    };
}
