const express = require("express");
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// SIMPLE TEST ROUTE
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Spotless Solution</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #667eea; }
                .links a { display: inline-block; margin: 10px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>✅ Spotless Solution Backend is Running!</h1>
            <p>Server is working correctly on port ${port}</p>
            <div class="links">
                <a href="/dashboard.html">Go to Dashboard</a>
                <a href="/reports.html">Go to Reports</a>
                <a href="/api/test">Test API</a>
            </div>
        </body>
        </html>
    `);
});

// TEST API
app.get("/api/test", (req, res) => {
    res.json({ 
        success: true, 
        message: "API is working!", 
        timestamp: new Date().toISOString() 
    });
});

// SIMPLE REPORTS API (GUARANTEED TO WORK)
app.get("/api/reports", (req, res) => {
    console.log("📊 Reports API called");
    
    const { type = "financial" } = req.query;
    
    // Always return valid JSON
    res.json({
        success: true,
        report: {
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
            period: "Jan 2024 - Dec 2024",
            totalRevenue: 12500.00,
            totalBookings: 47,
            averageBooking: 265.96,
            message: "Report generated successfully"
        }
    });
});

// Start server
app.listen(port, () => {
    console.log("=".repeat(50));
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`📊 Test API: http://localhost:${port}/api/test`);
    console.log(`📈 Reports API: http://localhost:${port}/api/reports?type=financial`);
    console.log("=".repeat(50));
});
