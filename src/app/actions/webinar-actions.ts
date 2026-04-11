"use server";

import { createAdminClient, createServerClient } from "@/lib/supabase-server";
import { Webinar, WebinarStatus } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Fetches all non-volunteer users (Admin, Program, Operations)
 * Returns their profile information.
 */
export async function getPotentialHosts() {
    const supabase = createAdminClient();
    
    // In this system, roles are stored in auth.users app_metadata.
    // Fetch all users from the auth table.
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw new Error(error.message);
    
    // Filter for staff (non-volunteers)
    const staff = users.filter(u => u.app_metadata.role && u.app_metadata.role !== 'Volunteer');
    const staffAuthIds = staff.map(u => u.id);
    
    if (staffAuthIds.length === 0) return [];

    // Map auth IDs to profile data
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, auth_user_id')
        .in('auth_user_id', staffAuthIds);
        
    if (profileError) throw new Error(profileError.message);
    return profiles || [];
}

/**
 * Fetches all volunteers
 */
export async function getPotentialParticipants() {
    const supabase = createAdminClient();
    
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw new Error(error.message);
    
    // Filter for volunteers
    const volunteers = users.filter(u => !u.app_metadata.role || u.app_metadata.role === 'Volunteer');
    const volunteerAuthIds = volunteers.map(u => u.id);
    
    if (volunteerAuthIds.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, auth_user_id')
        .in('auth_user_id', volunteerAuthIds);
        
    if (profileError) throw new Error(profileError.message);
    return profiles || [];
}

/**
 * Creates a new webinar and its associated host and participant relationships.
 */
export async function createWebinarAction(params: {
    title: string;
    date: string;
    agenda?: string;
    department?: string;
    gmeet_link?: string;
    is_open_to_all: boolean;
    hostIds: string[];
    participantIds: string[];
    status?: WebinarStatus;
    type?: 'one_off' | 'recurring';
}) {
    const supabase = createAdminClient();
    
    // 1. Insert Webinar entry
    const { data: webinar, error: webinarError } = await supabase
        .from('webinars')
        .insert({
            title: params.title,
            date: params.date,
            agenda: params.agenda,
            department: params.department,
            gmeet_link: params.gmeet_link,
            is_open_to_all: params.is_open_to_all,
            status: params.status || 'planned',
            type: params.type || 'one_off'
        })
        .select()
        .single();
        
    if (webinarError) throw new Error(webinarError.message);
    
    // 2. Insert Host relationships
    if (params.hostIds.length > 0) {
        const hostData = params.hostIds.map(id => ({
            webinar_id: webinar.id,
            profile_id: id
        }));
        await supabase.from('webinar_hosts').insert(hostData);
    }
    
    // 3. Insert Participant requirements (if targeted)
    if (!params.is_open_to_all && params.participantIds.length > 0) {
        const participantData = params.participantIds.map(id => ({
            webinar_id: webinar.id,
            profile_id: id
        }));
        await supabase.from('webinar_participants').insert(participantData);
    }
    
    revalidatePath('/management/support/webinars');
    return { success: true, data: webinar };
}

/**
 * Updates an existing webinar and its relationships.
 */
export async function updateWebinarAction(id: string, params: {
    title: string;
    date: string;
    agenda?: string;
    department?: string;
    gmeet_link?: string;
    is_open_to_all: boolean;
    hostIds: string[];
    participantIds: string[];
    status?: WebinarStatus;
    type?: 'one_off' | 'recurring';
}) {
    const supabase = createAdminClient();
    
    // 1. Update Webinar entry
    const { error: webinarError } = await supabase
        .from('webinars')
        .update({
            title: params.title,
            date: params.date,
            agenda: params.agenda,
            department: params.department,
            gmeet_link: params.gmeet_link,
            is_open_to_all: params.is_open_to_all,
            status: params.status,
            type: params.type,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
    if (webinarError) throw new Error(webinarError.message);
    
    // 2. Refresh Host relationships (Delete old, insert new)
    await supabase.from('webinar_hosts').delete().eq('webinar_id', id);
    if (params.hostIds.length > 0) {
        const hostData = params.hostIds.map(hid => ({
            webinar_id: id,
            profile_id: hid
        }));
        await supabase.from('webinar_hosts').insert(hostData);
    }
    
    // 3. Refresh Participant requirements
    await supabase.from('webinar_participants').delete().eq('webinar_id', id);
    if (!params.is_open_to_all && params.participantIds.length > 0) {
        const participantData = params.participantIds.map(pid => ({
            webinar_id: id,
            profile_id: pid
        }));
        await supabase.from('webinar_participants').insert(participantData);
    }
    
    revalidatePath('/management/support/webinars');
    return { success: true };
}

/**
 * Fetches all webinars including their rich relationship data.
 */
export async function getWebinarsAction() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webinars')
        .select('*, webinar_hosts(profile_id), webinar_participants(profile_id)')
        .order('date', { ascending: true });
        
    if (error) throw new Error(error.message);
    return data as (Webinar & { webinar_hosts: {profile_id: string}[], webinar_participants: {profile_id: string}[] })[];
}

/**
 * Deletes a webinar. Cascade deletion on relationships is expected via DB schema.
 */
export async function deleteWebinarAction(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('webinars').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/management/support/webinars');
    return { success: true };
}

/**
 * Fetches webinars relevant to the current volunteer user.
 * Includes 'open to all' webinars and those specifically targeted at the user.
 */
export async function getWebinarsForVolunteerAction() {
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id;
    
    if (!authUserId) return [];
    
    // Use admin client for the actual data fetching to ensure targeted webinars are visible regardless of RLS on mapping tables
    const adminClient = createAdminClient();
    
    // 1. Get profile UUID for mapping
    const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();
        
    if (!profile) return [];

    // 2. Fetch webinars that are open to all
    const { data: openWebinars } = await adminClient
        .from('webinars')
        .select('*')
        .eq('is_open_to_all', true)
        .in('status', ['planned', 'ongoing'])
        .order('date', { ascending: true });
        
    // 3. Fetch webinars specifically targeted at this volunteer
    const { data: targetedEntries } = await adminClient
        .from('webinar_participants')
        .select('webinars(*)')
        .eq('profile_id', profile.id);
        
    const targetedWebinars = (targetedEntries || [])
        .map(te => (te.webinars as any))
        .filter(w => w && ['planned', 'ongoing'].includes(w.status));

    // Combine and deduplicate
    const combined = [...(openWebinars || []), ...targetedWebinars];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    // Sort by chronological order
    unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return unique as Webinar[];
}
