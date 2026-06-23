export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-base">{text}</p>
    </div>
  );
}
