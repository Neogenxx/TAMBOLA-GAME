let tickets = [];
let calledNumbers = [];
let availableNumbers = [...Array(90)].map((_, i) => i + 1);
let currentTicketCount = 6;

// Tambola ticket generation following the rules
function generateTambolaTicket() {
    const ticket = Array(3).fill().map(() => Array(9).fill(0));
    
    // Define column ranges
    const columnRanges = [
        [1, 10], [11, 20], [21, 30], [31, 40], [41, 50],
        [51, 60], [61, 70], [71, 80], [81, 90]
    ];

    // Generate numbers for each row
    for (let row = 0; row < 3; row++) {
        const positions = [];
        
        // Select 5 random positions for numbers in this row
        while (positions.length < 5) {
            const pos = Math.floor(Math.random() * 9);
            if (!positions.includes(pos)) {
                positions.push(pos);
            }
        }
        
        // Fill selected positions with numbers from respective column ranges
        positions.forEach(col => {
            const [min, max] = columnRanges[col];
            let number;
            do {
                number = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (ticket.flat().includes(number));
            
            ticket[row][col] = number;
        });
    }

    return ticket;
}

function generateTickets() {
    tickets = [];
    for (let i = 0; i < currentTicketCount; i++) {
        tickets.push(generateTambolaTicket());
    }
    displayTickets();
    animateTicketGeneration();
}

function displayTickets() {
    const ticketsContainer = document.getElementById('tickets');
    ticketsContainer.innerHTML = '';

    tickets.forEach((ticket, ticketIndex) => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'tambola-ticket';
        ticketDiv.style.animationDelay = `${ticketIndex * 0.1}s`;

        ticket.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellDiv = document.createElement('div');
                cellDiv.className = `ticket-cell ${cell === 0 ? 'blank' : 'number'}`;
                cellDiv.textContent = cell === 0 ? '' : cell;
                cellDiv.onclick = () => toggleCell(ticketIndex, rowIndex, colIndex);
                cellDiv.id = `cell-${ticketIndex}-${rowIndex}-${colIndex}`;
                
                if (cell !== 0 && calledNumbers.includes(cell)) {
                    cellDiv.classList.add('marked');
                }
                
                ticketDiv.appendChild(cellDiv);
            });
        });

        ticketsContainer.appendChild(ticketDiv);
    });
}

function toggleCell(ticketIndex, rowIndex, colIndex) {
    const cell = document.getElementById(`cell-${ticketIndex}-${rowIndex}-${colIndex}`);
    const number = tickets[ticketIndex][rowIndex][colIndex];
    
    if (number !== 0 && calledNumbers.includes(number)) {
        cell.classList.toggle('marked');
        checkWinConditions(ticketIndex);
    }
}

function pickNumber() {
    if (availableNumbers.length === 0) {
        alert('All numbers have been called!');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const pickedNumber = availableNumbers.splice(randomIndex, 1)[0];
    
    calledNumbers.push(pickedNumber);
    
    // Display the number with animation
    const currentNumberDiv = document.getElementById('currentNumber');
    currentNumberDiv.style.animation = 'none';
    currentNumberDiv.textContent = pickedNumber;
    currentNumberDiv.offsetHeight; // Trigger reflow
    currentNumberDiv.style.animation = 'markNumber 0.8s ease-out';

    // Add to history
    const historyDiv = document.getElementById('numberHistory');
    const numberDiv = document.createElement('div');
    numberDiv.className = 'history-number';
    numberDiv.textContent = pickedNumber;
    historyDiv.appendChild(numberDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // Speak the number
    speakNumber(pickedNumber);

    // Update ticket displays
    updateTicketsForNumber(pickedNumber);

    // Check for wins
    setTimeout(() => {
        tickets.forEach((ticket, index) => {
            checkWinConditions(index);
        });
    }, 500);
}

function speakNumber(number) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(number.toString());
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function updateTicketsForNumber(number) {
    tickets.forEach((ticket, ticketIndex) => {
        ticket.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === number) {
                    const cellDiv = document.getElementById(`cell-${ticketIndex}-${rowIndex}-${colIndex}`);
                    cellDiv.classList.add('marked');
                }
            });
        });
    });
}

function checkWinConditions(ticketIndex) {
    const ticket = tickets[ticketIndex];
    let hasWin = false;

    // Check for completed rows
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
        const row = ticket[rowIndex];
        const markedInRow = row.filter(cell => cell !== 0 && calledNumbers.includes(cell));
        const totalInRow = row.filter(cell => cell !== 0);
        
        if (markedInRow.length === totalInRow.length && totalInRow.length === 5) {
            showWin(`Ticket ${ticketIndex + 1} - Row ${rowIndex + 1} Complete!`);
            hasWin = true;
        }
    }

    // Check for full house
    const allNumbers = ticket.flat().filter(cell => cell !== 0);
    const markedNumbers = allNumbers.filter(num => calledNumbers.includes(num));
    
    if (markedNumbers.length === allNumbers.length) {
        showWin(`Ticket ${ticketIndex + 1} - FULL HOUSE! 🎉`);
        hasWin = true;
    }

    if (hasWin) {
        createConfetti();
    }
}

function showWin(message) {
    const popup = document.createElement('div');
    popup.className = 'win-popup';
    popup.innerHTML = `
        <h2>🎉 WINNER! 🎉</h2>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="this.parentNode.remove()" style="margin-top: 20px;">
            Continue Playing
        </button>
    `;
    document.body.appendChild(popup);

    // Speak the win announcement
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Winner! ${message}`);
        speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
        popup.remove();
    }, 5000);
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 6000);
        }, i * 100);
    }
}

function resetGame() {
    tickets = [];
    calledNumbers = [];
    availableNumbers = [...Array(90)].map((_, i) => i + 1);
    
    document.getElementById('tickets').innerHTML = '';
    document.getElementById('currentNumber').textContent = 'Click "Pick Number"';
    document.getElementById('numberHistory').innerHTML = '';
    
    // Remove any win popups
    document.querySelectorAll('.win-popup').forEach(popup => popup.remove());
}

function animateTicketGeneration() {
    const tickets = document.querySelectorAll('.tambola-ticket');
    tickets.forEach((ticket, index) => {
        ticket.style.opacity = '0';
        ticket.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            ticket.style.transition = 'all 0.8s ease-out';
            ticket.style.opacity = '1';
            ticket.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Welcome message
    setTimeout(() => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Welcome to Smart Tambola! Click Generate Tickets to start playing.');
            speechSynthesis.speak(utterance);
        }
    }, 1000);
});