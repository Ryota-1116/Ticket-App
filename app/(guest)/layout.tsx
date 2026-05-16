import "../globals.css";

export default function GuestRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white antialiased">{children}</body>
    </html>
  );
}
