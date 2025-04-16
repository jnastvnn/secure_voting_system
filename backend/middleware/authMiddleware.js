import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    req.user = decodedToken; // Attach the decoded token to the request object
    // Debug logging removed to avoid exposing sensitive authentication data
    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;