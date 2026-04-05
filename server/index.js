const express = require('express');
const usersRouter = require('./src/routes/usersRoute');


const app = express();
const port = 3000;
app.use(express.json());

// Example route

app.use('/users', usersRouter);

app.get('/', (req, res) => {
    res.json({ message: "Hello, World!" });
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});