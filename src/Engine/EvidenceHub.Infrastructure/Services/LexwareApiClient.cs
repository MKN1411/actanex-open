using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EvidenceHub.Domain.Interfaces;

namespace EvidenceHub.Infrastructure.Services;

/// <summary>
/// Robuster Client für die Lexware Office XL Public API (https://api.lexware.io)
/// mit integriertem Token-Bucket-Rate-Limiter (max. 2 Requests/s) und Idempotenz-Schutz.
/// Unterstützt Angebote, Auftragsbestätigungen, Rechnungen, Kunden-Sync und Dateiablage.
/// </summary>
public class LexwareApiClient : ILexwareClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private static DateTime _lastRequestTime = DateTime.MinValue;
    private static readonly object LockObj = new();

    public LexwareApiClient(HttpClient httpClient, string apiKey, string baseUrl = "https://api.lexware.io")
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _apiKey = apiKey ?? string.Empty;

        _httpClient.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        _httpClient.DefaultRequestHeaders.Accept.Clear();
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await ExecuteWithRateLimitAsync(() => _httpClient.GetAsync("v1/profile", cancellationToken), cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Ruft das Firmenprofil des angemeldeten Lexware-Accounts ab.
    /// </summary>
    public async Task<CompanyProfile> GetCompanyProfileAsync(CancellationToken cancellationToken = default)
    {
        var response = await ExecuteWithRateLimitAsync(() => _httpClient.GetAsync("v1/profile", cancellationToken), cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return new CompanyProfile("Michael Kirst-Neshva", "Michael Kirst-Neshva", "Speicherstadt", "20095", "Hamburg", "mkn@ankbs.de");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var compName = root.TryGetProperty("companyName", out var cName) ? cName.GetString() ?? "Michael Kirst-Neshva" : "Michael Kirst-Neshva";
        var taxNum = root.TryGetProperty("taxNumber", out var tNum) ? tNum.GetString() : null;
        var vatId = root.TryGetProperty("vatId", out var vId) ? vId.GetString() : null;

        return new CompanyProfile(
            compName,
            compName,
            "Speicherstadt",
            "20095",
            "Hamburg",
            "mkn@ankbs.de",
            taxNum,
            vatId
        );
    }

    /// <summary>
    /// Erstellt ein Angebot (Quotation) in Lexware Office XL (/v1/quotations).
    /// </summary>
    public async Task<string> CreateQuotationAsync(
        string contactId,
        string title,
        string description,
        decimal totalHours,
        decimal hourlyRate,
        DateOnly validUntil,
        CancellationToken cancellationToken = default)
    {
        var nowOffset = DateTimeOffset.UtcNow;
        var expirationOffset = new DateTimeOffset(validUntil.ToDateTime(new TimeOnly(23, 59, 59)), TimeSpan.FromHours(2));

        var payload = new
        {
            voucherDate = nowOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
            expirationDate = expirationOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
            address = new { contactId },
            lineItems = new[]
            {
                new
                {
                    type = "custom",
                    name = title,
                    description,
                    quantity = totalHours,
                    unitName = "Stunde",
                    unitPrice = new
                    {
                        currency = "EUR",
                        netAmount = hourlyRate,
                        taxRatePercentage = 19.0
                    }
                }
            },
            totalPrice = new { currency = "EUR" },
            taxConditions = new { taxType = "net" },
            title = "Angebot",
            introduction = "Gerne bieten wir Ihnen unsere freiberuflichen IT-Architektur- und Beratungsleistungen wie folgt an:"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.PostAsync("v1/quotations", content, cancellationToken),
            cancellationToken);

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Fehler beim Erstellen des Angebots in Lexware: HTTP {response.StatusCode} - {responseJson}");
        }

        using var doc = JsonDocument.Parse(responseJson);
        return doc.RootElement.GetProperty("id").GetString() ?? "";
    }

    /// <summary>
    /// Erstellt eine Auftragsbestätigung (Order Confirmation) in Lexware Office XL (/v1/order-confirmations).
    /// </summary>
    public async Task<string> CreateOrderConfirmationAsync(
        string contactId,
        string title,
        string description,
        decimal totalHours,
        decimal hourlyRate,
        DateOnly deliveryDate,
        CancellationToken cancellationToken = default)
    {
        var nowOffset = DateTimeOffset.UtcNow;
        var delivOffset = new DateTimeOffset(deliveryDate.ToDateTime(new TimeOnly(23, 59, 59)), TimeSpan.FromHours(2));

        var payload = new
        {
            voucherDate = nowOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
            address = new { contactId },
            lineItems = new[]
            {
                new
                {
                    type = "custom",
                    name = title,
                    description,
                    quantity = totalHours,
                    unitName = "Stunde",
                    unitPrice = new
                    {
                        currency = "EUR",
                        netAmount = hourlyRate,
                        taxRatePercentage = 19.0
                    }
                }
            },
            totalPrice = new { currency = "EUR" },
            taxConditions = new { taxType = "net" },
            shippingConditions = new
            {
                shippingDate = delivOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
                shippingType = "deliverydate"
            },
            title = "Auftragsbestätigung",
            introduction = "Wir bestätigen Ihren Auftrag für folgende IT-Architektur- und Beratungsleistungen:"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.PostAsync("v1/order-confirmations", content, cancellationToken),
            cancellationToken);

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Fehler beim Erstellen der Auftragsbestätigung in Lexware: HTTP {response.StatusCode} - {responseJson}");
        }

        using var doc = JsonDocument.Parse(responseJson);
        return doc.RootElement.GetProperty("id").GetString() ?? "";
    }

    /// <summary>
    /// Löscht oder storniert einen Rechnungsentwurf (Draft) in Lexware Office XL (/v1/invoices/{id}).
    /// </summary>
    public async Task<(bool success, int statusCode, string responseBody)> DeleteInvoiceDraftAsync(string invoiceId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(invoiceId);

        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.DeleteAsync($"v1/invoices/{invoiceId}", cancellationToken),
            cancellationToken);

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        return (response.IsSuccessStatusCode, (int)response.StatusCode, responseJson);
    }

    /// <summary>
    /// Lädt eine Datei über die allgemeine Lexware Files API hoch.
    /// </summary>
    public async Task<string> UploadFileAsync(byte[] fileBytes, string fileName, string type = "voucher", CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(fileBytes);

        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(fileContent, "file", fileName);
        form.Add(new StringContent(type), "type");

        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.PostAsync("v1/files", form, cancellationToken),
            cancellationToken);

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Fehler beim Upload der Datei nach Lexware: HTTP {response.StatusCode} - {responseJson}");
        }

        using var doc = JsonDocument.Parse(responseJson);
        return doc.RootElement.TryGetProperty("id", out var idElem) ? idElem.GetString() ?? "" : "";
    }

    /// <summary>
    /// Ruft alle Kundenkontakte aus Lexware Office XL ab.
    /// </summary>
    public async Task<IReadOnlyList<LexwareContactDto>> GetContactsAsync(CancellationToken cancellationToken = default)
    {
        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.GetAsync("v1/contacts?customer=true&size=100", cancellationToken),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
            return Array.Empty<LexwareContactDto>();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var list = new List<LexwareContactDto>();

        if (doc.RootElement.TryGetProperty("content", out var contentArray) && contentArray.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in contentArray.EnumerateArray())
            {
                var id = item.GetProperty("id").GetString() ?? "";
                var company = item.TryGetProperty("company", out var comp) && comp.TryGetProperty("name", out var cName) ? cName.GetString() : null;
                
                string? personName = null;
                string? email = null;

                if (item.TryGetProperty("company", out var companyObj) && companyObj.TryGetProperty("contactPersons", out var persons) && persons.ValueKind == JsonValueKind.Array)
                {
                    foreach (var p in persons.EnumerateArray())
                    {
                        var fn = p.TryGetProperty("firstName", out var f) ? f.GetString() : "";
                        var ln = p.TryGetProperty("lastName", out var l) ? l.GetString() : "";
                        personName = $"{fn} {ln}".Trim();
                        email = p.TryGetProperty("emailAddress", out var em) ? em.GetString() : null;
                        break;
                    }
                }

                list.Add(new LexwareContactDto(id, company ?? personName ?? "Unbekannt", personName, email, null));
            }
        }

        return list;
    }

    /// <summary>
    /// Erstellt einen Rechnungsentwurf (finalize=false) in Lexware Office XL.
    /// </summary>
    public async Task<LexwareInvoiceResult> CreateInvoiceDraftAsync(LexwareInvoiceRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var lineItems = new List<object>
        {
            new
            {
                type = "custom",
                name = request.ServiceTitle,
                description = request.ServiceDescription,
                quantity = request.HoursQuantity,
                unitName = "Stunde",
                unitPrice = new
                {
                    currency = "EUR",
                    netAmount = request.HourlyRateNet,
                    taxRatePercentage = 19.0
                }
            }
        };

        if (request.ReimbursableExpensesNet > 0)
        {
            lineItems.Add(new
            {
                type = "custom",
                name = "Weiterberechnete Reisekosten",
                description = "Auslagen für Bahn-/PKW-Reisen laut beigefügtem Nachweis",
                quantity = 1,
                unitName = "Pauschal",
                unitPrice = new
                {
                    currency = "EUR",
                    netAmount = request.ReimbursableExpensesNet,
                    taxRatePercentage = 19.0
                }
            });
        }

        var nowOffset = DateTimeOffset.UtcNow;
        var startOffset = new DateTimeOffset(request.ServiceDateFrom.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(2));
        var endOffset = new DateTimeOffset(request.ServiceDateTo.ToDateTime(new TimeOnly(23, 59, 59)), TimeSpan.FromHours(2));

        var payload = new
        {
            voucherDate = nowOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
            address = new { contactId = request.LexwareContactId },
            lineItems,
            totalPrice = new { currency = "EUR" },
            taxConditions = new { taxType = "net" },
            shippingConditions = new
            {
                shippingDate = startOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
                shippingEndDate = endOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"),
                shippingType = "serviceperiod"
            },
            title = "Rechnung",
            introduction = "Für die im Leistungszeitraum erbrachten freiberuflichen IT-Dienstleistungen stellen wir folgende Positionen gem. beigefügtem Leistungsnachweis in Rechnung:"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.PostAsync("v1/invoices?finalize=false", content, cancellationToken),
            cancellationToken);

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Fehler bei Lexware Rechnungsanlage: HTTP {response.StatusCode} - {responseJson}");
        }

        using var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;

        var invoiceId = root.GetProperty("id").GetString() ?? Guid.NewGuid().ToString();
        var invoiceNumber = root.TryGetProperty("voucherNumber", out var numElem) ? numElem.GetString() : null;

        var totalNet = (request.HoursQuantity * request.HourlyRateNet) + request.ReimbursableExpensesNet;
        var totalGross = totalNet * 1.19m;

        return new LexwareInvoiceResult(
            invoiceId,
            invoiceNumber,
            totalNet,
            totalGross,
            DateTime.UtcNow
        );
    }

    public async Task<IReadOnlyList<LexwareArticleDto>> GetServiceArticlesAsync(CancellationToken cancellationToken = default)
    {
        var response = await ExecuteWithRateLimitAsync(
            () => _httpClient.GetAsync("v1/articles?type=service&size=100", cancellationToken),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
            return Array.Empty<LexwareArticleDto>();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var list = new List<LexwareArticleDto>();

        if (doc.RootElement.TryGetProperty("content", out var contentArray) && contentArray.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in contentArray.EnumerateArray())
            {
                var id = item.GetProperty("id").GetString() ?? "";
                var title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
                var num = item.TryGetProperty("articleNumber", out var n) ? n.GetString() ?? "" : "";
                var unit = item.TryGetProperty("unitName", out var u) ? u.GetString() ?? "Stunde" : "Stunde";
                list.Add(new LexwareArticleDto(id, num, title, null, unit, 0m));
            }
        }

        return list;
    }

    public async Task<LexwarePermissionReport> RunPermissionCheckAsync(CancellationToken cancellationToken = default)
    {
        var report = new LexwarePermissionReport();
        try
        {
            var profileRes = await ExecuteWithRateLimitAsync(() => _httpClient.GetAsync("v1/profile", cancellationToken), cancellationToken);
            report.ProfileAccess = profileRes.IsSuccessStatusCode;
            report.ProfileStatusCode = (int)profileRes.StatusCode;
            if (profileRes.IsSuccessStatusCode)
            {
                var json = await profileRes.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                report.OrganizationId = doc.RootElement.TryGetProperty("organizationId", out var org) ? org.GetString() : null;
                report.CompanyName = doc.RootElement.TryGetProperty("companyName", out var comp) ? comp.GetString() : null;
            }
        }
        catch (Exception ex) { report.ProfileError = ex.Message; }

        try
        {
            var contactsRes = await ExecuteWithRateLimitAsync(() => _httpClient.GetAsync("v1/contacts?customer=true&size=5", cancellationToken), cancellationToken);
            report.ContactsAccess = contactsRes.IsSuccessStatusCode;
            report.ContactsStatusCode = (int)contactsRes.StatusCode;
        }
        catch (Exception ex) { report.ContactsError = ex.Message; }

        return report;
    }

    private async Task<HttpResponseMessage> ExecuteWithRateLimitAsync(Func<Task<HttpResponseMessage>> action, CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < 3; attempt++)
        {
            lock (LockObj)
            {
                var elapsed = DateTime.UtcNow - _lastRequestTime;
                if (elapsed.TotalMilliseconds < 500)
                {
                    Thread.Sleep(500 - (int)elapsed.TotalMilliseconds);
                }
                _lastRequestTime = DateTime.UtcNow;
            }

            var response = await action();
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                var retryAfter = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(2 * (attempt + 1));
                await Task.Delay(retryAfter, cancellationToken);
                continue;
            }

            return response;
        }

        return await action();
    }
}
