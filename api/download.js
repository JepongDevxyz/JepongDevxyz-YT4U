const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL || !ytdl.validateURL(videoURL)) {
        return res.status(400).json({ error: 'Invalid o walang nilagay na YouTube URL.' });
    }
    try {
        const info = await ytdl.getInfo(videoURL);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').trim();
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
        return res.status(200).json({
            title: title,
            mp3Url: audioFormat ? audioFormat.url : null,
            mp4Url: videoFormat ? videoFormat.url : null
        });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Hindi ma-process ang YouTube link.' });
    }
};
