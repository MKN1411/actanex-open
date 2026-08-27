// ActaNex Lexware Connector (Entkoppelter REST-Client für Lexware Office API)
export class LexwareConnector {
  private apiKey: string;
  private baseUrl = 'https://api.lexware.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async testConnection(): Promise<{ success: boolean; organizationName?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/profile`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: any = await res.json();
      return { success: true, organizationName: data.companyName || data.name || 'Verbunden' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Verbindung fehlgeschlagen' };
    }
  }

  async getContacts(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/contacts?page=0&size=100`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Fehler beim Laden der Kontakte: ${res.statusText}`);
    const data: any = await res.json();
    return data.content || [];
  }
}
