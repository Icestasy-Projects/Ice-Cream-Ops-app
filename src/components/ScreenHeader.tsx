import type { LucideIcon } from 'lucide-react';

interface ScreenHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
}

export default function ScreenHeader({ icon: Icon, iconColor = 'text-brand-500', title, description }: ScreenHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={30} className={iconColor} strokeWidth={1.7} />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <p className="text-gray-500 text-base leading-relaxed">{description}</p>
    </div>
  );
}
