#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const POLL_INTERVAL_MS = 2_000;

async function tick() {
  try {
    const res = await fetch(`${BASE_URL}/api/cron/process-orders`);
    const data = await res.json();
    if (data.processed > 0) {
      console.log(
        `[order-processor] Advanced ${data.processed} order(s):`,
        data.transitions.map((t) => `${t.orderId} ${t.from}→${t.to}`).join(", ")
      );
    }
  } catch {
    // server not ready yet, ignore
  }
}

console.log(`[order-processor] Polling ${BASE_URL}/api/cron/process-orders every ${POLL_INTERVAL_MS / 1000}s`);
setInterval(tick, POLL_INTERVAL_MS);
