import { cn } from '@/lib/utils';

interface FuelGaugeProps {
  current: number;
  reorderPoint: number;
  weeklyUsage?: number | null;
  unit: string;
  label: string;
  qtyToAct?: number | null;
  actionLabel?: string;
}

export default function FuelGauge({ current, reorderPoint, weeklyUsage, unit, label, qtyToAct, actionLabel }: FuelGaugeProps) {
  const fullLevel = reorderPoint > 0 ? reorderPoint * 2.5 : Math.max(current * 1.5, 1);
  const pct = Math.min((current / fullLevel) * 100, 100);
  const isLow = current <= reorderPoint;
  const isCritical = current <= reorderPoint * 0.5;

  const color = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-green-500';
  const bgColor = isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-green-50';
  const borderColor = isCritical ? 'border-red-200' : isLow ? 'border-amber-200' : 'border-green-200';
  const textColor = isCritical ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-green-700';
  const status = isCritical ? '🔴 Critical' : isLow ? '🟡 Running Low' : '🟢 Good';

  const weeksLeft = weeklyUsage && weeklyUsage > 0 ? (current / weeklyUsage).toFixed(1) : null;

  return (
    <div className={cn('rounded-3xl border p-4 space-y-3', bgColor, borderColor)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 text-base leading-tight">{label}</p>
          {weeksLeft && (
            <p className="text-xs text-gray-500 mt-0.5">
              ~{weeksLeft} weeks of stock
            </p>
          )}
        </div>
        <span className={cn('text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap', textColor,
          isCritical ? 'bg-red-100' : isLow ? 'bg-amber-100' : 'bg-green-100')}>
          {status}
        </span>
      </div>

      <div className="relative">
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', color)}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        {reorderPoint > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-600 opacity-60"
            style={{ left: `${Math.min((reorderPoint / fullLevel) * 100, 98)}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className={cn('text-lg font-bold', textColor)}>
            {current % 1 === 0 ? current : current.toFixed(1)} {unit}
          </p>
          <p className="text-xs text-gray-500">in stock now</p>
        </div>
        {reorderPoint > 0 && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              Reorder at {reorderPoint} {unit}
            </p>
            {qtyToAct && qtyToAct > 0 && actionLabel && (
              <p className={cn('text-sm font-bold mt-0.5', textColor)}>
                {actionLabel}: {qtyToAct % 1 === 0 ? qtyToAct : qtyToAct.toFixed(1)} {unit}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
