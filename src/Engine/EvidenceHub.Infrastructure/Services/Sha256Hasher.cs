using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EvidenceHub.Domain.Interfaces;
using EvidenceHub.Domain.Models;

namespace EvidenceHub.Infrastructure.Services;

/// <summary>
/// Deterministischer SHA-256 Hashing-Dienst für Datenintegrität und Revisionssicherheit (GoBD).
/// </summary>
public class Sha256Hasher : IHashService
{
    public string ComputeSha256(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);
        var hash = SHA256.HashData(data);
        return Convert.ToHexStringLower(hash);
    }

    public string ComputeSha256(string utf8Text)
    {
        ArgumentNullException.ThrowIfNull(utf8Text);
        var bytes = Encoding.UTF8.GetBytes(utf8Text);
        return ComputeSha256(bytes);
    }

    /// <summary>
    /// Berechnet einen deterministischen Hash über alle relevanten Zeiten, Evidence-Felder und Reisen eines Stundenzettels.
    /// </summary>
    public string ComputeTimesheetDataHash(TimesheetVersion timesheet)
    {
        ArgumentNullException.ThrowIfNull(timesheet);

        // Normalisiertes DTO für deterministische JSON-Serialisierung
        var normalized = new
        {
            timesheet.ProjectId,
            timesheet.Period,
            timesheet.VersionNumber,
            TimeEntries = timesheet.TimeEntries
                .OrderBy(t => t.Date)
                .ThenBy(t => t.StartTime)
                .Select(t => new
                {
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    StartTime = t.StartTime.ToString("HH:mm"),
                    EndTime = t.EndTime.ToString("HH:mm"),
                    t.BreakMinutes,
                    t.ActualDurationHours,
                    t.BillableDurationHours,
                    Category = t.Category.ToString(),
                    t.ShortDescription,
                    Evidence = t.Evidence == null ? null : new
                    {
                        t.Evidence.ProblemStatement,
                        t.Evidence.Methodology,
                        t.Evidence.TechnicalActivity,
                        t.Evidence.Result,
                        t.Evidence.Responsibility,
                        t.Evidence.Deliverable
                    }
                }),
            Trips = timesheet.Trips
                .OrderBy(tr => tr.Date)
                .Select(tr => new
                {
                    Date = tr.Date.ToString("yyyy-MM-dd"),
                    tr.Purpose,
                    tr.OriginLocation,
                    tr.DestinationLocation,
                    tr.TotalAbsenceHours,
                    tr.ElapsedTravelHours,
                    tr.WorkTimeDuringTravelHours,
                    tr.BillableTravelHours,
                    tr.CustomerReimbursableCost,
                    Segments = tr.Segments.OrderBy(s => s.SequenceNumber).Select(s => new
                    {
                        s.SequenceNumber,
                        Mode = s.Mode.ToString(),
                        s.FromLocation,
                        s.ToLocation,
                        s.DurationMinutes,
                        s.OperatorAndLine
                    })
                })
        };

        var json = JsonSerializer.Serialize(normalized, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return ComputeSha256(json);
    }

    /// <summary>
    /// Berechnet einen stabilen Idempotenzschlüssel für die Rechnungsanlage in Lexware.
    /// </summary>
    public string ComputeIdempotencyKey(string projectId, string period, int versionNumber, string batchId)
    {
        var raw = $"{projectId}:{period}:v{versionNumber}:{batchId}";
        return ComputeSha256(raw);
    }
}
