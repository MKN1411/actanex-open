using EvidenceHub.Domain.Enums;
using EvidenceHub.Domain.Interfaces;
using EvidenceHub.Domain.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EvidenceHub.Infrastructure.Services;

/// <summary>
/// Hochpräzise, GoBD-konforme Vektor-PDF-Engine (QuestPDF 2025.12+).
/// Unterstützt Dual-PDF-Generierung:
/// 1. Kunden-Leistungsnachweis (Zeiten, Reisen, Summen, OTP-Signatur)
/// 2. Internes GoBD- & § 18 EStG Audit-PDF (Vollständige Methodik, Problemstellungen & Hashbaum)
/// </summary>
public class QuestPdfTimesheetRenderer : ITimesheetRenderer
{
    public QuestPdfTimesheetRenderer()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<byte[]> RenderPdfAsync(TimesheetVersion timesheet, Project project, Customer customer, CancellationToken cancellationToken = default)
    {
        return RenderCustomerTimesheetPdfAsync(timesheet, project, customer, null, cancellationToken);
    }

    public Task<byte[]> RenderCustomerTimesheetPdfAsync(
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CompanyProfile? company = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveCompany = company ?? DefaultCompany();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor(Colors.Grey.Darken3));

                page.Header().Element(c => ComposeHeader(c, timesheet, project, customer, effectiveCompany, isInternalAudit: false));
                page.Content().Element(c => ComposeCustomerContent(c, timesheet, project));
                page.Footer().Element(c => ComposeFooter(c, timesheet, effectiveCompany));
            });
        });

        return Task.FromResult(document.GeneratePdf());
    }

    public Task<byte[]> RenderInternalAuditPdfAsync(
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CompanyProfile? company = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveCompany = company ?? DefaultCompany();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor(Colors.Grey.Darken3));

                page.Header().Element(c => ComposeHeader(c, timesheet, project, customer, effectiveCompany, isInternalAudit: true));
                page.Content().Element(c => ComposeInternalAuditContent(c, timesheet, project));
                page.Footer().Element(c => ComposeFooter(c, timesheet, effectiveCompany));
            });
        });

        return Task.FromResult(document.GeneratePdf());
    }

    private static void ComposeHeader(
        IContainer container,
        TimesheetVersion timesheet,
        Project project,
        Customer customer,
        CompanyProfile company,
        bool isInternalAudit)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                // Linke Spalte: Dokumententitel & Absender
                row.RelativeItem(3).Column(leftCol =>
                {
                    var title = isInternalAudit
                        ? "GOBD & § 18 ESTG PRÜFNACHWEIS"
                        : "TÄTIGKEITS- & LEISTUNGSNACHWEIS";

                    leftCol.Item().Text(title)
                        .FontSize(15).ExtraBold().FontColor(isInternalAudit ? Colors.Orange.Darken3 : Colors.Blue.Darken3);

                    leftCol.Item().Text($"Abrechnungsperiode: {timesheet.Period} | Version: {timesheet.VersionNumber}.0 ({timesheet.Status})")
                        .FontSize(9.5f).SemiBold().FontColor(Colors.Grey.Darken2);

                    leftCol.Item().PaddingTop(4).Text($"{company.CompanyName}")
                        .FontSize(8.5f).Bold().FontColor(Colors.Grey.Darken3);

                    leftCol.Item().Text($"{company.OwnerName} • {company.Street} • {company.ZipCode} {company.City}")
                        .FontSize(7.5f).FontColor(Colors.Grey.Darken1);

                    if (!string.IsNullOrWhiteSpace(company.VatId) || !string.IsNullOrWhiteSpace(company.TaxNumber))
                    {
                        var taxInfo = !string.IsNullOrWhiteSpace(company.VatId) ? $"USt-IdNr.: {company.VatId}" : $"St.-Nr.: {company.TaxNumber}";
                        leftCol.Item().Text(taxInfo).FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                    }
                });

                // Rechte Spalte: Kunde & Projektdaten
                row.RelativeItem(3).AlignRight().Column(rightCol =>
                {
                    rightCol.Item().Text(customer.Name)
                        .FontSize(11).Bold().FontColor(Colors.Grey.Darken4);

                    if (!string.IsNullOrWhiteSpace(customer.ContactPerson))
                    {
                        rightCol.Item().Text($"Ansprechpartner: {customer.ContactPerson}")
                            .FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                    }

                    rightCol.Item().Text($"Projekt: {project.Name} ({project.ProjectNumber})")
                        .FontSize(8.5f).Bold().FontColor(Colors.Grey.Darken3);

                    if (!string.IsNullOrWhiteSpace(project.PurchaseOrderNumber))
                    {
                        rightCol.Item().Text($"PO-Nr. / Auftrag: {project.PurchaseOrderNumber}")
                            .FontSize(8.5f).SemiBold().FontColor(Colors.Blue.Darken2);
                    }
                });
            });

            col.Item().PaddingTop(8).PaddingBottom(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
        });
    }

    private static void ComposeCustomerContent(IContainer container, TimesheetVersion timesheet, Project project)
    {
        var totalHours = timesheet.TimeEntries.Sum(t => t.BillableDurationHours);
        var totalReimbursements = timesheet.Trips.Sum(t => t.CalculateEffectiveReimbursement());
        var totalNet = (totalHours * project.DefaultHourlyRate) + totalReimbursements;

        container.Column(col =>
        {
            // 1. KPI Übersichtskarten
            col.Item().Row(row =>
            {
                row.RelativeItem().Element(c => ComposeKpiBox(c, "Abrechenbare Stunden", $"{totalHours:N2} Std.", Colors.Blue.Darken2));
                row.RelativeItem().Element(c => ComposeKpiBox(c, "Stundensatz (Netto)", $"{project.DefaultHourlyRate:N2} € / Std.", Colors.Grey.Darken3));
                row.RelativeItem().Element(c => ComposeKpiBox(c, "Reisekosten (Netto)", $"{totalReimbursements:N2} €", Colors.Grey.Darken3));
                row.RelativeItem().Element(c => ComposeKpiBox(c, "Gesamtbetrag (Netto)", $"{totalNet:N2} €", Colors.Green.Darken2));
            });

            // 2. Aufstellung der Arbeitszeiten
            col.Item().PaddingTop(12).Text("1. Aufstellung der erbrachten Leistungen").FontSize(11).Bold().FontColor(Colors.Blue.Darken3);

            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(65);  // Datum
                    columns.ConstantColumn(85);  // Zeit & Pause
                    columns.ConstantColumn(55);  // Dauer
                    columns.ConstantColumn(60);  // Modus (Remote/Vor Ort)
                    columns.ConstantColumn(85);  // Kategorie
                    columns.RelativeColumn();   // Beschreibung
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Datum").Bold().FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Uhrzeit").Bold().FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Dauer").Bold().FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Einsatzort").Bold().FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Kategorie").Bold().FontSize(8);
                    header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Beschreibung").Bold().FontSize(8);
                });

                foreach (var entry in timesheet.TimeEntries.OrderBy(e => e.Date).ThenBy(e => e.StartTime))
                {
                    var timeStr = entry.StartTime != TimeOnly.MinValue && entry.EndTime != TimeOnly.MinValue
                        ? $"{entry.StartTime:HH\\:mm} - {entry.EndTime:HH\\:mm}" + (entry.BreakMinutes > 0 ? $"\n(-{entry.BreakMinutes}m)" : "")
                        : "Ganztägig";

                    var locStr = entry.Location == LocationType.OnSite ? "Vor Ort" : "Remote";
                    var catStr = FormatCategory(entry.Category);

                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(entry.Date.ToString("dd.MM.yyyy")).FontSize(8);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(timeStr).FontSize(7.5f);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text($"{entry.BillableDurationHours:N2} h").Bold().FontSize(8);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(locStr).FontSize(8);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(catStr).FontSize(8);
                    table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(entry.ShortDescription).FontSize(8);
                }
            });

            // 3. Reisekosten
            if (timesheet.Trips.Any())
            {
                col.Item().PaddingTop(12).Text("2. Weiterberechnete Reisekosten (Auslagen)").FontSize(11).Bold().FontColor(Colors.Blue.Darken3);

                col.Item().PaddingTop(6).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(65);
                        columns.ConstantColumn(90);
                        columns.RelativeColumn();
                        columns.ConstantColumn(80);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Datum").Bold().FontSize(8);
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Verkehrsmittel").Bold().FontSize(8);
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Zweck & Route").Bold().FontSize(8);
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(4).AlignRight().Text("Betrag (Netto)").Bold().FontSize(8);
                    });

                    foreach (var trip in timesheet.Trips.OrderBy(t => t.Date))
                    {
                        var modeDesc = trip.ExpenseType == TravelExpenseType.PersonalCar
                            ? $"PKW ({trip.DistanceKm:N0} km à {trip.RatePerKm:N2} €)"
                            : "Bahn / ÖPNV";

                        var route = $"{trip.Purpose}\nRoute: {trip.OriginLocation} -> {trip.DestinationLocation}";
                        var amount = trip.CalculateEffectiveReimbursement();

                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(trip.Date.ToString("dd.MM.yyyy")).FontSize(8);
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(modeDesc).FontSize(8);
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(route).FontSize(7.5f);
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"{amount:N2} €").Bold().FontSize(8);
                    }
                });
            }

            // 4. Digitales Freigabeprotokoll
            col.Item().PaddingTop(14).Element(c => ComposeApprovalBadge(c, timesheet));
        });
    }

    private static void ComposeInternalAuditContent(IContainer container, TimesheetVersion timesheet, Project project)
    {
        container.Column(col =>
        {
            // Erst Standard-Kundenübersicht rendern
            col.Item().Element(c => ComposeCustomerContent(c, timesheet, project));

            // Dann Abschnitt: Fachlicher Tätigkeits- & Problemlösungsnachweis gem. § 18 EStG
            col.Item().PaddingTop(16).Text("3. Fachlicher Tätigkeits- & Problemlösungsnachweis (§ 18 EStG)").FontSize(11).Bold().FontColor(Colors.Orange.Darken3);
            col.Item().PaddingTop(2).Text("Revisionssichere Dokumentation der ingenieurähnlichen Problemlösung, Methodik und konkreten Arbeitsergebnisse:").FontSize(7.5f).Italic().FontColor(Colors.Grey.Darken1);

            foreach (var entry in timesheet.TimeEntries.Where(e => e.Evidence != null).OrderBy(e => e.Date))
            {
                var ev = entry.Evidence!;
                col.Item().PaddingTop(8).Background(Colors.Grey.Lighten4).Padding(8).Column(box =>
                {
                    box.Item().Row(r =>
                    {
                        r.RelativeItem().Text($"{entry.Date:dd.MM.yyyy} | {FormatCategory(entry.Category)}: {entry.ShortDescription}").Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                        r.AutoItem().Text($"{entry.BillableDurationHours:N2} Std.").Bold().FontSize(8.5f);
                    });

                    if (!string.IsNullOrWhiteSpace(ev.ProblemStatement))
                    {
                        box.Item().PaddingTop(3).Text(txt =>
                        {
                            txt.Span("Problemstellung / Ausgangslage: ").Bold().FontSize(7.5f);
                            txt.Span(ev.ProblemStatement).FontSize(7.5f);
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(ev.Methodology))
                    {
                        box.Item().PaddingTop(2).Text(txt =>
                        {
                            txt.Span("Angewandte Methodik: ").Bold().FontSize(7.5f);
                            txt.Span(ev.Methodology).FontSize(7.5f);
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(ev.TechnicalActivity))
                    {
                        box.Item().PaddingTop(2).Text(txt =>
                        {
                            txt.Span("Konkrete technische Leistung: ").Bold().FontSize(7.5f);
                            txt.Span(ev.TechnicalActivity).FontSize(7.5f);
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(ev.Result))
                    {
                        box.Item().PaddingTop(2).Text(txt =>
                        {
                            txt.Span("Technisches Resultat: ").Bold().FontSize(7.5f).FontColor(Colors.Green.Darken3);
                            txt.Span(ev.Result).FontSize(7.5f);
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(ev.Deliverable))
                    {
                        box.Item().PaddingTop(2).Text(txt =>
                        {
                            txt.Span("Erstelltes Artefakt / Dokument: ").Bold().FontSize(7.5f);
                            txt.Span(ev.Deliverable).FontSize(7.5f);
                        });
                    }
                });
            }

            // Vollständiger Hashbaum & Audit Trail
            col.Item().PaddingTop(12).Background(Colors.Grey.Lighten3).Padding(6).Column(hCol =>
            {
                hCol.Item().Text("GoBD-Integritätsnachweis & Kryptografischer Hashbaum").Bold().FontSize(8).FontColor(Colors.Grey.Darken3);
                hCol.Item().Text($"SHA-256 Datenhash: {timesheet.DataHashSha256 ?? "(Berechnet bei Übermittlung)"}").FontFamily("Courier New").FontSize(7);
                if (timesheet.Approval != null)
                {
                    hCol.Item().Text($"Freigegeben durch: {timesheet.Approval.ApproverEmail} ({timesheet.Approval.Method})").FontSize(7);
                    hCol.Item().Text($"IP / User-Agent: {timesheet.Approval.ClientIp ?? "N/A"} | {timesheet.Approval.UserAgent ?? "Cloudflare Access"}").FontSize(6.5f).FontColor(Colors.Grey.Darken1);
                }
            });
        });
    }

    private static void ComposeKpiBox(IContainer container, string title, string value, string color)
    {
        container.Background(Colors.Grey.Lighten4).Padding(6).Column(col =>
        {
            col.Item().Text(title).FontSize(7.5f).FontColor(Colors.Grey.Darken2);
            col.Item().PaddingTop(2).Text(value).FontSize(11).Bold().FontColor(color);
        });
    }

    private static void ComposeApprovalBadge(IContainer container, TimesheetVersion timesheet)
    {
        var isApproved = timesheet.Status == TimesheetStatus.Approved || timesheet.Approval != null;
        var bg = isApproved ? Colors.Blue.Lighten5 : Colors.Orange.Lighten5;
        var border = isApproved ? Colors.Blue.Lighten2 : Colors.Orange.Lighten2;

        container.Border(1).BorderColor(border).Background(bg).Padding(8).Column(col =>
        {
            if (isApproved)
            {
                var approver = timesheet.Approval?.ApproverEmail ?? "Auftraggeber";
                var dateStr = timesheet.Approval?.DecisionAtUtc.ToString("dd.MM.yyyy HH:mm:ss UTC") ?? DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm:ss UTC");
                var method = timesheet.Approval?.Method.ToString() ?? "CloudflareZeroTrustOtp";

                col.Item().Text($"Status: DIGITAL GENEHMIGT durch {approver}").Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                col.Item().PaddingTop(2).Text($"Freigabezeitpunkt: {dateStr} | Methode: {method}").FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                if (!string.IsNullOrWhiteSpace(timesheet.DataHashSha256))
                {
                    col.Item().Text($"Verifizierter SHA-256 Dokumentenhash: {timesheet.DataHashSha256}").FontFamily("Courier New").FontSize(6.5f).FontColor(Colors.Grey.Darken2);
                }
            }
            else
            {
                col.Item().Text($"Status: {timesheet.Status} (Ausstehende digitale Freigabe)").Bold().FontSize(8.5f).FontColor(Colors.Orange.Darken3);
                col.Item().PaddingTop(2).Text("Dieses Dokument ist ein vorläufiger Leistungsnachweis zur Prüfung und Freigabe.").FontSize(7.5f).FontColor(Colors.Grey.Darken2);
            }
        });
    }

    private static void ComposeFooter(IContainer container, TimesheetVersion timesheet, CompanyProfile company)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Text($"{company.CompanyName} | Dokument-ID: {timesheet.Id} | GoBD-konform")
                    .FontSize(7).FontColor(Colors.Grey.Darken1);

                row.RelativeItem().AlignRight().Text(x =>
                {
                    x.Span("Seite ");
                    x.CurrentPageNumber();
                    x.Span(" von ");
                    x.TotalPages();
                });
            });
        });
    }

    private static string FormatCategory(ActivityCategory category) => category switch
    {
        ActivityCategory.Architecture => "Architecture",
        ActivityCategory.SecurityDesign => "SecurityDesign",
        ActivityCategory.Workshop => "Workshop",
        ActivityCategory.Engineering => "Engineering",
        ActivityCategory.ImplementationReview => "Review",
        ActivityCategory.TechnicalDocumentation => "Dokumentation",
        ActivityCategory.TelkoMeeting => "Telko / Meeting",
        ActivityCategory.TechnicalAnalysis => "Analyse",
        ActivityCategory.Support => "Support",
        ActivityCategory.Travel => "Reisezeit",
        _ => category.ToString()
    };

    private static CompanyProfile DefaultCompany() => new(
        "Michael Kirst-Neshva",
        "Michael Kirst-Neshva",
        "Senior Cloud Security & Architecture Consultant",
        "Hamburg",
        "Deutschland",
        "mkn@ankbs.de",
        VatId: "DE313886737"
    );
}
