import NavBar from '@/components/NavBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <NavBar />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
