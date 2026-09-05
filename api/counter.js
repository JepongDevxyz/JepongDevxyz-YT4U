export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    const BUCKET_KEY = 'jepongdevxyz_yt4u_counter';
    const KVDB_URL = `https://kvdb.io/4T8m4e1uK9uS7yX2L2m1A1/${BUCKET_KEY}`;

    try {
        if (req.method === 'POST') {
            // Kunin ang kasalukuyang count
            const getRes = await fetch(KVDB_URL);
            let currentCount = 0;
            if (getRes.ok) {
                const text = await getRes.text();
                currentCount = parseInt(text, 10) || 0;
            }
            
            // Dagdagan ng 1 at i-save ulit sa KVDB
            const newCount = currentCount + 1;
            await fetch(KVDB_URL, {
                method: 'POST',
                body: newCount.toString()
            });

            return res.status(200).json({ count: newCount });
        } else {
            // GET request para sa pag-read ng count
            const getRes = await fetch(KVDB_URL);
            let currentCount = 0;
            if (getRes.ok) {
                const text = await getRes.text();
                currentCount = parseInt(text, 10) || 0;
            }
            return res.status(200).json({ count: currentCount });
        }
    } catch (err) {
        console.error("Counter Error:", err);
        return res.status(200).json({ count: 0 });
    }
}
