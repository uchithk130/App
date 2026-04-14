"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Checkout is now integrated into the basket page. Redirect. */
export default function CheckoutRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/cart");
  }, [router]);
  return null;
}
