export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url, format } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Maglagay ng valid na YouTube URL." });
    }

    try {
        const isMp4 = format && format.toLowerCase() === 'mp4';

        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                downloadMode: isMp4 ? 'auto' : 'audio',
                audioFormat: 'mp3'
            })
        });

        const data = await response.json();

        if (data.status === 'error') {
            return res.status(400).json({ error: data.text || "Hindi ma-process ang video." });
        }

        if (data.status === 'redirect' || data.status === 'stream') {
            return res.status(200).json({
                downloadUrl: data.url,
                format: isMp4 ? 'mp4' : 'mp3'
            });
        }

        return res.status(500).json({ error: "May problema sa pagkuha ng download link." });

    } catch (err) {
        console.error("Download Error:", err);
        return res.status(500).json({ error: "Server error. Subukan ulit mamaya." });
    }
}
