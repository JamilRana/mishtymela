import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
