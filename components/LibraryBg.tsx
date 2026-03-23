"use client";

/**
 * LibraryBg — 左右の本棚シルエット + ビネット効果
 * CSS グラデーションのみ。画像不要。
 */
export default function LibraryBg() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true">
      {/* ── Left bookshelf ── */}
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: "clamp(60px, 12vw, 120px)",
          background: `
            linear-gradient(to right,
              rgba(18,16,12,0.95) 0%,
              rgba(18,16,12,0.6) 70%,
              transparent 100%
            )
          `,
        }}
      >
        {/* Book spines */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 18px,
                rgba(201,169,110,0.04) 18px,
                rgba(201,169,110,0.04) 20px,
                transparent 20px,
                transparent 45px,
                rgba(140,110,70,0.05) 45px,
                rgba(140,110,70,0.05) 47px,
                transparent 47px,
                transparent 72px,
                rgba(201,169,110,0.03) 72px,
                rgba(201,169,110,0.03) 74px
              )
            `,
          }}
        />
        {/* Shelf dividers */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 140px,
                rgba(80,65,40,0.12) 140px,
                rgba(80,65,40,0.12) 143px,
                transparent 143px,
                transparent 145px
              )
            `,
          }}
        />
      </div>

      {/* ── Right bookshelf ── */}
      <div
        className="absolute top-0 right-0 h-full"
        style={{
          width: "clamp(60px, 12vw, 120px)",
          background: `
            linear-gradient(to left,
              rgba(18,16,12,0.95) 0%,
              rgba(18,16,12,0.6) 70%,
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
                transparent 25px,
                rgba(140,110,70,0.04) 25px,
                rgba(140,110,70,0.04) 27px,
                transparent 27px,
                transparent 55px,
                rgba(201,169,110,0.03) 55px,
                rgba(201,169,110,0.03) 57px,
                transparent 57px,
                transparent 80px,
                rgba(201,169,110,0.04) 80px,
                rgba(201,169,110,0.04) 82px
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
                transparent 160px,
                rgba(80,65,40,0.12) 160px,
                rgba(80,65,40,0.12) 163px,
                transparent 163px,
                transparent 165px
              )
            `,
          }}
        />
      </div>

      {/* ── Vignette ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(12,10,8,0.45) 70%, rgba(12,10,8,0.7) 100%)",
        }}
      />
    </div>
  );
}
