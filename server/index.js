require('dotenv').config();
const express = require('express');
const cors = require('cors');
const usersRouter = require('./src/routes/usersRoute');
const listingsRouter = require('./src/routes/listing');

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());

// setup CORS to allow requests from SWA and local development
app.use(cors({
  origin: [
    'https://nice-water-0d3098403.1.azurestaticapps.net', // replace with real SWA URL
    'http://localhost:5173'
  ]
}));

// Example route

app.use('/users', usersRouter);
app.use('/api/listings', listingsRouter);

app.get('/', (req, res) => {
    res.json({ message: "Hello, World!" });
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});