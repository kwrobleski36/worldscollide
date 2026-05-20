export async function onRequestPost(context) {
    const { request, env } = context;
    const { gmId, layoutData } = await request.json();
    
    await env.DB.prepare("INSERT OR REPLACE INTO layout_configs (gm_id, layout_data) VALUES (?, ?)")
        .bind(gmId, JSON.stringify(layoutData)).run();
        
    return new Response(JSON.stringify({ success: true }));
}