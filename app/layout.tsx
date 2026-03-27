import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeacherMate",
  description: "Tao de trac nghiem bang AI, cho hoc sinh lam bai va cham diem tu dong."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
