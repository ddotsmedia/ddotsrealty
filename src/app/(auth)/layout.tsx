export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          Ddots<span className="text-yellow-500">Realty</span>
        </span>
        <p className="text-sm text-muted-foreground">UAE Real Estate Platform</p>
      </div>
      {children}
    </div>
  );
}
