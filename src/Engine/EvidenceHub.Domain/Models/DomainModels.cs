using EvidenceHub.Domain.Enums;

namespace EvidenceHub.Domain.Models;

/// <summary>
/// Kunde / Auftraggeber (referenziert führend den Lexware-Kontakt).
/// </summary>
public class Customer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Eindeutige Kontakt-ID in Lexware Office XL.
    /// </summary>
    public string LexwareContactId { get; set; } = string.Empty;

    /// <summary>
    /// Vollständiger Firmenname / Kundenname.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Street { get; set; }
    public string? ZipCode { get; set; }
    public string? City { get; set; }
    public string CountryCode { get; set; } = "DE";
    public string? VatId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

/// <summary>
/// Projektcontainer mit vertraglichen Abrechnungs- und Reiseregeln.
/// </summary>
public class Project
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CustomerId { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PurchaseOrderNumber { get; set; } // PO-Nummer
    public string? ContractNumber { get; set; }

    /// <summary>
    /// Standard-Stundensatz in EUR (Netto).
    /// </summary>
    public decimal DefaultHourlyRate { get; set; } = 120.00m;

    /// <summary>
    /// Lexware Serviceartikel-ID (z. B. für "IT-Architektur- und Beratungsleistung").
    /// </summary>
    public string LexwareServiceArticleId { get; set; } = string.Empty;

    /// <summary>
    /// Abrechnungstakt in Minuten (z. B. 15 Minuten = 0.25h).
    /// </summary>
    public int BillingIntervalMinutes { get; set; } = 15;

    /// <summary>
    /// Projektlaufzeit Beginn.
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Projektlaufzeit Ende.
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Vereinbartes Gesamtbudget in EUR Netto.
    /// </summary>
    public decimal? TotalBudgetNet { get; set; }

    /// <summary>
    /// E-Mail-Adresse des zur Freigabe berechtigten Projektowners beim Kunden.
    /// </summary>
    public string ApproverEmail { get; set; } = string.Empty;
    public string? ApproverName { get; set; }

    /// <summary>
    /// Ob Reisezeiten laut Vertrag abrechenbar sind (true/false).
    /// </summary>
    public bool TravelTimeBillable { get; set; } = false;

    /// <summary>
    /// Reisezeit-Vergütungssatz (z. B. 0.5 = 50% des Stundensatzes oder 1.0 = 100%).
    /// </summary>
    public decimal TravelTimeRateMultiplier { get; set; } = 1.0m;

    /// <summary>
    /// Ob ÖPNV-Tickets (2. Klasse / DB) laut Vertrag 1:1 erstattungsfähig sind.
    /// </summary>
    public bool PublicTransitReimbursable { get; set; } = true;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Zeiteintrag mit getrennter Ist- und Abrechnungsdauer sowie optionalem Evidence-Nachweis.
/// </summary>
public class TimeEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int BreakMinutes { get; set; } = 0;

    /// <summary>
    /// Einsatzort: Remote (Standard) vs. Vor Ort.
    /// </summary>
    public LocationType Location { get; set; } = LocationType.Remote;

    /// <summary>
    /// Tatsächlich geleistete Arbeitszeit in Stunden (dezimal).
    /// </summary>
    public decimal ActualDurationHours => CalculateActualHours();

    /// <summary>
    /// Vertraglich abrechenbare Arbeitszeit in Stunden (nach Rundungstakt).
    /// </summary>
    public decimal BillableDurationHours { get; set; }

    public ActivityCategory Category { get; set; } = ActivityCategory.Architecture;

    /// <summary>
    /// Kundentaugliche Kurzbeschreibung (erscheint auf Rechnung/Übersicht).
    /// </summary>
    public string ShortDescription { get; set; } = string.Empty;

    public string? TaskOrTicketReference { get; set; }
    public bool IsBillable { get; set; } = true;
    public decimal BillingRateSnapshot { get; set; }

    /// <summary>
    /// Strukturierte Nachweisfelder für GoBD- und § 18 EStG-Beweiskette.
    /// </summary>
    public ActivityEvidence? Evidence { get; set; }

    public string? TimesheetVersionId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    private decimal CalculateActualHours()
    {
        var totalMinutes = (EndTime - StartTime).TotalMinutes - BreakMinutes;
        if (totalMinutes < 0) totalMinutes = 0;
        return Math.Round((decimal)(totalMinutes / 60.0), 2, MidpointRounding.AwayFromZero);
    }
}

/// <summary>
/// Detaillierter fachlicher Tätigkeitsnachweis (§ 18 EStG / freiberufliche Abgrenzung).
/// </summary>
public class ActivityEvidence
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TimeEntryId { get; set; } = string.Empty;

    /// <summary>
    /// Problemstellung / Ausgangslage beim Kunden.
    /// </summary>
    public string ProblemStatement { get; set; } = string.Empty;

    /// <summary>
    /// Angewandte Methodik (z. B. Ist-Analyse, Variantenprüfung, Architekturmodellierung).
    /// </summary>
    public string Methodology { get; set; } = string.Empty;

    /// <summary>
    /// Konkrete technische Leistung (z. B. Konzeption des Policy-Scopes, Schnittstellendesign).
    /// </summary>
    public string TechnicalActivity { get; set; } = string.Empty;

    /// <summary>
    /// Technisches Arbeitsergebnis (z. B. Zielbild, Blueprint, Spezifikation).
    /// </summary>
    public string Result { get; set; } = string.Empty;

    /// <summary>
    /// Eigenverantwortlicher Anteil (z. B. Gesamtverantwortung Lösungsarchitektur).
    /// </summary>
    public string Responsibility { get; set; } = "Eigenverantwortliche Konzeption & Durchführung";

    /// <summary>
    /// Erzeugtes Artefakt / Dokument (z. B. Solution Design v1.2, ADR-005).
    /// </summary>
    public string? Deliverable { get; set; }
}

/// <summary>
/// Zusammenhängende Tür-zu-Tür-Geschäftsreise (ÖPNV oder PKW).
/// </summary>
public class Trip
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string Purpose { get; set; } = string.Empty;

    public TravelExpenseType ExpenseType { get; set; } = TravelExpenseType.PublicTransit;

    public string OriginLocation { get; set; } = string.Empty;
    public string DestinationLocation { get; set; } = string.Empty;

    /// <summary>
    /// Gefahrene Kilometer (bei PKW-Nutzung).
    /// </summary>
    public decimal DistanceKm { get; set; } = 0m;

    /// <summary>
    /// Kilometersatz in EUR/km (Standard: 0.30 € gem. EStG).
    /// </summary>
    public decimal RatePerKm { get; set; } = 0.30m;

    public DateTime ActualDepartureUtc { get; set; }
    public DateTime ActualArrivalUtc { get; set; }
    public DateTime? ReturnActualDepartureUtc { get; set; }
    public DateTime? ReturnActualArrivalUtc { get; set; }

    /// <summary>
    /// Gesamte Abwesenheitsdauer von Tür zu Tür (in Stunden) für steuerliche Verpflegungspauschalen.
    /// </summary>
    public decimal TotalAbsenceHours { get; set; }

    /// <summary>
    /// Gesamte reine Reisezeit (in Stunden).
    /// </summary>
    public decimal ElapsedTravelHours { get; set; }

    /// <summary>
    /// Während der Reise (z. B. im ICE) geleistete Projektarbeitszeit.
    /// </summary>
    public decimal WorkTimeDuringTravelHours { get; set; }

    /// <summary>
    /// Abrechenbare Reisezeit laut Kundenvertrag.
    /// </summary>
    public decimal BillableTravelHours { get; set; }

    /// <summary>
    /// Dem Kunden weiterberechenbare Reisekosten in EUR Netto.
    /// </summary>
    public decimal CustomerReimbursableCost { get; set; }

    /// <summary>
    /// Tatsächliche Gesamtkosten der Reise (Tickets, Hotel, etc.).
    /// </summary>
    public decimal TotalActualCost { get; set; }

    public List<TripSegment> Segments { get; set; } = new();
    public List<Receipt> Receipts { get; set; } = new();

    public string? TimesheetVersionId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public decimal CalculateEffectiveReimbursement()
    {
        if (ExpenseType == TravelExpenseType.PersonalCar && DistanceKm > 0)
        {
            return Math.Round(DistanceKm * RatePerKm, 2, MidpointRounding.AwayFromZero);
        }
        return CustomerReimbursableCost;
    }
}

/// <summary>
/// Einzelner Abschnitt einer multimodalen Reise (z. B. Bus, ICE, Fußweg).
/// </summary>
public class TripSegment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TripId { get; set; } = string.Empty;
    public int SequenceNumber { get; set; }
    public TravelMode Mode { get; set; } = TravelMode.Train;
    public string FromLocation { get; set; } = string.Empty;
    public string ToLocation { get; set; } = string.Empty;
    public TimeOnly DepartureTime { get; set; }
    public TimeOnly ArrivalTime { get; set; }
    public int DurationMinutes { get; set; }
    public string? OperatorAndLine { get; set; } // z. B. "DB ICE 1505"
    public string? ReceiptId { get; set; }
}

/// <summary>
/// Belegdatei (Ticket, Quittung, Rechnung) mit kryptografischem SHA-256 Hash.
/// </summary>
public class Receipt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? TripId { get; set; }
    public string? ProjectId { get; set; }
    public DateOnly ReceiptDate { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public decimal AmountNet { get; set; }
    public decimal VatRate { get; set; } = 19.0m;
    public decimal AmountGross { get; set; }
    public string Currency { get; set; } = "EUR";
    public bool IsCustomerReimbursable { get; set; } = true;

    /// <summary>
    /// Speicherpfad im Cloudflare R2 Bucket.
    /// </summary>
    public string R2StorageKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSizeBytes { get; set; }
    public string Sha256Hash { get; set; } = string.Empty;

    public RetentionClass Retention { get; set; } = RetentionClass.AccountingEvidence;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Unveränderbarer, periodischer Stundenzettel mit SHA-256-Integritätsnachweis.
/// </summary>
public class TimesheetVersion
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = string.Empty;
    public int VersionNumber { get; set; } = 1;
    public string Period { get; set; } = string.Empty; // z. B. "2026-09"
    public TimesheetStatus Status { get; set; } = TimesheetStatus.Draft;

    public decimal TotalActualHours { get; set; }
    public decimal TotalBillableHours { get; set; }
    public decimal TotalBillableTravelHours { get; set; }
    public decimal TotalReimbursableExpenses { get; set; }
    public decimal TotalAmountNet { get; set; }

    /// <summary>
    /// Deterministischer SHA-256 Hash der normalisierten Daten.
    /// </summary>
    public string DataHashSha256 { get; set; } = string.Empty;

    /// <summary>
    /// SHA-256 Hash der gerenderten Kunden-PDF-Datei.
    /// </summary>
    public string? CustomerPdfHashSha256 { get; set; }
    public string? CustomerPdfR2StorageKey { get; set; }

    /// <summary>
    /// SHA-256 Hash der gerenderten internen Audit-PDF-Datei.
    /// </summary>
    public string? InternalPdfHashSha256 { get; set; }
    public string? InternalPdfR2StorageKey { get; set; }

    /// <summary>
    /// SHA-256 Hash der gerenderten XLSX-Datei.
    /// </summary>
    public string? XlsxHashSha256 { get; set; }
    public string? XlsxR2StorageKey { get; set; }

    /// <summary>
    /// Vorgänger-Version bei Korrekturen (Version n+1).
    /// </summary>
    public string? SupersedesVersionId { get; set; }

    public List<TimeEntry> TimeEntries { get; set; } = new();
    public List<Trip> Trips { get; set; } = new();
    public Approval? Approval { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAtUtc { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
}

/// <summary>
/// Protokoll der Kundenfreigabe mit kryptografischem Binding an den Dokumenten-Hash.
/// </summary>
public class Approval
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TimesheetVersionId { get; set; } = string.Empty;
    public ApprovalDecision Decision { get; set; } = ApprovalDecision.Approve;
    public ApprovalMethod Method { get; set; } = ApprovalMethod.CloudflareZeroTrustOtp;
    public string ApproverEmail { get; set; } = string.Empty;
    public string? ApproverName { get; set; }
    public string? Comment { get; set; }

    /// <summary>
    /// Der exakte SHA-256 Hash des Stundenzettels, den der Kunde gesehen und genehmigt hat.
    /// </summary>
    public string BoundDocumentHashSha256 { get; set; } = string.Empty;

    public string? ClientIp { get; set; }
    public string? UserAgent { get; set; }
    public DateTime DecisionAtUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Übertragungspaket für Lexware Office XL mit deterministischem IdempotencyKey.
/// </summary>
public class BillingBatch
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TimesheetVersionId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;

    public string IdempotencyKey { get; set; } = string.Empty;
    public string? LexwareInvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }

    public decimal BilledHours { get; set; }
    public decimal BilledExpensesNet { get; set; }
    public decimal TotalBilledAmountNet { get; set; }

    public bool IsFinalizedInLexware { get; set; } = false;
    public DateTime DraftCreatedUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Revisionssicheres Audit-Log für GoBD-Prüfbarkeit.
/// </summary>
public class AuditEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DataPayloadJson { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
