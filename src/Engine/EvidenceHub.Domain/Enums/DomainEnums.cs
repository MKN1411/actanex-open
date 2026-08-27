namespace EvidenceHub.Domain.Enums;

/// <summary>
/// Fachliche Tätigkeitstaxonomie zur sauberen Abgrenzung freiberuflicher/ingenieurähnlicher Tätigkeiten (§ 18 EStG).
/// </summary>
public enum ActivityCategory
{
    Architecture = 1,
    TechnicalAnalysis = 2,
    Engineering = 3,
    SecurityDesign = 4,
    Integration = 5,
    TechnicalEvaluation = 6,
    ImplementationReview = 7,
    TechnicalDocumentation = 8,
    Requirements = 9,
    Workshop = 10,
    ProjectManagement = 11,
    Support = 12,
    Operations = 13,
    Travel = 14,
    NonBillable = 15,
    /// <summary>
    /// Telefonkonferenzen, Status-Calls, Abstimmungen.
    /// </summary>
    TelkoMeeting = 16
}

/// <summary>
/// Einsatzort der Leistungserbringung.
/// </summary>
public enum LocationType
{
    Remote = 1,
    OnSite = 2
}

/// <summary>
/// Art der Reisekosten (PKW-Kilometer vs. ÖPNV/Bahn).
/// </summary>
public enum TravelExpenseType
{
    PublicTransit = 1,
    PersonalCar = 2,
    Flight = 3,
    Hotel = 4,
    Other = 5
}

/// <summary>
/// Lebenszyklus eines Stundenzettels / Periodenabschlusses (GoBD-konforme State Machine).
/// </summary>
public enum TimesheetStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Rejected = 4,
    ReadyForBilling = 5,
    Billed = 6,
    Archived = 7
}

/// <summary>
/// Verkehrsmittel für multimodale Tür-zu-Tür-Geschäftsreisen.
/// </summary>
public enum TravelMode
{
    Walk = 1,
    Bus = 2,
    Train = 3,
    Tram = 4,
    Subway = 5,
    Taxi = 6,
    Car = 7,
    Other = 8
}

/// <summary>
/// Entscheidung bei der Kundenfreigabe.
/// </summary>
public enum ApprovalDecision
{
    Approve = 1,
    Reject = 2,
    Question = 3
}

/// <summary>
/// Authentisierungs- und Freigabemethode.
/// </summary>
public enum ApprovalMethod
{
    CloudflareZeroTrustOtp = 1,
    SignedPdf = 2,
    EmailImport = 3,
    Manual = 4
}

/// <summary>
/// Gesetzliche Aufbewahrungsklasse nach GoBD / AO.
/// </summary>
public enum RetentionClass
{
    AccountingEvidence = 1,
    ProjectEvidence = 2,
    OperationalLog = 3,
    SecurityAudit = 4
}
