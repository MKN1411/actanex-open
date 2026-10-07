import { Env } from '../types';
import { ensureDocumentStorage } from './db_bootstrap.service';

const CHUNK_BYTES = 32 * 1024;
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const D1_PREFIX = 'd1/';

async function digest(bytes: Uint8Array) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
}

export function documentStorage(env: Env) {
  const mode = env.FILE_STORAGE_MODE || 'R2';
  if (!['D1','R2'].includes(mode)) throw new Error('Unbekannter Dateispeichermodus.');
  return {
    async put(key: string, value: ArrayBuffer | Uint8Array, options?: {httpMetadata?: {contentType?: string};customMetadata?:Record<string,string>}) {
      if (mode === 'R2') {
        if (!env.STORAGE) throw new Error('R2-Dateispeicher nicht konfiguriert. Datei wurde nicht gespeichert.');
        await env.STORAGE.put(key,value,options);
        return key;
      }
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      if (!bytes.length || bytes.length > MAX_DOCUMENT_BYTES) throw new Error('D1-Datei muss zwischen 1 Byte und 8 MiB gross sein.');
      await ensureDocumentStorage(env);
      // Backend-specific keys preserve access to existing R2 files after a mode change.
      const storageKey = `${D1_PREFIX}${crypto.randomUUID()}`;
      const hash = await digest(bytes);
      const count = Math.ceil(bytes.length/CHUNK_BYTES);
      const statements = [env.DB.prepare('INSERT INTO stored_documents VALUES (?,?,?,?,?,?)')
        .bind(storageKey,options?.httpMetadata?.contentType || 'application/octet-stream',bytes.length,hash,count,new Date().toISOString())];
      for (let part=0;part<count;part+=16) {
        const end=Math.min(part+16,count);const params:unknown[]=[];
        for(let index=part;index<end;index++) params.push(storageKey,index,bytes.slice(index*CHUNK_BYTES,(index+1)*CHUNK_BYTES).buffer);
        statements.push(env.DB.prepare(`INSERT INTO stored_document_parts VALUES ${Array.from({length:end-part},()=>'(?,?,?)').join(',')}`).bind(...params));
      }
      await env.DB.batch(statements);
      return storageKey;
    },
    async get(key: string) {
      if (!key.startsWith(D1_PREFIX)) {
        const object = await env.STORAGE?.get(key);
        if (object) return object;
        if (env.DOCUMENTS_BUCKET) return env.DOCUMENTS_BUCKET.get(key);
        return null;
      }
      await ensureDocumentStorage(env);
      const meta = await env.DB.prepare('SELECT * FROM stored_documents WHERE storage_key=?').bind(key)
        .first<{content_type:string;size_bytes:number;sha256:string;part_count:number}>();
      if (!meta) return null;
      if (!Number.isInteger(meta.size_bytes) || meta.size_bytes<1 || meta.size_bytes>MAX_DOCUMENT_BYTES ||
          meta.part_count!==Math.ceil(meta.size_bytes/CHUNK_BYTES)) throw new Error('Ungueltige Dateimetadaten.');
      const results = await env.DB.batch(Array.from({length:Math.ceil(meta.part_count/32)},(_,index)=>
        env.DB.prepare('SELECT part,body FROM stored_document_parts WHERE storage_key=? AND part>=? AND part<? ORDER BY part').bind(key,index*32,Math.min((index+1)*32,meta.part_count))));
      const rows=results.flatMap(result=>result.results) as {part:number;body:number[]}[];
      const bytes = new Uint8Array(meta.size_bytes);
      for (let part=0;part<meta.part_count;part++) {
        const row = rows[part];
        if (!row || row.part!==part) throw new Error('Datei unvollstaendig.');
        const data = new Uint8Array(row.body);
        if(data.length!==Math.min(CHUNK_BYTES,meta.size_bytes-part*CHUNK_BYTES)) throw new Error('Dateiteil unvollstaendig.');
        bytes.set(data,part*CHUNK_BYTES);
      }
      if(await digest(bytes)!==meta.sha256) throw new Error('Datei-Pruefsumme stimmt nicht.');
      return {
        body:bytes,
        httpMetadata:{contentType:meta.content_type},
        httpEtag:`"${meta.sha256}"`,
        async arrayBuffer() {return bytes.slice().buffer;},
        writeHttpMetadata(headers: Headers) {headers.set('Content-Type',meta.content_type);headers.set('Content-Length',String(meta.size_bytes));}
      };
    }
  };
}
