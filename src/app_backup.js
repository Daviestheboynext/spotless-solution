const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Simple in-memory database
const users = [
    { id: 1, email: "admin@spotless.com", password: "admin123", name: "Admin User", role: "admin" },
    { id: 2, email: "cleaner@spotless.com", password: "cleaner123", name: "John Cleaner", role: "cleaner" },
    { id: 3, email: "customer@spotless.com", password: "customer123", name: "Sarah Customer", role: "customer" }
];

const bookings = [
    { id: 1, customer: "Sarah Johnson", service: "Deep Cleaning", date: "2023-10-15", status: "completed", priority: "low", amount: 250 },
    { id: 2, customer: "Michael Chen", service: "Office Cleaning", date: "2023-10-16", status: "confirmed", priority: "high", amount: 450 },
    { id: 3, customer: "Emma Williams", service: "Regular Cleaning", date: "2023-10-17", status: "pending", priority: "medium", amount: 180 },
    { id: 4, customer: "David Miller", service: "Carpet Cleaning", date: "2023-10-18", status: "confirmed", priority: "low", amount: 320 },
    { id: 5, customer: "Lisa Anderson", service: "Window Cleaning", date: "2023-10-19", status: "pending", priority: "high", amount: 275 }
];

const customers = [
    { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1234567890", joinDate: "2023-01-15", totalBookings: 5 },
    { id: 2, name: "Michael Chen", email: "michael@email.com", phone: "+1234567891", joinDate: "2023-02-20", totalBookings: 3 },
    { id: 3, name: "Emma Williams", email: "emma@email.com", phone: "+1234567892", joinDate: "2023-03-10", totalBookings: 7 },
    { id: 4, name: "David Miller", email: "david@email.com", phone: "+1234567893", joinDate: "2023-04-05", totalBookings: 2 },
    { id: 5, name: "Lisa Anderson", email: "lisa@email.com", phone: "+1234567894", joinDate: "2023-05-12", totalBookings: 4 }
];

const cleaners = [
    { id: 1, name: "John Doe", email: "john@spotless.com", phone: "+1234567801", status: "active", rating: 4.8, jobsCompleted: 124 },
    { id: 2, name: "Jane Smith", email: "jane@spotless.com", phone: "+1234567802", status: "active", rating: 4.9, jobsCompleted: 89 },
    { id: 3, name: "Robert Brown", email: "robert@spotless.com", phone: "+1234567803", status: "on-leave", rating: 4.7, jobsCompleted: 156 },
    { id: 4, name: "Maria Garcia", email: "maria@spotless.com", phone: "+1234567804", status: "active", rating: 4.6, jobsCompleted: 67 }
];

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // For demo, any token works
        req.user = { id: 1, name: "Admin User", role: "admin" };
        return next();
    }
    
    // Check for token in query (for demo)
    const token = req.query.token;
    if (token === "demo-token") {
        req.user = { id: 1, name: "Admin User", role: "admin" };
        return next();
    }
    
    res.status(401).json({ success: false, message: "Unauthorized" });
};

// ===== ROUTES =====

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Auth routes
app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Please provide name, email, and password" 
        });
    }
    
    const userExists = users.find(u => u.email === email);
    if (userExists) {
        return res.status(400).json({ 
            success: false, 
            message: "User already exists" 
        });
    }
    
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role: "customer"
    };
    
    users.push(newUser);
    
    res.json({
        success: true,
        message: "User registered successfully",
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
});

app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials" 
        });
    }
    
    res.json({
        success: true,
        message: "Login successful",
        token: "demo-token",
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});

// Dashboard routes
app.get("/api/dashboard/stats", authenticate, (req, res) => {
    const stats = {
        totalBookings: bookings.length,
        completed: bookings.filter(b => b.status === "completed").length,
        pending: bookings.filter(b => b.status === "pending").length,
        revenue: bookings.reduce((sum, b) => sum + b.amount, 0),
        totalCustomers: customers.length,
        activeCleaners: cleaners.filter(c => c.status === "active").length
    };
    
    res.json({ success: true, data: stats });
});

app.get("/api/dashboard/recent-bookings", authenticate, (req, res) => {
    res.json({ success: true, data: bookings.slice(0, 5) });
});

// Booking routes
app.get("/api/bookings", authenticate, (req, res) => {
    res.json({ success: true, data: bookings });
});

app.get("/api/bookings/:id", authenticate, (req, res) => {
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, data: booking });
});

app.post("/api/bookings", authenticate, (req, res) => {
    const newBooking = {
        id: bookings.length + 1,
        ...req.body,
        status: "pending",
        createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    res.json({ success: true, data: newBooking });
});

// Customer routes
app.get("/api/customers", authenticate, (req, res) => {
    res.json({ success: true, data: customers });
});

app.get("/api/customers/:id", authenticate, (req, res) => {
    const customer = customers.find(c => c.id === parseInt(req.params.id));
    if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: customer });
});

// Cleaner routes
app.get("/api/cleaners", authenticate, (req, res) => {
    res.json({ success: true, data: cleaners });
});

// Settings routes
app.get("/api/settings", authenticate, (req, res) => {
    const settings = {
        companyName: "Spotless Solution",
        contactEmail: "info@spotless.com",
        contactPhone: "+1 (555) 123-4567",
        workingHours: "Mon-Fri 8:00 AM - 6:00 PM",
        currency: "USD",
        taxRate: 10
    };
    res.json({ success: true, data: settings });
});

// Static page routes
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/auth/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/auth/register.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.get("/bookings", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/bookings.html"));
});

app.get("/customers", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/customers.html"));
});

app.get("/cleaners", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/cleaners.html"));
});

app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/settings.html"));
});

// API Health endpoint
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "OK",
        message: "Spotless Solution API v1.0",
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : {}
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 Spotless Solution Server Started!
    📍 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    
    📊 Available Pages:
    • Home: http://localhost:${PORT}/
    • Login: http://localhost:${PORT}/login
    • Register: http://localhost:${PORT}/register
    • Dashboard: http://localhost:${PORT}/dashboard
    • Bookings: http://localhost:${PORT}/bookings
    • Customers: http://localhost:${PORT}/customers
    • Cleaners: http://localhost:${PORT}/cleaners
    • Settings: http://localhost:${PORT}/settings
    
    🔧 API Endpoints:
    • Health: http://localhost:${PORT}/api/health
    • Dashboard Stats: http://localhost:${PORT}/api/dashboard/stats?token=demo-token
    • Bookings: http://localhost:${PORT}/api/bookings?token=demo-token
    
    💡 Demo Token: demo-token
    `);
});

// Updated API endpoints using database

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const bookings = await db.all(`
            SELECT 
                b.*,
                u.name as customer_name,
                u.email as customer_email,
                c.name as cleaner_name,
                cu.address as customer_address
            FROM bookings b
            LEFT JOIN customers cust ON b.customer_id = cust.id
            LEFT JOIN users u ON cust.user_id = u.id
            LEFT JOIN cleaners cl ON b.cleaner_id = cl.id
            LEFT JOIN users c ON cl.user_id = c.id
            LEFT JOIN customers cu ON b.customer_id = cu.id
            ORDER BY b.date DESC, b.time DESC
            LIMIT 50
        `);

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const stats = await db.get(`
            SELECT 
                COUNT(*) as totalBookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                SUM(price) as revenue,
                AVG(CASE WHEN status = 'completed' THEN price ELSE NULL END) as avgRevenue
            FROM bookings
        `);

        // Get today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await db.get(`
            SELECT COUNT(*) as todayBookings FROM bookings WHERE date = ?
        `, [today]);

        res.json({ 
            success: true, 
            data: {
                ...stats,
                ...todayStats,
                revenue: stats.revenue ? `$${parseFloat(stats.revenue).toFixed(2)}` : '$0'
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const customers = await db.all(`
            SELECT 
                c.*,
                u.name,
                u.email,
                u.phone,
                COUNT(b.id) as total_bookings,
                SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings
            FROM customers c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN bookings b ON c.id = b.customer_id
            GROUP BY c.id
            ORDER BY u.name
        `);

        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all cleaners
app.get('/api/cleaners', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const cleaners = await db.all(`
            SELECT 
                cl.*,
                u.name,
                u.email,
                u.phone,
                COUNT(b.id) as total_jobs,
                AVG(CASE WHEN b.status = 'completed' THEN 1 ELSE NULL END) as completion_rate
            FROM cleaners cl
            JOIN users u ON cl.user_id = u.id
            LEFT JOIN bookings b ON cl.id = b.cleaner_id
            GROUP BY cl.id
            ORDER BY cl.rating DESC
        `);

        res.json({ success: true, data: cleaners });
    } catch (error) {
        console.error('Error fetching cleaners:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new booking
app.post('/api/bookings', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { customer_id, service_type, date, time, duration_hours, address, price, priority } = req.body;

        const result = await db.run(`
            INSERT INTO bookings (customer_id, service_type, date, time, duration_hours, address, price, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [customer_id, service_type, date, time, duration_hours, address, price, priority]);

        res.json({ 
            success: true, 
            message: 'Booking created successfully',
            bookingId: result.lastID 
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update booking status
app.put('/api/bookings/:id/status', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { status } = req.body;

        await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);

        res.json({ 
            success: true, 
            message: 'Booking status updated'
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
