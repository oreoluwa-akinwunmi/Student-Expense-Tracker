// Get the elements we need from the HTML
const balanceDisplay = document.getElementById('balance');
const incomeDisplay = document.getElementById('totalIncome');
const expensesDisplay = document.getElementById('totalExpenses');
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');
const transactionList = document.getElementById('transactionList');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const message = document.getElementById('message');

// Load saved transactions from the browser
let transactions = [];

try {
    transactions = JSON.parse(localStorage.getItem('studentTransactions')) || [];
} catch {
    transactions = [];
}

function formatMoney(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function saveTransactions() {
    localStorage.setItem('studentTransactions', JSON.stringify(transactions));
}

function showMessage(text) {
    message.textContent = text;
    message.classList.add('show');

    setTimeout(function () {
        message.classList.remove('show');
    }, 2500);
}

// Add income when the income form is submitted
incomeForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const amount = Number(document.getElementById('incomeAmount').value);
    const description = document.getElementById('incomeDescription').value.trim();

    if (amount <= 0 || !Number.isFinite(amount)) {
        showMessage('Enter an amount greater than zero.');
        return;
    }

    transactions.push({
        id: Date.now().toString(),
        type: 'income',
        amount: amount,
        category: 'Income',
        description: description,
        date: new Date().toLocaleDateString('en-NG')
    });

    saveTransactions();
    renderTransactions();
    incomeForm.reset();
    showMessage('Income added successfully.');
});

// Add an expense when the expense form is submitted
expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const amount = Number(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value.trim();

    if (amount <= 0 || !Number.isFinite(amount)) {
        showMessage('Enter an amount greater than zero.');
        return;
    }

    const totals = calculateTotals();
    const balance = totals.income - totals.expenses;

    if (amount > balance) {
        showMessage('You do not have enough money for this expense.');
        return;
    }

    transactions.push({
        id: Date.now().toString(),
        type: 'expense',
        amount: amount,
        category: category,
        description: description,
        date: new Date().toLocaleDateString('en-NG')
    });

    saveTransactions();
    renderTransactions();
    expenseForm.reset();
    showMessage('Expense added successfully.');
});

// Calculate total income and expenses
function calculateTotals() {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === 'income') {
            income += Number(transaction.amount);
        } else {
            expenses += Number(transaction.amount);
        }
    });

    return { income: income, expenses: expenses };
}

// Update the balance and transaction history on the page
function renderTransactions() {
    const totals = calculateTotals();
    const balance = totals.income - totals.expenses;

    balanceDisplay.textContent = formatMoney(balance);
    incomeDisplay.textContent = formatMoney(totals.income);
    expensesDisplay.textContent = formatMoney(totals.expenses);

    const searchText = searchInput.value.toLowerCase().trim();
    const selectedType = filterType.value;

    const visibleTransactions = transactions.filter(function (transaction) {
        const matchesSearch =
            transaction.description.toLowerCase().includes(searchText) ||
            transaction.category.toLowerCase().includes(searchText);

        const matchesType =
            selectedType === 'all' || transaction.type === selectedType;

        return matchesSearch && matchesType;
    });

    if (visibleTransactions.length === 0) {
        transactionList.innerHTML = '<p class="empty-message">No matching transactions. Add one above or change your search.</p>';
        return;
    }

    transactionList.innerHTML = '';

    // Display newest transactions first
    visibleTransactions.slice().reverse().forEach(function (transaction) {
        const row = document.createElement('div');
        row.className = 'transaction';

        const icon = transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';
        const sign = transaction.type === 'income' ? '+' : '−';

        row.innerHTML = `
            <div class="transaction-left">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <p class="transaction-description"></p>
                    <p class="transaction-detail"></p>
                </div>
            </div>
            <div>
                <span class="transaction-amount ${transaction.type}">${sign}${formatMoney(transaction.amount)}</span>
                <button class="delete-button" type="button" aria-label="Delete transaction" title="Delete transaction">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Use textContent for user-entered text
        row.querySelector('.transaction-description').textContent =
            transaction.description || transaction.category;
        row.querySelector('.transaction-detail').textContent =
            transaction.category + ' · ' + transaction.date;

        row.querySelector('.delete-button').addEventListener('click', function () {
            const shouldDelete = confirm('Delete this transaction?');

            if (shouldDelete) {
                transactions = transactions.filter(function (item) {
                    return item.id !== transaction.id;
                });

                saveTransactions();
                renderTransactions();
                showMessage('Transaction deleted.');
            }
        });

        transactionList.appendChild(row);
    });
}

// Update the list when the user searches or changes the filter
searchInput.addEventListener('input', renderTransactions);
filterType.addEventListener('change', renderTransactions);

// Clear all saved transactions
document.getElementById('clearButton').addEventListener('click', function () {
    if (transactions.length === 0) {
        showMessage('There is no transaction data to clear.');
        return;
    }

    if (confirm('Are you sure you want to delete all transactions?')) {
        transactions = [];
        saveTransactions();
        renderTransactions();
        showMessage('All transactions cleared.');
    }
});

// Show saved transactions when the page first opens
renderTransactions();
