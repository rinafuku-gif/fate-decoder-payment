'use server'

export async function generateFortune(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('鑑定の準備ができていません。しばらくお待ちください。')
  }

  const modelName = 'gemini-flash-latest'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    }),
    signal: AbortSignal.timeout(55000)
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('ただいま混み合っています。しばらく時間をおいてお試しください。')
    }
    throw new Error('鑑定の生成に失敗しました。もう一度お試しください。')
  }

  const json = await response.json()
  const candidate = json.candidates?.[0]
  if (!candidate) throw new Error('AIからの応答が空でした。')
  const text = candidate.content?.parts?.[0]?.text
  if (!text) throw new Error('AIの応答を読み取れませんでした。')
  return text
}
