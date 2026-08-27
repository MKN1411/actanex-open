using ClosedXML.Excel;
using EvidenceHub.Domain.Interfaces;
using EvidenceHub.Domain.Models;

namespace EvidenceHub.Infrastructure.Services;

/// <summary>
/// ClosedXML-basierter Exporter für strukturierte, mehrseitige Excel-Arbeitsmappen (XLSX).
/// </summary>
public class ClosedXmlTimesheetExporter : ITimesheetExporter
{
    public Task<byte[]> ExportXlsxAsync(TimesheetVersion timesheet, Project project, Customer customer, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(timesheet);
        ArgumentNullException.ThrowIfNull(project);
        ArgumentNullException.ThrowIfNull(customer);

        using var workbook = new XLWorkbook();

        // 1. Tab: Übersicht
        var wsSummary = workbook.Worksheets.Add("Übersicht");
        wsSummary.Cell(1, 1).Value = "TÄTIGKEITS- & LEISTUNGSNACHWEIS (ZUSAMMENFASSUNG)";
        wsSummary.Cell(1, 1).Style.Font.Bold = true;
        wsSummary.Cell(1, 1).Style.Font.FontSize = 14;

        wsSummary.Cell(3, 1).Value = "Kunde:";
        wsSummary.Cell(3, 2).Value = customer.Name;
        wsSummary.Cell(4, 1).Value = "Projekt:";
        wsSummary.Cell(4, 2).Value = $"{project.Name} ({project.ProjectNumber})";
        wsSummary.Cell(5, 1).Value = "PO-Nummer:";
        wsSummary.Cell(5, 2).Value = project.PurchaseOrderNumber ?? "-";
        wsSummary.Cell(6, 1).Value = "Abrechnungsperiode:";
        wsSummary.Cell(6, 2).Value = timesheet.Period;
        wsSummary.Cell(7, 1).Value = "Version / Status:";
        wsSummary.Cell(7, 2).Value = $"v{timesheet.VersionNumber} ({timesheet.Status})";

        wsSummary.Cell(9, 1).Value = "Geleistete Ist-Stunden:";
        wsSummary.Cell(9, 2).Value = (double)timesheet.TotalActualHours;
        wsSummary.Cell(10, 1).Value = "Abrechenbare Stunden:";
        wsSummary.Cell(10, 2).Value = (double)timesheet.TotalBillableHours;
        wsSummary.Cell(11, 1).Value = "Stundensatz (Netto):";
        wsSummary.Cell(11, 2).Value = (double)project.DefaultHourlyRate;
        wsSummary.Cell(12, 1).Value = "Reisekosten (Netto):";
        wsSummary.Cell(12, 2).Value = (double)timesheet.TotalReimbursableExpenses;
        wsSummary.Cell(13, 1).Value = "Gesamtbetrag Netto:";
        wsSummary.Cell(13, 2).Value = (double)timesheet.TotalAmountNet;
        wsSummary.Cell(13, 2).Style.Font.Bold = true;

        wsSummary.Cell(15, 1).Value = "SHA-256 Datenhash:";
        wsSummary.Cell(15, 2).Value = timesheet.DataHashSha256;
        wsSummary.Columns().AdjustToContents();

        // 2. Tab: Zeiterfassung
        var wsTime = workbook.Worksheets.Add("Zeiterfassung");
        wsTime.Cell(1, 1).Value = "Datum";
        wsTime.Cell(1, 2).Value = "Von";
        wsTime.Cell(1, 3).Value = "Bis";
        wsTime.Cell(1, 4).Value = "Pause (Min)";
        wsTime.Cell(1, 5).Value = "Ist-Std";
        wsTime.Cell(1, 6).Value = "Abrechb. Std";
        wsTime.Cell(1, 7).Value = "Kategorie";
        wsTime.Cell(1, 8).Value = "Beschreibung";
        wsTime.Cell(1, 9).Value = "Ticket / Ref";
        wsTime.Row(1).Style.Font.Bold = true;

        int row = 2;
        foreach (var entry in timesheet.TimeEntries.OrderBy(e => e.Date).ThenBy(e => e.StartTime))
        {
            wsTime.Cell(row, 1).Value = entry.Date.ToString("yyyy-MM-dd");
            wsTime.Cell(row, 2).Value = entry.StartTime.ToString("HH:mm");
            wsTime.Cell(row, 3).Value = entry.EndTime.ToString("HH:mm");
            wsTime.Cell(row, 4).Value = entry.BreakMinutes;
            wsTime.Cell(row, 5).Value = (double)entry.ActualDurationHours;
            wsTime.Cell(row, 6).Value = (double)entry.BillableDurationHours;
            wsTime.Cell(row, 7).Value = entry.Category.ToString();
            wsTime.Cell(row, 8).Value = entry.ShortDescription;
            wsTime.Cell(row, 9).Value = entry.TaskOrTicketReference ?? "";
            row++;
        }
        wsTime.Columns().AdjustToContents();

        // 3. Tab: Fachlicher Tätigkeitsnachweis (§ 18 EStG)
        var wsEvidence = workbook.Worksheets.Add("Tätigkeitsnachweis_EStG");
        wsEvidence.Cell(1, 1).Value = "Datum";
        wsEvidence.Cell(1, 2).Value = "Kategorie";
        wsEvidence.Cell(1, 3).Value = "Kurzbeschreibung";
        wsEvidence.Cell(1, 4).Value = "Problemstellung";
        wsEvidence.Cell(1, 5).Value = "Methodik";
        wsEvidence.Cell(1, 6).Value = "Technische Leistung";
        wsEvidence.Cell(1, 7).Value = "Resultat";
        wsEvidence.Cell(1, 8).Value = "Artefakt / Deliverable";
        wsEvidence.Row(1).Style.Font.Bold = true;

        row = 2;
        foreach (var entry in timesheet.TimeEntries.Where(e => e.Evidence != null).OrderBy(e => e.Date))
        {
            wsEvidence.Cell(row, 1).Value = entry.Date.ToString("yyyy-MM-dd");
            wsEvidence.Cell(row, 2).Value = entry.Category.ToString();
            wsEvidence.Cell(row, 3).Value = entry.ShortDescription;
            wsEvidence.Cell(row, 4).Value = entry.Evidence!.ProblemStatement;
            wsEvidence.Cell(row, 5).Value = entry.Evidence!.Methodology;
            wsEvidence.Cell(row, 6).Value = entry.Evidence!.TechnicalActivity;
            wsEvidence.Cell(row, 7).Value = entry.Evidence!.Result;
            wsEvidence.Cell(row, 8).Value = entry.Evidence!.Deliverable ?? "";
            row++;
        }
        wsEvidence.Columns().AdjustToContents();

        // 4. Tab: Reisen & Belege
        if (timesheet.Trips.Any())
        {
            var wsTravel = workbook.Worksheets.Add("Reisen");
            wsTravel.Cell(1, 1).Value = "Datum";
            wsTravel.Cell(1, 2).Value = "Zweck";
            wsTravel.Cell(1, 3).Value = "Start";
            wsTravel.Cell(1, 4).Value = "Ziel";
            wsTravel.Cell(1, 5).Value = "Abwesenheit (h)";
            wsTravel.Cell(1, 6).Value = "Bahn-Arbeitszeit (h)";
            wsTravel.Cell(1, 7).Value = "Reisekosten Erstattung (€)";
            wsTravel.Row(1).Style.Font.Bold = true;

            row = 2;
            foreach (var trip in timesheet.Trips.OrderBy(t => t.Date))
            {
                wsTravel.Cell(row, 1).Value = trip.Date.ToString("yyyy-MM-dd");
                wsTravel.Cell(row, 2).Value = trip.Purpose;
                wsTravel.Cell(row, 3).Value = trip.OriginLocation;
                wsTravel.Cell(row, 4).Value = trip.DestinationLocation;
                wsTravel.Cell(row, 5).Value = (double)trip.TotalAbsenceHours;
                wsTravel.Cell(row, 6).Value = (double)trip.WorkTimeDuringTravelHours;
                wsTravel.Cell(row, 7).Value = (double)trip.CustomerReimbursableCost;
                row++;
            }
            wsTravel.Columns().AdjustToContents();
        }

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return Task.FromResult(memoryStream.ToArray());
    }
}
