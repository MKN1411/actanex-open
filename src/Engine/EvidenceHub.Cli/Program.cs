using System.Text.Json;
using EvidenceHub.Domain.Enums;
using EvidenceHub.Domain.Interfaces;
using EvidenceHub.Domain.Models;
using EvidenceHub.Infrastructure.Services;

namespace EvidenceHub.Cli;

public class Program
{
    public static async Task<int> Main(string[] args)
    {
        Console.WriteLine("==========================================================");
        Console.WriteLine("   FREELANCER EVIDENCE & BILLING HUB - ENGINE RUNNER      ");
        Console.WriteLine("   GoBD-konforme PDF- & Excel-Engine & Lexware Client     ");
        Console.WriteLine("==========================================================");

        var hasher = new Sha256Hasher();
        var pdfRenderer = new QuestPdfTimesheetRenderer();
        var xlsxExporter = new ClosedXmlTimesheetExporter();

        var cfAccountId = Environment.GetEnvironmentVariable("CF_ACCOUNT_ID") ?? Environment.GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID");
        var r2KeyId = Environment.GetEnvironmentVariable("CF_R2_ACCESS_KEY_ID");
        var r2Secret = Environment.GetEnvironmentVariable("CF_R2_SECRET_ACCESS_KEY");
        var r2Bucket = Environment.GetEnvironmentVariable("CF_R2_BUCKET_NAME") ?? "evidence-hub-storage";

        IStorageService storage;
        if (!string.IsNullOrWhiteSpace(cfAccountId) && !string.IsNullOrWhiteSpace(r2KeyId) && !string.IsNullOrWhiteSpace(r2Secret))
        {
            Console.WriteLine($"[STORAGE] Verwende Cloudflare R2 Bucket: {r2Bucket} (Account: {cfAccountId[..6]}...)");
            storage = new R2StorageService(cfAccountId, r2KeyId, r2Secret, r2Bucket);
        }
        else
        {
            Console.WriteLine("[STORAGE] Keine R2-Credentials gefunden. Verwende lokales Dateisystem (./output).");
            storage = new LocalStorageService(Path.Combine(Directory.GetCurrentDirectory(), "output"));
        }

        var command = args.Length > 0 ? args[0].ToLowerInvariant() : "--demo";

        switch (command)
        {
            case "--demo":
            case "demo":
                Console.WriteLine("\n[INFO] Starte Demo-Lauf zur Generierung & Upload von GoBD-Musterdokumenten...");
                return await RunDemoAsync(hasher, pdfRenderer, xlsxExporter, storage);

            case "test-r2":
                Console.WriteLine("\n[INFO] Teste Verbindung zu Cloudflare R2...");
                return await TestR2Async(storage, hasher);

            case "test-lexware":
            case "ping-lexware":
                var apiKey = Environment.GetEnvironmentVariable("LEXWARE_API_KEY") ?? (args.Length > 1 ? args[1] : "");
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ERROR] Kein LEXWARE_API_KEY angegeben.");
                    Console.ResetColor();
                    return 1;
                }
                var client = new LexwareApiClient(new HttpClient(), apiKey);
                return await TestLexwarePermissionsAsync(client);

            case "delete-test-invoices":
            case "delete-invoices":
                var delApiKey = Environment.GetEnvironmentVariable("LEXWARE_API_KEY") ?? "";
                if (string.IsNullOrWhiteSpace(delApiKey))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ERROR] Kein LEXWARE_API_KEY angegeben.");
                    Console.ResetColor();
                    return 1;
                }
                var delClient = new LexwareApiClient(new HttpClient(), delApiKey);
                var idsToDelete = args.Length > 1 
                    ? args.Skip(1).ToArray() 
                    : new[] { "666e90c7-bef0-48da-bd52-5e382988b6af", "2c4f0272-af4e-464f-9979-a47fcc0bb4fa" };
                return await DeleteTestInvoicesAsync(delClient, idsToDelete);

            case "create-invoice":
            case "seed-lexware-testdata":
                var seedApiKey = Environment.GetEnvironmentVariable("LEXWARE_API_KEY") ?? (args.Length > 1 ? args[1] : "");
                if (string.IsNullOrWhiteSpace(seedApiKey))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ERROR] Kein LEXWARE_API_KEY angegeben.");
                    Console.ResetColor();
                    return 1;
                }
                var seedClient = new LexwareApiClient(new HttpClient(), seedApiKey);
                return await CreateFreshInvoiceDraftAsync(seedClient, hasher);

            case "generate-timesheet":
                var inputFile = args.Length > 1 ? args[1] : "timesheet_input.json";
                return await RunGenerateTimesheetAsync(inputFile, hasher, pdfRenderer, xlsxExporter, storage);

            default:
                Console.WriteLine($"[WARNUNG] Unbekannter Befehl: {command}");
                Console.WriteLine("Verfügbare Befehle: demo, test-r2, test-lexware, create-invoice, delete-test-invoices, generate-timesheet <json-file>");
                return 1;
        }
    }

    private static async Task<int> DeleteTestInvoicesAsync(LexwareApiClient client, string[] invoiceIds)
    {
        Console.WriteLine("\n[INFO] Starte Löschung / Stornierung der Test-Rechnungsentwürfe in Lexware Office XL...");
        var allOk = true;

        foreach (var id in invoiceIds)
        {
            Console.WriteLine($"\n-> Lösche Rechnungsentwurf ID: {id}...");
            var (success, statusCode, body) = await client.DeleteInvoiceDraftAsync(id);
            if (success || statusCode == 204 || statusCode == 200)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"[✓] Rechnungsentwurf {id} erfolgreich aus Lexware gelöscht! (HTTP {statusCode})");
                Console.ResetColor();
            }
            else if (statusCode == 404)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"[!] Rechnung {id} existiert bereits nicht mehr (bereits gelöscht oder andere ID).");
                Console.ResetColor();
            }
            else
            {
                allOk = false;
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[✗] Fehler beim Löschen von {id}: HTTP {statusCode} - {body}");
                Console.ResetColor();
            }
        }

        Console.WriteLine("\n==========================================================");
        Console.WriteLine("   STORNIERUNG / LÖSCHUNG DER TESTRECHNUNGEN BEENDET      ");
        Console.WriteLine("==========================================================");
        return allOk ? 0 : 1;
    }

    private static async Task<int> CreateFreshInvoiceDraftAsync(LexwareApiClient client, Sha256Hasher hasher)
    {
        Console.WriteLine("\n[INFO] Erstelle neue GoBD-konforme Testrechnung (Entwurf) in Lexware Office XL...");

        try
        {
            Console.WriteLine("\n[1/2] Suche Kundenkontakt in Lexware...");
            var contacts = await client.GetContactsAsync();
            var customer = contacts.FirstOrDefault(c => c.CompanyName.Contains("Contoso", StringComparison.OrdinalIgnoreCase));
            
            string contactId;
            if (customer != null)
            {
                contactId = customer.Id;
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"[✓] Vorhandenen Testkunden gefunden: {customer.CompanyName} (ID: {contactId})");
                Console.ResetColor();
            }
            else
            {
                Console.WriteLine("Lege neuen Kundenkontakt 'Contoso Cloud Architecture Test GmbH' an...");
                contactId = await client.CreateCustomerContactAsync(
                    "Contoso Cloud Architecture Test GmbH",
                    "Dr. Markus",
                    "Weber",
                    "m.weber@contoso-cloud-test.de",
                    "Speicherstraße 12",
                    "20095",
                    "Hamburg"
                );
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"[✓] Neuer Kunde angelegt! ID: {contactId}");
                Console.ResetColor();
            }

            Console.WriteLine("\n[2/2] Erstelle Rechnungsentwurf (finalize=false) mit detaillierten Nachweisdaten...");
            var currentBatchId = $"batch_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
            var idempotencyKey = hasher.ComputeIdempotencyKey("prj_m365_security", "2026-08", 1, currentBatchId);

            var invoiceRequest = new LexwareInvoiceRequest(
                idempotencyKey,
                contactId,
                "IT-ARCH",
                "IT-Architektur- und technische Beratungsleistungen – M365 & Zero Trust Security",
                "• Konzeption der Enterprise Data Loss Prevention (DLP) Architektur\n• Technischer Review der Purview Sensitivity Labels & Rollout-Konzept\n• Abstimmung des Sicherheitszielbildes gem. beiliegendem Leistungsnachweis.\n\nLeistungszeitraum: 01.08.2026 – 31.08.2026\nKryptografischer Nachweis-Hash (SHA-256): 9f8a7c6e5d4b3a210fedcba9876543210123456789abcdef\nVerifizierungs-Methode: Cloudflare Zero Trust E-Mail-OTP",
                42.50m,
                135.00m,
                new DateOnly(2026, 8, 1),
                new DateOnly(2026, 8, 31),
                78.50m
            );

            var invoiceResult = await client.CreateInvoiceDraftAsync(invoiceRequest);

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\n==========================================================");
            Console.WriteLine("   NEUE LEXWARE TESTRECHNUNG ERFOLGREICH ANGELEGT!        ");
            Console.WriteLine("==========================================================");
            Console.WriteLine($"-> Rechnungs-ID:     {invoiceResult.InvoiceId}");
            Console.WriteLine($"-> Netto-Gesamt:     {invoiceResult.TotalNetAmount:N2} EUR");
            Console.WriteLine($"-> USt (19 %):       {(invoiceResult.TotalGrossAmount - invoiceResult.TotalNetAmount):N2} EUR");
            Console.WriteLine($"-> Brutto-Gesamt:    {invoiceResult.TotalGrossAmount:N2} EUR");
            Console.WriteLine($"-> Status:           DRAFT (Entwurf - bereit zur E-Rechnung)");
            Console.WriteLine($"-> Direkt-Link:      https://app.lexware.de/voucher/#/{invoiceResult.InvoiceId}");
            Console.WriteLine("==========================================================");
            Console.ResetColor();

            return 0;
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"\n[ERROR] Fehler beim Erstellen der Testrechnung: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"[DETAILS] {ex.InnerException.Message}");
            Console.ResetColor();
            return 1;
        }
    }

    private static async Task<int> TestLexwarePermissionsAsync(LexwareApiClient client)
    {
        Console.WriteLine("\n[INFO] Prüfe Lexware Office XL API-Berechtigungen...");
        var report = await client.RunPermissionCheckAsync();
        return 0;
    }

    private static async Task<int> TestR2Async(IStorageService storage, Sha256Hasher hasher)
    {
        return 0;
    }

    private static async Task<int> RunDemoAsync(
        Sha256Hasher hasher,
        QuestPdfTimesheetRenderer pdfRenderer,
        ClosedXmlTimesheetExporter xlsxExporter,
        IStorageService storage)
    {
        return 0;
    }

    private static async Task<int> RunGenerateTimesheetAsync(
        string jsonPath,
        Sha256Hasher hasher,
        QuestPdfTimesheetRenderer pdfRenderer,
        ClosedXmlTimesheetExporter xlsxExporter,
        IStorageService storage)
    {
        return 0;
    }
}
