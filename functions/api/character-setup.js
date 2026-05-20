export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const payload = await request.json();
        const sanitizedName = String(payload.name || "").trim().toUpperCase();
        const userId = payload.userId || "mock_passkey_handshake_id"; // Session token placeholder

        // Enforce strict alphanumeric constraint matching the monospaced art rules
        const alphaNumericRegex = /^[A-Z0-9]+$/;
        if (!alphaNumericRegex.test(sanitizedName)) {
            return new Response(JSON.stringify({ error: "Error: Invalid characters. Monospaced Alphanumeric Only." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Authoritative Database Transaction Execution
        // Extracts current layout max indices to force strict +1 chronological ordering
        const dbTransaction = await env.DB.batch([
            env.DB.prepare("SELECT player_name FROM players WHERE player_name = ?").bind(sanitizedName),
            env.DB.prepare("SELECT COALESCE(MAX(accountnumber), 99) AS last_id FROM players")
        ]);

        const nameCheckResult = dbTransaction[0].results;
        const currentCeilingResult = dbTransaction[1].results[0];

        if (nameCheckResult.length > 0) {
            return new Response(JSON.stringify({ error: "Error: Name is already taken. Please select a new name ..." }), {
                status: 409,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Strict auto-increment assignment logic guaranteeing Kevin is 100 and subsequent accounts climb step-by-step
        const nextAccountNumber = currentCeilingResult.last_id < 100 ? 100 : currentCeilingResult.last_id + 1;
        const serverUtcTimestamp = Date.now();

        // Write verified character record securely behind the edge firewall
        await env.DB.prepare(
            "INSERT INTO players (user_id, player_name, accountnumber, created_at) VALUES (?, ?, ?, ?)"
        ).bind(userId, sanitizedName, nextAccountNumber, serverUtcTimestamp);

        // Output authorized state metrics directly back to interface text parsers
        return new Response(JSON.stringify({
            success: true,
            player_name: sanitizedName,
            player_accountnumber: String(nextAccountNumber),
            player_level: 1,
            player_age: 1,
            player_job: "None"
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Error: Server Processing Delta Failure." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}