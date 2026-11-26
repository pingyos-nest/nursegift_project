"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => 0;

export function Clock() {
  const second = useSyncExternalStore(subscribe, getSecond, getServerSnapshot);
  return (
    <p className="mt-3 h-6 text-sm tabular-nums text-stone-500">
      {second > 0 &&
        new Date(second * 1000).toLocaleString("th-TH", {
          year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })}
    </p>
  );
}
