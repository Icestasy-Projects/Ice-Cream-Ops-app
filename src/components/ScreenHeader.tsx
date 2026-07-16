interface ScreenHeaderProps {
  icon: string;
  title: string;
  description: string;
}

export default function ScreenHeader({ icon, title, description }: ScreenHeaderProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-2xl leading-none">{icon}</span>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
