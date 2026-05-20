export async function onRequestGet(context) {
    const { env } = context;
    // In production, get this from your Auth session, not hardcoded
    const userId = "live_active_user_passkey_token"; 
    
    try {
        const player = await env.DB.prepare("SELECT * FROM players WHERE user_id = ?").bind(userId).first();
        
        // If no player found, return a default state instead of crashing
        if (!player) {
            return new Response(JSON.stringify({ 
                name: "???", account: "000", level: 1, age: 0, job: "None" 
            }), { headers: { "Content-Type": "application/json" } });
        }

        const ageInDays = Math.floor((Date.now() - player.created_at) / 86400000) + 1;
        
        return new Response(JSON.stringify({
            name: player.player_name,
            account: player.accountnumber,
            level: player.player_level,
            age: ageInDays,
            job: player.player_job
        }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}