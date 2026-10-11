import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "NEXUS — The Living Intelligence Layer for the Physical World",
  description: "Live operational world model, spatial intelligence, and automated response orchestration.",
};

import { JudgeDemoController } from "@/components/command-center/JudgeDemoController";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* CesiumJS Stylesheet */}
        <link
          rel="stylesheet"
          href="https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/Widgets/widgets.css"
        />
      </head>
      <body className="antialiased bg-space-950 text-slate-100 min-h-screen overflow-x-hidden overflow-y-auto">
        {children}
        <JudgeDemoController />
      </body>
    </html>
  );
}
