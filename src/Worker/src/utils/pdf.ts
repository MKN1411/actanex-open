export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

export async function extractTextFromPdfBytes(buffer: Uint8Array): Promise<string> {
  const latin1 = new TextDecoder("latin1");
  const pdfStr = latin1.decode(buffer);
  const textPieces: string[] = [];
  let searchIdx = 0;

  function cleanPdfString(raw: string): string {
    return raw.replace(/\\([()\\])/g, "$1")
              .replace(/\\n/g, " ")
              .replace(/\\r/g, " ")
              .replace(/\\t/g, " ");
  }

  function hexToText(hex: string): string {
    let str = "";
    const cleanHex = hex.replace(/\s+/g, "");
    for (let i = 0; i < cleanHex.length; i += 2) {
      const code = parseInt(cleanHex.substr(i, 2), 16);
      if (!isNaN(code) && code > 0) str += String.fromCharCode(code);
    }
    return str;
  }

  while (true) {
    const streamIdx = pdfStr.indexOf("stream", searchIdx);
    if (streamIdx === -1) break;

    const headerStart = Math.max(0, streamIdx - 300);
    const header = pdfStr.slice(headerStart, streamIdx);
    const isFlate = header.includes("/FlateDecode");
    const isImage = header.includes("/Image");

    let contentStart = streamIdx + 6;
    if (buffer[contentStart] === 0x0d && buffer[contentStart + 1] === 0x0a) contentStart += 2;
    else if (buffer[contentStart] === 0x0a || buffer[contentStart] === 0x0d) contentStart += 1;

    const endstreamIdx = pdfStr.indexOf("endstream", contentStart);
    if (endstreamIdx === -1) break;

    let contentEnd = endstreamIdx;
    if (buffer[contentEnd - 1] === 0x0a) contentEnd--;
    if (buffer[contentEnd - 1] === 0x0d) contentEnd--;

    const streamBytes = buffer.subarray(contentStart, contentEnd);
    searchIdx = endstreamIdx + 9;

    if (isImage || streamBytes.length > 2 * 1024 * 1024) continue;

    try {
      let inflatedStr = "";
      if (isFlate) {
        try {
          const ds = new DecompressionStream("deflate");
          const writer = ds.writable.getWriter();
          writer.write(streamBytes);
          writer.close();
          const res = new Response(ds.readable);
          const decomp = new Uint8Array(await res.arrayBuffer());
          inflatedStr = latin1.decode(decomp);
        } catch {
          try {
            const dsRaw = new DecompressionStream("deflate-raw");
            const writer = dsRaw.writable.getWriter();
            writer.write(streamBytes);
            writer.close();
            const res = new Response(dsRaw.readable);
            const decomp = new Uint8Array(await res.arrayBuffer());
            inflatedStr = latin1.decode(decomp);
          } catch {
            inflatedStr = latin1.decode(streamBytes);
          }
        }
      } else {
        inflatedStr = latin1.decode(streamBytes);
      }

      const btRegex = /BT[\s\S]*?ET/g;
      let match;
      while ((match = btRegex.exec(inflatedStr)) !== null) {
        const block = match[0];
        const tjRegex = /\[(.*?)\]\s*TJ/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          const inner = tjMatch[1];
          const strRegex = /\((.*?)\)/g;
          let sMatch;
          while ((sMatch = strRegex.exec(inner)) !== null) {
            textPieces.push(cleanPdfString(sMatch[1]));
          }
          const hexRegex = /<([0-9a-fA-F]+)>/g;
          let hMatch;
          while ((hMatch = hexRegex.exec(inner)) !== null) {
            const ht = hexToText(hMatch[1]);
            if (ht) textPieces.push(ht);
          }
        }
        const singleTjRegex = /\((.*?)\)\s*Tj/g;
        let sTjMatch;
        while ((sTjMatch = singleTjRegex.exec(block)) !== null) {
          textPieces.push(cleanPdfString(sTjMatch[1]));
        }
        const singleHexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
        let sHexMatch;
        while ((sHexMatch = singleHexTjRegex.exec(block)) !== null) {
          const ht = hexToText(sHexMatch[1]);
          if (ht) textPieces.push(ht);
        }
      }
    } catch (stErr) {
      console.warn("PDF stream decode error:", stErr);
    }
  }

  return textPieces.join(" ");
}
