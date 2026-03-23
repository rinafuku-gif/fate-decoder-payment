"use client";

/**
 * LibraryBg — 図書館の空間を構成する背景
 * 左右の本棚 + 木の壁パネル + 棚板 + アーチ窓（星空）+ ビネット
 */
export default function LibraryBg() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true">
      {/* ── Wood panel wall (全体背景) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              87deg,
              transparent 0px,
              transparent 60px,
              rgba(201,169,110,0.008) 60px,
              rgba(201,169,110,0.008) 61px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 120px,
              rgba(140,100,50,0.012) 120px,
              rgba(140,100,50,0.012) 121px
            ),
            linear-gradient(180deg, var(--library-warm) 0%, var(--background) 40%, var(--library-dark) 100%)
          `,
        }}
      />

      {/* ── Left bookshelf (wider, denser) ── */}
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: "clamp(80px, 18vw, 180px)",
          background: `
            linear-gradient(to right,
              rgba(42,31,20,0.95) 0%,
              rgba(42,31,20,0.7) 60%,
              rgba(42,31,20,0.2) 85%,
              transparent 100%
            )
          `,
        }}
      >
        {/* Book spines (denser) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 12px,
                rgba(201,169,110,0.06) 12px,
                rgba(201,169,110,0.06) 14px,
                transparent 14px,
                transparent 28px,
                rgba(140,110,70,0.07) 28px,
                rgba(140,110,70,0.07) 30px,
                transparent 30px,
                transparent 44px,
                rgba(90,69,48,0.05) 44px,
                rgba(90,69,48,0.05) 46px,
                transparent 46px,
                transparent 56px,
                rgba(201,169,110,0.04) 56px,
                rgba(201,169,110,0.04) 58px
              )
            `,
          }}
        />
        {/* Shelf dividers (horizontal bars) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 110px,
                rgba(139,117,64,0.2) 110px,
                rgba(139,117,64,0.2) 113px,
                rgba(42,31,20,0.4) 113px,
                rgba(42,31,20,0.4) 116px,
                transparent 116px,
                transparent 118px
              )
            `,
          }}
        />
        {/* Brass shelf brackets */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 108px,
                rgba(201,169,110,0.1) 108px,
                rgba(201,169,110,0.1) 110px,
                transparent 110px,
                transparent 118px
              )
            `,
          }}
        />
      </div>

      {/* ── Right bookshelf ── */}
      <div
        className="absolute top-0 right-0 h-full"
        style={{
          width: "clamp(80px, 18vw, 180px)",
          background: `
            linear-gradient(to left,
              rgba(42,31,20,0.95) 0%,
              rgba(42,31,20,0.7) 60%,
              rgba(42,31,20,0.2) 85%,
              transparent 100%
            )
          `,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 15px,
                rgba(140,110,70,0.06) 15px,
                rgba(140,110,70,0.06) 17px,
                transparent 17px,
                transparent 32px,
                rgba(201,169,110,0.05) 32px,
                rgba(201,169,110,0.05) 34px,
                transparent 34px,
                transparent 48px,
                rgba(90,69,48,0.06) 48px,
                rgba(90,69,48,0.06) 50px,
                transparent 50px,
                transparent 62px,
                rgba(201,169,110,0.04) 62px,
                rgba(201,169,110,0.04) 64px
              )
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 125px,
                rgba(139,117,64,0.2) 125px,
                rgba(139,117,64,0.2) 128px,
                rgba(42,31,20,0.4) 128px,
                rgba(42,31,20,0.4) 131px,
                transparent 131px,
                transparent 133px
              )
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 123px,
                rgba(201,169,110,0.1) 123px,
                rgba(201,169,110,0.1) 125px,
                transparent 125px,
                transparent 133px
              )
            `,
          }}
        />
      </div>

      {/* ── Arched window (top center) — night sky visible ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "3%",
          width: "clamp(60px, 10vw, 100px)",
          height: "clamp(80px, 14vw, 140px)",
          borderRadius: "50px 50px 4px 4px",
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(10,14,24,0.9) 0%, rgba(10,14,24,0.95) 100%)
          `,
          border: "1px solid rgba(139,117,64,0.25)",
          boxShadow: "inset 0 0 20px rgba(10,14,24,0.5), 0 0 30px rgba(10,14,24,0.3)",
        }}
      >
        {/* Stars inside window */}
        {[
          { top: "20%", left: "30%", size: 2 },
          { top: "35%", left: "65%", size: 1.5 },
          { top: "15%", left: "55%", size: 1 },
          { top: "45%", left: "40%", size: 1.5 },
          { top: "25%", left: "75%", size: 1 },
          { top: "50%", left: "20%", size: 1 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              background: "var(--star-glow)",
              boxShadow: `0 0 ${star.size * 3}px rgba(212,200,160,0.4)`,
              opacity: 0.6 + Math.random() * 0.3,
            }}
          />
        ))}
        {/* Window frame divider (cross) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px" style={{ background: "rgba(139,117,64,0.3)" }} />
        <div className="absolute top-[55%] left-0 right-0 h-px" style={{ background: "rgba(139,117,64,0.25)" }} />
      </div>

      {/* ── Desk lamp light (focused right-upper glow) ── */}
      <div
        className="absolute"
        style={{
          top: "5%",
          right: "15%",
          width: "clamp(200px, 30vw, 400px)",
          height: "clamp(200px, 30vw, 400px)",
          background: "radial-gradient(ellipse at center, rgba(201,169,110,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* ── Vignette (stronger, more "enclosed" feeling) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(13,11,7,0.4) 55%, rgba(13,11,7,0.75) 100%)",
        }}
      />

      {/* ── Bottom: desk/floor shadow ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "15%",
          background: "linear-gradient(to top, rgba(13,11,7,0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
