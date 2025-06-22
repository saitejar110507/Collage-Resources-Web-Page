const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

const TELEGRAM_TOKEN = '7710612613:AAHZ71hmWVq2lqQwXmarwAWYQIkXST00kAg'; // Replace this
const CHAT_ID = '1002782089113'; // Replace this (starts with -100)

app.use(cors()); // Allow frontend requests

app.get('/api/files', async (req, res) => {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`;
        const response = await axios.get(url);
        const messages = response.data.result;

        const files = messages
            .filter(msg => msg.channel_post && msg.channel_post.document)
            .map(msg => {
                const doc = msg.channel_post.document;
                return {
                    filename: doc.file_name,
                    filetype: getFileType(doc.file_name),
                    filesize: doc.file_size,
                    date: new Date(msg.channel_post.date * 1000).toISOString(),
                    download_url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${doc.file_id}`
                };
            });

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching files');
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
