import { useState } from 'react';

// Helper function to get the JWT from localStorage
const getJWTToken = () => {
  try {
    const userString = localStorage.getItem('currentUser');

    if (!userString) return null;
    const user = JSON.parse(userString);
    // console.log("Parsed User:", user); // Debug logging commented out to avoid exposing sensitive data
    return user.token || null;
  } catch (error) {
    console.error("Error retrieving token from localStorage:", error);
    return null;
  }
};

function CreatePoll({ onCancel, onPollCreated }) {
  const [pollData, setPollData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    allow_multiple_choices: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update text inputs (title, description)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPollData(prev => ({ ...prev, [name]: value }));
  };

  // Update checkbox
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPollData(prev => ({ ...prev, [name]: checked }));
  };

  // Update individual option text input
  const handleOptionChange = (index, value) => {
    if (value.length > 255) return;
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData(prev => ({ ...prev, options: newOptions }));
  };

  // Add a new empty option field
  const addOption = () => {
    setError('');
    setPollData(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  // Remove an option field (minimum of 2 options required)
  const removeOption = (index) => {
    if (pollData.options.length <= 2) {
      setError("Minimum of 2 options required.");
      return;
    }
    setError('');
    const newOptions = pollData.options.filter((_, i) => i !== index);
    setPollData(prev => ({ ...prev, options: newOptions }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const trimmedTitle = pollData.title.trim();
    const trimmedDescription = pollData.description.trim();
    const validOptions = pollData.options.map(o => o.trim()).filter(o => o !== '');

    if (!trimmedTitle) return setError('Title is required');
    if (!trimmedDescription) return setError('Description is required');
    if (validOptions.length < 2) return setError('At least two non-empty options are required');
    if (validOptions.length !== pollData.options.length) {
      return setError('All options must have text. Remove empty fields or fill them.');
    }
    if (new Set(validOptions).size !== validOptions.length) {
      return setError("Duplicate options are not allowed.");
    }

    const token = getJWTToken();
    console.log("Token:", token);
    if (!token) {
      setError('You must be logged in to create a poll.');
      return;
    }

    // Prepare payload (note: backend uses JWT to determine the user)
    const payload = {
      title: trimmedTitle,
      description: trimmedDescription,
      allow_multiple_choices: pollData.allow_multiple_choices,
      options: validOptions,
    };

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to create poll (Status: ${response.status})`);
      }

      console.log('Poll created successfully:', responseData);
      onPollCreated?.(responseData);
      // Reset form state
      setPollData({
        title: '',
        description: '',
        options: ['', ''],
        allow_multiple_choices: false,
      });
    } catch (err) {
      console.error("Create poll error:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-create-poll">
      <h2>Create New Poll</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="poll-title">Title</label>
          <input
            id="poll-title"
            type="text"
            name="title"
            value={pollData.title}
            onChange={handleChange}
            placeholder="What is your question?"
            maxLength={255}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="poll-description">Description</label>
          <textarea
            id="poll-description"
            name="description"
            value={pollData.description}
            onChange={handleChange}
            placeholder="Add more context (optional)"
            rows={3}
            required
          />
        </div>
        <div className="form-group">
          <label>Options</label>
          {pollData.options.map((option, index) => (
            <div key={index} className="option-input-group">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
                maxLength={255}
              />
              {pollData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-option-btn"
                  aria-label={`Remove option ${index + 1}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} disabled={pollData.options.length >= 10} className="add-option-btn">
            Add Option
          </button>
        </div>
        <div className="form-group form-check">
          <input
            type="checkbox"
            id="allow_multiple_choices"
            name="allow_multiple_choices"
            checked={pollData.allow_multiple_choices}
            onChange={handleCheckboxChange}
            className="form-check-input"
          />
          <label htmlFor="allow_multiple_choices" className="form-check-label">
            Allow multiple choices per voter?
          </label>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;
