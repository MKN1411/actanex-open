// ActaNex Tax & Compliance Engine (§ 9 EStG, VMA, Pendlerpauschale & Vorsteuer)
export class TaxComplianceEngine {
  /**
   * Verpflegungsmehraufwand (VMA) nach deutschem Steuerrecht (§ 9 Abs. 4a EStG)
   */
  static calculateVMA(startDate: string, endDate: string, departureTime = '08:00', returnTime = '18:00'): { vmaTotal: number; daysCount: number; breakdown: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (startDate === endDate) {
      // Eintägige Dienstreise: > 8 Stunden = 14,00 €
      const [depH] = departureTime.split(':').map(Number);
      const [retH] = returnTime.split(':').map(Number);
      const hours = (retH || 18) - (depH || 8);
      if (hours >= 8) {
        return { vmaTotal: 14.00, daysCount: 1, breakdown: "Eintägige Reise > 8h: 14,00 €" };
      }
      return { vmaTotal: 0.00, daysCount: 1, breakdown: "Eintägige Reise < 8h: 0,00 €" };
    }

    if (diffDays === 2) {
      // 2 Tage: An- und Abreisetag je 14,00 €
      return { vmaTotal: 28.00, daysCount: 2, breakdown: "2 Tage (An-/Abreisetag je 14,00 €): 28,00 €" };
    }

    // Mehrere Tage: An- und Abreisetag je 14,00 €, Zwischentage je 28,00 €
    const intermediateDays = Math.max(0, diffDays - 2);
    const total = 14.00 + 14.00 + (intermediateDays * 28.00);
    return {
      vmaTotal: total,
      daysCount: diffDays,
      breakdown: `An-/Abreise (2x 14 €) + ${intermediateDays} volle Tage (je 28 €): ${total.toFixed(2)} €`
    };
  }

  /**
   * Fahrtkosten nach Entfernungspauschale / Kilometersatz (0,30 € / km)
   */
  static calculateMileage(distanceKm: number, ratePerKm = 0.30): number {
    return parseFloat((Math.max(0, distanceKm) * ratePerKm).toFixed(2));
  }
}
