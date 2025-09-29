/* --- UI Switching Logic --- */
let switchCtn = document.querySelector("#switch-cnt");
let switchC1 = document.querySelector("#switch-c1");
let switchC2 = document.querySelector("#switch-c2");
let switchCircle = document.querySelectorAll(".switch__circle");
let switchBtn = document.querySelectorAll(".switch-btn");
let aContainer = document.querySelector("#a-container");
let bContainer = document.querySelector("#b-container");
let allButtons = document.querySelectorAll(".submit");

// Global variable for the logged-in account number (made globally accessible via window)
window.CURRENT_ACCNO = null; 

let changeForm = (e) => {
    switchCtn.classList.add("is-gx");
    setTimeout(function(){
        switchCtn.classList.remove("is-gx");
    }, 1500)

    switchCtn.classList.toggle("is-txr");
    switchCircle[0].classList.toggle("is-txr");
    switchCircle[1].classList.toggle("is-txr");

    switchC1.classList.toggle("is-hidden");
    switchC2.classList.toggle("is-hidden");
    aContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-z200");
}

/* --- Banking Utility Functions --- */

function getCurrentUserAccount() {
    // Attempt to retrieve logged-in account number from sessionStorage
    const accno = sessionStorage.getItem('loggedInAccNo')
    if (!accno) {
        alert("Session expired or user not logged in. Please log in.");
        // Redirect to login page in a real app
        // window.location.href = "./login.html";
        return null;
    }
    return accno
}

function getUserData(accno) {
    const data = sessionStorage.getItem(accno);
    return data ? JSON.parse(data) : null;
}

function saveUserData(accno, data) {
    sessionStorage.setItem(accno, JSON.stringify(data));
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function updateBalanceDisplay(balance) {
    const formattedBalance = formatCurrency(balance)
    
    // Check and update the Withdrawal balance display
    const balanceElementWithdraw = document.getElementById('currentBalanceDisplayWithdraw');
    if (balanceElementWithdraw) {
        balanceElementWithdraw.textContent = formattedBalance;
    }

    // Check and update the Deposit balance display
    const balanceElementDeposit = document.getElementById('currentBalanceDisplayDeposit');
    if (balanceElementDeposit) {
        balanceElementDeposit.textContent = formattedBalance;
    }
}

function updateUserNameDisplay(name) {
    const nameElement = document.getElementById('userNameDisplay');
    let displayName = name;

    // Check if name is missing or is the default hardcoded value
    if (!name || name === 'User') {
        displayName = JSON.parse(sessionStorage.getItem(window.CURRENT_ACCNO)).name  || "Guest";
    }

    if (nameElement) {
        nameElement.textContent = displayName;
    }
}

function renderTransactionHistory(history) {
    const container = document.getElementById('transactionHistoryContainer');
    if (!container) return;
    
    // Sort by date (newest first) and limit to last 10 entries for display
    const sortedHistory = history.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const displayHistory = sortedHistory.slice(0, 10);

    if (displayHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #a0a5a8; padding: 20px;">No transactions recorded yet.</p>';
        return;
    }

    let tableHTML = `
        <table class="transaction-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
    `;

    displayHistory.forEach(tx => {
        const dateObj = new Date(tx.timestamp);
        const dateStr = dateObj.toLocaleDateString('en-GB');
        const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const typeClass = tx.type === 'deposit' ? 'deposit-type' : 'withdraw-type';
        
        tableHTML += `
            <tr>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td class="${typeClass}">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
                <td>₹${formatCurrency(tx.amount)}</td>
                <td>₹${formatCurrency(tx.balanceAfter)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
}

function initializeDashboard() {
    window.CURRENT_ACCNO = getCurrentUserAccount();
    if (!window.CURRENT_ACCNO) return;

    const userData = getUserData(window.CURRENT_ACCNO);
    
    // 1. Initialize data if necessary
    if (!userData.balance) userData.balance = 0;
    if (!userData.history) userData.history = [];
    if (!userData.username) userData.username = "User";
    
    saveUserData(window.CURRENT_ACCNO, userData); 
    
    // 2. Update UI
    updateBalanceDisplay(userData.balance);
    updateUserNameDisplay(userData.username);
    renderTransactionHistory(userData.history);
}
function handleLogout() {
    // Clear the logged-in flag
    sessionStorage.removeItem('loggedInAccNo');
    window.CURRENT_ACCNO = null; 

    alert("You have been successfully logged out. Redirecting to home page");
    // In a real application, you would redirect to the login page:
     window.location.href = "./index.html"; 
}

/* --- Transaction Logic --- */

function handleDeposit(event) {
    event.preventDefault()
    
    const amountInput = document.getElementById('depositAmount');
    const passwordInput = document.getElementById('depositPassword');

    const amount = parseFloat(amountInput.value);
    const password = passwordInput.value.trim();
    
    if (isNaN(amount) || amount <= 0.01 || !password) {
        alert("Please enter a valid amount (at least ₹0.01) and your password.");
        return;
    }
    
    processTransaction(amount, password, 'deposit');

    // Clear fields
    amountInput.value = '';
    passwordInput.value = '';
}

function handleWithdrawal(event) {
    event.preventDefault();

    const amountInput = document.getElementById('withdrawAmount');
    const passwordInput = document.getElementById('withdrawPassword');
    
    const amount = parseFloat(amountInput.value);
    const password = passwordInput.value.trim();


    if (isNaN(amount) || amount <= 0.01 || !password) {
        alert("Please enter a valid amount (at least ₹0.01) and your password.");
        return;
    }

    processTransaction(amount, password, 'withdraw');

    // Clear fields
    amountInput.value = '';
    passwordInput.value = '';
}

function processTransaction(amount, submittedPassword, type) {
    if (!window.CURRENT_ACCNO) {
        // Try to initialize if null, or redirect to login
        initializeDashboard(); 
        if (!window.CURRENT_ACCNO) return;
    }

    let userData = getUserData(window.CURRENT_ACCNO);

    // 1. Password Verification
    if (userData.password !== submittedPassword) {
        alert("Incorrect password. Transaction failed.");
        return;
    }

    let currentBalance = userData.balance;

    if (type === 'deposit') {
        currentBalance += amount;
        alert(`Deposit successful. ₹${formatCurrency(amount)} added.`); 

    } else if (type === 'withdraw') {
        if (currentBalance < amount) {
            alert(`Insufficient funds. Current balance: ₹${formatCurrency(currentBalance)}`);
            return;
        }
        currentBalance -= amount;
        alert(`Withdrawal successful. ₹${formatCurrency(amount)} withdrawn.`);
    }

    // 2. Update and Save Data
    userData.balance = currentBalance;
    
    // 3. Record History
    userData.history.push({
        timestamp: new Date().toISOString(),
        type: type,
        amount: amount,
        balanceAfter: currentBalance
    });
    
    saveUserData(window.CURRENT_ACCNO, userData);

    // 4. Update UI
    updateBalanceDisplay(currentBalance);
    renderTransactionHistory(userData.history);
}


/* --- Main Execution Function (Combines switching setup and dashboard init) --- */
let mainF = (e) => {
    // 1. Setup UI Switching Listeners
    for (var i = 0; i < switchBtn.length; i++)
        switchBtn[i].addEventListener("click", changeForm)

    // 2. Initialize Bank Dashboard State
    initializeDashboard();
}

window.addEventListener("load", mainF);