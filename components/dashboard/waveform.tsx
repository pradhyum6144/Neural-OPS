"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 12;

interface WaveformProps {
  active: boolean;
  color?: string;
}

export function Waveform({ active, color = "#6366f1" }: WaveformProps) {
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: color, originY: 1 }}
          animate={
            active
              ? {
                  scaleY: [0.15, 0.6 + Math.random() * 0.8, 0.2, 0.9, 0.15],
                  opacity: [0.5, 1, 0.6, 1, 0.5],
                }
              : { scaleY: 0.12, opacity: 0.3 }
          }
          transition={
            active
              ? {
                  duration: 0.8 + (i % 4) * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.06,
                }
              : { duration: 0.3 }
          }
          initial={{ scaleY: 0.12, height: 20 }}
        />
      ))}
    </div>
  );
}
