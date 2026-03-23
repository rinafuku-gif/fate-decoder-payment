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
      // Use toPng with explicit node cloning to avoid border artifacts
      const dataUrl = await domToImage.toPng(cardRef.current, {
        bgcolor: "#12100c",
        quality: 1,
        style: {
          borderRadius: "0",
          border: "none",
          boxShadow: "none",
          overflow: "hidden",
        },
      });

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Try native share with image first (mobile)
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
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="mb-8">
      {/* The actual card — NO borders, NO box-shadow on the capture target */}
      <div
        ref={cardRef}
        className="share-card-bg overflow-hidden relative"
        style={{ padding: "28px 24px" }}
      >
        {/* Decorative symbol */}
        <div
          className="absolute top-4 right-4 text-6xl pointer-events-none select-none"
          style={{ opacity: 0.03, color: "#c9a96e" }}
        >
          ✦
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)" }}>✦</span>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const }}>星の図書館</span>
          <span style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)" }}>✦</span>
        </div>

        {/* Character + name — use inline styles to avoid dom-to-image issues */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image src={characterAvatar} alt={characterName} width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{characterName}が読んだ</p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: 0 }}>{userName}の{topicLabel}</p>
          </div>
        </div>

        {/* Book title */}
        {bookTitle && (
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", letterSpacing: "0.05em" }}>「{bookTitle}」</p>
        )}

        {/* Main oneWord */}
        <div style={{ padding: "16px 0", marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              lineHeight: 1.3,
              fontFamily: "var(--font-serif), serif",
              color: "#e8d5a8",
              margin: 0,
            }}
          >
            {oneWord}
          </p>
        </div>

        {/* Data badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "16px" }}>
          {westernSign && <span>♈ {westernSign}</span>}
          {kin && <span>KIN {kin}</span>}
          {glyph && <span>{glyph}</span>}
        </div>

        {/* Divider — use background instead of border */}
        <div style={{ height: "1px", width: "100%", marginBottom: "12px", background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.25), transparent)" }} />

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", margin: 0 }}>{siteUrl.replace("https://", "")}</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0 }}>あなたの星も読んでみる →</p>
        </div>
      </div>

      {/* Visual wrapper for display only (shadow/rounded) — NOT part of the capture */}
      <style jsx>{`
        div:first-child > div:first-child {
          border-radius: 24px;
          box-shadow: 0 0 60px rgba(201,169,110,0.15), 0 4px 32px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Save / Share button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full py-3 rounded-full text-sm font-medium text-white/70 transition-all disabled:opacity-40"
        style={{
          background: "rgba(201,169,110,0.08)",
        }}
      >
        {saving ? "…準備中" : "カードを保存"}
      </motion.button>
    </div>
  );
}
