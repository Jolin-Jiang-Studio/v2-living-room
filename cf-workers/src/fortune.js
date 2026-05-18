/**
 * 算命 API - Cloudflare Workers 版本
 * 路由: /api/fortune
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { birth = '', sign = '', mood = '', lang = 'zh' } = await request.json();

    if (!mood) {
      return new Response(JSON.stringify({ error: 'Missing mood' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // 根据语言构建 system prompt
    const systemPrompt = lang === 'zh'
      ? `你是「赛博占卜师」，风格：轻松有趣、有点玄学但不迷信，带点小洞察。输出 150~250 字，格式活泼，结尾加点小建议。不要太长，也不要太短。`
      : `You are a "Cyber Fortune Teller". Style: fun, lighthearted, slightly mystical but not superstitious, with small insightful observations. Output 150~250 characters, lively format, end with a small suggestion.`;

    const userPrompt = lang === 'zh'
      ? `生日：${birth || '未知'}，星座：${sign || '随机'}，今天心情：「${mood}」。请根据这些信息给我一段赛博占卜。`
      : `Birthday: ${birth || 'unknown'}, Zodiac: ${sign || 'random'}, Today's mood: "${mood}". Give me a cyber fortune based on these.`;

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    // 调用 DeepSeek API
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.9,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('DeepSeek API error:', err);
      return new Response(JSON.stringify({ error: 'LLM call failed' }), {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '(empty)';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: CORS_HEADERS,
    });

  } catch (e) {
    console.error('Fortune error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
