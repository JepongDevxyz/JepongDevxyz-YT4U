export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Palitan ang mga ito ng UPSTASH_REDIS_REST_URL at UPSTASH_REDIS_REST_TOKEN mo mula sa Upstash Dashboard
    // Mas maganda ring ilagay ito sa Vercel Environment Variables: process.env.UPSTASH_REDIS_REST_URL
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "YOUR_UPSTASH_REST_URL";
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "YOUR_UPSTASH_REST_TOKEN";

    const COUNTER_KEY = "yt4u_global_generated_count";

    try {
        if (req.method === 'POST') {
            // INCR command - atomic at permanently dagdag +1 sa Redis
            const postRes = await fetch(`${REDIS_URL}/incr/${COUNTER_KEY}`, {
                headers: {
                    Authorization: `Bearer ${REDIS_TOKEN}`
                }
            });
            const data = await postRes.json();
            return res.status(200).json({ count: data.result || 0 });
        } else {
            // GET command - kunin ang kasalukuyang bilang
            const getRes = await fetch(`${REDIS_URL}/get/${COUNTER_KEY}`, {
                headers: {
                    Authorization: `Bearer ${REDIS_TOKEN}`
                }
            });
            const data = await getRes.json();
            const count = parseInt(data.result, 10) || 0;
            return res.status(200).json({ count: count });
        }
    } catch (err) {
        console.error("Redis Counter Error:", err);
        return res.status(200).json({ count: 0 });
    }
}
