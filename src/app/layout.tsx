// NO "use client" here
import "./globals.css";
import Script from "next/script";
import ClientLayout from "./components/clientLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500&display=swap"
        />
      </head>
      <body className="bg-[#f7f9fc] text-[#191c1e] antialiased">

        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}