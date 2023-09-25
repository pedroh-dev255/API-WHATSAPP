# API-WHATSAPP
Um simples host da api do Whats

## Sobre

Sistema para host de api de whatsapp para envio de mensagens.

## Sistema
Ao iniciar o sistema ele gera uma rota /qrcode onde ele
mostra o qr para que o usuario autentique a sessão do seu whatsapp.
Quando a sessão é autenticada a rota /qrcode é desativada ficando
somente a /api/enviar-mensagem para que o sistema seja entegrado.
Recebendo um json