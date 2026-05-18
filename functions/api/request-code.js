export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { email } = await request.json();
        
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: "Invalid Email Format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        
        // Generates a 6-digit numeric passcode
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        // Sets expiration threshold to 10 minutes from current transaction time
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Check if the user already exists in the D1 database instance
        const existingUser = await env.DB.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).bind(normalizedEmail).first();

        if (!existingUser) {
            // New user registration step
            const newId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO users (id, email, role, otp_code, otp_expires_at) VALUES (?, ?, 'User', ?, ?)"
            ).bind(newId, normalizedEmail, passcode, expiresAt).run();
        } else {
            // Returning user step
            await env.DB.prepare(
                "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?"
            ).bind(passcode, expiresAt, normalizedEmail).run();
        }

        // Output to the Cloudflare log stream for testing
        console.log(`[AUTH DEBUG] Code for ${normalizedEmail}: ${passcode}`);

        return new Response(JSON.stringify({ success: true, message: "Passcode generated" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}