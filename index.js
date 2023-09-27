const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
let qrcodeRouteActive = true;

const SESSION_FILE_PATH = './session.json';
const TOKEN_FILE_PATH = '.env';

// Verifica se o arquivo .env existe e contém um token. Caso contrário, cria um novo token.
if (!fs.existsSync(TOKEN_FILE_PATH) || !process.env.API_TOKEN) {
  const token = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(TOKEN_FILE_PATH, `API_TOKEN=${token}`);
  console.log(`Token gerado e salvo no arquivo ${TOKEN_FILE_PATH}`);
}

const apiToken = process.env.API_TOKEN;
const app = express();
let server;
const client = new Client();
server = http.createServer(app);

// Middleware para analisar o corpo JSON das solicitações
app.use(express.json());

client.on('qr', async (qrCode) => {
  // Exibe o QR code no terminal
  qrcode.toString(qrCode, { type: 'terminal' }, (err, url) => {
    if (err) {
      console.error('Erro ao gerar QR code:', err);
    } else {
      console.log(url);
    }
  });

  app.get('/qrcode', async (req, res) => {
    try {
      const qrDataURL = await qrcode.toDataURL(qrCode);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(`<img src="${qrDataURL}" alt="QR Code">`);
      res.end();
    } catch (err) {
      console.error('Erro ao criar QR code:', err);
      res.status(500).send('Erro ao criar QR code.');
    }
  });
});

app.post('/api/enviar-mensagem', (req, res, next) => {
  console.log('Corpo da Solicitação:', req.body);
  next(); // Continue com o processamento normal da rota
}, async (req, res) => {
  console.log('Authorization Header no Início da Rota:', req.header('Authorization'));
  const { number, body, medias } = req.body;

  // Verifica se o token de autorização é válido
  const authorizationHeader = req.header('Authorization');
  console.log('Authorization Header:', authorizationHeader); //linha para depuração
  if (!authorizationHeader || authorizationHeader !== `Bearer ${apiToken}`) {
    return res.status(401).json({ message: 'Token de autorização inválido' });
  }

  // Verifica se o WhatsApp está autenticado
  if (!client.isReady) {
    return res.status(400).json({ message: 'WhatsApp não está autenticado' });
  }

  try {
    let mediaArray = [];
    if (medias && Array.isArray(medias)) {
      // Processa as mídias anexadas
      for (const media of medias) {
        const mediaBuffer = Buffer.from(media, 'base64');
        const extension = media.startsWith('data:image/') ? media.split(';')[0].split('/')[1] : 'jpg';
        const mediaType = media.startsWith('data:video/') ? 'video' : 'image';
        const mediaName = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
        fs.writeFileSync(mediaName, mediaBuffer);
        const mediaObject = new MessageMedia(mediaType, mediaName);
        mediaArray.push(mediaObject);
      }
    }

    // Envia a mensagem
    const chat = await client.getChatById(number);
    await chat.sendMessage(body, { media: mediaArray });
    return res.status(200).json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000/qrcode');
});

client.on('authenticated', (session) => {
  console.log('Sessão autenticada com sucesso!');
});

client.on('ready', () => {
  console.log('Sessão pronta para uso!');
  // Agora você pode começar a interagir com o WhatsApp aqui
});

client.on('auth_failure', (msg) => {
  console.error('Falha na autenticação:', msg);
});

// Inicie a conexão com o WhatsApp
client.initialize();
