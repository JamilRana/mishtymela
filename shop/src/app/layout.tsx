import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e293b",
};

export const metadata: Metadata = {
  title: "মিষ্টি মেলা (Mishty Mela) | ত্রিশাল - ঐতিহ্যবাহী মিষ্টি ও দই",
  description:
    "ত্রিশালের সেরা খাঁটি মিষ্টি, স্পেশাল রসমালাই, বগুড়ার মিষ্টি দই ও গাওয়া ঘি। খুচরা বিক্রয় ও যেকোনো অনুষ্ঠানের জন্য পাইকারি মিষ্টির অর্ডার গ্রহণ করা হয়।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
