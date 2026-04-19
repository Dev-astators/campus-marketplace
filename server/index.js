require('dotenv').config();
const express = require('express');
const cors = require('cors');
const usersRouter = require('./src/routes/usersRoute');
const listingsRouter = require('./src/routes/listing');
const messagesRouter = require('./src/routes/messages');
  
const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());

// setup CORS to allow requests from SWA and local development
const allowedOrigins = [
  'http://localhost:5173',
  'https://nice-water-0d3098403.1.azurestaticapps.net'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Example route

app.use('/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/messages', messagesRouter);

app.get('/', (req, res) => {
    res.json({ message: "Hello, World!" });
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});