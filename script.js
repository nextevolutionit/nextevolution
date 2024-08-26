document.getElementById('reservation-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const cognome = document.getElementById('cognome').value;
    const eta = document.getElementById('eta').value;
    const email = document.getElementById('email').value;

    fetch('/prenota', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, cognome, eta, email }),
    })
    .then(response => response.json())
    .then(data => {
        alert('Prenotazione effettuata con successo! Controlla la tua email per il QR code.');
    })
    .catch((error) => {
        console.error('Errore:', error);
    });
});
