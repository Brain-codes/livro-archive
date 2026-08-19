import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Livro Archive — Books, Stationery & More",
    template: "%s · Livro Archive",
  },
  description:
    "Livro Archive is a books and stationery store — novels, textbooks, notebooks and classroom supplies, with guest checkout and real order tracking.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
