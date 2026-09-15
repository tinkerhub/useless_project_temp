import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anti-Social — Connect. Share. Be Completely Isolated.",
  description: "The social network where everyone is connected and completely isolated. Your posts are hidden from everyone, including yourself.",
  keywords: ["social media", "anti-social", "useless", "hidden posts"],
  openGraph: {
    title: "Anti-Social",
    description: "The world's most honest social network.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
