import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createAdminClient();

    // 1. Check if profiles table exists by doing a count
    const { data, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    if (error) {
        return NextResponse.json({
            ok: false,
            error: error.message,
            hint: error.hint,
            code: error.code,
            detail: "Table may not exist or RLS is blocking. Check Supabase SQL Editor.",
        }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        profilesTableExists: true,
        rowCount: count,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
}
