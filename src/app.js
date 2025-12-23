const express = require('express');
const app = express();
const port = process.env.PORT || 3960;

// ============= HTML PAGE ROUTES =============
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/bookings', (req, res) => {
    res.sendFile(__dirname + '/public/bookings.html');
});

app.get('/customers', (req, res) => {
    res.sendFile(__dirname + '/public/customers.html');
});

app.get('/cleaners', (req, res) => {
    res.sendFile(__dirname + '/public/cleaners.html');
});

app.get('/settings', (req, res) => {
    res.sendFile(__dirname + '/public/settings.html');
});

app.get('/reports', (req, res) => {
    res.sendFile(__dirname + '/public/reports.html');
});

// Add this at the VERY TOP of app.js
console.log('=== DEBUG ===');
console.log('process.env.PORT:', process.env.PORT);
console.log('Default port will be:', process.env.PORT || 3960);
console.log('=== DEBUG ===\n');

// ============= MIDDLEWARE =============
app.use(express.json());
app.use(express.static('public'));

// CORS for Render
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ============= DATA STORAGE =============
let users = [
    {
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@spotless.com",
        password: "admin123",
        phone: "+254 712 345 678",
        company: "Spotless Solution Kenya",
        role: "admin",
        avatar: "AU"
    }
];

let bookings = [
    { id: 1, customer: "John Kamau", service: "Deep Cleaning", date: "2024-03-15", status: "confirmed", amount: 22500 },
    { id: 2, customer: "Sarah Achieng", service: "Regular Cleaning", date: "2024-03-14", status: "completed", amount: 13500 },
    { id: 3, customer: "Mike Otieno", service: "Office Cleaning", date: "2024-03-14", status: "pending", amount: 30000 },
    { id: 4, customer: "Faith Wanjiku", service: "Deep Cleaning", date: "2024-03-13", status: "completed", amount: 22500 },
    { id: 5, customer: "David Mwangi", service: "Regular Cleaning", date: "2024-03-13", status: "confirmed", amount: 13500 }
];

let notifications = [
    { id: 1, type: "info", message: "Karibu to Spotless Solution!", timestamp: new Date().toISOString(), read: false },
    { id: 2, type: "booking", message: "New booking #1001 received from John Kamau", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: 3, type: "payment", message: "Payment of KES 22,500 received for booking #1001", timestamp: new Date(Date.now() - 7200000).toISOString(), read: true }
];

let currentUser = null;

// ============= AUTHENTICATION API =============
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = { ...user };
        delete currentUser.password; // Don't send password back
        
        res.json({ 
            success: true, 
            message: "Login successful!",
            user: currentUser,
            token: "spotless-token-" + Date.now()
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: "Invalid email or password" 
        });
    }
});

// ... [ALL YOUR OTHER API CODE REMAINS THE SAME] ...

// ============= SERVER START =============
app.listen(port, () => {
    console.log(\✅ Spotless Solution Kenya Server running on port \\);
    console.log(\🌐 Local URL: http://localhost:\\);
    console.log(\📊 Dashboard: http://localhost:\/dashboard\);
    console.log(\🔐 Login: http://localhost:\/login\);
    console.log(\📱 SMS API: /api/sms/send\);
    console.log(\💰 M-Pesa API: /api/mpesa/payment\);
});
