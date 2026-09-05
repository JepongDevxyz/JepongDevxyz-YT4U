export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Permanent Unique Key para sa YT4U
    const NAMESPACE = 'yt4u_jepongdevxyz_2026';
    const KEY = 'total_generated_count';

    try {
        if (req.method === 'POST') {
            // Permanently dagdagan ng +1 sa CountAPI
            const postRes = await fetch(`https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`);
            const data = await postRes.json();
            return res.status(200).json({ count: data.value || 0 });
        } else {
            // Kunin ang permanent count
            const getRes = await fetch(`https://api.countapi.xyz/get/${NAMESPACE}/${KEY}`);
            const data = await getRes.json();
            
            // Kapag bago pa ang key, i-create sa 0
            if (data.value === undefined) {
                const createRes = await fetch(`https://api.countapi.xyz/create?namespace=${NAMESPACE}&key=${KEY}&value=0`);
                const createData = await createRes.json();
                return res.status(200).json({ count: createData.value || 0 });
            }

            return res.status(200).json({ count: data.value });
        }
    } catch (err) {
        console.error("Counter Error:", err);
        return res.status(200).json({ count: 0 });
    }
}
