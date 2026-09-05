module.exports = async (req, res) => {
    const videoURL = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    try {
        // Paalala: Sa Cobalt API v10, ang 'url' field sa payload ay kailangang plain String, hindi Array.
        const cleanUrl = videoURL.split('&')[0]; 

        const payload = {
            url: cleanUrl,
            downloadMode: format === 'mp4' ? 'auto' : 'audio', 
            audioFormat: 'mp3',
            filenameStyle: 'basic'
        };

        // Gamit ang pinaka-stable na proxy instance ng Cobalt ngayon
        const response = await fetch('https://co.wukko.me/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `API Error: ${errText || 'Hindi ma-process.'}` });
        }

        const result = await response.json();

        // 1. Kapag nag-error ang API (halimbawa: Copyrighted ang kanta o lumagpas sa limit)
        if (result.status === 'error') {
            return res.status(400).json({ error: result.text || 'May error sa pagkuha ng media.' });
        }

        // 2. Kunin ang tamang download link depende sa response type ('tunnel', 'redirect', o 'picker')
        let downloadUrl = null;
        
        if (result.status === 'redirect' || result.status === 'tunnel') {
            downloadUrl = result.url;
        } else if (result.status === 'picker' && result.picker && result.picker[0]) {
            downloadUrl = result.picker[0].url; // Para sa mga videos na may maraming options
        } else {
            downloadUrl = result.url; // Fallback link
        }

        if (!downloadUrl) {
            return res.status(500).json({ error: 'Walang nakuha na valid download link.' });
        }

        // Linisin ang filename para maging maganda tingnan sa phone mo pagka-download
        const cleanTitle = (result.filename || 'youtube_media')
            .replace(/[^\w\s.-]/gi, '')
            .trim();

        // Ibalik sa iyong Frontend UI (tulad ng pagpapakita ng Download Button)
        return res.status(200).json({
            success: true,
            title: cleanTitle || 'YouTube Media',
            downloadUrl: downloadUrl, 
            filename: cleanTitle
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Server connection error o offline ang API endpoint.' });
    }
};
