"use client";

import { useMemo } from "react";

const COLORS = [
  "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
  "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
  "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
  "radial-gradient(circle, #6366f1 0%, transparent 70%)",
];

const DOT_COUNT = 8;

export function BackgroundDots() {
  const dots = useMemo(() => {
    const items = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      items.push({
        id: i,
        top: (i / DOT_COUNT) * 100,
        left: (i * 37 + 10) % 85,
        size: 350 + (i * 47) % 180,
        bg: COLORS[i % COLORS.length],
        delay: -(i * 3),
      });
    }
    return items;
  }, []);

  return (
    <div className="bg-dots">
      {dots.map((d) => (
        <span
          key={d.id}
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background: d.bg,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
