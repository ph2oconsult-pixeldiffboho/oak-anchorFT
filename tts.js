// api/tts.js — Vercel serverless function
// Stores the ElevenLabs key server-side so users never need to paste it.
// Set ELEVENLABS_API_KEY in Vercel → Settings → Environment Variables.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NO_KEY' });
  }

  const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Missing text' });

  try {
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.50, similarity_boost: 0.80, style: 0.30, use_speaker_boost: true },
        }),
      }
    );

    if (!elRes.ok) {
      const body = await elRes.text();
      return res.status(elRes.status).json({ error: `ElevenLabs ${elRes.status}`, detail: body.slice(0, 200) });
    }

    const audio = await elRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(audio));

  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
};
