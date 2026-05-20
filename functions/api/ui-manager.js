export async function onRequest(context) {
    const { request, env } = context;
    const userId = "admin_gm_session"; 

    if (request.method === "GET") {
        const layout = await env.DB.prepare("SELECT layout_data FROM layout_configs WHERE gm_id = ?")
            .bind(userId).first();
        return new Response(layout ? layout.layout_data : "{}", { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
        const data = await request.json();
        await env.DB.prepare("INSERT OR REPLACE INTO layout_configs (gm_id, layout_data) VALUES (?, ?)")
            .bind(userId, JSON.stringify(data)).run();
        return new Response(JSON.stringify({ success: true }));
    }
}