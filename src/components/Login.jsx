import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/auth/login`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorText = await response.text();
        const parsedError = JSON.parse(errorText);
        throw new Error(`Login failed: ${parsedError.error}`);
      }

      const data = await response.json();

      // Store only user info in Redux (no token, as it's in HTTP-only cookie)
      const currentUser = {
        id: data.user.id,
        username: data.user.username,
      };
      
      dispatch(loginSuccess(currentUser));
    } catch (err) {
      dispatch(loginFailure(err.message));
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="test-user-note">
          <small>Demo user: admin / password</small>
        </p>
      </form>
    </div>
  );
}

export default Login;