export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will go here */}
      <aside className="w-64 shrink-0 border-r border-border" />
      <div className="flex flex-1 flex-col">
        {/* Header will go here */}
        <header className="h-16 shrink-0 border-b border-border" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
