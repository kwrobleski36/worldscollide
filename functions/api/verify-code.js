export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { email, code } = await request.json();

        if (!email || !code) {
            return new Response(JSON.stringify({ error: "Missing Parameters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const currentTime = new Date().toISOString();

        // Query targeted account credentials from D1
        const userRow = await env.DB.prepare(
            "SELECT id, role, otp_code, otp_expires_at FROM users WHERE email = ?"
        ).bind(normalizedEmail).first();

        // Verify passcode matches
        if (!userRow || userRow.otp_code !== code.trim()) {
            return new Response(JSON.stringify({ error: "Incorrect Passcode Entered" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Enforce 10-minute lifespan threshold limits
        if (currentTime > userRow.otp_expires_at) {
            return new Response(JSON.stringify({ error: "Token Expired" }), {
                status: 410,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Wipe code entries immediately to protect against token replay exploits
        await env.DB.prepare(
            "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE email = ?"
        ).bind(normalizedEmail).run();

        // Pass finalized user authorization packet back to client window context
        return new Response(JSON.stringify({
            success: true,
            user: { id: userRow.id, email: normalizedEmail, role: userRow.role }
        }), {
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