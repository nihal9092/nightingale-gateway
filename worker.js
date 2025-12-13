export default {
    async fetch(request, env) {
        const ALLOWED_ORIGIN = 'https://intelligence.unaux.com';
        const CORS_HEADERS = {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // 1. Handle Pre-flight OPTIONS request (for CORS)
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // 2. Handle GET /favicon.ico (prevents the 500 error you saw)
        if (request.method === 'GET') {
            const url = new URL(request.url);
            if (url.pathname === '/favicon.ico' || url.pathname === '/') {
                // Return a simple 404 or a minimal JSON response for GETs
                return new Response(JSON.stringify({ message: 'Worker is online, expecting POST request.' }), { status: 404, headers: CORS_HEADERS });
            }
        }

        // 3. Reject non-POST requests
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method Not Allowed. Expecting POST.' }), { status: 405, headers: CORS_HEADERS });
        }

        // --- Start POST Request Logic ---
        try {
            const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
            const CHAT_ID = env.TELEGRAM_CHAT_ID;
            
            // Check for missing secrets before trying to use them
            if (!BOT_TOKEN || !CHAT_ID) {
                throw new Error("Telegram secrets are not configured in Cloudflare.");
            }

            const body = await request.json();
            const command = body.command;

            if (!command) {
                return new Response(JSON.stringify({ error: 'Missing "command" field in request body.' }), { status: 400, headers: CORS_HEADERS });
            }

            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            
            const telegramResponse = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: `Command received from website: ${command}`,
                    parse_mode: 'Markdown'
                })
            });

            const telegramJson = await telegramResponse.json();

            // Check if Telegram API returned an error (e.g., 400 Bad Request)
            if (!telegramResponse.ok) {
                console.error("Telegram API Error:", telegramJson);
                // Throw an error that includes the Telegram error description
                throw new Error(`Telegram API Error: ${telegramJson.description || 'Unknown error'}`);
            }

            // Success Response
            return new Response(JSON.stringify({ success: true, message: 'Command sent to Telegram.' }), { status: 200, headers: CORS_HEADERS });

        } catch (e) {
            console.error("Worker Execution Error:", e.message);
            // Return a clear, informative 500 error to the client
            return new Response(JSON.stringify({ 
                error: 'Internal Worker Error', 
                details: e.message 
            }), { status: 500, headers: CORS_HEADERS });
        }
    }
              }
