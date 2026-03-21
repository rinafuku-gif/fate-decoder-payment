"use client";

export default function Aurora() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(201,169,110,0.4) 0%, rgba(30,42,74,0) 70%)",
          top: "-10%",
          right: "-15%",
          animation: "aurora1 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(120,80,180,0.3) 0%, rgba(30,42,74,0) 70%)",
          bottom: "-5%",
          left: "-10%",
          animation: "aurora2 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <style jsx global>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 40px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .absolute[style*="aurora"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
