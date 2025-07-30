import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  try {
    // Read the HTML file
    const htmlPath = join(process.cwd(), 'public', 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // Return the HTML
    return res.status(200).send(html);
    
  } catch (error) {
    console.error('Failed to serve dashboard:', error);
    
    // Fallback HTML if file reading fails
    const fallbackHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Token Transfer Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { color: #dc2626; background: #fee2e2; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <h1>Token Transfer Dashboard</h1>
        <div class="error">
            <h3>Dashboard konnte nicht geladen werden</h3>
            <p>Fehler: ${error.message}</p>
            <p>Verfügbare APIs:</p>
            <ul>
                <li><a href="/api/dashboard">/api/dashboard</a> - Queue Status API</li>
                <li><a href="/api/status">/api/status</a> - Wallet Status API</li>
                <li><a href="/api/webhook">/api/webhook</a> - Webhook Endpoint</li>
            </ul>
        </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(fallbackHtml);
  }
}
