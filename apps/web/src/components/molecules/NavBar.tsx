"use client";

import Link from "next/link";
import { CartIndicator } from "@/components/atoms/CartIndicator";
import styles from "./NavBar.module.css";

export function NavBar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.logo}>
          Effect Eats
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Menu</Link>
          <Link href="/orders" className={styles.navLink}>Orders</Link>
          <Link href="/cart" className={styles.navLink}>
            Cart <CartIndicator />
          </Link>
          <Link href="/admin" className={styles.navLink}>Kitchen</Link>
        </div>
      </div>
    </nav>
  );
}
