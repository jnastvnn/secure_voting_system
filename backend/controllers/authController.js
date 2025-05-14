import User from '../models/User.js';
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for token generation
import dotenv from 'dotenv'; // Import dotenv to load environment variables

dotenv.config(); // Load environment variables from .env file

// Make sure SECRET is defined
if (!process.env.SECRET) {
  console.error('JWT SECRET key is not defined in environment variables!');
  process.exit(1);
}

// Define token expiration time
const TOKEN_EXPIRY = '2h'; // 2 hours
const COOKIE_MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const authController = {
  async register(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Basic validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    try {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      const user = await User.create(username, passwordHash);
      res.status(201).json({ message: 'User registered successfully', userId: user.id });
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
      };

      // Generate JWT token with expiration
      const token = jwt.sign(
        userForToken, 
        process.env.SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      // Set token in HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE
      });

      // Return user info (but not the token in the JSON response)
      res.json({ 
        message: 'Login successful',
        user: { id: user.id, username: user.username }
      });

    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Add logout endpoint
  logout(req, res) {
    res.clearCookie('authToken');
    res.json({ message: 'Logout successful' });
  }
};

export default authController; 