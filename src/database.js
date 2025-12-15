// File: src/database.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function initDatabase() {
    try {
        // Open database connection
        const db = await open({
            filename: path.join(__dirname, '../data/spotless.db'),
            driver: sqlite3.Database
        });

        // Create tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                address TEXT,
                preferred_cleaner TEXT,
                special_instructions TEXT,
                loyalty_points INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS cleaners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                bio TEXT,
                hourly_rate DECIMAL(10, 2),
                skills TEXT,
                availability TEXT,
                rating DECIMAL(3, 2) DEFAULT 0.0,
                total_jobs INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                cleaner_id INTEGER,
                service_type TEXT NOT NULL,
                date DATE NOT NULL,
                time TEXT NOT NULL,
                duration_hours DECIMAL(4, 2),
                address TEXT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                special_instructions TEXT,
                payment_status TEXT DEFAULT 'unpaid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
            );

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                method TEXT,
                status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                payment_date DATETIME,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            );
        `);

        console.log('✅ Database initialized successfully');
        
        // Insert demo data if tables are empty
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            await db.exec(`
                INSERT INTO users (name, email, password, role) VALUES 
                ('Admin User', 'admin@spotless.com', 'admin123', 'admin'),
                ('Sarah Johnson', 'sarah@email.com', 'password123', 'customer'),
                ('Michael Chen', 'michael@email.com', 'password123', 'customer'),
                ('Emma Williams', 'emma@email.com', 'password123', 'customer'),
                ('John Cleaner', 'john@cleaner.com', 'password123', 'cleaner'),
                ('Maria Garcia', 'maria@cleaner.com', 'password123', 'cleaner');

                INSERT INTO customers (user_id, address, preferred_cleaner) VALUES
                (2, '123 Main St, New York, NY', 'John Cleaner'),
                (3, '456 Oak Ave, Brooklyn, NY', 'Maria Garcia'),
                (4, '789 Pine Rd, Queens, NY', 'John Cleaner');

                INSERT INTO cleaners (user_id, bio, hourly_rate, skills, rating, total_jobs) VALUES
                (5, 'Professional cleaner with 5 years experience. Specialized in deep cleaning.', 25.00, 'deep_cleaning,carpet_cleaning', 4.8, 120),
                (6, 'Reliable and detail-oriented cleaner. Available for regular maintenance cleaning.', 22.00, 'regular_cleaning,window_cleaning', 4.6, 85);

                INSERT INTO bookings (customer_id, cleaner_id, service_type, date, time, duration_hours, address, price, status, priority) VALUES
                (1, 1, 'Deep Cleaning', '2024-01-15', '09:00', 4.0, '123 Main St, New York, NY', 100.00, 'completed', 'high'),
                (2, 2, 'Regular Cleaning', '2024-01-16', '10:00', 3.0, '456 Oak Ave, Brooklyn, NY', 66.00, 'confirmed', 'medium'),
                (3, 1, 'Window Cleaning', '2024-01-17', '13:00', 2.5, '789 Pine Rd, Queens, NY', 62.50, 'pending', 'low'),
                (1, NULL, 'Carpet Cleaning', '2024-01-18', '11:00', 3.5, '123 Main St, New York, NY', 87.50, 'pending', 'medium'),
                (2, NULL, 'Deep Cleaning', '2024-01-19', '14:00', 4.0, '456 Oak Ave, Brooklyn, NY', 100.00, 'pending', 'high');
            `);
            console.log('✅ Demo data inserted');
        }

        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initDatabase };


// Create settings table
db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Insert default settings if table is empty
db.get('SELECT COUNT(*) as count FROM settings', (err, result) => {
    if (result.count === 0) {
        const defaultSettings = [
            ['company_name', 'Spotless Solution'],
            ['company_email', 'contact@spotless.com'],
            ['company_phone', '+1 (555) 987-6543'],
            ['company_address', '123 Clean Street, San Francisco, CA 94103'],
            ['business_hours', 'Monday-Friday: 8:00 AM - 8:00 PM\\nSaturday: 9:00 AM - 5:00 PM\\nSunday: 10:00 AM - 4:00 PM'],
            ['service_areas', 'San Francisco\\nOakland\\nSan Jose\\nBerkeley\\nPalo Alto\\nMarin County'],
            ['notification_emails', 'true'],
            ['notification_new_bookings', 'true'],
            ['notification_reviews', 'true'],
            ['default_hourly_rate', '25.00'],
            ['currency', 'USD'],
            ['tax_rate', '8.5'],
            ['timezone', 'America/Los_Angeles']
        ];

        defaultSettings.forEach(setting => {
            db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', setting);
        });
        
        console.log('Default settings inserted');
    }
});

// Database backup function
function backupDatabase() {
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `spotless-backup-${timestamp}.db`);
    
    // Create backup
    fs.copyFileSync(DB_PATH, backupFile);
    
    // Clean up old backups (keep last 30 days)
    const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .map(f => ({ name: f, path: path.join(backupDir, f) }))
        .map(f => ({ ...f, time: fs.statSync(f.path).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
    
    // Remove backups older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    files.forEach(file => {
        if (file.time < thirtyDaysAgo) {
            fs.unlinkSync(file.path);
            console.log(`Removed old backup: ${file.name}`);
        }
    });
    
    console.log(`Database backup created: ${backupFile}`);
    return backupFile;
}

// Auto-backup on server start
backupDatabase();

// Schedule daily backups (in production)
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        console.log('Running scheduled database backup...');
        backupDatabase();
    }, 24 * 60 * 60 * 1000); // 24 hours
}

// Export function for API access
module.exports.backupDatabase = backupDatabase;
