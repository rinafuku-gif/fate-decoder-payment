"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ShareCardProps {
  characterName: string;
  characterAvatar: string;
  characterId: string;
  userName: string;
  topicLabel: string;
  oneWord: string;
  bookTitle?: string;
  westernSign?: string;
  kin?: number;
  glyph?: string;
  siteUrl: string;
}

export default function ShareCard({
  characterName,
  characterAvatar,
  characterId,
  userName,
  topicLabel,
  oneWord,
  bookTitle,
  westernSign,
  kin,
  glyph,
  siteUrl,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const domToImage = (await import("dom-to-image-more")).default;
      const node = cardRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const scale = 3; // 3x for Retina / SNS quality

      const blob = await domToImage.toBlob(node, {
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${width}px`,
          height: `${height}px`,
        },
        bgcolor: "#1a1410",
        quality: 1,
      });

      if (!blob) throw new Error("Failed to generate image");

      // Try native share (mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "star-library-result.png", { type: "image/png" });
        const shareData = { files: [file], title: "星の図書館", text: `「${bookTitle || oneWord}」\n${userName}の星の記録、読んでもらった` };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setSaving(false);
          return;
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "star-library-result.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="mb-8">
      {/* ── Capture target: NO border, NO shadow, NO borderRadius ── */}
      <div
        ref={cardRef}
        style={{
          background: "#1a1410",
          padding: "32px 28px",
          /* Explicitly no border/shadow/radius — clean capture */
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(201,169,110,0.3)" }}>✦</span>
          <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(201,169,110,0.45)", fontFamily: "serif" }}>星の図書館</span>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(201,169,110,0.3)" }}>✦</span>
        </div>

        {/* Character + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <Image src={characterAvatar} alt={characterName} width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div>
            <p style={{ fontSize: "13px", color: "rgba(232,224,208,0.6)", margin: 0, fontFamily: "serif" }}>{characterName}が読んだ</p>
            <p style={{ fontSize: "11px", color: "rgba(232,224,208,0.3)", margin: "2px 0 0 0" }}>{userName}の{topicLabel}</p>
          </div>
        </div>

        {/* Book title */}
        {bookTitle && (
          <p style={{ fontSize: "12px", color: "rgba(201,169,110,0.5)", marginBottom: "12px", letterSpacing: "0.03em", fontFamily: "serif" }}>
            「{bookTitle}」
          </p>
        )}

        {/* Main oneWord */}
        <div style={{ padding: "20px 0", marginBottom: "20px" }}>
          <p style={{
            fontSize: "28px",
            fontWeight: "bold",
            lineHeight: 1.4,
            fontFamily: "'Shippori Mincho', serif",
            color: "#e8d5a8",
            margin: 0,
          }}>
            {oneWord}
          </p>
        </div>

        {/* Data badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "rgba(232,224,208,0.35)", marginBottom: "20px" }}>
          {westernSign && <span>♈ {westernSign}</span>}
          {kin && <span>KIN {kin}</span>}
          {glyph && <span>{glyph}</span>}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", width: "100%", marginBottom: "16px", background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)" }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "10px", color: "rgba(232,224,208,0.2)", margin: 0 }}>{siteUrl.replace("https://", "")}</p>
          <p style={{ fontSize: "10px", color: "rgba(201,169,110,0.4)", margin: 0 }}>あなたの星も読んでみる →</p>
        </div>
      </div>

      {/* Display-only decoration (not captured) */}
      <div
        className="pointer-events-none -mt-px"
        style={{
          position: "relative",
          top: "-100%",
          height: "100%",
          borderRadius: "16px",
          boxShadow: "0 0 40px rgba(201,169,110,0.1), 0 4px 24px rgba(0,0,0,0.3)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* Save / Share button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full py-3 rounded text-sm font-medium transition-all disabled:opacity-40"
        style={{
          background: "rgba(201,169,110,0.12)",
          border: "1px solid rgba(201,169,110,0.2)",
          color: "var(--brass-light)",
          fontFamily: "var(--font-ui), sans-serif",
        }}
      >
        {saving ? "…準備中" : "カードを保存"}
      </motion.button>
    </div>
  );
}
