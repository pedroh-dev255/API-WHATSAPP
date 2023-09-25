const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const crypto = require('crypto');

const app = express();
const port = 3000;

let qrCodeActive = true; // Variável de controle para ativar/desativar o QR code

// Gera uma chave secreta aleatória com 32 bytes (256 bits)
const secretKey = crypto.randomBytes(32).toString('hex');

const client = new Client();

// Middleware para autenticação por token
function authenticate(req, res, next) {
  const token = req.headers['authorization'];

  if (!token || token !== `Bearer ${secretKey}`) {
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  next();
}

app.use(express.json());

client.on('qr', (qrCode) => {
    // QR code gerado, ativa a rota
    qrCodeActive = true;
    console.log('Escaneie o código QR com o WhatsApp para autenticar.');
  });

// Rota para exibir o QR code
// Rota para exibir o QR code
app.get('/qrcode', (req, res) => {
    try {
      if (qrCodeActive) {
        const qrCode = client.generateQR(); // Gere o QR code usando o cliente do WhatsApp Web
        qrcode.toDataURL(qrCode, (err, qrDataURL) => {
          if (err) {
            console.error('Erro ao criar QR code:', err);
            res.status(500).send('Erro ao criar QR code.');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`<img src="${qrDataURL}" alt="QR Code">`);
            res.end();
          }
        });
      } else {
        res.status(403).json({ message: 'QR code desativado' });
      }
    } catch (err) {
      console.error('Erro ao criar QR code:', err);
      res.status(500).send('Erro ao criar QR code.');
    }
  });
  



client.on('authenticated', (session) => {
  // Sessão autenticada, desativa a rota
  qrCodeActive = false;
  console.log('WhatsApp Web autenticado com sucesso!');
});

// Rota protegida que envia uma mensagem
app.post('/enviar-mensagem', authenticate, async (req, res) => {
  try {
    const { numero, mensagem } = req.body;
    const chat = await client.getChatById(numero);
    chat.sendMessage(mensagem);
    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

app.listen(port, () => {
  console.log(`API WhatsApp está rodando em http://localhost:${port}`);
});

// Conecta-se ao WhatsApp Web
client.initialize();

console.log('Chave Aleatória:', secretKey);
