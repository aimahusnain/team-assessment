import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarPageTemplate from "@/components/sidebar_page_template";
import ThemeContextProvider from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Assessment",
  description: "Team Assessment is a tool for assessing team performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-black dark:text-white`}
      >
        <ThemeContextProvider>
          <SidebarPageTemplate>{children}</SidebarPageTemplate>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
