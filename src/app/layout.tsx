import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helena Hair – Prenota il tuo appuntamento",
  description: "Prenota il tuo servizio con Helena, hair stylist freelance a Milano",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
