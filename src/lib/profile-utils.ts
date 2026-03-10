import { Profile } from "./supabase";

export function calculateProfileCompletion(
    profile: Profile | null,
    publicMetadata: any,
    categoryKeys: string[] = []
): number {
    if (!profile) return 0;

    const keyFields: (keyof Profile)[] = [
        "phone",
        "city",
        "state",
        "country",
        "education_degree",
        "education_institution",
        "education_year",
        "job_title",
        "employer",
        "industry_vertical",
        "experience_description",
        "primary_skill_category",
        "commitment_type",
        "hours_per_week",
        "volunteer_mode",
    ];

    let completedFields = 0;

    // 1. Check basic Supabase fields
    keyFields.forEach((field) => {
        const value = profile[field];
        if (value !== null && value !== "" && value !== undefined) {
            completedFields++;
        }
    });

    // 2. Check Skills (at least one sub-skill selected for primary category)
    const primaryCat = profile.primary_skill_category;
    if (primaryCat) {
        // Now we simply check the array in the profile itself
        const subSkills = profile.primary_skill_subcategories || [];
        if (subSkills.length > 0) {
            completedFields++;
        }
    }

    // 3. Check Acknowledgement
    if (profile.acknowledgement) {
        completedFields++;
    }

    // Total possible: keyFields.length (15) + Skills check (1) + Acknowledgement (1) = 17
    const totalPossible = keyFields.length + 2;
    const percentage = Math.round((completedFields / totalPossible) * 100);

    return Math.min(percentage, 100);
}
