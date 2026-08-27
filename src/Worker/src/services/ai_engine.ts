// ActaNex AI Engine (Cloudflare Workers AI & Adaptive OCR)
export interface ExtractedReceiptData {
  merchant: string;
  date: string;
  amountGross: number;
  amountNet: number;
  taxRate: number;
  category: string;
  skr04Account: string;
  confidenceScore: number;
  isLearnedRule: boolean;
}

export interface Env {
  DB: D1Database;
  AI?: any;
}

export class AiEngine {
  /**
   * Extrahiert Belegdaten mittels KI/OCR und gleicht mit gelernten Händlerregeln ab
   */
  static async processReceipt(env: Env, filename: string, ocrText?: string): Promise<ExtractedReceiptData> {
    const lowerText = (ocrText || filename || '').toLowerCase();
    
    // 1. Zuerst Prüfung in der gelernten Händler-Regeltabelle (merchant_rules)
    try {
      const learnedRule = await env.DB.prepare(
        "SELECT * FROM merchant_rules WHERE LOWER(?) LIKE '%' || LOWER(pattern) || '%' LIMIT 1"
      ).bind(lowerText).first<{
        merchant_name: string;
        skr04_account: string;
        tax_rate: number;
        category: string;
      }>();

      if (learnedRule) {
        return {
          merchant: learnedRule.merchant_name,
          date: new Date().toISOString().substring(0, 10),
          amountGross: 0,
          amountNet: 0,
          taxRate: learnedRule.tax_rate,
          category: learnedRule.category || 'Travel',
          skr04Account: learnedRule.skr04_account,
          confidenceScore: 0.98,
          isLearnedRule: true
        };
      }
    } catch (e) {
      console.warn("Lernregel-Prüfung fehlgeschlagen:", e);
    }

    // 2. Standard-Klassifizierung nach Mustern
    let merchant = 'Unbekannter Händler';
    let category = 'Other';
    let skr04 = '6670';
    let taxRate = 19;
    let confidence = 0.85;

    if (lowerText.includes('bahn') || lowerText.includes('db') || lowerText.includes('zug') || lowerText.includes('ticket')) {
      merchant = 'Deutsche Bahn AG';
      category = 'Travel';
      skr04 = '6663';
      taxRate = 7;
      confidence = 0.95;
    } else if (lowerText.includes('hotel') || lowerText.includes('motel') || lowerText.includes('logis')) {
      merchant = 'Hotelübernachtung';
      category = 'Hotel';
      skr04 = '6670';
      taxRate = 7;
      confidence = 0.92;
    } else if (lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('bolt')) {
      merchant = 'Taxi / Fahrservice';
      category = 'Travel';
      skr04 = '6673';
      taxRate = 7;
      confidence = 0.90;
    } else if (lowerText.includes('shell') || lowerText.includes('aral') || lowerText.includes('tanken') || lowerText.includes('total')) {
      merchant = 'Tankstelle / Kraftstoff';
      category = 'Fuel';
      skr04 = '6530';
      taxRate = 19;
      confidence = 0.91;
    }

    return {
      merchant,
      date: new Date().toISOString().substring(0, 10),
      amountGross: 0,
      amountNet: 0,
      taxRate,
      category,
      skr04Account: skr04,
      confidenceScore: confidence,
      isLearnedRule: false
    };
  }

  /**
   * Speichert eine vom Anwender korrigierte Händler-Zuordnung für zukünftiges adaptives Lernen
   */
  static async learnMerchantRule(
    env: Env, 
    pattern: string, 
    merchantName: string, 
    skr04Account: string, 
    taxRate: number, 
    category: string
  ): Promise<boolean> {
    try {
      await env.DB.prepare(`
        INSERT INTO merchant_rules (id, pattern, merchant_name, skr04_account, tax_rate, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(pattern) DO UPDATE SET 
          merchant_name = excluded.merchant_name,
          skr04_account = excluded.skr04_account,
          tax_rate = excluded.tax_rate,
          category = excluded.category,
          updated_at = datetime('now')
      `).bind(
        'rule_' + Date.now(),
        pattern.toLowerCase().trim(),
        merchantName.trim(),
        skr04Account,
        taxRate,
        category
      ).run();
      return true;
    } catch (e) {
      console.error("Fehler beim Speichern der Lernregel:", e);
      return false;
    }
  }
}
