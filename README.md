# Token Transfer Claim Service

Ein Vercel-Service zum automatischen Versenden von D.FAITH Tokens und ETH auf der Base Chain mit Web-Dashboard.

## 🎯 Funktionen

- ✅ Empfängt Webhook-Requests von Make.com
- ✅ Versendet D.FAITH Tokens (0x69eFD833288605f320d77eB2aB99DDE62919BbC1)
- ✅ Versendet kleine ETH-Beträge
- ✅ Verarbeitet Anfragen in einer Queue (Reihenfolge)
- ✅ **Web-Dashboard** zur Überwachung von Transaktionen
- ✅ **Real-time Updates** alle 5 Sekunden
- ✅ Läuft auf der Base Chain (Chain ID: 8453)

## 🖥️ Dashboard

Das Dashboard ist unter der Haupt-URL Ihrer Vercel-App verfügbar:
- **Live Dashboard**: `https://ihre-vercel-domain.vercel.app/`
- **Alternative URL**: `https://ihre-vercel-domain.vercel.app/dashboard`

### Dashboard Features:
- 📊 **Live-Statistiken**: Warteschlange, abgeschlossene und fehlgeschlagene Transaktionen
- 🔄 **Auto-Refresh**: Automatische Aktualisierung alle 5 Sekunden
- 📱 **Responsive Design**: Funktioniert auf Desktop und Mobile
- 🎨 **Moderne UI**: Schönes Interface mit Tabs und Karten
- 🔍 **Detailansicht**: Vollständige Transaktionsdetails inkl. TX-Hashes

## 📡 API Endpoints

### **🎯 POST `/api/webhook`** - Hauptendpunkt
Empfängt Webhook-Requests und startet Transfers.

**Request Body:**
```json
{
  "amount": 10.50,
  "walletAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction queued successfully",
  "data": {
    "transactionId": "abc123def456",
    "amount": 10.50,
    "walletAddress": "0x1234...",
    "queuePosition": 1
  }
}
```

### **📊 GET `/api/dashboard`** - Queue Status
Zeigt alle Transaktionen und Queue-Status.

**Response:**
```json
{
  "success": true,
  "data": {
    "queuedTransactions": [...],
    "completedTransactions": [...],
    "failedTransactions": [...],
    "stats": {
      "totalQueued": 3,
      "totalCompleted": 15,
      "totalFailed": 1,
      "isProcessing": true
    }
  }
}
```

### **🔍 GET `/api/dashboard?id=abc123`** - Spezifische Transaktion
Zeigt Details einer bestimmten Transaktion.

### **💰 GET `/api/status`** - Wallet Status
Zeigt Wallet-Balances und System-Status.

## Sicherheit

⚠️ **Wichtige Sicherheitshinweise:**

1. **Private Key Schutz**: Verwenden Sie eine separate Wallet nur für diesen Service
2. **Rate Limiting**: Implementieren Sie zusätzliche Rate Limits wenn nötig
3. **Monitoring**: Überwachen Sie die Wallet-Balance regelmäßig
4. **Fehlerbehandlung**: Failed Transactions werden geloggt

## Architektur

- **Webhook Handler** (`api/webhook.js`): Empfängt und validiert Requests
- **Transaction Queue** (`utils/transactionQueue.js`): Verarbeitet Transaktionen sequenziell
- **Configuration** (`config.js`): Zentrale Konfiguration für Base Chain und Token

## Entwicklung

```bash
# Dependencies installieren
npm install

# Lokale Entwicklung starten
npm run dev

# Testen des Webhooks lokal
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"amount": 5.0, "walletAddress": "0x..."}'
```

## Monitoring

Überprüfen Sie regelmäßig:
- Wallet-Balance für D.FAITH Tokens
- ETH-Balance für Gas und Transfers
- Vercel Function Logs für Fehler
- Transaction Success Rate