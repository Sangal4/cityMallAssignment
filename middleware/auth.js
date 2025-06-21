const users = [
    { id: 'netrunnerX', username: 'netrunnerX', role: 'admin' },
    { id: 'reliefAdmin', username: 'reliefAdmin', role: 'admin' },
    { id: 'citizen1', username: 'citizen1', role: 'contributor' },
    { id: 'citizen2', username: 'citizen2', role: 'contributor' }
];

export function authenticateUser(req, res, next) {
    // For demo: Accept username in header or query
    const username = req.headers['x-username'] || req.query.username || req.body.username;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid or missing user' });
    req.user = user;
    next();
}

export { users }; 