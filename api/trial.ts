
import type { VercelRequest, VercelResponse } from '@vercel/node';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error:'Method not allowed' }); }
  try {
    const { email, source } = (req.body || {}) as { email?: string, source?: string };
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const payload = { embeds:[{ title:'New Free Trial Request', color:0x58B4AE, fields:[
      { name:'Email', value:String(email), inline:true },
      { name:'Source', value:String(source||'landing#trial'), inline:true },
      { name:'Time', value:new Date().toISOString() },
    ]}] };
    if (process.env.DISCORD_WEBHOOK_URL) {
      const r = await fetch(process.env.DISCORD_WEBHOOK_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) return res.status(502).json({ error:'Discord webhook failed' });
      return res.status(200).json({ ok:true });
    }
    return res.status(200).json({ ok:true, note:'No webhook configured' });
  } catch(e){ return res.status(500).json({ error:'Internal error' }); }
}


