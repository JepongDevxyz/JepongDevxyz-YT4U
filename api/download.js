const https = require('https');

module.exports = async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    try {
        const data = JSON.stringify({
            url: videoURL,
            vQuality: "720",
            filenamePattern: "classic"
        });

        const options = {
            hostname: 'co.wuk.sh',
            path: '/api/json',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const apiReq = https.request(options, (apiRes) => {
            let body = '';
            apiRes.on('data', (chunk) => { body += chunk; });
            apiRes.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.status === 'error' || !result.url) {
                        return res.status(500).json({ error: result.text || 'Hindi ma-process ang video.' });
                    }

                    const cleanTitle = (result.filename || 'youtube_media').replace(/[^\w\s]/gi, '').trim();

                    // I-return ang JSON response na pwedeng gamitin bilang API
                    return res.status(200).json({
                        success: true,
                        title: cleanTitle,
                        mp3Url: result.url,
                        mp4Url: result.url,
                        mp3Filename: `${cleanTitle}.mp3`,
                        mp4Filename: `${cleanTitle}.mp4`
                    });
                } catch (e) {
                    return res.status(500).json({ error: 'Nagka-error sa pag-parse ng data.' });
                }
            });
        });

        apiReq.on('error', (e) => {
            return res.status(500).json({ error: 'Nabigo ang koneksyon sa downloader service.' });
        });

        apiReq.write(data);
        apiReq.end();

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
};
