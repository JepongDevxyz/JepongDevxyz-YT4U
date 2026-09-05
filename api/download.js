import NodeID3 from 'node-id3';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url, format } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Maglagay ng valid na YouTube URL." });
    }

    const videoId = extractYouTubeID(url);
    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL format." });
    }

    try {
        const apiKey = process.env.RAPIDAPI_KEY;

        if (!apiKey) {
            throw new Error("Missing RapidAPI Key in Environment Variables.");
        }

        const requestedFormat = (format && format.toLowerCase() === 'mp4') ? 'mp4' : 'mp3';

        // 1. Fetch download link mula sa RapidAPI
        const apiResponse = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        const data = await apiResponse.json();

        if (data.status !== "ok") {
            throw new Error(data.msg || "Hindi ma-extract ang video details.");
        }

        // Kung MP4, ibalik lang ang direct link via JSON
        if (requestedFormat === 'mp4') {
            return res.status(200).json({
                title: data.title,
                downloadUrl: data.link,
                filename: `${data.title}.mp4`
            });
        }

        // 2. Kung MP3, i-download natin ang buffer para ma-strip ang thumbnail/cover art
        const audioResponse = await fetch(data.link);
        const arrayBuffer = await audioResponse.arrayBuffer();
        let audioBuffer = Buffer.from(arrayBuffer);

        // 3. Alisin ang Cover Art (APIC) at iba pang nakakabit na tags
        const cleanBuffer = NodeID3.removeTagsFromBuffer(audioBuffer);

        // 4. Maglagay lang ng malinis na basic tags (walang image)
        const cleanTags = {
            title: data.title,
            artist: "YT4U"
        };

        const finalBuffer = NodeID3.write(cleanTags, cleanBuffer);

        // 5. I-send ang malinis na MP3 file sa browser
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(data.title)}.mp3"`);
        return res.send(finalBuffer);

    } catch (err) {
        console.error("API Error:", err);
        return res.status(500).json({ 
            error: "Hindi ma-process ang video ngayon. Subukan ulit mamaya." 
        });
    }
}

function extractYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
