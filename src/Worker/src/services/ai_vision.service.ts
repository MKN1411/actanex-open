import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { extractTextFromPdfBytes, uint8ArrayToBase64 } from "../utils/pdf";

export async function scanVoucherWithAi(request: Request, env: Env): Promise<Response> {
        try {
          const body = await request.json() as any;
          let imageBytes: Uint8Array | null = null;

          if (body.r2Key) {
            const obj = await env.STORAGE.get(body.r2Key);
            if (obj) {
              imageBytes = new Uint8Array(await obj.arrayBuffer());
            }
          }

          if (!imageBytes && (body.imageBase64 || body.base64DataUri || body.base64)) {
            let base64 = body.imageBase64 || body.base64DataUri || body.base64;
            if (base64.includes(",")) base64 = base64.split(",")[1];
            const binaryString = atob(base64);
            imageBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              imageBytes[i] = binaryString.charCodeAt(i);
            }
          }

          if (!imageBytes || imageBytes.length === 0) {
            return errorResponse("Kein Belegbild oder r2Key übergeben.", 400);
          }

          // Settings für AI & Erkennungsregeln laden
          let aiVisionModel = "@cf/meta/llama-3.2-11b-vision-instruct";
          let aiPdfModel = "@cf/meta/llama-3.1-8b-instruct";
          let aiAutoDetect = 1;
          let customRules: Array<{ keyword: string; category: string; taxRate?: number }> = [];
          let geminiApiKey = "";
          let geminiModel = "gemini-3.1-flash-lite-preview";
          let customPromptImage = "";
          let customPromptPdf = "";

          try {
            const dbSettings = await env.DB.prepare("SELECT ai_vision_model, ai_pdf_model, ai_auto_provider_detect, ai_custom_rules_json, gemini_api_key, gemini_model, ai_prompt_image, ai_prompt_pdf FROM app_settings WHERE id = 'global_config'").first<any>();
            if (dbSettings) {
              if (dbSettings.ai_vision_model) aiVisionModel = dbSettings.ai_vision_model;
              if (dbSettings.ai_pdf_model) aiPdfModel = dbSettings.ai_pdf_model;
              if (dbSettings.ai_auto_provider_detect !== undefined) aiAutoDetect = Number(dbSettings.ai_auto_provider_detect);
              if (dbSettings.gemini_api_key) geminiApiKey = dbSettings.gemini_api_key.trim();
              if (dbSettings.gemini_model) geminiModel = dbSettings.gemini_model.trim();
              if (dbSettings.ai_prompt_image) customPromptImage = dbSettings.ai_prompt_image.trim();
              if (dbSettings.ai_prompt_pdf) customPromptPdf = dbSettings.ai_prompt_pdf.trim();
              if (dbSettings.ai_custom_rules_json) {
                try {
                  customRules = JSON.parse(dbSettings.ai_custom_rules_json);
                } catch {}
              }
            }
          } catch {}

          if (!geminiApiKey && (body.geminiApiKey || body.gemini_api_key)) {
            geminiApiKey = String(body.geminiApiKey || body.gemini_api_key).trim();
          }

          if (!geminiApiKey && env.GEMINI_API_KEY) {
            geminiApiKey = env.GEMINI_API_KEY.trim();
          }

          if (body.preferredModel && !body.preferredModel.startsWith("@cf/")) {
            geminiModel = String(body.preferredModel).trim();
          }

          // Format-Erkennung: Ist es ein PDF? (Magic-Bytes %PDF -> 0x25, 0x50, 0x44, 0x46 mit Offset-Toleranz)
          let isPdf = false;
          let pdfOffset = -1;
          const searchLen = Math.min(imageBytes.length - 4, 1024);
          for (let i = 0; i <= searchLen; i++) {
            if (imageBytes[i] === 0x25 && imageBytes[i+1] === 0x50 && imageBytes[i+2] === 0x44 && imageBytes[i+3] === 0x46) {
              isPdf = true;
              pdfOffset = i;
              break;
            }
          }
          if (isPdf && pdfOffset > 0) {
            imageBytes = imageBytes.subarray(pdfOffset);
          } else if (!isPdf && (body.filename?.toLowerCase()?.endsWith(".pdf") || body.r2Key?.toLowerCase()?.endsWith(".pdf") || body.base64DataUri?.startsWith("data:application/pdf"))) {
            const deepSearch = Math.min(imageBytes.length - 4, 4096);
            for (let i = 0; i <= deepSearch; i++) {
              if (imageBytes[i] === 0x25 && imageBytes[i+1] === 0x50 && imageBytes[i+2] === 0x44 && imageBytes[i+3] === 0x46) {
                isPdf = true;
                imageBytes = imageBytes.subarray(i);
                break;
              }
            }
          }

          let extractedData: any = null;
          let debugModelUsed = "";
          let debugRawAiText = "";
          let pdfExtractedText = "";

          if (isPdf) {
            try {
              pdfExtractedText = await extractTextFromPdfBytes(imageBytes);
            } catch (pErr) {
              console.warn("PDF stream text extraction failed:", pErr);
            }
          }

          let customRuleInstructions = "";
          if (customRules.length > 0) {
            customRuleInstructions = "\nBenutzerdefinierte Prioritätszuordnungen:\n" +
              customRules.map(r => `- Wenn '${r.keyword}', ordne zwingend zu: categorySuggestion='${r.category}'`).join("\n");
          }

          // Standard-Prompts mit penibler Bewirtungs- (7%/19% Aufteilung) & Nahverkehrs-/Taxi-Präzision
          const defaultImagePrompt = `Du bist ein hochpräziser Beleg-Scanner für deutsche Reisekosten, Bewirtungen und Buchhaltung (GoBD/DATEV).
Analysiere diesen Beleg (Foto oder Scan). Achte penibel auf Handschriften, Stempel, Steuersätze und Summen.

Antworte AUSSCHLIESSLICH als valides JSON-Objekt mit exakt folgendem Schema ohne zusätzlichen Text:
{
  "docRole": "HospitalityInvoice | HotelInvoice | TrainTicket | FlightTicket | TaxiReceipt | ParkingTicket | FuelReceipt | PaymentSlip | OtherReceipt",
  "categorySuggestion": "HotelLogis | HotelBreakfast | TrainLongDistance | TransitLocal | Flight | TaxiLocal | TaxiLong | FuelPower | Parking | Hospitality | Other",
  "supplierName": "Name des Lokals, Hotels, Taxiunternehmens, Händlers",
  "locationAddress": "Straße Hausnummer, PLZ Ort (falls vorhanden)",
  "voucherDate": "YYYY-MM-DD",
  "amountGross": 0.00,
  "amountNet": 0.00,
  "taxRate": 19.0,
  "taxAmount": 0.00,
  "tax19Gross": 0.00,
  "tax7Gross": 0.00,
  "hotelLogisGross": 0.00,
  "hotelBreakfastGross": 0.00,
  "tipAmount": 0.00,
  "paymentMethod": "Card_NFC | Cash | Invoice | Other",
  "summary": "Prägnante Kurzbeschreibung (z. B. 'Geschäftsessen Restaurant XY' oder 'Taxifahrt München')",
  "currency": "EUR",
  "foreignAmountGross": 0.00,
  "exchangeRate": 1.0,
  "isForeign": false,
  "isHotel": false,
  "isTrain": false,
  "isFlight": false,
  "isTaxi": false,
  "isParking": false,
  "isFuel": false,
  "isPaymentSlip": false
}

KRITISCHE REGELN FÜR DIE GENAUE ERKENNUNG:
1. BEWIRTUNGSBELEG (Hospitality):
   - Häufig enthält eine Rechnung Speisen zu 7% USt (Mitnahme/Ermäßigt) UND Getränke zu 19% USt (oder Speisen & Getränke beide 19%).
   - Trenne bei Bewirtung IMMER:
     * tax7Gross = Bruttobetrag aller Positionen mit 7% USt
     * tax19Gross = Bruttobetrag aller Positionen mit 19% USt
     * amountGross = tax7Gross + tax19Gross
     * taxRate = wenn gemischt, den überwiegenden Satz (z.B. 19.0) oder 19.0
   - Suche nach Trinkgeld (handschriftlich oder separat): tipAmount.
   - docRole='HospitalityInvoice', categorySuggestion='Hospitality'.
2. TAXI (TaxiReceipt):
   - Taxifahrten im Nahverkehr (<50 km) unterliegen in Deutschland 7% USt (taxRate=7.0).
   - Handschriftliche Kürzungsstriche wie '15-' oder '15,00' bedeuten 15.00 EUR Brutto (amountGross=15.00, amountNet=14.02, taxAmount=0.98).
   - Handschrift wie '30,-' bedeutet 30.00 EUR Brutto (amountGross=30.00, amountNet=28.04, taxAmount=1.96).
   - docRole='TaxiReceipt', isTaxi=true, categorySuggestion='TaxiLocal'. Niemals als Hotel klassifizieren!
3. KARTENZAHLUNGSBELEG / TERMINALSLIP (PaymentSlip):
   - Reiner Girocard-/EC-Kundenbeleg (z.B. Samuel GmbH, 'Zahlung erfolgt', Terminal-ID, ohne Leistungsnachweis):
   - docRole='PaymentSlip', isPaymentSlip=true, categorySuggestion='Other', taxRate=0.0, taxAmount=0.0.
4. ÖPNV / BAHN / BUS (TransitLocal / TrainLongDistance):
   - Deutsche Bahn Nahverkehr = TransitLocal (7%). DB Fernverkehr (ICE/IC) = TrainLongDistance (7%).
   - Flughafenbusse (z.B. Kielius Autokraft) = TransitLocal (19% MwSt).
5. AUSLANDSBELEGE & FREMDWÄHRUNGEN:
   - Wenn der Beleg in einer Fremdwährung ausgestellt ist (z.B. CHF, USD, GBP, JPY, DKK, SEK), setze 'currency' (z.B. 'CHF'), 'foreignAmountGross' und 'isForeign'=true.
   - Für die deutsche Buchhaltung ist bei Auslandsbelegen kein inländischer Vorsteuerabzug möglich: taxRate=0.0, taxAmount=0.0.${customRuleInstructions}`;

          const defaultPdfPrompt = `Du bist ein hochpräziser Beleg-Scanner für die deutsche Buchhaltung (GoBD/DATEV) und Reisekostenabrechnung.
Analysiere diesen Beleg (PDF-Dokument oder Scan). Achte penibel auf Handschriften, Stempel, Aussteller, Rechnungsnummern, Reisedatum, Steuersätze und Summen.

Antworte AUSSCHLIESSLICH als valides JSON-Objekt ohne Erklärungen:
{
  "docRole": "HospitalityInvoice | HotelInvoice | TrainTicket | FlightTicket | TaxiReceipt | ParkingTicket | FuelReceipt | PaymentSlip | OtherReceipt",
  "categorySuggestion": "HotelLogis | HotelBreakfast | TrainLongDistance | TransitLocal | Flight | TaxiLocal | TaxiLong | FuelPower | Parking | Hospitality | Other",
  "supplierName": "Name des Lokals, Hotels, Beförderers oder Händlers",
  "locationAddress": "Straße Hausnummer, PLZ Ort",
  "voucherDate": "YYYY-MM-DD",
  "amountGross": 0.00,
  "amountNet": 0.00,
  "taxRate": 19.0,
  "taxAmount": 0.00,
  "tax19Gross": 0.00,
  "tax7Gross": 0.00,
  "hotelLogisGross": 0.00,
  "hotelBreakfastGross": 0.00,
  "tipAmount": 0.00,
  "paymentMethod": "Card_NFC | Invoice | Cash | Other",
  "summary": "Kurzbeschreibung der Leistung / Fahrtstrecke / Ticket",
  "currency": "EUR",
  "foreignAmountGross": 0.00,
  "exchangeRate": 1.0,
  "isForeign": false,
  "isHotel": false,
  "isTrain": false,
  "isFlight": false,
  "isTaxi": false,
  "isParking": false,
  "isFuel": false,
  "isPaymentSlip": false
}

WICHTIGE REGELN:
1. Bei Fahrkarten (z.B. Autokraft Kielius): Rechnungsnummer (z.B. 1000194060), Reisedatum oder Rechnungsdatum erfassen. docRole='TrainTicket', isTrain=true, categorySuggestion='TransitLocal', taxRate=19.0.
2. Bei Bewirtungsbelegen mit 7% und 19%: tax7Gross und tax19Gross separat ausweisen, amountGross = tax7Gross + tax19Gross.
3. Beträge penibel aus 'Gesamtrechnungsbetrag Brutto' oder 'Endbetrag' entnehmen.${customRuleInstructions}`;

          const activeImagePrompt = customPromptImage || defaultImagePrompt;
          const activePdfPrompt = customPromptPdf || defaultPdfPrompt;

          // =========================================================================
          // OPTION 1: GOOGLE GEMINI API (PRIMÄR, WENN API KEY VORHANDEN)
          // =========================================================================
          let geminiErrorDetails = "";
          if (geminiApiKey) {
            const requestedGeminiModel = body.preferredModel && !body.preferredModel.startsWith("@cf/") ? body.preferredModel : geminiModel;
            const geminiCandidates = [
              requestedGeminiModel,
              "gemini-3.1-flash-lite-preview",
              "gemini-flash-lite-latest",
              "gemini-2.5-flash",
              "gemini-1.5-flash"
            ].filter((m, i, arr) => m && arr.indexOf(m) === i);

            // Schnelle Base64 Payload für Bild oder PDF aufbereiten (chunked ohne Memory-Spikes)
            const b64Data = uint8ArrayToBase64(imageBytes);
            const mimeType = isPdf ? "application/pdf" : "image/jpeg";
            const promptToUse = isPdf ? activePdfPrompt : activeImagePrompt;

            const geminiPayload = JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptToUse },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: b64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.05
              }
            });

            for (const tryModel of geminiCandidates) {
              try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${geminiApiKey}`;

                // 12 Sekunden Timeout pro Modellversuch via AbortController gegen Hänger
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                let geminiRes = await fetch(geminiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: geminiPayload,
                  signal: controller.signal
                });
                clearTimeout(timeoutId);

                // Automatischer Retry bei 429 (Rate Limit) oder 503 (Overload) nach 1500ms Pause
                if (geminiRes.status === 429 || geminiRes.status === 503) {
                  console.warn(`Gemini model ${tryModel} returned status ${geminiRes.status}, trying next candidate...`);
                  continue;
                }

                if (geminiRes.ok) {
                  const gData = await geminiRes.json() as any;
                  const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  debugRawAiText = rawText;
                  debugModelUsed = `${tryModel} (Google Gemini API)`;

                  if (rawText && rawText.length > 5) {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      try {
                        extractedData = JSON.parse(jsonMatch[0]);
                        break; // Voller Erfolg mit Gemini!
                      } catch {}
                    }
                  }
                } else {
                  const errText = await geminiRes.text();
                  geminiErrorDetails = `Gemini API Status ${geminiRes.status}: ${errText.slice(0, 200)}`;
                  console.warn(`Gemini model ${tryModel} returned status ${geminiRes.status}:`, errText.slice(0, 150));
                }
              } catch (gErr: any) {
                geminiErrorDetails = `Gemini Exception: ${gErr?.message || gErr}`;
                console.warn(`Gemini model ${tryModel} failed/timeout:`, gErr?.message || gErr);
              }
            }
          }

          // =========================================================================
          // OPTION 2: CLOUDFLARE WORKERS AI (FALLBACK / KOSTENLOSES STANDARD-MODELL)
          // Nur wenn kein Gemini-Key vorhanden ist ODER Gemini komplett fehlschlug.
          // HINWEIS: LLaVA wurde entfernt, da es unzuverlässig ist und 0,00 € halluziniert.
          // =========================================================================
          if (!extractedData && env.AI) {
            // FALL A: PDF MIT TEXTSTROM -> TEXT-LLM (LLaMA 3.1 / 3.3)
            if (isPdf && pdfExtractedText && pdfExtractedText.trim().length > 20) {
              const textModels = [
                (body.preferredModel && body.preferredModel.startsWith("@cf/")) ? body.preferredModel : aiPdfModel,
                "@cf/meta/llama-3.1-8b-instruct",
                "@cf/meta/llama-3.3-70b-instruct"
              ].filter((m, i, arr) => arr.indexOf(m) === i);

              const textPrompt = `${activePdfPrompt}

Belegtext aus PDF:
"""
${pdfExtractedText.slice(0, 4000)}
"""`;

              for (const model of textModels) {
                try {
                  const aiResponse: any = await env.AI.run(model as any, {
                    prompt: textPrompt,
                    max_tokens: 600,
                    temperature: 0.0
                  });

                  let rawText = "";
                  if (typeof aiResponse === "string") rawText = aiResponse;
                  else if (aiResponse?.response) rawText = aiResponse.response;
                  else if (aiResponse?.result) rawText = aiResponse.result;
                  else rawText = JSON.stringify(aiResponse);

                  debugRawAiText = rawText;
                  debugModelUsed = model + " (Cloudflare Text-LLM)";

                  if (rawText && rawText.length > 5) {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      try {
                        extractedData = JSON.parse(jsonMatch[0]);
                        break;
                      } catch {}
                    }
                  }
                } catch (tErr: any) {
                  console.warn(`Text-LLM model ${model} failed:`, tErr?.message || tErr);
                }
              }
            }

            // FALL B: BILD-BELEG (ODER PDF OHNE TEXTSTROM) -> VISION-LLM
            if (!extractedData && !isPdf) {
              let visionModels = [
                (body.preferredModel && body.preferredModel.startsWith("@cf/")) ? body.preferredModel : aiVisionModel,
                "@cf/meta/llama-3.2-11b-vision-instruct",
                "@cf/moondream/moondream3.1-9b-a2b"
              ].filter((m, i, arr) => arr.indexOf(m) === i);

              const imageArray = Array.from(imageBytes);
              const base64DataUri = "data:image/jpeg;base64," + uint8ArrayToBase64(imageBytes);

              for (const model of visionModels) {
                try {
                  let aiResponse: any = null;

                  if (model.includes("llama")) {
                    aiResponse = await env.AI.run(model as any, {
                      image: imageArray,
                      prompt: activeImagePrompt,
                      max_tokens: 512,
                      temperature: 0.0
                    });
                  } else if (model.includes("moondream")) {
                    try {
                      aiResponse = await env.AI.run(model as any, { prompt: activeImagePrompt, image: imageArray });
                    } catch {
                      try {
                        aiResponse = await env.AI.run(model as any, { question: activeImagePrompt, image: imageArray });
                      } catch {
                        aiResponse = await env.AI.run(model as any, { task: "query", question: activeImagePrompt, image: base64DataUri });
                      }
                    }
                  } else {
                    aiResponse = await env.AI.run(model as any, { image: imageArray, prompt: activeImagePrompt, max_tokens: 512 });
                  }

                  let rawText = "";
                  if (typeof aiResponse === "string") rawText = aiResponse;
                  else if (aiResponse?.result || aiResponse?.answer) rawText = aiResponse.result || aiResponse.answer;
                  else if (aiResponse?.response) rawText = aiResponse.response;
                  else if (aiResponse?.description) rawText = aiResponse.description;
                  else rawText = JSON.stringify(aiResponse);

                  debugRawAiText = rawText;
                  debugModelUsed = model + " (Cloudflare Workers AI)";

                  if (rawText && rawText.length > 5) {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      try {
                        extractedData = JSON.parse(jsonMatch[0]);
                        break;
                      } catch {}
                    }
                  }
                } catch (modelErr: any) {
                  console.warn(`Vision model ${model} failed, trying next:`, modelErr?.message || modelErr);
                }
              }
            }
          }

          // Heuristische Extraktion als Fallback für PDFs, falls LLM ausfiel oder kein AI-Binding existiert
          if (!extractedData && isPdf && pdfExtractedText && pdfExtractedText.trim().length > 20) {
            const cleanText = pdfExtractedText.replace(/\\([()])/g, "$1").replace(/\\/g, " ");
            let fDate = "";
            const dateMatch = cleanText.match(/(?:rechnungsdatum|datum|reisedatum|bestelldatum)?[:\s]*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
            if (dateMatch) {
              fDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
            }

            let fGross = 0;
            let fNet = 0;
            let fTaxRate = 19.0;
            let fTaxAmount = 0;

            const grossMatch = cleanText.match(/(?:gesamtrechnungsbetrag\s*brutto|gesamtbetrag\s*brutto|gesamtbetrag|bruttobetrag|brutto|rechnungsbetrag|endbetrag|zu\s*zahlen|gesamtpreis|gesamt)[:\s]*([\d]{1,5}[.,]\d{2})/i);
            if (grossMatch) fGross = parseFloat(grossMatch[1].replace(",", "."));

            const netMatch = cleanText.match(/(?:gesamtrechnungsbetrag\s*netto|gesamtbetrag\s*netto|nettobetrag|netto)[:\s]*([\d]{1,5}[.,]\d{2})/i);
            if (netMatch) fNet = parseFloat(netMatch[1].replace(",", "."));

            const taxRateMatch = cleanText.match(/(?:ust|mwst)[.\s(]*(\d{1,2})[%\s)]*/i);
            if (taxRateMatch) fTaxRate = parseFloat(taxRateMatch[1]);

            const taxAmtMatch = cleanText.match(/(?:ust|mwst)[^:]*?[:\s]+([\d]{1,5}[.,]\d{2})\s*€?/i);
            if (taxAmtMatch) fTaxAmount = parseFloat(taxAmtMatch[1].replace(",", "."));

            if (fGross === 0 && fNet > 0 && fTaxAmount > 0) {
              fGross = +(fNet + fTaxAmount).toFixed(2);
            } else if (fGross > 0 && fNet === 0 && fTaxRate > 0) {
              fNet = +(fGross / (1 + fTaxRate / 100)).toFixed(2);
            } else if (fGross > 0 && fNet > 0 && fGross > fNet && fTaxAmount === 0) {
              fTaxAmount = +(fGross - fNet).toFixed(2);
            }

            extractedData = {
              docRole: "TrainTicket",
              categorySuggestion: "TransitLocal",
              supplierName: "",
              locationAddress: "",
              voucherDate: fDate,
              amountGross: fGross,
              amountNet: fNet,
              taxRate: fTaxRate,
              taxAmount: fTaxAmount,
              summary: "",
              isTrain: true
            };
            debugModelUsed = "Regex Stream Fallback (PDF)";
          }

          // Klassifizierung, DACH-Erkennungsliste & Benutzer-Ausnahmeregeln anwenden
          if (extractedData && typeof extractedData === "object") {
            // WICHTIG: combinedText darf NIEMALS debugRawAiText enthalten, da der JSON-Prompt Schlüsselwörter wie "isHotel" enthält!
            const combinedText = (
              (pdfExtractedText || "") + " " +
              (extractedData.supplierName || "") + " " +
              (extractedData.summary || "") + " " +
              (extractedData.locationAddress || "")
            ).toLowerCase();
            const suppLower = (extractedData.supplierName || "").toLowerCase();

            const isGeminiModel = typeof debugModelUsed === "string" && debugModelUsed.includes("Google Gemini API");

            // 1. Benutzerdefinierte Regeln vorrangig prüfen
            let customRuleMatched = false;
            if (customRules.length > 0) {
              for (const cr of customRules) {
                if (cr.keyword && combinedText.includes(cr.keyword.toLowerCase().trim())) {
                  extractedData.categorySuggestion = cr.category;
                  if (cr.taxRate !== undefined && cr.taxRate !== null) {
                    extractedData.taxRate = Number(cr.taxRate);
                  }
                  if (cr.category === "TrainLongDistance" || cr.category === "TransitLocal") {
                    extractedData.docRole = "TrainTicket";
                    extractedData.isTrain = true;
                  } else if (cr.category === "HotelLogis" || cr.category === "HotelBreakfast") {
                    extractedData.docRole = "HotelInvoice";
                    extractedData.isHotel = true;
                  } else if (cr.category === "TaxiLocal" || cr.category === "TaxiLong") {
                    extractedData.docRole = "TaxiReceipt";
                    extractedData.isTaxi = true;
                  } else if (cr.category === "Flight") {
                    extractedData.docRole = "FlightTicket";
                    extractedData.isFlight = true;
                  } else if (cr.category === "Parking") {
                    extractedData.docRole = "ParkingTicket";
                    extractedData.isParking = true;
                  } else if (cr.category === "FuelPower") {
                    extractedData.docRole = "FuelReceipt";
                    extractedData.isFuel = true;
                  } else if (cr.category === "Hospitality") {
                    extractedData.docRole = "HospitalityInvoice";
                  }
                  customRuleMatched = true;
                  break;
                }
              }
            }

            // 1b. Höchste Priorität für reine Kartenzahlungsbelege / PaymentSlips (Girocard, Terminalbeleg)
            // Gilt IMMER, auch wenn ein Modell fälschlicherweise Hotel vermutet hat!
            const isStrictPaymentSlip = !customRuleMatched && (
              extractedData.isPaymentSlip === true ||
              extractedData.docRole === "PaymentSlip" ||
              extractedData.categorySuggestion === "PaymentSlip" ||
              extractedData.categorySuggestion === "OtherExpense" ||
              combinedText.includes("kundenbeleg") ||
              combinedText.includes("kartenzahlung") ||
              combinedText.includes("terminalbeleg") ||
              combinedText.includes("ec-beleg") ||
              combinedText.includes("girocard") ||
              combinedText.includes("electronic cash") ||
              combinedText.includes("terminal-id") ||
              combinedText.includes("trace-nr") ||
              combinedText.includes("genehmigungs-nr") ||
              suppLower.includes("kundenbeleg")
            ) && !combinedText.includes("taxifahrt") && !combinedText.includes("flug");

            if (isStrictPaymentSlip) {
              extractedData.docRole = "PaymentSlip";
              extractedData.isPaymentSlip = true;
              extractedData.isHotel = false;
              extractedData.isTaxi = false;
              extractedData.isTrain = false;
              extractedData.isFlight = false;
              extractedData.isParking = false;
              extractedData.isFuel = false;
              extractedData.categorySuggestion = "Other";
              extractedData.taxRate = 0.0;
              extractedData.taxAmount = 0.0;
              extractedData.tax7Gross = 0.0;
              extractedData.tax19Gross = 0.0;
              if (extractedData.amountGross > 0) {
                extractedData.amountNet = extractedData.amountGross;
              }
              customRuleMatched = true;
            }

            // 2. Deutschlandweite DACH-Verkehrs- und Mobilitätserkennung (wenn aktiv, aber nicht Gemini überschreiben)
            if (!customRuleMatched && aiAutoDetect && !isGeminiModel) {
              const isDachTransit = combinedText.includes("autokraft") ||
                combinedText.includes("kielius") ||
                combinedText.includes("bvg") ||
                combinedText.includes("hvv") ||
                combinedText.includes("vbb") ||
                combinedText.includes("mvv") ||
                combinedText.includes("rmv") ||
                combinedText.includes("vrr") ||
                combinedText.includes("vvs") ||
                combinedText.includes("kvv") ||
                combinedText.includes("nah.sh") ||
                combinedText.includes("nahverkehr") ||
                combinedText.includes("öpnv") ||
                combinedText.includes("flughafenbus") ||
                combinedText.includes("fernbus") ||
                combinedText.includes("flixbus") ||
                combinedText.includes("fahrschein") ||
                combinedText.includes("einzelkarte") ||
                combinedText.includes("tageskarte");

              const isDachTrain = combinedText.includes("bahn") ||
                combinedText.includes("deutsche bahn") ||
                combinedText.includes("db fernverkehr") ||
                combinedText.includes("db vertrieb") ||
                combinedText.includes("zugticket") ||
                combinedText.includes("fahrkarte") ||
                combinedText.includes("ice ") ||
                combinedText.includes("ic/ec") ||
                suppLower.includes("deutsche bahn") ||
                suppLower.includes("db fernverkehr");

              if (isDachTransit) {
                extractedData.docRole = "TrainTicket";
                extractedData.isTrain = true;
                extractedData.categorySuggestion = "TransitLocal";
                if (!extractedData.supplierName) {
                  if (combinedText.includes("autokraft")) extractedData.supplierName = "Autokraft GmbH";
                  else if (combinedText.includes("bvg")) extractedData.supplierName = "Berliner Verkehrsbetriebe (BVG)";
                  else if (combinedText.includes("hvv")) extractedData.supplierName = "Hamburger Verkehrsverbund (HVV)";
                  else if (combinedText.includes("nah.sh")) extractedData.supplierName = "NAH.SH GmbH";
                }
                if (combinedText.includes("kielius") && !extractedData.summary) {
                  extractedData.summary = "Kielius Flughafentransfer / Bus";
                }
                customRuleMatched = true;
              } else if (isDachTrain) {
                extractedData.docRole = "TrainTicket";
                extractedData.isTrain = true;
                extractedData.categorySuggestion = "TrainLongDistance";
                if (!extractedData.supplierName) extractedData.supplierName = "Deutsche Bahn AG";
                if (!extractedData.taxRate) extractedData.taxRate = 7.0;
                customRuleMatched = true;
              }
            }

            // 3. Allgemeine Heuristik (Hotel, Taxi, Flug, Tanken, Parken, Bewirtung, Zahlbeleg)
            // Nur anwenden, wenn kein Custom Rule griff und Gemini nicht bereits eine valide Kategorie ermittelt hat
            if (!customRuleMatched && !isGeminiModel) {
              const isRestaurantDoc = (
                combinedText.includes("restaurant") ||
                combinedText.includes("buffet") ||
                combinedText.includes("gaststätte") ||
                suppLower.includes("restaurant") ||
                extractedData.docRole === "HospitalityInvoice"
              ) && extractedData.docRole !== "PaymentSlip";
              const isTaxiDetected = !isRestaurantDoc && (
                combinedText.includes("taxifahrt") ||
                combinedText.includes("taxi ") ||
                combinedText.includes("taxi-") ||
                combinedText.includes("taxen ") ||
                combinedText.includes("fahrauftrag") ||
                combinedText.includes("stadtfahrt") ||
                suppLower.includes("taxi") ||
                extractedData.docRole === "TaxiReceipt" ||
                extractedData.isTaxi === true ||
                extractedData.categorySuggestion === "TaxiLocal" ||
                extractedData.categorySuggestion === "TaxiLong"
              );
              const isHotelDetected = !isTaxiDetected && !isRestaurantDoc && (
                combinedText.includes("hotel") ||
                combinedText.includes("übernachtung") ||
                combinedText.includes("logis") ||
                combinedText.includes("zimmer") ||
                combinedText.includes("lodging") ||
                suppLower.includes("hotel") ||
                suppLower.includes("motel") ||
                suppLower.includes("inn") ||
                suppLower.includes("resort") ||
                extractedData.docRole === "HotelInvoice" ||
                extractedData.isHotel === true ||
                extractedData.categorySuggestion === "HotelLogis" ||
                extractedData.categorySuggestion === "HotelBreakfast"
              );
              const isFlightDetected = !isTaxiDetected && (
                combinedText.includes("flug") ||
                combinedText.includes("flight") ||
                combinedText.includes("boarding") ||
                combinedText.includes("airline") ||
                combinedText.includes("lufthansa") ||
                combinedText.includes("eurowings") ||
                suppLower.includes("airline") ||
                suppLower.includes("lufthansa") ||
                extractedData.docRole === "FlightTicket" ||
                extractedData.isFlight === true
              );
              const isParkingDetected = !isTaxiDetected && (
                combinedText.includes("parkhaus") ||
                combinedText.includes("parkplatz") ||
                combinedText.includes("parkschein") ||
                combinedText.includes("apcoa") ||
                combinedText.includes("contipark") ||
                suppLower.includes("park") ||
                extractedData.docRole === "ParkingTicket" ||
                extractedData.isParking === true
              );
              const isFuelDetected = !isTaxiDetected && (
                combinedText.includes("tankstelle") ||
                combinedText.includes("kraftstoff") ||
                combinedText.includes("diesel") ||
                combinedText.includes("super e10") ||
                combinedText.includes("aral") ||
                combinedText.includes("shell") ||
                combinedText.includes("total") ||
                suppLower.includes("aral") ||
                suppLower.includes("shell") ||
                suppLower.includes("total") ||
                extractedData.docRole === "FuelReceipt" ||
                extractedData.isFuel === true
              );
              const isPaymentSlipDetected = !isRestaurantDoc && !isHotelDetected && !isFlightDetected && !isParkingDetected && !isTaxiDetected && (
                combinedText.includes("kundenbeleg") ||
                combinedText.includes("kartenzahlung") ||
                combinedText.includes("contactless") ||
                combinedText.includes("girocard") ||
                combinedText.includes("terminal-id") ||
                combinedText.includes("trace-nr") ||
                combinedText.includes("genehmigungs-nr") ||
                combinedText.includes("terminalbeleg") ||
                suppLower.includes("kundenbeleg")
              );

              if (isPaymentSlipDetected) {
                extractedData.docRole = "PaymentSlip";
                extractedData.isPaymentSlip = true;
                extractedData.isTaxi = false;
                extractedData.categorySuggestion = "Other";
              } else if (isTaxiDetected) {
                extractedData.docRole = "TaxiReceipt";
                extractedData.isTaxi = true;
                extractedData.isPaymentSlip = false;
                extractedData.isHotel = false;
                extractedData.categorySuggestion = (extractedData.taxRate === 19 || (extractedData.amountGross && extractedData.amountGross > 80)) ? "TaxiLong" : "TaxiLocal";
                if (!extractedData.taxRate) extractedData.taxRate = 7.0;
              } else if (isHotelDetected) {
                extractedData.docRole = "HotelInvoice";
                extractedData.isHotel = true;
                extractedData.isPaymentSlip = false;
                extractedData.isTaxi = false;
                extractedData.categorySuggestion = "HotelLogis";
                if (!extractedData.taxRate || extractedData.taxRate === 19) extractedData.taxRate = 7.0;
              } else if (isFlightDetected) {
                extractedData.docRole = "FlightTicket";
                extractedData.isFlight = true;
                extractedData.categorySuggestion = "Flight";
                if (!extractedData.taxRate) extractedData.taxRate = 19.0;
              } else if (isParkingDetected) {
                extractedData.docRole = "ParkingTicket";
                extractedData.isParking = true;
                extractedData.categorySuggestion = "Parking";
                if (!extractedData.taxRate) extractedData.taxRate = 19.0;
              } else if (isFuelDetected) {
                extractedData.docRole = "FuelReceipt";
                extractedData.isFuel = true;
                extractedData.categorySuggestion = "FuelPower";
                if (!extractedData.taxRate) extractedData.taxRate = 19.0;
              } else if (isRestaurantDoc) {
                extractedData.docRole = "HospitalityInvoice";
                extractedData.categorySuggestion = "Hospitality";
                extractedData.isPaymentSlip = false;
                extractedData.isTaxi = false;
              } else {
                if (!extractedData.categorySuggestion) extractedData.categorySuggestion = "Other";
              }
            }
          }

          // Sanitize numerical fields
          if (extractedData) {
            if (typeof extractedData.amountGross === "string") extractedData.amountGross = parseFloat(extractedData.amountGross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.amountNet === "string") extractedData.amountNet = parseFloat(extractedData.amountNet.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.taxRate === "string") extractedData.taxRate = parseFloat(extractedData.taxRate.replace(",", ".").replace(/[^0-9.]/g, "")) || 19;
            if (typeof extractedData.tipAmount === "string") extractedData.tipAmount = parseFloat(extractedData.tipAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.taxAmount === "string") extractedData.taxAmount = parseFloat(extractedData.taxAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.tax7Gross === "string") extractedData.tax7Gross = parseFloat(extractedData.tax7Gross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.tax19Gross === "string") extractedData.tax19Gross = parseFloat(extractedData.tax19Gross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;

            // Plausibilisierung für Bewirtungsbeleg mit getrennten Steuersätzen
            if ((extractedData.tax7Gross > 0 || extractedData.tax19Gross > 0) && (!extractedData.amountGross || extractedData.amountGross === 0)) {
              extractedData.amountGross = +( (extractedData.tax7Gross || 0) + (extractedData.tax19Gross || 0) ).toFixed(2);
            }
          }

          if (!extractedData) {
            return jsonResponse({
              success: false,
              error: "KI-Modell konnte Belegdaten nicht automatisch extrahieren (z. B. unleserlich oder ununterstütztes Rohformat). Bitte manuell erfassen.",
              extracted: null,
              modelUsed: debugModelUsed,
              rawAiText: debugRawAiText,
              geminiError: geminiErrorDetails || undefined
            });
          }

          return jsonResponse({
            success: true,
            extracted: extractedData,
            modelUsed: debugModelUsed,
            rawAiText: debugRawAiText,
            geminiError: geminiErrorDetails || undefined
          });
        } catch (err: any) {
          return errorResponse(`Fehler bei der Beleg-Analyse: ${err?.message || err}`, 500);
        }
}
