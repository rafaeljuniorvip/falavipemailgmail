const express = require('express');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do client em produção
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
}

const config = {
    imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 20000
    }
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatImapDate = (d) => `${d.getUTCDate()}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;

// Helper para processar mensagens IMAP
async function processMessages(messages) {
    const recentMessages = messages.reverse();

    return Promise.all(recentMessages.map(async (item) => {
        const all = item.parts.find(part => part.which === '');
        const id = item.attributes.uid;
        const idHeader = "Imap-Id: "+id+"\r\n";

        const parsed = await simpleParser(idHeader + all.body);

        return {
            id: item.attributes.uid,
            from: parsed.from ? parsed.from.text : 'Desconhecido',
            subject: parsed.subject,
            date: parsed.date,
            html: parsed.html || parsed.textAsHtml || parsed.text,
            attachments: parsed.attachments.map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
                checksum: att.checksum
            }))
        };
    }));
}

// Helper para conectar e buscar emails (dia único ou últimos 20)
async function fetchEmails(dateFilter = null) {
    try {
        const connection = await imap.connect(config);
        const box = await connection.openBox('INBOX');

        let searchCriteria;

        if (dateFilter) {
            const dateObj = new Date(dateFilter);
            dateObj.setUTCHours(0, 0, 0, 0);

            const nextDay = new Date(dateObj);
            nextDay.setUTCDate(dateObj.getUTCDate() + 1);
            nextDay.setUTCHours(0, 0, 0, 0);

            searchCriteria = [
                ['SINCE', formatImapDate(dateObj)],
                ['BEFORE', formatImapDate(nextDay)]
            ];
            console.log(`Buscando por data: SINCE ${formatImapDate(dateObj)} BEFORE ${formatImapDate(nextDay)}`);
        } else {
            const totalMessages = box.messages.total;

            if (totalMessages === 0) {
                connection.end();
                return [];
            }

            const fetchCount = 20;
            const start = Math.max(1, totalMessages - fetchCount + 1);
            searchCriteria = [`${start}:*`];
            console.log(`Buscando últimos 20 (intervalo: ${searchCriteria})`);
        }

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true,
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const emails = await processMessages(messages);

        connection.end();
        return emails;
    } catch (err) {
        console.error("Erro IMAP:", err);
        throw err;
    }
}

// Helper para buscar emails por intervalo de datas
async function fetchEmailsByDateRange(startDate, endDate) {
    try {
        const connection = await imap.connect(config);
        await connection.openBox('INBOX');

        const startObj = new Date(startDate);
        startObj.setUTCHours(0, 0, 0, 0);

        const endObj = new Date(endDate);
        endObj.setUTCDate(endObj.getUTCDate() + 1); // Inclui o último dia
        endObj.setUTCHours(0, 0, 0, 0);

        const searchCriteria = [
            ['SINCE', formatImapDate(startObj)],
            ['BEFORE', formatImapDate(endObj)]
        ];

        console.log(`Buscando por range: SINCE ${formatImapDate(startObj)} BEFORE ${formatImapDate(endObj)}`);

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true,
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const emails = await processMessages(messages);

        connection.end();
        return emails;
    } catch (err) {
        console.error("Erro IMAP:", err);
        throw err;
    }
}

// ... (fetchAttachment mantido igual)

app.get('/api/emails', async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;

        // Se tiver range de datas, usa fetchEmailsByDateRange
        if (startDate && endDate) {
            const emails = await fetchEmailsByDateRange(startDate, endDate);
            return res.json(emails);
        }

        // Caso contrário, usa fetchEmails (dia único ou últimos 20)
        const emails = await fetchEmails(date);
        res.json(emails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para download de anexos (simplificada)
// Nota: Buscar o anexo em tempo real pode ser lento.
app.get('/api/emails/:uid/attachments/:filename', async (req, res) => {
    try {
        const { uid, filename } = req.params;
        const data = await fetchAttachment(uid, filename);

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir o index.html do React para todas as rotas não API em produção
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // Se não é uma rota de API, servir o index.html
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            next();
        }
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
