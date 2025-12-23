const express = require('express');
const app = express();
const PORT = process.env.PORT || 3960;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => res.send('Spotless Solution Kenya'));
app.get('/login', (req, res) => res.send('Login Page'));
app.get('/dashboard', (req, res) => res.send('Dashboard Page'));
app.get('/api/test', (req, res) => res.json({ success: true }));

app.listen(PORT, () => {
    console.log(\✅ Server running on port \\);
});
