"use client";
import React from "react";

function simpleGradient(address: string) {
  // derive two hex colors from address for a deterministic gradient
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash << 5) - hash + address.charCodeAt(i);
  const c1 = `hsl(${Math.abs(hash) % 360} 70% 50%)`;
  const c2 = `hsl(${(Math.abs(hash) + 60) % 360} 65% 45%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

export default function TokenLogo({
  logo,
  symbol,
  address,
  size = 32,
}: {
  logo?: string | null;
  symbol?: string | null;
  address: string;
  size?: number;
}) {
  const initials = (symbol || address || "?").slice(0, 3).toUpperCase();

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={symbol ?? address} style={{ width: size, height: size }} className="rounded-full object-cover" />
    );
  }

  return (
    <div
      style={{ width: size, height: size, background: simpleGradient(address) }}
      className="flex items-center justify-center rounded-full text-xs font-semibold text-white"
    >
      {initials}
    </div>
  );
}
