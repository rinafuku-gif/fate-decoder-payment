export const REF_MAP: Record<string, string> = {
  misoca: "三十日珈琲（上野原）",
  engawa: "えんがわ（梁川）",
  torisawa: "鳥沢ポータル",
  satoyama: "SATOYAMA AI BASE",
  sns_ig: "Instagram広告",
  sns_tt: "TikTok広告",
  sns_x: "X広告",
  direct: "直接アクセス",
}

export function getRefName(ref: string | null): string {
  if (!ref) return REF_MAP.direct
  return REF_MAP[ref] || ref
}
