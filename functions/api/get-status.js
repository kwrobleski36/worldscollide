export async function onRequestGet(context) {
    const userId = "current_session_id"; // Retrieve via your Auth system
    const { env } = context;
    const player = await env.DB.prepare("SELECT * FROM players WHERE user_id = ?").bind(userId).first();
    
    // Server-Side Age Calculation: No client-side manipulation possible
    const ageInDays = Math.floor((Date.now() - player.created_at) / 86400000) + 1;
    
    return new Response(JSON.stringify({
        name: player.player_name,
        account: player.accountnumber,
        level: player.player_level,
        age: ageInDays,
        job: player.player_job
    }), { headers: { "Content-Type": "application/json" } });
}