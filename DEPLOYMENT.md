# Token Transfer Dashboard - Vercel Deployment

## 🎯 Verfügbare Features:

### **API Endpoints:**
- **`/api/webhook`** - Empfängt Webhook-Requests von Make.com
- **`/api/status`** - Zeigt Wallet-Balances und System-Status
- **`/api/dashboard`** - API für Queue-Daten (JSON)

### **Web Interface:**
- **`/`** - Hauptdashboard (HTML Interface)
- **`/dashboard`** - Alternative Dashboard-Route

## 🚀 Deployment:

```bash
# Einfaches Deployment:
./deploy.sh

# Oder manuell:
vercel --prod
```

## 📊 Dashboard Features:

- ✅ Live Queue-Status
- ✅ Abgeschlossene Transaktionen
- ✅ Fehlgeschlagene Transaktionen  
- ✅ Wallet-Balance Monitoring
- ✅ Automatische Aktualisierung (alle 5 Sekunden)

## 🔧 Environment Variables (in Vercel):

```
PRIVATE_KEY=ihr_private_key_ohne_0x
ETH_AMOUNT=0.001
```

## 📝 Make.com Webhook Setup:

**URL:** `https://ihre-domain.vercel.app/api/webhook`
**Method:** POST
**Content-Type:** application/json
**Body:**
```json
{
  "amount": 5.5,
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4e3AA5C7b73D7e5"
}
```

Das System ist bereit für Vercel und bietet eine vollständige Web-Oberfläche!
