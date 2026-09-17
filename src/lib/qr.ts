/** Generate a label code: ICE-YYYYMMDD-{fg_units_id padded 4}-{seq padded 3} */
export function makeLabelCode(fgUnitsId: number, seq: number, date?: Date): string {
  const d = date ?? new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `ICE-${ymd}-${String(fgUnitsId).padStart(4, '0')}-${String(seq).padStart(3, '0')}`;
}
