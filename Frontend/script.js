// Step 1: Set up voice recognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
    document.getElementById('chatInput').value = transcript;
    if (e.results[0].isFinal) {
        handleCommand(transcript);
    }
});

recognition.addEventListener('end', recognition.start);
recognition.start();

// Step 2: Parse the voice command
function handleCommand(command) {
    const words = command.split(' ');
    const amount = words[1];
    const person = words[3];
    processPayment(amount, person);
}

// Step 3: Process payment
function processPayment(amount, person) {
    fetch('http://localhost:3000/processPayment', { // Ensure this points to your backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, person })
    })
    .then(response => response.json())
    .then(data => {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML += `<p>System: ${data.message}</p>`;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('messages').innerHTML += `<p>System: Error processing payment.</p>`;
    });
}
