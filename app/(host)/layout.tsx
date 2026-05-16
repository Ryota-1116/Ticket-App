import "../globals.css";

export default function HostRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
