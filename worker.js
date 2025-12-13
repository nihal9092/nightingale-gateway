// =======================================================
// script.js - Client-Side Logic for intelligence.unaux.com
// =======================================================

// !!! CRITICAL: Set your active Cloudflare Worker URL here !!!
const BACKEND_URL = 'https://nightingale-gateway.unaih6099.workers.dev/'; 

document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('commandInput');
    const actionButton = document.getElementById('actionButton');
    const statusDiv = document.getElementById('statusMessage'); // Assuming you have a div for messages
    
    // Safety check for required elements
    if (!commandInput || !actionButton) {
        console.error("Missing required HTML elements: commandInput or actionButton.");
        return;
    }

    actionButton.addEventListener('click', handleCommandSend);

    // Optional: Allow sending command by pressing Enter key
    commandInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleCommandSend();
        }
    });

    /**
     * Handles the asynchronous command sending process.
     */
    async function handleCommandSend() {
        const command = commandInput.value.trim();

        if (command === '') {
            updateStatus('Please enter a command before sending.', 'error');
            return;
        }

        // 1. Prepare UI for sending
        actionButton.disabled = true;
        updateStatus('Sending command to gateway...', 'info');

        try {
            // 2. Execute the POST request
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                // CRITICAL: Ensure Content-Type is application/json for the Worker to read the body correctly
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    command: command // Send data in the format the Worker expects
                })
            });

            // 3. Process the response body
            const data = await response.json();
            
            if (response.ok) {
                // HTTP Status 200-299: Success
                updateStatus(`Success: ${data.message}`, 'success');
                commandInput.value = ''; // Clear input on success
                console.log("Worker Success Response:", data);
            } else {
                // HTTP Status 400-599: Error (e.g., 400 Missing field, 500 Worker crash)
                const errorMessage = data.error || "Unknown error occurred on the server.";
                updateStatus(`Error: ${errorMessage}`, 'error');
                console.error("Worker Error Response:", data);
            }

        } catch (error) {
            // Network failure (e.g., CORS block, DNS error, complete timeout)
            console.error('Fetch failed (Network/CORS/Timeout):', error);
            updateStatus('Network Error: Could not connect to the gateway. Check console.', 'error');
        } finally {
            // 4. Reset UI
            actionButton.disabled = false;
        }
    }

    /**
     * Updates a status message on the page. (Requires a <div id="statusMessage">)
     * @param {string} message The message to display.
     * @param {string} type 'info', 'success', or 'error' for styling (optional).
     */
    function updateStatus(message, type = 'info') {
        if (statusDiv) {
            statusDiv.textContent = message;
            // Basic styling for feedback
            statusDiv.style.color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';
        } else {
            // Fallback if the status div doesn't exist
            console.log(`Status (${type}): ${message}`);
            alert(message);
        }
    }
});
