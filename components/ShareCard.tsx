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
      const blob = await domToImage.toBlob(cardRef.current, {
        quality: 1,
        bgcolor: "#0a0e1a",
        width: cardRef.current.offsetWidth * 2,
        height: cardRef.current.offsetHeight * 2,
        style: { transform: "scale(2)", transformOrigin: "top left" },
      });
      if (!blob) return;

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

  const isUrara = characterId === "urara";

  return (
    <div className="mb-8">
      {/* The actual card */}
      <div
        ref={cardRef}
        className="share-card-bg rounded-3xl overflow-hidden relative p-6"
        style={{
          boxShadow: isUrara
            ? "0 0 60px rgba(124,92,191,0.2), 0 4px 32px rgba(0,0,0,0.3)"
            : "0 0 60px rgba(201,169,110,0.2), 0 4px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Decorative star symbol in background */}
        <div
          className="absolute top-4 right-4 text-6xl pointer-events-none select-none"
          style={{ opacity: 0.04, color: isUrara ? "#7c5cbf" : "#c9a96e" }}
        >
          ✦
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] tracking-[0.3em] text-white/20">✦</span>
          <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">星の図書館</span>
          <span className="text-[10px] tracking-[0.3em] text-white/20">✦</span>
        </div>

        {/* Character + name */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ border: `1.5px solid ${isUrara ? "rgba(124,92,191,0.5)" : "rgba(201,169,110,0.5)"}` }}
          >
            <Image src={characterAvatar} alt={characterName} width={72} height={72} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-xs text-white/50">{characterName}が読んだ</p>
            <p className="text-[10px] text-white/25">{userName}の{topicLabel}</p>
          </div>
        </div>

        {/* Book title */}
        {bookTitle && (
          <p className="text-[11px] text-white/30 mb-2 tracking-wide">「{bookTitle}」</p>
        )}

        {/* Main oneWord */}
        <div className="py-4 mb-4">
          <p
            className="text-2xl sm:text-3xl font-bold leading-snug"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: isUrara ? "#c4b0e0" : "#e8d5a8",
            }}
          >
            {oneWord}
          </p>
        </div>

        {/* Data badges */}
        <div className="flex items-center gap-3 text-[11px] text-white/35 mb-4">
          {westernSign && <span>♈ {westernSign}</span>}
          {kin && <span>KIN {kin}</span>}
          {glyph && <span>{glyph}</span>}
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-3" style={{ background: `linear-gradient(90deg, transparent, ${isUrara ? "rgba(124,92,191,0.3)" : "rgba(201,169,110,0.3)"}, transparent)` }} />

        {/* CTA */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/20">{siteUrl.replace("https://", "")}</p>
          <p className="text-[10px] text-white/30">あなたの星も読んでみる →</p>
        </div>
      </div>

      {/* Save / Share button */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(201,169,110,0.2)" }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full py-3 rounded-full text-sm font-medium text-white/80 transition-all disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg, rgba(201,169,110,0.15), rgba(124,92,191,0.15))",
          border: "1px solid rgba(201,169,110,0.2)",
        }}
      >
        {saving ? "…準備中" : "📷 カードを保存 / シェア"}
      </motion.button>
    </div>
  );
}
