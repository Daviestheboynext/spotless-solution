console.log('PORT environment variable:', process.env.PORT);
console.log('Type of PORT:', typeof process.env.PORT);
console.log('PORT value:', process.env.PORT || 'Not set, using default 3000');

const port = process.env.PORT || 3000;
console.log('Final port to use:', port);
