import User from '../models/User.js';

const authController = {
  async register(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const user = await User.create(username, password);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
      const user = await User.findByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default authController; 