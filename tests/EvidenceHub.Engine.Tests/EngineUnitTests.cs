using EvidenceHub.Domain.Enums;
using EvidenceHub.Domain.Models;
using EvidenceHub.Infrastructure.Services;
using FluentAssertions;
using Xunit;

namespace EvidenceHub.Engine.Tests;

public class Sha256HasherTests
{
    private readonly Sha256Hasher _hasher = new();

    [Fact]
    public void ComputeSha256_ShouldReturnConsistentHash_ForSameString()
    {
        var text = "Freelancer Evidence & Billing Hub 2026";
        var hash1 = _hasher.ComputeSha256(text);
        var hash2 = _hasher.ComputeSha256(text);

        hash1.Should().NotBeNullOrEmpty();
        hash1.Should().HaveLength(64); // SHA-256 hex length
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void ComputeTimesheetDataHash_ShouldBeDeterministic_RegardlessOfPropertyOrder()
    {
        var ts1 = CreateSampleTimesheet();
        var ts2 = CreateSampleTimesheet();

        var hash1 = _hasher.ComputeTimesheetDataHash(ts1);
        var hash2 = _hasher.ComputeTimesheetDataHash(ts2);

        hash1.Should().Be(hash2);
    }

    [Fact]
    public void ComputeIdempotencyKey_ShouldProduceUniqueHash_PerBatch()
    {
        var key1 = _hasher.ComputeIdempotencyKey("prj_1", "2026-09", 1, "batch_01");
        var key2 = _hasher.ComputeIdempotencyKey("prj_1", "2026-09", 1, "batch_02");

        key1.Should().NotBe(key2);
    }

    private static TimesheetVersion CreateSampleTimesheet()
    {
        return new TimesheetVersion
        {
            Id = "ts_test",
            ProjectId = "prj_test",
            Period = "2026-09",
            VersionNumber = 1,
            TimeEntries = new List<TimeEntry>
            {
                new()
                {
                    Date = new DateOnly(2026, 9, 1),
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(17, 0),
                    BreakMinutes = 30,
                    BillableDurationHours = 7.5m,
                    Category = ActivityCategory.Architecture,
                    ShortDescription = "Architekturkonzept",
                    Evidence = new ActivityEvidence
                    {
                        ProblemStatement = "Unzureichende DLP",
                        Methodology = "Ist-Analyse",
                        TechnicalActivity = "Policy Design",
                        Result = "Blueprint"
                    }
                }
            }
        };
    }
}

public class TimesheetRendererAndExporterTests
{
    private readonly QuestPdfTimesheetRenderer _pdfRenderer = new();
    private readonly ClosedXmlTimesheetExporter _xlsxExporter = new();

    [Fact]
    public async Task RenderPdfAsync_ShouldGenerateValidPdfBytes()
    {
        var (timesheet, project, customer) = CreateTestSetup();

        var pdfBytes = await _pdfRenderer.RenderPdfAsync(timesheet, project, customer);

        pdfBytes.Should().NotBeNull();
        pdfBytes.Length.Should().BeGreaterThan(1000); // Standard PDF > 1KB
        
        // PDF Header Signature "%PDF-"
        var header = System.Text.Encoding.ASCII.GetString(pdfBytes.Take(5).ToArray());
        header.Should().Be("%PDF-");
    }

    [Fact]
    public async Task ExportXlsxAsync_ShouldGenerateValidXlsxBytes()
    {
        var (timesheet, project, customer) = CreateTestSetup();

        var xlsxBytes = await _xlsxExporter.ExportXlsxAsync(timesheet, project, customer);

        xlsxBytes.Should().NotBeNull();
        xlsxBytes.Length.Should().BeGreaterThan(1000);

        // ZIP header signature for XLSX "PK"
        xlsxBytes[0].Should().Be(0x50); // 'P'
        xlsxBytes[1].Should().Be(0x4B); // 'K'
    }

    private static (TimesheetVersion, Project, Customer) CreateTestSetup()
    {
        var customer = new Customer { Name = "Test Kunde GmbH", ContactPerson = "Max Mustermann" };
        var project = new Project { Name = "Test Projekt", DefaultHourlyRate = 120.0m, ProjectNumber = "PRJ-01" };
        var timesheet = new TimesheetVersion
        {
            Period = "2026-09",
            VersionNumber = 1,
            TotalActualHours = 8.0m,
            TotalBillableHours = 8.0m,
            TotalAmountNet = 960.0m,
            DataHashSha256 = "abcdef1234567890",
            TimeEntries = new List<TimeEntry>
            {
                new()
                {
                    Date = new DateOnly(2026, 9, 10),
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(17, 0),
                    BreakMinutes = 0,
                    BillableDurationHours = 8.0m,
                    Category = ActivityCategory.Engineering,
                    ShortDescription = "Implementierung der Schnittstelle"
                }
            }
        };

        return (timesheet, project, customer);
    }
}
