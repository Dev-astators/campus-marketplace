const express = require('express');

const usersRouter = express.Router();

// Example route to get all users
usersRouter.get('/', (req, res) => {
    res.json({ message: 'Get all users!' });
});

usersRouter.get('/:id', (req, res) => {
    const userId = req.params.id;
    res.json({ message: `Get user with ID: ${userId}` });
});


module.exports = usersRouter;