interface ProviderConfig {
  base_url: string;
  api_key: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callLLM(provider: ProviderConfig, messages: Message[]): Promise<string | null> {
  try {
    const res = await fetch(provider.base_url.endsWith("/chat/completions") ? provider.base_url : `${provider.base_url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${provider.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: provider.temperature ?? 0.7,
        max_tokens: provider.max_tokens ?? 4096,
        stream: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
