// Step 1: Set up voice recognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = 'en-US';

// Recognize speech and process the command
recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
    
    // Display the transcript in chat input
    document.getElementById('chatInput').value = transcript;

    if (e.results[0].isFinal) {
        // Once the speech recognition is complete, process the command
        handleCommand(transcript);
        recognition.stop(); // Stop voice recognition after final result
    }
});

// Comment out or remove the continuous listening event
// recognition.addEventListener('end', recognition.start);

// Start listening for voice input initially
recognition.start();

// Step 2: Parse the voice command and extract amount and person
function handleCommand(command) {
    const words = command.toLowerCase().split(' '); // Convert to lowercase for consistency
    const amountIndex = words.findIndex(word => word === 'send') + 1;
    const toIndex = words.findIndex(word => word === 'to') + 1;

    const amount = words[amountIndex];
    const person = words[toIndex];

    // Ensure amount and person are valid before proceeding
    if (amount && person) {
        // Display the parsed amount and person in chat messages
        document.getElementById('messages').innerHTML += `<p>User: Send ${amount} to ${person}</p>`;
        showPinOverlay(); // Prompt the user to enter their PIN before payment
    } else {
        document.getElementById('messages').innerHTML += `<p>System: Could not process the command. Please use "send [amount] to [person]".</p>`;
    }
}

// Step 3: Process payment after PIN verification
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

// Step 4: Numpad for PIN verification (from the previous update)
function showPinOverlay() {
    document.getElementById('pinOverlay').classList.add('show');
}

function enterPin(value) {
    const pinInput = document.getElementById('pinInput');
    if (pinInput.value.length < 4) {
        pinInput.value += value;
    }
}

function clearPin() {
    document.getElementById('pinInput').value = '';
}

function verifyPin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === "1594") {
        // Assume PIN verification is successful
        alert('PIN Verified! Proceeding with payment...');
        document.getElementById('pinOverlay').classList.remove('show');
        
        // Extract amount and person from the user input and process the payment
        const command = document.getElementById('chatInput').value;
        const words = command.toLowerCase().split(' ');
        const amountIndex = words.findIndex(word => word === 'send') + 1;
        const toIndex = words.findIndex(word => word === 'to') + 1;

        const amount = words[amountIndex];
        const person = words[toIndex];
        
        processPayment(amount, person); // Process payment now that the PIN is verified
    } else {
        alert('Incorrect pin');
    }
}
