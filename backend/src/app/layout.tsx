// Minimal root layout required by Next.js App Router
// This is NOT a frontend component - it's required for API routes structure
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
