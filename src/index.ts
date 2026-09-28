/**
 * Welcome to Cloudflare Workers! This is your first worker.
 */

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const url = new URL(request.url);
        switch (url.pathname) {
            case '/message':
                return new Response('Hello, World!');
            case '/random':
                return new Response(crypto.randomUUID());
            case '/health':
                return Response.json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                });
            // ⬇️ NUEVO CASE AGREGADO PARA TU BASE DE DATOS D1 ⬇️
            case '/usuarios':
                try {
                    const { results } = await env.DB.prepare('SELECT * FROM usuarios').all();
                    return Response.json(results);
                } catch (error) {
                    return new Response('Error al consultar D1', { status: 500 });
                }
            default:
                return new Response('Not Found', { status: 404 });
        }
    },
} satisfies ExportedHandler<Env>;