import { Env } from "../types";
import { jsonResponse } from "../utils/http";

export async function handleDashboardRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  if (path === "/api/v1/dashboard/stats" && method === "GET") {
    // 1. Offene Zeiten
    const { results: openTimeEntries } = await env.DB.prepare(`
      SELECT t.*, p.default_hourly_rate, tv.status as ts_status, tv.is_invoice_canceled
      FROM time_entries t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
      WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
        AND p.is_active = 1 AND p.is_archived = 0 AND t.is_billable = 1
    `).all<any>();

    const openHours = (openTimeEntries || []).reduce(
      (sum, e) => sum + (e.billable_duration_hours || 0),
      0
    );
    const openTimeAmountNet = (openTimeEntries || []).reduce(
      (sum, e) =>
        sum +
        (e.billable_duration_hours || 0) *
          (e.billing_rate_snapshot || e.default_hourly_rate || 0),
      0
    );

    // 2. Offene Reisekosten
    const { results: openTrips } = await env.DB.prepare(`
      SELECT tr.*, tv.status as ts_status, tv.is_invoice_canceled
      FROM trips tr
      JOIN projects p ON tr.project_id = p.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
        AND p.is_active = 1 AND p.is_archived = 0
    `).all<any>();

    const openTravelAmountNet = (openTrips || []).reduce(
      (sum, tr) => sum + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0),
      0
    );
    const openTotalNet = openTimeAmountNet + openTravelAmountNet;

    // 3. Fakturierter / Genehmigter Umsatz der letzten 3 Monate
    const now = new Date();
    const past3Months = [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const { results: invoicedTimesheets } = await env.DB.prepare(`
      SELECT tv.*, p.name as project_name, c.name as customer_name
      FROM timesheet_versions tv
      JOIN projects p ON tv.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      WHERE (tv.status IN ('Approved', 'Invoiced') OR tv.lexware_invoice_id IS NOT NULL)
        AND tv.is_invoice_canceled = 0
        AND tv.period IN (?, ?, ?)
        AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
    `)
      .bind(past3Months[0], past3Months[1], past3Months[2])
      .all<any>();

    const past3MonthsRevenue = (invoicedTimesheets || []).reduce(
      (sum, ts) => sum + (ts.total_amount_net || 0),
      0
    );

    // 4. Laufende Projekte, Restbudgets & Umsatz-Forecast für die nächsten 3 Monate
    const { results: activeProjects } = await env.DB.prepare(`
      SELECT p.*, c.name as customer_name,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.is_active = 1 AND p.is_archived = 0 AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
      ORDER BY p.name ASC
    `).all<any>();

    const projectsList = (activeProjects || []).map((p) => {
      const plannedHours = p.planned_hours || 0;
      const defaultRate = p.default_hourly_rate || 0;
      const totalBudgetNet = p.total_budget_net || plannedHours * defaultRate;
      const recordedHours = p.recorded_hours || 0;
      const recordedAmountNet = p.recorded_amount_net || 0;
      const remainingHours = Math.max(0, plannedHours - recordedHours);
      const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
      const usagePercent =
        totalBudgetNet > 0
          ? Math.min(100, Math.round((recordedAmountNet / totalBudgetNet) * 100))
          : 0;

      return {
        id: p.id,
        name: p.name,
        projectNumber: p.project_number,
        customerName: p.customer_name,
        defaultHourlyRate: defaultRate,
        plannedHours,
        recordedHours,
        remainingHours,
        totalBudgetNet,
        recordedAmountNet,
        remainingBudgetNet,
        budgetUsagePercent: usagePercent,
        startDate: p.start_date,
        endDate: p.end_date,
        quotationNumber: p.lexware_quotation_number,
        orderConfirmationNumber: p.lexware_order_confirmation_number,
      };
    });

    const next3MonthsForecast = projectsList.reduce((sum, p) => sum + p.remainingBudgetNet, 0);

    // 5. Neueste Leistungsnachweise
    const { results: recentTimesheets } = await env.DB.prepare(`
      SELECT tv.*, p.name as project_name, p.project_number, c.name as customer_name
      FROM timesheet_versions tv
      JOIN projects p ON tv.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.is_archived = 0
        AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
      ORDER BY tv.period DESC, tv.created_at_utc DESC
      LIMIT 10
    `).all<any>();

    return jsonResponse({
      success: true,
      openBilling: {
        hours: openHours,
        timeAmountNet: openTimeAmountNet,
        travelAmountNet: openTravelAmountNet,
        totalNet: openTotalNet,
      },
      past3Months: {
        periods: past3Months,
        totalRevenueNet: past3MonthsRevenue,
        timesheetsCount: (invoicedTimesheets || []).length,
      },
      forecast3Months: {
        totalForecastNet: next3MonthsForecast,
        activeProjectsCount: projectsList.length,
      },
      projects: projectsList,
      recentTimesheets: recentTimesheets || [],
    });
  }

  return null;
}
