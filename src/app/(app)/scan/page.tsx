'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import { QrCode, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

type MovementType = 'production_in' | 'storage_putaway' | 'dispatch_out' | 'wastage' | 'transfer';

interface LabelInfo {
  label_code: string;
  qty: number;
  fg_sku_id: number;
  product_name: string;
  unit: string;
  produced_at: string;
  last_movement: string | null;
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  production_in:    'Production In',
  storage_putaway:  'Put into Cold Storage',
  dispatch_out:     'Dispatch Out',
  wastage:          'Record Wastage',
  transfer:         'Transfer',
};

const WASTAGE_REASONS = ['Melting', 'Damage', 'Expiry', 'Quality Rejection', 'Other'];

export default function ScanPage() {
  const supabase = createClient();
  const { user } = useUser();

  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const [labelInfo, setLabelInfo] = useState<LabelInfo | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [looking, setLooking] = useState(false);

  const [movement, setMovement] = useState<MovementType>('storage_putaway');
  const [wastageReason, setWastageReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState('');

  // Offline queue — persist to localStorage
  const [offlineQueue, setOfflineQueue] = useState<object[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fg_scan_queue') ?? '[]');
    } catch { return []; }
  });

  function saveQueue(q: object[]) {
    setOfflineQueue(q);
    try { localStorage.setItem('fg_scan_queue', JSON.stringify(q)); } catch { /* ignore */ }
  }

  async function flushQueue() {
    if (offlineQueue.length === 0) return;
    const { error } = await supabase.schema('production').from('fg_scan_log').insert(offlineQueue);
    if (!error) {
      saveQueue([]);
      toast.success(`Synced ${offlineQueue.length} offline scan(s).`);
    }
  }

  // Flush when page loads (reconnect)
  useEffect(() => { flushQueue(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startScanner() {
    if (scanning) return;
    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('qr-reader');
    html5QrRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text: string) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          lookupLabel(text.trim());
        },
        () => { /* scan errors are normal */ }
      );
    } catch {
      setScanning(false);
      toast.error('Could not access camera. Use manual entry instead.');
    }
  }

  function stopScanner() {
    html5QrRef.current?.stop().catch(() => {});
    setScanning(false);
  }

  useEffect(() => () => { html5QrRef.current?.stop().catch(() => {}); }, []);

  async function lookupLabel(code: string) {
    setLookupError('');
    setLabelInfo(null);
    setLastResult('');
    setLooking(true);
    try {
      const { data, error } = await supabase
        .schema('production')
        .from('fg_labels')
        .select(`
          label_code, qty, fg_sku_id, produced_at,
          fg_units!inner(fg_sku_id)
        `)
        .eq('label_code', code)
        .single();

      if (error || !data) {
        setLookupError(`Label "${code}" not found. Check the code and try again.`);
        setLooking(false);
        return;
      }

      // Get last movement from scan log
      const { data: lastScan } = await supabase
        .schema('production')
        .from('fg_scan_log')
        .select('movement_type, scanned_at')
        .eq('label_code', code)
        .order('scanned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get SKU product name
      const { data: skuData } = await supabase
        .schema('production')
        .from('v_fg_stock')
        .select('product_name, unit')
        .eq('fg_sku_id', data.fg_sku_id)
        .maybeSingle();

      setLabelInfo({
        label_code: data.label_code,
        qty: data.qty,
        fg_sku_id: data.fg_sku_id,
        product_name: (skuData as Record<string,string> | null)?.product_name ?? `SKU #${data.fg_sku_id}`,
        unit: (skuData as Record<string,string> | null)?.unit ?? 'tubs',
        produced_at: data.produced_at,
        last_movement: lastScan
          ? `${MOVEMENT_LABELS[lastScan.movement_type as MovementType]} on ${new Date(lastScan.scanned_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`
          : null,
      });
    } finally {
      setLooking(false);
    }
  }

  function reset() {
    setLabelInfo(null);
    setLookupError('');
    setManualCode('');
    setMovement('storage_putaway');
    setWastageReason('');
    setNote('');
    setLastResult('');
  }

  async function handleConfirm() {
    if (!labelInfo) return;
    if (movement === 'wastage' && !wastageReason) {
      toast.error('Please select a wastage reason.');
      return;
    }
    setSubmitting(true);

    const row = {
      label_code:     labelInfo.label_code,
      movement_type:  movement,
      wastage_reason: movement === 'wastage' ? wastageReason : null,
      scanned_by:     user?.id,
      note:           note || null,
    };

    const { error } = await supabase.schema('production').from('fg_scan_log').insert(row);
    if (error) {
      // Queue for later if offline
      const q = [...offlineQueue, row];
      saveQueue(q);
      toast('Saved offline. Will sync when connection is restored.', { icon: '📶' });
    } else {
      setLastResult(`Recorded: ${MOVEMENT_LABELS[movement]} for ${labelInfo.label_code}`);
      toast.success('Scan recorded!');
    }

    setSubmitting(false);
    reset();
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={QrCode} iconColor="text-teal-500"
        title="Scan Tub Label"
        description="Scan a QR label to record a stock movement — put-away, dispatch, wastage or transfer."
      />

      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-medium">{offlineQueue.length} scan(s) queued offline</p>
          <button onClick={flushQueue} className="text-sm font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl">Sync Now</button>
        </div>
      )}

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-800 font-medium">{lastResult}</p>
        </div>
      )}

      {/* Camera scanner */}
      {!labelInfo && (
        <div className="card space-y-4">
          <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden bg-black min-h-[200px]" />

          {!scanning ? (
            <button onClick={startScanner} className="btn-primary w-full">
              Open Camera to Scan
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-secondary w-full">
              Stop Camera
            </button>
          )}

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or enter manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="ICE-20260917-0042-001"
              className="input-field flex-1 font-mono text-sm"
              onKeyDown={e => e.key === 'Enter' && manualCode && lookupLabel(manualCode)}
            />
            <button
              onClick={() => manualCode && lookupLabel(manualCode)}
              disabled={!manualCode || looking}
              className="btn-primary px-4 shrink-0"
            >
              {looking ? <Loader2 size={16} className="animate-spin" /> : 'Look up'}
            </button>
          </div>

          {lookupError && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {lookupError}
            </div>
          )}
        </div>
      )}

      {/* Movement form */}
      {labelInfo && (
        <div className="card space-y-4">
          {/* Label info */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
            <p className="font-mono text-xs text-teal-600 mb-0.5">{labelInfo.label_code}</p>
            <p className="font-bold text-gray-900 text-lg">{labelInfo.product_name}</p>
            <p className="text-sm text-gray-600">{labelInfo.qty} {labelInfo.unit} · produced {new Date(labelInfo.produced_at).toLocaleDateString('en-IN')}</p>
            {labelInfo.last_movement && (
              <p className="text-xs text-gray-400 mt-1">Last: {labelInfo.last_movement}</p>
            )}
          </div>

          {/* Movement type */}
          <div>
            <label className="label-text block mb-2">Movement Type</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(MOVEMENT_LABELS) as [MovementType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setMovement(type)}
                  className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                    movement === type
                      ? type === 'wastage'
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                  }`}
                >
                  {label}
                  {type === 'wastage' && <span className="ml-2 text-xs font-normal text-red-500">Requires reason</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Wastage reason */}
          {movement === 'wastage' && (
            <div>
              <label className="label-text block mb-2">Wastage Reason <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {WASTAGE_REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setWastageReason(r)}
                    className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      wastageReason === r
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="label-text block mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any notes..."
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={submitting || (movement === 'wastage' && !wastageReason)}
              className={`flex-1 font-bold py-3 rounded-xl transition-all ${
                movement === 'wastage'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'btn-primary'
              } disabled:opacity-50`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : `Confirm ${MOVEMENT_LABELS[movement]}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
