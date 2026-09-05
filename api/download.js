module.exports = async (req, res) => {
    const videoURL = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    try {
        const cleanUrl = videoURL.split('&')[0];

        // Tamang payload configuration para sa Cobalt API v10
        const payload = {
            url: cleanUrl,
            downloadMode: format === 'mp4' ? 'auto' : 'audio', // 'auto' para sa mp4, 'audio' para sa mp3
            audioFormat: 'mp3',
            filenameStyle: 'basic'
        };

        // Gagamit tayo ng working public proxy mirror instance (Mas stable at walang Cloudflare blocking)
        const response = await fetch('https://wukko.me', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Kung hindi OK ang HTTP status, basahin ang error message
        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `API Error: ${errText || 'Hindi ma-process.'}` });
        }

        const result = await response.json();

        // Suriin kung may error sa loob ng response data
        if (result.status === 'error') {
            return res.status(400).json({ error: result.text || 'May error sa pag-download ng video.' });
        }

        // Kunin ang tamang Download URL batay sa iba't ibang status types ng Cobalt (tunnel, redirect, o picker)
        let downloadUrl = null;
        if (result.url) {
            downloadUrl = result.url;
        } else if (result.picker && result.picker[0]) {
            downloadUrl = result.picker[0].url;
        }

        if (!downloadUrl) {
            return res.status(500).json({ error: 'Walang nakuha na valid download link mula sa server.' });
        }

        // Linisin ang filename para maging safe i-download sa mobile/PC
        const cleanTitle = (result.filename || 'youtube_media')
            .replace(/[^\w\s.-]/gi, '')
            .trim();

        return res.status(200).json({
            success: true,
            title: cleanTitle || 'YouTube Media',
            downloadUrl: downloadUrl, // Ito ang direktang file link na ibibigay mo sa iyong download button
            filename: cleanTitle.get ? cleanTitle : `${cleanTitle}`
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Server connection error o offline ang API endpoint.' });
    }
};
