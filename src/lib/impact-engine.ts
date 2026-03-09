/**
 * NG Volunteer Connect — Impact Valuation Engine
 *
 * Calculates the monetary equivalent of volunteer work.
 * This is NOT pay — it is a proxy for the market cost NavGurukul
 * avoids by using skilled volunteer labour.
 *
 * Formula:
 *   hourly_rate = base_rate × skill_multiplier × impact_tier × seniority_band × type_adjustment
 *   session_value = hours_logged × hourly_rate
 */

import { ExperienceBand, ImpactTier, VolunteerType } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Multiplier Tables
// ─────────────────────────────────────────────────────────────────────────────

/** Impact tier multipliers assigned by PM at project creation */
const IMPACT_TIER_MULTIPLIER: Record<ImpactTier, number> = {
    Community: 1.0,
    Program: 1.25,
    Strategic: 1.5,
};

/** Seniority band multipliers derived from years_of_experience */
const SENIORITY_MULTIPLIER: Record<ExperienceBand, number> = {
    '0-2': 1.0,
    '3-5': 1.1,
    '6-10': 1.25,
    '10+': 1.4,
};

/** Type adjustment — internal staff adjusted slightly downward */
const TYPE_ADJUSTMENT: Record<VolunteerType, number> = {
    external_individual: 1.0,
    external_corporate: 1.0,
    internal_alumni_ext: 1.0,
    internal_alumni_staff: 0.9,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw years_of_experience integer to the correct ExperienceBand.
 */
export function getExperienceBand(yearsOfExperience: number): ExperienceBand {
    if (yearsOfExperience <= 2) return '0-2';
    if (yearsOfExperience <= 5) return '3-5';
    if (yearsOfExperience <= 10) return '6-10';
    return '10+';
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Calculation
// ─────────────────────────────────────────────────────────────────────────────

export interface ImpactCalculationInput {
    /** Base hourly rate in INR, fetched from market_rate_lookup */
    baseRateInr: number;
    /** Average complexity multiplier across the volunteer's skills matched to the project (1.0–1.8) */
    skillComplexityMultiplier: number;
    /** The project's impact tier as set by the PM */
    projectImpactTier: ImpactTier;
    /** Volunteer's years of experience */
    yearsOfExperience: number;
    /** Volunteer type — drives the type adjustment */
    volunteerType: VolunteerType;
    /** Hours logged in this work session */
    hoursLogged: number;
}

export interface ImpactCalculationResult {
    baseRate: number;
    skillMultiplier: number;
    impactTierMultiplier: number;
    seniorityMultiplier: number;
    typeAdjustment: number;
    calculatedHourlyRate: number;
    calculatedValue: number;
    experienceBand: ExperienceBand;
}

/**
 * Calculates the final hourly rate and session value for a volunteer contribution.
 * All multipliers are applied in sequence; the result is rounded to 2 decimal places.
 */
export function calculateImpact(input: ImpactCalculationInput): ImpactCalculationResult {
    const {
        baseRateInr,
        skillComplexityMultiplier,
        projectImpactTier,
        yearsOfExperience,
        volunteerType,
        hoursLogged,
    } = input;

    const experienceBand = getExperienceBand(yearsOfExperience);
    const impactTierMultiplier = IMPACT_TIER_MULTIPLIER[projectImpactTier] ?? 1.0;
    const seniorityMultiplier = SENIORITY_MULTIPLIER[experienceBand] ?? 1.0;
    const typeAdjustment = TYPE_ADJUSTMENT[volunteerType] ?? 1.0;

    const calculatedHourlyRate =
        baseRateInr *
        skillComplexityMultiplier *
        impactTierMultiplier *
        seniorityMultiplier *
        typeAdjustment;

    const calculatedValue = calculatedHourlyRate * hoursLogged;

    return {
        baseRate: baseRateInr,
        skillMultiplier: skillComplexityMultiplier,
        impactTierMultiplier,
        seniorityMultiplier,
        typeAdjustment,
        calculatedHourlyRate: Math.round(calculatedHourlyRate * 100) / 100,
        calculatedValue: Math.round(calculatedValue * 100) / 100,
        experienceBand,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a monetary value in INR with proper Indian number formatting.
 * e.g. 12500 → "₹12,500"
 */
export function formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format hours to 1 decimal place with unit.
 * e.g. 2.5 → "2.5 hrs"
 */
export function formatHours(hours: number): string {
    return `${hours.toFixed(1)} hrs`;
}
