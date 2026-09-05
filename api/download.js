module.exports = async (req, res) => {
    // Payagan ang Cross-Origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    const videoURL = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    // Extract YouTube Video ID
    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = extractVideoId(videoURL);
    if (!videoId) {
        return res.status(400).json({ error: 'Hindi valid ang YouTube URL.' });
    }

    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // --- METHOD 1: COBALT API ---
    try {
        const payload = {
            url: cleanUrl,
            downloadMode: format === 'mp4' ? 'auto' : 'audio',
            audioFormat: 'mp3',
            youtubeVideoContainer: 'mp4'
        };

        const response = await fetch('https://cobalt-api.kwiatek.xyz/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            const downloadUrl = result.url || (result.picker && result.picker[0] ? result.picker[0].url : null);

            if (downloadUrl) {
                const cleanTitle = (result.filename || `youtube_${videoId}`).replace(/[^\w\s]/gi, '').trim();
                return res.status(200).json({
                    success: true,
                    title: cleanTitle || 'YouTube Media',
                    downloadUrl: downloadUrl,
                    filename: `${cleanTitle || 'media'}.${format}`
                });
            }
        }
    } catch (e) {
        console.log("Cobalt primary endpoint failed, switching to Invidious Fallback...");
    }

    // --- METHOD 2: INVIDIOUS API FALLBACK ---
    try {
        const invidiousInstances = [
            'https://inv.nadeko.net',
            'https://invidious.nerdvpn.de',
            'https://invidious.drgns.space'
        ];

        for (const instance of invidiousInstances) {
            try {
                const invRes = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (invRes.ok) {
                    const data = await invRes.json();
                    let streamUrl = null;

                    if (format === 'mp3') {
                        // Kumuha ng Audio Format
                        const audioFormat = data.adaptiveFormats.find(f => f.type && f.type.includes('audio'));
                        if (audioFormat) streamUrl = audioFormat.url;
                    } else {
                        // Kumuha ng Combined MP4 Video Format
                        const videoFormat = data.formatStreams.find(f => f.container === 'mp4') || data.formatStreams[0];
                        if (videoFormat) streamUrl = videoFormat.url;
                    }

                    if (streamUrl) {
                        const cleanTitle = data.title.replace(/[^\w\s]/gi, '').trim();
                        return res.status(200).json({
                            success: true,
                            title: cleanTitle || 'YouTube Media',
                            downloadUrl: streamUrl,
                            filename: `${cleanTitle || 'media'}.${format}`
                        });
                    }
                }
            } catch (err) {
                continue;
            }
        }
    } catch (error) {
        console.error('Fallback Error:', error);
    }

    return res.status(500).json({ error: 'Hindi ma-process ang video ngayon. Subukan ulit mamaya.' });
};
