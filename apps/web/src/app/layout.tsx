import type { Metadata } from "next";
import "./design-system.css";
import styles from "./layout.module.css";
import { NavBar } from "@/components/molecules/NavBar";

export const metadata: Metadata = {
  title: "Effect Eats",
  description: "Restaurant ordering app showcasing Effect architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
