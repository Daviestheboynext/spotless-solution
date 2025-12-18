require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory database for school project demo
let bookings = [];
let users = [
    { id: 1, email: 'admin@spotless.com', password: 'password123', name: 'Admin', role: 'admin' },
    { id: 2, email: 'cleaner@spotless.com', password: 'password123', name: 'Cleaner', role: 'cleaner' },
    { id: 3, email: 'customer@spotless.com', password: 'password123', name: 'Customer', role: 'customer' }
];

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));
app.get('/bookings', (req, res) => res.sendFile(path.join(__dirname, '../public/bookings.html')));
app.get('/calendar', (req, res) => res.sendFile(path.join(__dirname, '../public/calendar.html')));
app.get('/customers', (req, res) => res.sendFile(path.join(__dirname, '../public/customers.html')));
app.get('/cleaners', (req, res) => res.sendFile(path.join(__dirname, '../public/cleaners.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(__dirname, '../public/reports.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../public/settings.html')));

// API Routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name, role: user.role } 
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = { 
        id: bookings.length + 1, 
        ...req.body, 
        status: 'pending', 
        created_at: new Date().toISOString() 
    };
    bookings.push(booking);
    res.json({ success: true, bookingId: booking.id });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Spotless Solution - School Project',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🎓 Ready for presentation!`);
});
