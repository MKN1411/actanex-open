// ActaNex Central Document Vault (R2 Storage & GoBD Hash Tracking)
export interface VaultDocument {
  id: string;
  filename: string;
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  documentType: 'receipt' | 'timesheet_pdf' | 'invoice' | 'contract';
  createdAt: string;
}

export class DocumentVault {
  static async calculateSha256(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async storeDocument(
    r2Bucket: R2Bucket,
    d1: D1Database,
    fileBuffer: ArrayBuffer,
    filename: string,
    mimeType: string,
    documentType: 'receipt' | 'timesheet_pdf' | 'invoice' | 'contract'
  ): Promise<VaultDocument> {
    const sha256Hash = await this.calculateSha256(fileBuffer);
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const r2Key = `vault/${documentType}/${new Date().toISOString().substring(0, 7)}/${docId}_${filename}`;

    await r2Bucket.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: { sha256: sha256Hash, docId, documentType }
    });

    try {
      await d1.prepare(`
        INSERT INTO document_vault (id, filename, r2_key, mime_type, size_bytes, sha256_hash, document_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        docId, filename, r2Key, mimeType, fileBuffer.byteLength, sha256Hash, documentType
      ).run();
    } catch (e) {
      console.warn("DocumentVault DB Registrierung übersprungen (falls Tabelle noch nicht migriert):", e);
    }

    return {
      id: docId,
      filename,
      r2Key,
      mimeType,
      sizeBytes: fileBuffer.byteLength,
      sha256Hash,
      documentType,
      createdAt: new Date().toISOString()
    };
  }
}
