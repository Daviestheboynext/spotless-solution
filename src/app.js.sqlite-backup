const express = require('express');
const path = require('path');
const { initDatabase } = require('./database');
const fs = require('fs');

// Initialize database
let db;
initDatabase().then(database => {
    db = database;
    console.log('✅ Database connected and ready');
}).catch(err => {
    console.error('❌ Database connection failed:', err);
});

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if HTML file exists before serving
function serveHtml(fileName) {
    return (req, res, next) => {
        const filePath = path.join(__dirname, '../public', fileName);
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File doesn't exist, create a simple response
                res.status(404).json({ 
                    success: false, 
                    message: `Page ${fileName} not found`,
                    availablePages: ['dashboard.html', 'bookings.html', 'customers.html', 'cleaners.html', 'settings.html', 'login.html']
                });
            } else {
                res.sendFile(filePath);
            }
        });
    };
}

// Root route - redirect to dashboard if logged in, otherwise to login
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../public', 'index.html');
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // If index.html doesn't exist, redirect to login
            res.redirect('/login');
        } else {
            res.sendFile(filePath);
        }
    });
});

// Route for dashboard
app.get('/dashboard', serveHtml('dashboard.html'));

// Route for bookings
app.get('/bookings', serveHtml('bookings.html'));

// Route for customers
app.get('/customers', serveHtml('customers.html'));

// Route for cleaners
app.get('/cleaners', serveHtml('cleaners.html'));

// Route for settings
app.get('/settings', serveHtml('settings.html'));

// Route for login
app.get('/login', serveHtml('login.html'));

// API Routes
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

// Auth API
app.post('/api/auth/login', express.json(), (req, res) => {
    const { email, password } = req.body;
    
    // Demo authentication
    if (email === 'admin@spotless.com' && password === 'admin123') {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'demo-token',
            user: {
                name: 'Admin User',
                email: email,
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        
        await db.run('DELETE FROM bookings WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update booking
app.put('/api/bookings/:id', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { customer_id, service_type, date, time, duration_hours, address, price, priority, status, special_instructions } = req.body;

        await db.run(`
            UPDATE bookings 
            SET customer_id = ?, service_type = ?, date = ?, time = ?, duration_hours = ?, 
                address = ?, price = ?, priority = ?, status = ?, special_instructions = ?
            WHERE id = ?
        `, [customer_id, service_type, date, time, duration_hours, address, price, priority, status, special_instructions, id]);

        res.json({ 
            success: true, 
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new customer
app.post('/api/customers', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, email, phone, address, preferred_cleaner, special_instructions, loyalty_points } = req.body;

        // First create user
        const userResult = await db.run(`
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, 'customer', ?)
        `, [name, email, 'password123', phone]);

        // Then create customer
        await db.run(`
            INSERT INTO customers (user_id, address, preferred_cleaner, special_instructions, loyalty_points)
            VALUES (?, ?, ?, ?, ?)
        `, [userResult.lastID, address, preferred_cleaner, special_instructions, loyalty_points]);

        res.json({ 
            success: true, 
            message: 'Customer created successfully',
            customerId: userResult.lastID 
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update customer
app.put('/api/customers/:id', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { name, email, phone, address, preferred_cleaner, special_instructions, loyalty_points } = req.body;

        // Get user_id from customer
        const customer = await db.get('SELECT user_id FROM customers WHERE id = ?', [id]);
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Update user
        await db.run(`
            UPDATE users 
            SET name = ?, email = ?, phone = ?
            WHERE id = ?
        `, [name, email, phone, customer.user_id]);

        // Update customer
        await db.run(`
            UPDATE customers 
            SET address = ?, preferred_cleaner = ?, special_instructions = ?, loyalty_points = ?
            WHERE id = ?
        `, [address, preferred_cleaner, special_instructions, loyalty_points, id]);

        res.json({ 
            success: true, 
            message: 'Customer updated successfully'
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        
        // Get user_id from customer
        const customer = await db.get('SELECT user_id FROM customers WHERE id = ?', [id]);
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Delete customer (cascade will handle user deletion if foreign key is set up)
        await db.run('DELETE FROM customers WHERE id = ?', [id]);
        await db.run('DELETE FROM users WHERE id = ?', [customer.user_id]);

        res.json({ 
            success: true, 
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single customer with details
app.get('/api/customers/:id', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;

        const customer = await db.get(`
            SELECT 
                c.*,
                u.name,
                u.email,
                u.phone,
                COUNT(b.id) as total_bookings,
                SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                SUM(b.price) as total_spent
            FROM customers c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN bookings b ON c.id = b.customer_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [id]);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Search customers
app.get('/api/customers/search', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const search = req.query.search || '';

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
            WHERE u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?
            GROUP BY c.id
            ORDER BY u.name
        `, [`%${search}%`, `%${search}%`, `%${search}%`]);

        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new cleaner
app.post('/api/cleaners', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, email, phone, bio, hourly_rate, skills, availability, rating, total_jobs, status } = req.body;

        // First create user
        const userResult = await db.run(`
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, 'cleaner', ?)
        `, [name, email, 'password123', phone]);

        // Then create cleaner
        await db.run(`
            INSERT INTO cleaners (user_id, bio, hourly_rate, skills, availability, rating, total_jobs)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userResult.lastID, bio, hourly_rate, skills, availability, rating || 4.5, total_jobs || 0]);

        res.json({ 
            success: true, 
            message: 'Cleaner created successfully',
            cleanerId: userResult.lastID 
        });
    } catch (error) {
        console.error('Error creating cleaner:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update cleaner
app.put('/api/cleaners/:id', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { name, email, phone, bio, hourly_rate, skills, availability, rating, total_jobs, status } = req.body;

        // Get user_id from cleaner
        const cleaner = await db.get('SELECT user_id FROM cleaners WHERE id = ?', [id]);
        
        if (!cleaner) {
            return res.status(404).json({ success: false, message: 'Cleaner not found' });
        }

        // Update user
        await db.run(`
            UPDATE users 
            SET name = ?, email = ?, phone = ?
            WHERE id = ?
        `, [name, email, phone, cleaner.user_id]);

        // Update cleaner
        await db.run(`
            UPDATE cleaners 
            SET bio = ?, hourly_rate = ?, skills = ?, availability = ?, rating = ?, total_jobs = ?
            WHERE id = ?
        `, [bio, hourly_rate, skills, availability, rating, total_jobs, id]);

        res.json({ 
            success: true, 
            message: 'Cleaner updated successfully'
        });
    } catch (error) {
        console.error('Error updating cleaner:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete cleaner
app.delete('/api/cleaners/:id', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        
        // Get user_id from cleaner
        const cleaner = await db.get('SELECT user_id FROM cleaners WHERE id = ?', [id]);
        
        if (!cleaner) {
            return res.status(404).json({ success: false, message: 'Cleaner not found' });
        }

        // Delete cleaner
        await db.run('DELETE FROM cleaners WHERE id = ?', [id]);
        await db.run('DELETE FROM users WHERE id = ?', [cleaner.user_id]);

        res.json({ 
            success: true, 
            message: 'Cleaner deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cleaner:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single cleaner with details
app.get('/api/cleaners/:id', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;

        const cleaner = await db.get(`
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
            WHERE cl.id = ?
            GROUP BY cl.id
        `, [id]);

        if (!cleaner) {
            return res.status(404).json({ success: false, message: 'Cleaner not found' });
        }

        res.json({ success: true, data: cleaner });
    } catch (error) {
        console.error('Error fetching cleaner:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Search cleaners with filters
app.get('/api/cleaners/search', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const search = req.query.search || '';
        const status = req.query.status || '';
        const minRating = req.query.min_rating || '';

        let query = `
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
            WHERE 1=1
        `;
        
        const params = [];
        
        if (search) {
            query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR cl.skills LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status) {
            // Note: You would need to add a status column to the cleaners table
            // For now, we'll simulate it based on availability
            if (status === 'available') {
                query += ` AND cl.availability LIKE '%mon%'`; // Simplified logic
            }
        }
        
        if (minRating) {
            query += ` AND cl.rating >= ?`;
            params.push(minRating);
        }
        
        query += ` GROUP BY cl.id ORDER BY cl.rating DESC, u.name`;

        const cleaners = await db.all(query, params);

        res.json({ success: true, data: cleaners });
    } catch (error) {
        console.error('Error searching cleaners:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get bookings for calendar view
app.get('/api/bookings/calendar', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end, cleaner_id, status } = req.query;
        
        let query = `
            SELECT 
                b.id,
                b.customer_id,
                b.cleaner_id,
                b.date,
                b.time,
                b.duration,
                b.status,
                b.service_type,
                b.notes,
                b.total_price,
                b.address,
                u_customer.name as customer_name,
                u_customer.email as customer_email,
                u_cleaner.name as cleaner_name
            FROM bookings b
            JOIN users u_customer ON b.customer_id = u_customer.id
            JOIN cleaners cl ON b.cleaner_id = cl.id
            JOIN users u_cleaner ON cl.user_id = u_cleaner.id
            WHERE b.date BETWEEN ? AND ?
        `;
        
        const params = [start.split('T')[0], end.split('T')[0]];
        
        if (cleaner_id) {
            query += ` AND b.cleaner_id = ?`;
            params.push(cleaner_id);
        }
        
        if (status) {
            query += ` AND b.status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY b.date, b.time`;
        
        const bookings = await db.all(query, params);

        res.json({ 
            success: true, 
            data: bookings 
        });
    } catch (error) {
        console.error('Error fetching calendar bookings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get booking statistics for calendar dashboard
app.get('/api/bookings/stats', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { date } = req.query;
        const today = date || new Date().toISOString().split('T')[0];
        
        // Get confirmed bookings for today
        const confirmedToday = await db.get(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue
            FROM bookings 
            WHERE date = ? AND status = 'confirmed'
        `, [today]);
        
        // Get total bookings for today
        const totalToday = await db.get(`
            SELECT COUNT(*) as count
            FROM bookings 
            WHERE date = ?
        `, [today]);
        
        // Get pending bookings total
        const pendingTotal = await db.get(`
            SELECT COUNT(*) as count
            FROM bookings 
            WHERE status = 'pending'
        `);

        res.json({ 
            success: true, 
            data: {
                confirmed_today: confirmedToday.count,
                revenue_today: confirmedToday.revenue,
                total_today: totalToday.count,
                pending_total: pendingTotal.count
            }
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update booking time (for drag & drop)
app.put('/api/bookings/:id/time', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { date, time } = req.body;
        
        // Check if cleaner is available at new time
        const booking = await db.get(`
            SELECT cleaner_id, duration 
            FROM bookings 
            WHERE id = ?
        `, [id]);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        // Check for conflicts (simplified - in real app would check availability)
        const conflict = await db.get(`
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE cleaner_id = ? 
            AND date = ? 
            AND time = ?
            AND id != ?
            AND status != 'cancelled'
        `, [booking.cleaner_id, date, time, id]);
        
        if (conflict.count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cleaner already has a booking at this time' 
            });
        }
        
        // Update booking
        await db.run(`
            UPDATE bookings 
            SET date = ?, time = ?, updated_at = datetime('now')
            WHERE id = ?
        `, [date, time, id]);

        res.json({ 
            success: true, 
            message: 'Booking time updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking time:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update booking duration (for resize)
app.put('/api/bookings/:id/duration', express.json(), async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { duration } = req.body;
        
        // Get cleaner hourly rate
        const booking = await db.get(`
            SELECT b.cleaner_id, c.hourly_rate
            FROM bookings b
            JOIN cleaners c ON b.cleaner_id = c.id
            WHERE b.id = ?
        `, [id]);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        // Calculate new price
        const total_price = (booking.hourly_rate * duration).toFixed(2);
        
        // Update booking
        await db.run(`
            UPDATE bookings 
            SET duration = ?, total_price = ?, updated_at = datetime('now')
            WHERE id = ?
        `, [duration, total_price, id]);

        res.json({ 
            success: true, 
            message: 'Booking duration updated successfully'
        });
    } catch (error) {
        console.error('Error updating booking duration:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check cleaner availability
app.get('/api/cleaners/:id/availability', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { date } = req.query;
        
        // Get cleaner's availability days
        const cleaner = await db.get(`
            SELECT availability 
            FROM cleaners 
            WHERE id = ?
        `, [id]);
        
        if (!cleaner) {
            return res.status(404).json({ success: false, message: 'Cleaner not found' });
        }
        
        // Get bookings for the date
        const bookings = await db.all(`
            SELECT time, duration 
            FROM bookings 
            WHERE cleaner_id = ? 
            AND date = ? 
            AND status != 'cancelled'
            ORDER BY time
        `, [id, date]);
        
        // Generate available time slots (8am-8pm)
        const availableSlots = [];
        const dayStart = 8; // 8am
        const dayEnd = 20; // 8pm
        
        // Simple availability check - in real app would check cleaner's schedule
        for (let hour = dayStart; hour < dayEnd; hour++) {
            const slotTime = `${hour.toString().padStart(2, '0')}:00`;
            let isAvailable = true;
            
            // Check if slot conflicts with existing bookings
            for (const booking of bookings) {
                const bookingHour = parseInt(booking.time.split(':')[0]);
                const bookingEndHour = bookingHour + booking.duration;
                
                if (hour >= bookingHour && hour < bookingEndHour) {
                    isAvailable = false;
                    break;
                }
            }
            
            if (isAvailable) {
                availableSlots.push(slotTime);
            }
        }

        res.json({ 
            success: true, 
            data: {
                available_slots: availableSlots,
                existing_bookings: bookings
            }
        });
    } catch (error) {
        console.error('Error checking cleaner availability:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve calendar page
app.get('/calendar', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/calendar.html'));
});

// Get overview reports data
app.get('/api/reports/overview', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end } = req.query;
        
        // Calculate previous period for comparison
        const startDate = new Date(start);
        const endDate = new Date(end);
        const periodDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
        
        const prevStartDate = new Date(startDate);
        const prevEndDate = new Date(endDate);
        prevStartDate.setDate(prevStartDate.getDate() - periodDiff - 1);
        prevEndDate.setDate(prevEndDate.getDate() - periodDiff - 1);
        
        // Total revenue
        const revenueResult = await db.get(`
            SELECT COALESCE(SUM(total_price), 0) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ? 
            AND status IN ('confirmed', 'completed')
        `, [start, end]);
        
        const prevRevenueResult = await db.get(`
            SELECT COALESCE(SUM(total_price), 0) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ? 
            AND status IN ('confirmed', 'completed')
        `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);
        
        const totalRevenue = revenueResult.total;
        const prevRevenue = prevRevenueResult.total;
        const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
        
        // Total bookings
        const bookingsResult = await db.get(`
            SELECT COUNT(*) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ?
        `, [start, end]);
        
        const prevBookingsResult = await db.get(`
            SELECT COUNT(*) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ?
        `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);
        
        const totalBookings = bookingsResult.total;
        const prevBookings = prevBookingsResult.total;
        const bookingsChange = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings * 100).toFixed(1) : 0;
        
        // New customers
        const newCustomersResult = await db.get(`
            SELECT COUNT(*) as total
            FROM users 
            WHERE role = 'customer' 
            AND DATE(created_at) BETWEEN ? AND ?
        `, [start, end]);
        
        const prevCustomersResult = await db.get(`
            SELECT COUNT(*) as total
            FROM users 
            WHERE role = 'customer' 
            AND DATE(created_at) BETWEEN ? AND ?
        `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);
        
        const newCustomers = newCustomersResult.total;
        const prevCustomers = prevCustomersResult.total;
        const customersChange = prevCustomers > 0 ? ((newCustomers - prevCustomers) / prevCustomers * 100).toFixed(1) : 0;
        
        // Active cleaners
        const activeCleanersResult = await db.get(`
            SELECT COUNT(DISTINCT cleaner_id) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ? 
            AND status IN ('confirmed', 'completed')
        `, [start, end]);
        
        const prevCleanersResult = await db.get(`
            SELECT COUNT(DISTINCT cleaner_id) as total
            FROM bookings 
            WHERE date BETWEEN ? AND ? 
            AND status IN ('confirmed', 'completed')
        `, [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]);
        
        const activeCleaners = activeCleanersResult.total;
        const prevCleaners = prevCleanersResult.total;
        const cleanersChange = prevCleaners > 0 ? ((activeCleaners - prevCleaners) / prevCleaners * 100).toFixed(1) : 0;
        
        // Revenue trend (last 12 months)
        const revenueTrend = await db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(total_price), 0) as revenue
            FROM bookings 
            WHERE status IN ('confirmed', 'completed')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month DESC
            LIMIT 12
        `);
        
        // Bookings by status
        const bookingsByStatus = await db.all(`
            SELECT 
                status,
                COUNT(*) as count
            FROM bookings 
            WHERE date BETWEEN ? AND ?
            GROUP BY status
        `, [start, end]);

        res.json({ 
            success: true, 
            data: {
                total_revenue: parseFloat(totalRevenue),
                total_bookings: totalBookings,
                new_customers: newCustomers,
                active_cleaners: activeCleaners,
                revenue_change: parseFloat(revenueChange),
                bookings_change: parseFloat(bookingsChange),
                customers_change: parseFloat(customersChange),
                cleaners_change: parseFloat(cleanersChange),
                revenue_trend: revenueTrend.reverse(),
                bookings_by_status: bookingsByStatus
            }
        });
    } catch (error) {
        console.error('Error fetching overview reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get financial reports data
app.get('/api/reports/financial', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end } = req.query;
        
        // Monthly revenue breakdown
        const monthlyRevenue = await db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                COUNT(*) as bookings,
                COALESCE(SUM(total_price), 0) as revenue,
                COALESCE(AVG(total_price), 0) as avg_booking_value,
                ROUND(
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                    1
                ) as cancellation_rate
            FROM bookings 
            WHERE date BETWEEN ? AND ?
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        `, [start, end]);
        
        // Calculate month-over-month growth
        monthlyRevenue.forEach((month, index) => {
            if (index > 0) {
                const prevRevenue = monthlyRevenue[index - 1].revenue;
                month.growth = prevRevenue > 0 ? ((month.revenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
            } else {
                month.growth = 0;
            }
        });
        
        // Service type revenue
        const serviceRevenue = await db.all(`
            SELECT 
                COALESCE(service_type, 'regular_cleaning') as service_type,
                COUNT(*) as bookings,
                COALESCE(SUM(total_price), 0) as revenue,
                ROUND(COALESCE(AVG(total_price), 0), 2) as avg_revenue
            FROM bookings 
            WHERE date BETWEEN ? AND ? 
            AND status IN ('confirmed', 'completed')
            GROUP BY service_type
            ORDER BY revenue DESC
        `, [start, end]);

        res.json({ 
            success: true, 
            data: {
                monthly_summary: monthlyRevenue,
                monthly_revenue: monthlyRevenue,
                service_revenue: serviceRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching financial reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get performance reports data
app.get('/api/reports/performance', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end } = req.query;
        
        // Cleaner performance
        const cleanerPerformance = await db.all(`
            SELECT 
                u.name,
                c.rating,
                COUNT(b.id) as jobs_completed,
                ROUND(
                    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(b.id), 
                    1
                ) as completion_rate,
                ROUND(COALESCE(AVG(c.rating), 0), 1) as avg_customer_rating,
                COALESCE(SUM(b.total_price), 0) as revenue_generated
            FROM cleaners c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN bookings b ON c.id = b.cleaner_id 
                AND b.date BETWEEN ? AND ?
                AND b.status IN ('completed', 'confirmed')
            GROUP BY c.id
            ORDER BY revenue_generated DESC
        `, [start, end]);

        res.json({ 
            success: true, 
            data: {
                cleaner_performance: cleanerPerformance
            }
        });
    } catch (error) {
        console.error('Error fetching performance reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get customers reports data
app.get('/api/reports/customers', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end } = req.query;
        
        // Top customers by revenue
        const topCustomers = await db.all(`
            SELECT 
                u.name,
                u.email,
                COUNT(b.id) as total_bookings,
                COALESCE(SUM(b.total_price), 0) as total_spent,
                ROUND(COALESCE(AVG(b.rating), 0), 1) as avg_rating,
                MAX(b.date) as last_booking,
                DATE(MIN(u.created_at)) as customer_since
            FROM users u
            LEFT JOIN bookings b ON u.id = b.customer_id 
                AND b.date BETWEEN ? AND ?
                AND b.status IN ('completed', 'confirmed')
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT 20
        `, [start, end]);

        // Customer acquisition trend
        const acquisitionTrend = await db.all(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as new_customers
            FROM users 
            WHERE role = 'customer'
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({ 
            success: true, 
            data: {
                top_customers: topCustomers,
                acquisition_trend: acquisitionTrend.reverse()
            }
        });
    } catch (error) {
        console.error('Error fetching customers reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get cleaners reports data
app.get('/api/reports/cleaners', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end } = req.query;
        
        // Cleaner efficiency report
        const cleanerEfficiency = await db.all(`
            SELECT 
                u.name,
                c.rating,
                c.status,
                COUNT(b.id) as jobs_completed,
                ROUND(
                    COUNT(b.id) * 100.0 / (
                        SELECT COUNT(*) 
                        FROM bookings 
                        WHERE date BETWEEN ? AND ?
                    ), 
                    1
                ) as utilization_rate,
                ROUND(COALESCE(AVG(b.duration), 0), 1) as avg_job_duration,
                COALESCE(SUM(b.total_price), 0) as revenue_generated
            FROM cleaners c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN bookings b ON c.id = b.cleaner_id 
                AND b.date BETWEEN ? AND ?
                AND b.status IN ('completed', 'confirmed')
            GROUP BY c.id
            ORDER BY utilization_rate DESC
        `, [start, end, start, end]);

        res.json({ 
            success: true, 
            data: {
                cleaner_efficiency: cleanerEfficiency
            }
        });
    } catch (error) {
        console.error('Error fetching cleaners reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get recent bookings for reports
app.get('/api/reports/bookings', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { start, end, status, cleaner_id } = req.query;
        
        let query = `
            SELECT 
                b.id,
                b.date,
                b.time,
                b.duration,
                b.status,
                b.service_type,
                b.total_price,
                u_customer.name as customer_name,
                u_cleaner.name as cleaner_name
            FROM bookings b
            JOIN users u_customer ON b.customer_id = u_customer.id
            JOIN cleaners c ON b.cleaner_id = c.id
            JOIN users u_cleaner ON c.user_id = u_cleaner.id
            WHERE b.date BETWEEN ? AND ?
        `;
        
        const params = [start, end];
        
        if (status) {
            query += ` AND b.status = ?`;
            params.push(status);
        }
        
        if (cleaner_id) {
            query += ` AND b.cleaner_id = ?`;
            params.push(cleaner_id);
        }
        
        query += ` ORDER BY b.date DESC, b.time DESC LIMIT 50`;
        
        const bookings = await db.all(query, params);

        res.json({ 
            success: true, 
            data: bookings 
        });
    } catch (error) {
        console.error('Error fetching report bookings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve reports page
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/reports.html'));
});

// Serve reports page
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/reports.html'));
});

// Serve reports page
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/reports.html'));
});

// Enhanced authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || 
                  req.query.token || 
                  req.body.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }
    
    // In production, use JWT verification
    // For demo, we'll check against a simple token
    if (token !== 'demo-token' && token !== 'secure-token-2024') {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
    
    next();
};

// Apply authentication to all API routes (except login)
app.use('/api/*', (req, res, next) => {
    // Skip authentication for login endpoint
    if (req.path === '/api/login' || req.path === '/api/register') {
        return next();
    }
    authenticateToken(req, res, next);
});

// User login endpoint
app.post('/api/login', express.json(), async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user in database
        const user = await db.get(`
            SELECT id, name, email, role, created_at 
            FROM users 
            WHERE email = ? AND password = ?
        `, [email, password]);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        // Generate token (in production, use JWT)
        const token = 'demo-token'; // Replace with JWT in production
        
        // Get additional user info based on role
        if (user.role === 'cleaner') {
            const cleaner = await db.get(`
                SELECT * FROM cleaners WHERE user_id = ?
            `, [user.id]);
            user.cleaner_info = cleaner;
        }
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            token: token,
            user: user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User registration endpoint
app.post('/api/register', express.json(), async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        
        // Check if user already exists
        const existingUser = await db.get(`
            SELECT id FROM users WHERE email = ?
        `, [email]);
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }
        
        // Create new user
        const result = await db.run(`
            INSERT INTO users (name, email, password, phone, role, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [name, email, password, phone || '', role || 'customer']);
        
        // If registering as cleaner, create cleaner record
        if (role === 'cleaner') {
            await db.run(`
                INSERT INTO cleaners (user_id, status, rating, total_jobs)
                VALUES (?, 'available', 4.5, 0)
            `, [result.lastID]);
        }
        
        // Generate token
        const token = 'demo-token';
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            token: token,
            user: {
                id: result.lastID,
                name,
                email,
                role: role || 'customer'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Password reset request
app.post('/api/password-reset-request', express.json(), async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await db.get(`
            SELECT id, name, email FROM users WHERE email = ?
        `, [email]);
        
        if (!user) {
            // Don't reveal that user doesn't exist (security best practice)
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, a reset link has been sent.' 
            });
        }
        
        // In production: Generate reset token, send email
        // For demo, just return success
        res.json({ 
            success: true, 
            message: 'Password reset email sent (simulated)',
            reset_token: 'demo-reset-token' // In production, generate secure token
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update password with reset token
app.post('/api/password-reset', express.json(), async (req, res) => {
    try {
        const { token, new_password } = req.body;
        
        // In production: Verify reset token, update password
        // For demo, just return success
        res.json({ 
            success: true, 
            message: 'Password updated successfully' 
        });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        // Get user from token (in production, decode JWT)
        const token = req.query.token;
        const email = 'admin@spotless.com'; // In production, get from token
        
        const user = await db.get(`
            SELECT id, name, email, phone, role, created_at 
            FROM users 
            WHERE email = ?
        `, [email]);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            data: user 
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user profile
app.put('/api/profile', authenticateToken, express.json(), async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const token = req.query.token;
        const userId = 1; // In production, get from token
        
        await db.run(`
            UPDATE users 
            SET name = ?, email = ?, phone = ?, updated_at = datetime('now')
            WHERE id = ?
        `, [name, email, phone, userId]);
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Change password
app.post('/api/change-password', authenticateToken, express.json(), async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const token = req.query.token;
        const userId = 1; // In production, get from token
        
        // Verify current password
        const user = await db.get(`
            SELECT password FROM users WHERE id = ?
        `, [userId]);
        
        if (!user || user.password !== current_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // Update password
        await db.run(`
            UPDATE users 
            SET password = ?, updated_at = datetime('now')
            WHERE id = ?
        `, [new_password, userId]);
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Import email service
const emailService = require('./emailService');

// Send test email endpoint
app.post('/api/email/test', authenticateToken, express.json(), async (req, res) => {
    try {
        const { to, subject, message } = req.body;
        
        await transporter.sendMail({
            from: `"Spotless Solution" <${process.env.SMTP_FROM || 'noreply@spotless.com'}>`,
            to: to || 'admin@spotless.com',
            subject: subject || 'Test Email from Spotless Solution',
            text: message || 'This is a test email from your Spotless Solution application.',
            html: `<p>${message || 'This is a test email from your Spotless Solution application.'}</p>`
        });
        
        res.json({ 
            success: true, 
            message: 'Test email sent successfully' 
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
});

// Send booking confirmation email
app.post('/api/email/booking-confirmation/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await emailService.sendBookingConfirmation(id);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Booking confirmation email sent' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Failed to send booking confirmation' 
            });
        }
    } catch (error) {
        console.error('Booking confirmation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update booking creation to send email
app.post('/api/bookings', express.json(), async (req, res) => {
    try {
        const token = req.body.token;
        if (!token || token !== 'demo-token') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { customer_id, cleaner_id, date, time, duration, service_type, notes, address } = req.body;
        
        // Calculate total price
        const cleaner = await db.get('SELECT hourly_rate FROM cleaners WHERE id = ?', [cleaner_id]);
        const total_price = (cleaner.hourly_rate * duration).toFixed(2);
        
        const result = await db.run(`
            INSERT INTO bookings (customer_id, cleaner_id, date, time, duration, service_type, notes, address, total_price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
        `, [customer_id, cleaner_id, date, time, duration, service_type, notes, address, total_price]);

        // Send confirmation email (in production)
        if (process.env.NODE_ENV === 'production') {
            setTimeout(() => {
                emailService.sendBookingConfirmation(result.lastID).catch(console.error);
            }, 1000);
        }

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
