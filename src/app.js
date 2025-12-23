const express = require('express');
const app = express();
const port = process.env.PORT || 3960;  // MUST be 3960 (matches Render)

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

app.post('/api/logout', (req, res) => {
    currentUser = null;
    res.json({ 
        success: true, 
        message: "Logged out successfully" 
    });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ 
        success: currentUser !== null, 
        user: currentUser 
    });
});

// ============= DASHBOARD API =============
app.get('/api/dashboard/stats', (req, res) => {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    
    // Kenyan themed colors
    const kenyanColors = {
        green: '#007A4D',    // Kenyan green
        red: '#BD271A',      // Kenyan red
        black: '#000000',    // Kenyan black
        gold: '#FFB81C'      // Kenyan gold
    };
    
    res.json({
        success: true,
        stats: {
            totalRevenue,
            totalBookings: bookings.length,
            pendingBookings,
            completedBookings,
            activeCleaners: 8,
            customerSatisfaction: 4.6,
            monthlyGrowth: 12.5,
            kenyanColors: kenyanColors
        },
        chartData: {
            monthlyRevenue: [
                { month: 'Jan', revenue: 315000, bookings: 15 },
                { month: 'Feb', revenue: 367500, bookings: 18 },
                { month: 'Mar', revenue: 337500, bookings: 17 },
                { month: 'Apr', revenue: 262500, bookings: 13 },
                { month: 'May', revenue: 292500, bookings: 12 }
            ],
            services: [
                { service: 'Deep Cleaning', count: 42, color: kenyanColors.green },
                { service: 'Regular Cleaning', count: 35, color: kenyanColors.red },
                { service: 'Office Cleaning', count: 28, color: kenyanColors.black }
            ]
        }
    });
});

// ============= REPORTS API =============
app.get('/api/reports', (req, res) => {
    const { type = 'financial' } = req.query;
    
    const reports = {
        financial: {
            title: "Financial Report",
            subtitle: "Spotless Solution Kenya",
            period: "January 2024 - May 2024",
            totalRevenue: 1575000,
            totalBookings: 75,
            averageBooking: 21000,
            currency: "KES",
            data: [
                { month: 'Jan', revenue: 315000, bookings: 15 },
                { month: 'Feb', revenue: 367500, bookings: 18 },
                { month: 'Mar', revenue: 337500, bookings: 17 },
                { month: 'Apr', revenue: 262500, bookings: 13 },
                { month: 'May', revenue: 292500, bookings: 12 }
            ]
        },
        performance: {
            title: "Performance Report",
            subtitle: "Team Efficiency Analysis",
            topCleaners: [
                { name: 'John Doe', completed: 42, rating: 4.8, efficiency: '95%' },
                { name: 'Sarah Smith', completed: 38, rating: 4.7, efficiency: '88%' },
                { name: 'Mike Johnson', completed: 35, rating: 4.6, efficiency: '85%' }
            ],
            customerSatisfaction: 4.5,
            repeatCustomers: 68,
            completionRate: '94%'
        },
        customer: {
            title: "Customer Analysis",
            subtitle: "Client Insights Report",
            totalCustomers: 156,
            newThisMonth: 24,
            retentionRate: '78%',
            topLocations: [
                { location: 'Nairobi CBD', customers: 45 },
                { location: 'Westlands', customers: 32 },
                { location: 'Karen', customers: 28 }
            ]
        }
    };
    
    const report = reports[type] || reports.financial;
    res.json({ success: true, report });
});

app.post('/api/reports/export', (req, res) => {
    const { format = 'pdf', type = 'financial' } = req.body;
    
    res.json({ 
        success: true, 
        message: `Report exported as ${format.toUpperCase()}`,
        filename: `spotless-${type}-report-${new Date().toISOString().split('T')[0]}.${format}`,
        downloadUrl: '#',
        timestamp: new Date().toISOString()
    });
});

// ============= NOTIFICATIONS API =============
app.get('/api/notifications', (req, res) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({ 
        success: true, 
        notifications: notifications.slice(0, 10), // Last 10 notifications
        unreadCount,
        total: notifications.length
    });
});

app.post('/api/notifications/send', (req, res) => {
    const { message, type = 'info', recipient = 'all' } = req.body;
    
    if (!message) {
        return res.status(400).json({ 
            success: false, 
            message: "Message is required" 
        });
    }
    
    const notification = {
        id: notifications.length + 1,
        type,
        message,
        recipient,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    res.json({ 
        success: true, 
        message: "Notification sent successfully",
        notification
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const id = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.read = true;
        res.json({ success: true, message: "Notification marked as read" });
    } else {
        res.status(404).json({ success: false, message: "Notification not found" });
    }
});

// ============= PROFILE API =============
app.get('/api/profile', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ 
            success: false, 
            message: "Please login first" 
        });
    }
    
    const profile = users.find(u => u.id === currentUser.id);
    if (profile) {
        const { password, ...userWithoutPassword } = profile;
        res.json({ success: true, profile: userWithoutPassword });
    } else {
        res.status(404).json({ success: false, message: "Profile not found" });
    }
});

app.put('/api/profile', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ 
            success: false, 
            message: "Please login first" 
        });
    }
    
    const updates = req.body;
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        // Keep password if not being updated
        if (!updates.password) {
            updates.password = users[userIndex].password;
        }
        
        users[userIndex] = { ...users[userIndex], ...updates };
        currentUser = { ...users[userIndex] };
        delete currentUser.password;
        
        res.json({ 
            success: true, 
            message: "Profile updated successfully",
            profile: currentUser
        });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// ============= BOOKINGS API =============
app.get('/api/bookings', (req, res) => {
    res.json({ 
        success: true, 
        bookings: bookings.slice(0, 10), // Last 10 bookings
        total: bookings.length
    });
});

app.post('/api/bookings', (req, res) => {
    const newBooking = {
        id: bookings.length + 1000,
        ...req.body,
        status: 'pending',
        created: new Date().toISOString(),
        amount: parseInt(req.body.amount) || 0
    };
    
    bookings.unshift(newBooking);
    
    // Add notification
    notifications.unshift({
        id: notifications.length + 1,
        type: 'booking',
        message: `New booking #${newBooking.id} from ${newBooking.customer}`,
        timestamp: new Date().toISOString(),
        read: false
    });
    
    res.json({ 
        success: true, 
        message: "Booking created successfully",
        booking: newBooking,
        bookingId: newBooking.id
    });
});

// ============= SERVICES API =============
app.get('/api/services', (req, res) => {
    const services = [
        { id: 1, name: "Deep Cleaning", price: 22500, duration: "4-6 hours", description: "Complete home deep cleaning" },
        { id: 2, name: "Regular Cleaning", price: 13500, duration: "2-3 hours", description: "Weekly/Monthly regular cleaning" },
        { id: 3, name: "Office Cleaning", price: 30000, duration: "5-8 hours", description: "Commercial office cleaning" },
        { id: 4, name: "Carpet Cleaning", price: 18000, duration: "3-4 hours", description: "Professional carpet cleaning" },
        { id: 5, name: "Window Cleaning", price: 12000, duration: "2-3 hours", description: "Interior/Exterior window cleaning" }
    ];
    
    res.json({ success: true, services });
});

// ============= SMS SIMULATION API (Kenyan Focus) =============
app.post('/api/sms/send', (req, res) => {
    const { phone, message } = req.body;
    
    // Validate Kenyan phone number
    if (!phone.startsWith('+254') && !phone.startsWith('254') && !phone.startsWith('07')) {
        return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid Kenyan phone number" 
        });
    }
    
    // Simulate SMS sending
    console.log(`📱 [SMS SIMULATION] To: ${phone}, Message: ${message}`);
    
    res.json({ 
        success: true, 
        message: "SMS sent successfully",
        reference: "SMS-" + Date.now(),
        cost: 1, // KES
        provider: "Safaricom"
    });
});

// ============= M-PESA SIMULATION API =============
app.post('/api/mpesa/payment', (req, res) => {
    const { phone, amount, reference } = req.body;
    
    // Remove + from phone if present
    const cleanPhone = phone.replace('+', '');
    
    // Simulate M-Pesa payment
    const transaction = {
        id: "MPE" + Date.now(),
        phone: cleanPhone,
        amount: parseInt(amount),
        reference: reference || "Spotless Booking",
        status: "completed",
        timestamp: new Date().toISOString(),
        message: `Confirmed. KSh${amount} sent to Spotless Solution. Transaction ID: MPE${Date.now()}`,
        balance: 5000 + Math.floor(Math.random() * 10000)
    };
    
    res.json({ 
        success: true, 
        message: "M-Pesa payment initiated",
        transaction: transaction,
        instruction: "Check your phone to enter M-Pesa PIN"
    });
});

// ============= SERVER START =============
app.listen(port, () => {
    console.log(`✅ Spotless Solution Kenya Server running on port ${port}`);
    console.log(`🌐 Local URL: http://localhost:${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
    console.log(`🔐 Login: http://localhost:${port}/login`);
    console.log(`📱 SMS API: /api/sms/send`);
    console.log(`💰 M-Pesa API: /api/mpesa/payment`);
});

// REMOVE THE DUPLICATE SERVER START AT THE BOTTOM!
// DELETE everything after this line if it exists