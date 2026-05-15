"use client";
import React from "react";

export default function NetWorthChart({ series }: { series: { timestamp: string; valueUsd: number }[] }) {
  if (!series || series.length === 0) {
    return <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">No net worth history available.</div>;
  }

  const points = series.map((p) => ({ x: new Date(p.timestamp).getTime(), y: p.valueUsd }));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = 600;
  const height = 120;

  const path = points
    .map((p, i) => {
      const x = ((p.x - minX) / (maxX - minX || 1)) * width;
      const y = height - ((p.y - minY) / (maxY - minY || 1)) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(2,8,23,0.25)]">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="block overflow-visible">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#g1)" />
        <path d={path} fill="none" stroke="#67e8f9" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-2 text-xs text-slate-400">Net worth over time</div>
    </div>
  );
}
