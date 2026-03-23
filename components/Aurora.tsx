"use client";

/**
 * LibraryGlow — Warm lamp light glows replacing cosmic aurora.
 * Creates the feeling of reading by lamplight in an old library.
 */

export default function Aurora() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top-right: warm amber lamp glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(180,140,80,0.35) 0%, rgba(30,25,15,0) 70%)",
          top: "-8%",
          right: "-10%",
          animation: "lampGlow1 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Bottom-left: deeper warm shadow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-12"
        style={{
          background: "radial-gradient(circle, rgba(140,100,50,0.25) 0%, rgba(20,15,10,0) 70%)",
          bottom: "-5%",
          left: "-8%",
          animation: "lampGlow2 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Center: faint reading-light warmth */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-8"
        style={{
          background: "radial-gradient(circle, rgba(200,165,100,0.15) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <style jsx global>{`
        @keyframes lampGlow1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-15px, 20px) scale(1.03); opacity: 0.25; }
          66% { transform: translate(10px, -10px) scale(0.97); opacity: 0.18; }
        }
        @keyframes lampGlow2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .absolute[style*="lampGlow"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
