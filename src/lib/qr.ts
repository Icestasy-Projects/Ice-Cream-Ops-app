/** Generate a label code: ICE-YYYYMMDD-{fg_units_id padded 4}-{seq padded 3} */
export function makeLabelCode(fgUnitsId: number, seq: number, date?: Date): string {
  const d = date ?? new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `ICE-${ymd}-${String(fgUnitsId).padStart(4, '0')}-${String(seq).padStart(3, '0')}`;
}

/** Render a label_code as a QR code data-URL (PNG). Lazy-imports qrcode for browser compat. */
export async function labelToDataUrl(labelCode: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(labelCode, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
