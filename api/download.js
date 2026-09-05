module.exports = async (req, res) => {
    const videoURL = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    try {
        const response = await fetch('https://api.cobalt.tools/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                url: videoURL,
                downloadMode: format === 'mp4' ? 'auto' : 'audio'
            })
        });

        const result = await response.json();

        if (!response.ok || result.status === 'error' || (!result.url && !result.picker)) {
            return res.status(500).json({ error: result.text || 'Hindi ma-process ang video.' });
        }

        const downloadUrl = result.url || (result.picker && result.picker[0] ? result.picker[0].url : null);
        if (!downloadUrl) {
            return res.status(500).json({ error: 'Walang nakuha na download link.' });
        }

        const cleanTitle = (result.filename || 'youtube_media').replace(/[^\w\s]/gi, '').trim();
        const extension = format === 'mp4' ? 'mp4' : 'mp3';

        return res.status(200).json({
            success: true,
            title: cleanTitle,
            downloadUrl: downloadUrl,
            filename: `${cleanTitle}.${extension}`
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Server connection error.' });
    }
};
