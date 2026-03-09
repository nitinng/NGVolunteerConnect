import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if user has a profile (or is admin)
                const isAdmin = user.email === 'nitin@navgurukul.org'
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .maybeSingle()

                if (!profile && !isAdmin && !next.startsWith('/register')) {
                    next = '/register?reason=no_account'
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
