import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Get token from cookies
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    
    // Check if token is about to expire (within 30 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiryTime = decodedToken.exp;
    const timeToExpiry = tokenExpiryTime - currentTime;
    
    // If token will expire in less than 30 minutes (1800 seconds), set header
    if (timeToExpiry < 1800) {
      res.set('X-Token-Expiring', 'true');
    }
    
    req.user = decodedToken; // Attach the decoded token to the request object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    
    console.error('Error verifying token:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;