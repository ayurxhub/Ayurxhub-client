import "./globals.css";
import ClientLayout from "./components/clientLayout";

export const metadata = {
  title: "AyurXHub — Ayurveda Medical Education Platform",
  description: "Learn Ayurveda with chapter-wise MCQ tests, BAMS study materials, expert consultations, and clinical references. India's modern Ayurveda EdTech platform.",
  keywords: "BAMS study material, Ayurveda MCQ tests, Ayurvedic consultation online, BAMS exam preparation, Dravyaguna, Kayachikitsa, Swasthavritta",
  verification: {
    google: "CGKmIK0gxcKaWKY-lrgDoEqm4PbVaqwxkCBp-dXpRNc",
  },
  openGraph: {
    title: "AyurXHub — Ayurveda Medical Education",
    description: "Chapter-wise tests, study materials, and expert consultations for BAMS students and Ayurvedic practitioners.",
    url: "https://ayurxhub.com",
    siteName: "AyurXHub",
    images: [{ url: "https://ayurxhub.com/hero.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AyurXHub — Ayurveda Medical Education",
    description: "BAMS tests, study materials, and Ayurvedic expert consultations.",
    images: ["https://ayurxhub.com/hero.png"],
  },
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