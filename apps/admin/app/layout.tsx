import "./globals.css";
import { Providers } from "./providers";
import type { ReactNode } from "react";

export const metadata = {
  title: "RideWithMe Admin",
  description: "Admin dashboard for RideWithMe"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
