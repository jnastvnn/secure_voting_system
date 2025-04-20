import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signupStart, signupSuccess, signupFailure } from '../store/slices/authSlice';

function SignUp({ onSignupSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      dispatch(signupFailure('Passwords do not match'));
      return;
    }

    if (!formData.username || !formData.password) {
      dispatch(signupFailure('Username and Password are required'));
      return;
    }

    dispatch(signupStart());

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/auth/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        let errorMsg = `Registration failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.message || errorData?.error || JSON.stringify(errorData);
        } catch (parseError) {
          errorMsg = `${errorMsg}: ${response.statusText || 'Server error'}`;
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      dispatch(signupSuccess());
      setFormData({ username: '', password: '', confirmPassword: '' });

      if (onSignupSuccess) {
        onSignupSuccess();
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(signupFailure(message));
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signup-username">Username:</label>
          <input
            type="text"
            id="signup-username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password:</label>
          <input
            type="password"
            id="signup-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password:</label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;