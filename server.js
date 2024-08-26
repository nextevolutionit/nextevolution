const express = require('express');
const qr = require('qr-image');
const fs = require('fs');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const numeroPrenotazioniFile = 'numero_prenotazioni.txt';

// Funzione per ottenere il numero di prenotazione corrente e incrementarlo
const getNextNumeroPrenotazione = () => {
    let numeroPrenotazione = 1;
    if (fs.existsSync(numeroPrenotazioniFile)) {
        const fileContent = fs.readFileSync(numeroPrenotazioniFile, 'utf8');
        numeroPrenotazione = parseInt(fileContent.trim(), 10) + 1;
    }
    fs.writeFileSync(numeroPrenotazioniFile, numeroPrenotazione.toString());
    return numeroPrenotazione;
};

// Configura Brevo (SendinBlue) con la tua API Key
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = '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';  // Sostituisci con la tua API Key

app.post('/prenota', (req, res) => {
    const { nome, cognome, eta, email } = req.body;

    // Ottieni il prossimo numero di prenotazione
    const numeroPrenotazione = getNextNumeroPrenotazione();

    // Crea il contenuto per il QR code, includendo il numero di prenotazione
    const qrData = `Prenotazione Evento 21 Settembre - Numero: ${numeroPrenotazione}`;
    
    console.log('Dati per il QR code:', qrData);

    try {
        const qrFileName = `qrcode-${numeroPrenotazione}.png`;
        const qrPng = qr.image(qrData, { type: 'png' });
        const qrStream = fs.createWriteStream(qrFileName);
        qrPng.pipe(qrStream);

        qrStream.on('finish', async () => {
            console.log('QR code generato e salvato come:', qrFileName);

            // Configura l'email per inviare al cliente
            let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            let sendSmtpEmail = {
                to: [{ email: email }],
                sender: { email: 'next.evolution.italia@gmail.com', name: 'NExT evolution' }, // Sostituisci con la tua email verificata
                subject: 'Conferma Prenotazione Evento 21 Settembre',
                htmlContent: `<p>Grazie per aver prenotato, ${nome}! Ecco il tuo QR code in allegato.</p>`,
                attachment: [{
                    content: fs.readFileSync(qrFileName, { encoding: 'base64' }),
                    name: `qrcode-${numeroPrenotazione}.png`
                }]
            };

            try {
                const emailResponse = await apiInstance.sendTransacEmail(sendSmtpEmail);
                console.log('Email inviata con successo a:', email);
                console.log('Risposta API:', emailResponse);

                // Elimina il file temporaneo
                fs.unlinkSync(qrFileName);

                res.status(200).json({ message: 'Prenotazione effettuata con successo. Controlla la tua email per il QR code.' });
            } catch (error) {
                console.error('Errore nell\'invio dell\'email:', error);
                res.status(500).json({ error: 'Errore nell\'invio dell\'email' });
            }
        });

    } catch (error) {
        console.error('Errore nella generazione del QR code:', error);
        res.status(500).json({ error: 'Errore nella generazione del QR code' });
    }
});

// Gestione degli errori per rotte non trovate (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Rotta non trovata' });
});

// Avvio del server sulla porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
