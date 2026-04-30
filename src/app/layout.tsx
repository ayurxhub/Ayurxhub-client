import "./globals.css";
import ClientLayout from "./components/clientLayout";

export const metadata = {
  title: "AyuRxHub",
  description: "Integrative Ayurvedic Care Platform",
  icons: {
    icon: "/Ayurxhub logo.png",
  },
};

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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display&family=Inter"
        />
      </head>
      <body className="bg-[#f7f9fc] text-[#191c1e] antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}