import User from '../models/User.js';
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for token generation
import dotenv from 'dotenv'; // Import dotenv to load environment variables

dotenv.config(); // Load environment variables from .env file

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
      
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      const user = await User.create(username, passwordHash);
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
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const userForToken = {
        username: user.username,
        id: user.id,
      }

      const token = jwt.sign(userForToken, process.env.SECRET) // Generate JWT token

      res.json({ message: 'Login successful',token, user: {id: user.id, username: user.username } });

    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default authController; 