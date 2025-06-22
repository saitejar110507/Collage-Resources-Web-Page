require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(cors());

// Root route
app.get('/', (req, res) => {
    res.send('Telegram API server is running.');
});

// /api/files route
app.get('/api/files', async (req, res) => {
    try {
        const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`;
        const updatesResponse = await axios.get(updatesUrl);
        const messages = updatesResponse.data.result;

        const docMessages = messages.filter(msg => msg.channel_post && msg.channel_post.document);

        const files = await Promise.all(docMessages.map(async (msg) => {
            const doc = msg.channel_post.document;
            const fileId = doc.file_id;

            const fileResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
            const filePath = fileResponse.data.result.file_path;

            const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

            return {
                filename: doc.file_name,
                filetype: getFileType(doc.file_name),
                filesize: doc.file_size,
                date: new Date(msg.channel_post.date * 1000).toISOString(),
                download_url: downloadUrl
            };
        }));

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching files');
    }
});

// Proxy route to enable 'View' feature (fixed with axios stream)
app.get('/view', async (req, res) => {
    const fileUrl = req.query.url;
    if (!fileUrl) {
        return res.status(400).send('Missing file URL');
    }

    try {
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline'); // Important: tells browser to view
        response.data.pipe(res); // Proper stream pipe
    } catch (error) {
        console.error('Error fetching file for viewing:', error.message);
        res.status(500).send('Error fetching file for viewing');
    }
});

function getFileType(filename) {
    if (filename.endsWith('.pdf')) return 'pdf';
    if (filename.endsWith('.mp4')) return 'video';
    if (filename.endsWith('.zip')) return 'zip';
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return 'doc';
    return 'other';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
