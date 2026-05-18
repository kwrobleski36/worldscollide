export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { email } = await request.json();

        // 1. Log incoming tracking vector immediately
        console.log(`[AUTH SYSTEM] Request intercepted for email node: ${email}`);

        if (!email) {
            return new Response(JSON.stringify({ error: "Missing Parameters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Generate the 6-digit token matrix unit
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // CRITICAL DEBUG ENTRY: Forced visibility to log stream pipeline
        console.log(`[AUTH DEBUG] Code for ${normalizedEmail}: ${passcode}`);

        // Set explicit 10-minute threshold expiration window
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // 3. Sync structural profile components into active D1 rows
        await env.DB.prepare(
            "INSERT OR IGNORE INTO users (id, email, role) VALUES (?, ?, 'User')"
        ).bind(crypto.randomUUID(), normalizedEmail).run();

        await env.DB.prepare(
            "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?"
        ).bind(passcode, expiresAt, normalizedEmail).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        // Explicitly catch and log any hidden server block drops to the stream
        console.error(`[CRITICAL AUTH CRASH] Execution dropped: ${err.message}`);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}