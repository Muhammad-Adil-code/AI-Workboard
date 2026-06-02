import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function askGPT(prompt: string, system?: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system || 'You are a helpful AI assistant for a freelancer productivity app called WorkBoard.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
  })
  return res.choices[0]?.message?.content || ''
}
