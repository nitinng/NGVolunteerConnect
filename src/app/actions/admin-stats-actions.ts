"use server";

import { createAdminClient } from "@/lib/supabase-server";

/**
 * Fetches the distribution of skill categories selected as primary or secondary.
 * Groups by category name and returns counts for both primary and secondary slots.
 */
export async function getSkillDistribution() {
    const supabase = createAdminClient();
    
    // Fetch all profiles that have either a primary or secondary skill category selected
    const { data, error } = await supabase
        .from("profiles")
        .select("primary_skill_category, secondary_skill_category")
        .or("primary_skill_category.not.is.null,secondary_skill_category.not.is.null");

    if (error) {
        console.error("[getSkillDistribution] Error:", error);
        return [];
    }

    const counts: Record<string, { primary: number; secondary: number }> = {};

    data.forEach((p) => {
        if (p.primary_skill_category) {
            if (!counts[p.primary_skill_category]) counts[p.primary_skill_category] = { primary: 0, secondary: 0 };
            counts[p.primary_skill_category].primary++;
        }
        if (p.secondary_skill_category) {
            if (!counts[p.secondary_skill_category]) counts[p.secondary_skill_category] = { primary: 0, secondary: 0 };
            counts[p.secondary_skill_category].secondary++;
        }
    });

    return Object.entries(counts).map(([category, data]) => ({
        category,
        primary: data.primary,
        secondary: data.secondary,
        total: data.primary + data.secondary
    })).sort((a, b) => b.total - a.total);
}

/**
 * Fetches the distribution of subcategories selected by volunteers.
 * This looks into primary_skill_subcategories and secondary_skill_subcategories arrays.
 */
export async function getSubcategoryDistribution() {
    const supabase = createAdminClient();

    const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("primary_skill_subcategories, secondary_skill_subcategories")
        .or("primary_skill_subcategories.not.is.null,secondary_skill_subcategories.not.is.null");

    if (pError) {
        console.error("[getSubcategoryDistribution] Error fetching profiles:", pError);
        return [];
    }

    const subcounts: Record<string, number> = {};

    profiles.forEach((p) => {
        const primary = p.primary_skill_subcategories || [];
        const secondary = p.secondary_skill_subcategories || [];
        const combined = Array.from(new Set([...primary, ...secondary]));
        
        combined.forEach(sub => {
            subcounts[sub] = (subcounts[sub] || 0) + 1;
        });
    });

    return Object.entries(subcounts).map(([subcategory, count]) => ({
        subcategory,
        count
    })).sort((a, b) => b.count - a.count);
}
/**
 * Fetches all metrics for the admin dashboard including summary cards,
 * area chart data, and weekly trends.
 */
export async function getDashboardMetrics() {
    const supabase = createAdminClient();

    // 1. Fetch all profiles for summary and distribution
    const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

    if (pError) {
        console.error("[getDashboardMetrics] Error fetching profiles:", pError);
        throw new Error("Failed to fetch dashboard metrics");
    }

    const totalRegistered = profiles.length;
    let completedProfiles = 0;
    let totalCompletionSum = 0;
    let onboardingCompletedCount = 0;
    let totalOnboardingSum = 0;

    // Key fields for profile completion tracking (10 fields)
    const keyFields: (keyof any)[] = [
        "phone", "city", "state", "country", "job_title", 
        "industry_vertical", "years_of_experience", 
        "primary_skill_category", "commitment_type", "hours_per_week"
    ];

    profiles.forEach((p: any) => {
        let filledCount = 0;
        keyFields.forEach(field => {
            if (p[field] !== null && p[field] !== "" && p[field] !== undefined) {
                filledCount++;
            }
        });
        
        const completionPct = (filledCount / keyFields.length) * 100;
        totalCompletionSum += completionPct;
        if (completionPct >= 80) completedProfiles++; // Define 80% as "Completed"
        
        // Use actually stored onboarding percentage
        onboardingCompletedCount += p.onboarding_completed ? 1 : 0;
        totalOnboardingSum += p.onboarding_percentage || 0;
    });

    const avgProfileCompletion = totalRegistered > 0 ? Math.round(totalCompletionSum / totalRegistered) : 0;
    const avgOnboardingCompletion = totalRegistered > 0 ? Math.round(totalOnboardingSum / totalRegistered) : 0;

    // 2. Prepare Area Chart Data (Daily counts)
    const areaDataMap: Record<string, { registered: number; completed: number; onboarding: number }> = {};
    
    profiles.forEach((p: any) => {
        const dateStr = new Date(p.created_at).toISOString().split("T")[0];
        if (!areaDataMap[dateStr]) {
            areaDataMap[dateStr] = { registered: 0, completed: 0, onboarding: 0 };
        }
        areaDataMap[dateStr].registered++;
        
        // Count as completed on the day it was created if it currently is (approximation)
        let filledCount = 0;
        keyFields.forEach(field => {
            if (p[field]) filledCount++;
        });
        if (filledCount / keyFields.length >= 0.8) {
            areaDataMap[dateStr].completed++;
        }
        if (p.onboarding_completed) {
            areaDataMap[dateStr].onboarding++;
        }
    });

    const areaChartData = Object.entries(areaDataMap).map(([date, counts]) => ({
        date,
        ...counts,
        avgCompletion: avgProfileCompletion // Global avg for now, or could be daily avg
    }));

    // 3. Prepare Weekly Trends (Last 6 weeks)
    const weeklyData: { week: string; signups: number; completed: number; onboarding: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekSignups = profiles.filter(p => {
            const d = new Date(p.created_at);
            return d >= weekStart && d <= weekEnd;
        }).length;

        const weekCompleted = profiles.filter(p => {
             const d = new Date(p.created_at);
             let filledCount = 0;
             keyFields.forEach(field => { if ((p as any)[field]) filledCount++; });
             return d >= weekStart && d <= weekEnd && (filledCount / keyFields.length >= 0.8);
        }).length;

        const weekOnboarding = profiles.filter(p => {
            const d = new Date(p.created_at);
            return d >= weekStart && d <= weekEnd && p.onboarding_completed;
        }).length;

        weeklyData.push({
            week: `Week ${6 - i}`,
            signups: weekSignups,
            completed: weekCompleted,
            onboarding: weekOnboarding
        });
    }

    return {
        summaryCards: {
            totalRegistered,
            completedProfiles,
            avgProfileCompletion,
            onboardingCompletedCount,
            avgOnboardingCompletion
        },
        areaChartData,
        weeklyData
    };
}
