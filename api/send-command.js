// api/send-command.js

const fetch = require('node-fetch');

// --- CONSTANTS ---
// Your domain, used for CORS. Must be HTTPS.
const ALLOWED_ORIGIN = 'https://intelligence.unaux.com'; 

module.exports = async (req, res) => {
    
    // --- CORS CONFIGURATION (MUST BE FIRST) ---
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request (Browser check before sending POST)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // --- BASIC INPUT VALIDATION ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { command } = req.body; 
    if (!command) {
        return res.status(400).json({ error: 'Missing "command" field in request body.' });
    }

    // --- SECURE ENVIRONMENT VARIABLES ---
    // NOTE: These must be configured in the Vercel Dashboard (Step 3).
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({ error: 'Server configuration error: Tokens missing.' });
    }
    
    // --- TELEGRAM API DISPATCH ---
    const telegramApiUrl = `https://api.telegram.org/bot$8235682948:AAGjVizsz2FUL63CWeoclWbOgT8YesKvj2YsendMessage`;
    
    const messagePayload = {
        chat_id: CHAT_ID,
        // Format the command nicely for your Telegram group
        text: `<b>NIGHTINGALE C2 COMMAND</b>\n\n<b>Analyst Input:</b> <code>${command}</code>\n\n[Awaiting Team Response...]`,
        parse_mode: 'HTML'
    };

    try {
        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messagePayload)
        });

        if (!telegramResponse.ok) {
            console.error('Telegram API Error:', await telegramResponse.text());
            return res.status(502).json({ 
                status: 'Telegram API Error', 
                message: 'Failed to send command to Telegram.'
            });
        }

        // Success response back to your website
        res.status(200).json({ 
            status: 'Command Dispatched', 
            message: `Command "${command}" sent successfully.`,
            command_id: Date.now() 
        });

    } catch (error) {
        console.error('Network Error:', error);
        res.status(500).json({ error: 'Internal server error during dispatch.' });
    }
};
