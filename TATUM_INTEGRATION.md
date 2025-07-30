# Tatum API Integration

## Neue Environment Variables

Die folgenden Environment Variables müssen in den Vercel Project Settings hinzugefügt werden:

### TATUM_API_KEY
- **Wert:** Dein Tatum API Key
- **Beschreibung:** API Key für die Tatum Blockchain API
- **Beispiel:** `your-tatum-api-key-here`

### Bestehende Variables (müssen weiterhin gesetzt bleiben):

### PRIVATE_KEY  
- **Wert:** Private Key der Sender-Wallet (ohne 0x Prefix)
- **Beschreibung:** Private Key für die Wallet, die die Tokens sendet

### ETH_AMOUNT
- **Wert:** ETH Menge pro Transfer
- **Beschreibung:** Menge ETH die zusammen mit den Tokens gesendet wird
- **Beispiel:** `0.0000001`

## Vorteile der Tatum API Integration:

1. **🚀 Zuverlässiger:** Tatum kümmert sich um Nonce-Management und Gas-Optimierung
2. **📊 Einfacher:** Weniger komplexer Code, weniger Fehlerquellen  
3. **⚡ Schneller:** Optimierte Transaktionsverarbeitung
4. **🔒 Sicherer:** Professionelle API mit bewährten Sicherheitspraktiken
5. **📈 Skalierbar:** Bessere Handhabung von vielen gleichzeitigen Transaktionen

## API Endpoints die jetzt Tatum verwenden:

- `/api/webhook` - Sendet Transaktionen über Tatum API
- `/api/status` - Zeigt weiterhin Wallet Status über direkte RPC
- `/api/dashboard` - Queue Management bleibt unverändert

## Testen:

```bash
node test-tatum-webhook.js
```

## Transaction Hashes:

Die API gibt jetzt Tatum Transaction IDs zurück, die 1:1 mit Blockchain Transaction Hashes übereinstimmen und auf BaseScan.org überprüft werden können.
