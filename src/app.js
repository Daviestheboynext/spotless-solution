// ============================================
// SPOTLESS SOLUTION - SCHOOL PROJECT
// Clean version for Render deployment
// NO SQLite, NO database.js
// ============================================

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Demo data for school project
const users = [
    { id: 1, email: 'admin@spotless.com', password: 'password123', name: 'Admin', role: 'admin' },
    { id: 2, email: 'cleaner@spotless.com', password: 'password123', name: 'John Cleaner', role: 'cleaner' },
    { id: 3, email: 'customer@spotless.com', password: 'password123', name: 'Sarah Customer', role: 'customer' }
];

let bookings = [];
let nextBookingId = 1;

// ========== ROUTES ==========
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));
app.get('/bookings', (req, res) => res.sendFile(path.join(__dirname, '../public/bookings.html')));
app.get('/calendar', (req, res) => res.sendFile(path.join(__dirname, '../public/calendar.html')));
app.get('/customers', (req, res) => res.sendFile(path.join(__dirname, '../public/customers.html')));
app.get('/cleaners', (req, res) => res.sendFile(path.join(__dirname, '../public/cleaners.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(__dirname, '../public/reports.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../public/settings.html')));

// ========== API ROUTES ==========
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                role: user.role 
            } 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
        });
    }
});

app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = {
        id: nextBookingId++,
        ...req.body,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    bookings.push(booking);
    res.json({ 
        success: true, 
        message: 'Booking created successfully',
        bookingId: booking.id 
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Spotless Solution - School Project',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🎓 SPOTLESS SOLUTION - SCHOOL PROJECT');
    console.log('='.repeat(50));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 Demo Login: admin@spotless.com / password123`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('🚀 Ready for presentation!');
    console.log('='.repeat(50));
});

module.exports = app;
