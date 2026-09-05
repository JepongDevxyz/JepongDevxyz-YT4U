export default async function handler(req, res) {
    // Payagan ang CORS para hindi ma-block ng browser ang request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const videoURL = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoURL) {
        return res.status(400).json({ error: 'Walang nilagay na YouTube URL.' });
    }

    // Listahan ng mga back-up proxy servers ng Cobalt para kung down ang isa, gagana pa rin ang download
    const cobaltNodes = [
        'https://301-dev.tech',
        'https://wukko.me',
        'https://v00.space'
    ];

    const cleanUrl = videoURL.split('&')[0]; // Siguraduhing malinis ang link string

    const payload = {
        url: cleanUrl,
        downloadMode: format === 'mp4' ? 'auto' : 'audio',
        audioFormat: 'mp3',
        filenameStyle: 'basic'
    };

    // Subukan ang bawat API node hanggang may gumana
    for (const node of cobaltNodes) {
        try {
            console.log(`Sububukan ang API node: ${node}`);
            const response = await fetch(node, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) continue; // Pag hindi OK ang status, lumipat sa susunod na node

            const result = await response.json();
            
            if (result.status === 'error') continue;

            let downloadUrl = null;
            if (result.status === 'redirect' || result.status === 'tunnel') {
                downloadUrl = result.url;
            } else if (result.status === 'picker' && result.picker && result.picker[0]) {
                downloadUrl = result.picker[0].url;
            } else {
                downloadUrl = result.url;
            }

            if (!downloadUrl) continue;

            const cleanTitle = (result.filename || 'youtube_media')
                .replace(/[^\w\s.-]/gi, '')
                .trim();

            // Kapag nakahanap ng working node, ibalik agad ang sagot sa frontend
            return res.status(200).json({
                success: true,
                title: cleanTitle || 'YouTube Media',
                downloadUrl: downloadUrl,
                filename: `${cleanTitle || 'media'}.${format}`
            });

        } catch (err) {
            console.error(`Failed connecting to node ${node}:`, err.message);
            continue; // Subukan ang susunod na server link kapag nag-timeout
        }
    }

    // Kung lahat ng servers sa listahan ay nabigo o down
    return res.status(500).json({ 
        error: 'Ang lahat ng download systems ay kasalukuyang busy o offline. Subukan muli mamaya.' 
    });
}
