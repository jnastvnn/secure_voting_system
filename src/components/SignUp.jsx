import { useState } from 'react';

// Optional: Define API URL base outside if used elsewhere
const API_BASE_URL = import.meta.env.VITE_API_URL;

function SignUp({ onSignupSuccess }) {
  // 1. Consolidate form input state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Generic change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    // Optionally clear error when user starts typing again
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Basic validation using consolidated state
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Added validation for empty fields (optional but good practice)
    if (!formData.username || !formData.password) {
        setError('Username and Password are required');
        return;
    }

    setIsLoading(true);

    try {
      const apiUrl = `${API_BASE_URL}/auth/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Good practice to include Accept header
        },
        // Send only necessary fields from consolidated state
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      // 3. Streamlined error handling
      if (!response.ok) {
        let errorMsg = `Registration failed (${response.status})`;
        try {
          // Attempt to parse error response from backend
          const errorData = await response.json();
          errorMsg = errorData?.message || errorData?.error || JSON.stringify(errorData);
        } catch (parseError) {
          // If response is not JSON or empty, use the status text
          errorMsg = `${errorMsg}: ${response.statusText || 'Server error'}`;
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      // Assuming successful registration if response.ok is true
      // const result = await response.json(); // If you need data from the response
      // console.log('Registration successful:', result);

      setSuccess(true);
      // Reset form state
      setFormData({ username: '', password: '', confirmPassword: '' });

      // 4. Call onSignupSuccess immediately (removed setTimeout)
      if (onSignupSuccess) {
        onSignupSuccess();
      }

    } catch (err) {
       // Use instanceof check for better Error object handling
       const message = err instanceof Error ? err.message : String(err);
       setError(message);
       console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {/* Use explicit boolean checks for conditional rendering */}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Registration successful! You can now log in.</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signup-username">Username:</label>
          <input
            type="text"
            id="signup-username"
            name="username" // Add name attribute
            value={formData.username} // Use consolidated state
            onChange={handleChange} // Use generic handler
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password:</label>
          <input
            type="password"
            id="signup-password"
            name="password" // Add name attribute
            value={formData.password} // Use consolidated state
            onChange={handleChange} // Use generic handler
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password:</label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword" // Add name attribute
            value={formData.confirmPassword} // Use consolidated state
            onChange={handleChange} // Use generic handler
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;