/**
 * 留言瓶 API - Cloudflare Workers 版本
 * 路由: /api/chat
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
    const { messages, lang = 'zh', forwardToWechat = true, sessionId = '' } = await request.json();

    // 取用户最新一条消息
    const userMsg = messages && messages.length > 0
      ? messages.filter(m => m.role === 'user').pop()?.content || ''
      : '';

    if (!userMsg) {
      return new Response(JSON.stringify({ error: 'Empty message' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // 拼接推送到微信的内容
    const title = lang === 'zh' ? '💬 留言瓶新消息' : '💬 New message from your site';
    const content = [
      `🌐 来源：小姜的网络客厅`,
      `💬 消息：${userMsg}`,
      forwardToWechat ? `✅ 已转发到微信` : `⚠️ 未转发`,
      sessionId ? `📌 会话ID：${sessionId}` : '',
      `⏰ 时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    ].filter(Boolean).join('\n\n');

    // 调用 Server 酱推送
    const SENDKEY = env.SERVERCHAN_SENDKEY;
    if (SENDKEY && forwardToWechat) {
      try {
        await fetch(`https://sctapi.ftqq.com/${SENDKEY}.send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            desp: content,
          }),
        });
      } catch (e) {
        console.error('Server酱推送失败:', e);
      }
    }

    // AI 回复
    const reply = lang === 'zh'
      ? '收到啦，小姜本人晚点会从微信看到这条 ✨'
      : 'Got it — Jolin will see this on his WeChat later ✨';

    return new Response(JSON.stringify({
      reply,
      forwarded: !!SENDKEY,
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });

  } catch (e) {
    console.error('Chat error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
