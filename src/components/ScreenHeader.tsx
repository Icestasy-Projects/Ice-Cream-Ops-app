interface ScreenHeaderProps {
  icon: string;
  title: string;
  description: string;
}

export default function ScreenHeader({ icon, title, description }: ScreenHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl">{icon}</span>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <p className="text-gray-500 text-base leading-relaxed">{description}</p>
    </div>
  );
}
