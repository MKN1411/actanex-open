using EvidenceHub.Domain.Models;

namespace EvidenceHub.Domain.Interfaces;

/// <summary>
/// Renderer für GoBD- und steuerkonforme PDF-Leistungsnachweise.
/// Unterstützt Dual-PDF: Kunden-Leistungsnachweis vs. Internes GoBD/§18-Audit-PDF.
/// </summary>
public interface ITimesheetRenderer
{
    Task<byte[]> RenderCustomerTimesheetPdfAsync(
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CompanyProfile? company = null,
        CancellationToken cancellationToken = default);

    Task<byte[]> RenderInternalAuditPdfAsync(
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CompanyProfile? company = null,
        CancellationToken cancellationToken = default);

    Task<byte[]> RenderPdfAsync(
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Exporter für tabellarische Excel-Dateien (XLSX).
/// </summary>
public interface ITimesheetExporter
{
    Task<byte[]> ExportXlsxAsync(TimesheetVersion timesheet, Project project, Customer customer, CancellationToken cancellationToken = default);
}

/// <summary>
/// Speicher-Abstraktion (Cloudflare R2 vs. lokales Dateisystem).
/// </summary>
public interface IStorageService
{
    Task<string> UploadFileAsync(string storageKey, byte[] content, string contentType, CancellationToken cancellationToken = default);
    Task<byte[]> DownloadFileAsync(string storageKey, CancellationToken cancellationToken = default);
    Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default);
}

/// <summary>
/// Schnittstelle zur Lexware Office XL Public API (https://api.lexware.io).
/// </summary>
public interface ILexwareClient
{
    Task<bool> PingAsync(CancellationToken cancellationToken = default);
    Task<LexwareInvoiceResult> CreateInvoiceDraftAsync(LexwareInvoiceRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LexwareContactDto>> GetContactsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LexwareArticleDto>> GetServiceArticlesAsync(CancellationToken cancellationToken = default);
}

public record LexwareInvoiceRequest(
    string IdempotencyKey,
    string LexwareContactId,
    string LexwareArticleId,
    string ServiceTitle,
    string ServiceDescription,
    decimal HoursQuantity,
    decimal HourlyRateNet,
    DateOnly ServiceDateFrom,
    DateOnly ServiceDateTo,
    decimal ReimbursableExpensesNet = 0m
);

public record LexwareInvoiceResult(
    string InvoiceId,
    string? InvoiceNumber,
    decimal TotalNetAmount,
    decimal TotalGrossAmount,
    DateTime CreatedAtUtc
);

public record LexwareContactDto(
    string Id,
    string CompanyName,
    string? ContactPerson,
    string? Email,
    string? City
);

public record LexwareArticleDto(
    string Id,
    string ArticleNumber,
    string Title,
    string? Description,
    string UnitName,
    decimal PriceNet
);

public record CompanyProfile(
    string CompanyName,
    string OwnerName,
    string Street,
    string ZipCode,
    string City,
    string Email,
    string? TaxNumber = null,
    string? VatId = null,
    string? Iban = null,
    string? Bic = null
);

public class LexwarePermissionReport
{
    public bool ProfileAccess { get; set; }
    public int ProfileStatusCode { get; set; }
    public string? OrganizationId { get; set; }
    public string? CompanyName { get; set; }
    public string? ProfileError { get; set; }

    public bool ContactsAccess { get; set; }
    public int ContactsStatusCode { get; set; }
    public int TotalContactsCount { get; set; }
    public List<string> SampleContactNames { get; set; } = new();
    public string? ContactsError { get; set; }

    public bool ArticlesAccess { get; set; }
    public int ArticlesStatusCode { get; set; }
    public int TotalArticlesCount { get; set; }
    public List<string> SampleArticleTitles { get; set; } = new();
    public string? ArticlesError { get; set; }

    public bool VoucherListAccess { get; set; }
    public int VoucherListStatusCode { get; set; }
    public int TotalInvoicesCount { get; set; }
    public string? VoucherListError { get; set; }

    public bool VouchersAccess { get; set; }
    public int VouchersStatusCode { get; set; }
    public string? VouchersError { get; set; }
}

/// <summary>
/// Dienst für kryptografisches SHA-256 Hashing.
/// </summary>
public interface IHashService
{
    string ComputeSha256(byte[] data);
    string ComputeSha256(string utf8Text);
    string ComputeTimesheetDataHash(TimesheetVersion timesheet);
    string ComputeIdempotencyKey(string projectId, string period, int versionNumber, string batchId);
}
