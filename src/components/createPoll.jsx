import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPollStart, createPollSuccess, createPollFailure } from '../store/slices/pollsSlice';

function CreatePoll({ onCancel }) {
  const [pollData, setPollData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    allow_multiple_choices: false,
  });

  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.polls);
  const { user } = useSelector(state => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPollData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPollData(prev => ({ ...prev, [name]: checked }));
  };

  const handleOptionChange = (index, value) => {
    if (value.length > 255) return;
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setPollData(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index) => {
    if (pollData.options.length <= 2) return;
    const newOptions = pollData.options.filter((_, i) => i !== index);
    setPollData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const trimmedTitle = pollData.title.trim();
    const trimmedDescription = pollData.description.trim();
    const validOptions = pollData.options.map(o => o.trim()).filter(o => o !== '');

    if (!trimmedTitle || !trimmedDescription || validOptions.length < 2) {
      dispatch(createPollFailure('Please fill in all required fields'));
      return;
    }

    if (new Set(validOptions).size !== validOptions.length) {
      dispatch(createPollFailure('Duplicate options are not allowed'));
      return;
    }

    const token = user?.token;
    if (!token) {
      dispatch(createPollFailure('You must be logged in to create a poll'));
      return;
    }

    dispatch(createPollStart());

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          allow_multiple_choices: pollData.allow_multiple_choices,
          options: validOptions,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to create poll (Status: ${response.status})`);
      }

      dispatch(createPollSuccess(responseData));
      setPollData({
        title: '',
        description: '',
        options: ['', ''],
        allow_multiple_choices: false,
      });
      onCancel?.();
    } catch (err) {
      console.error("Create poll error:", err);
      dispatch(createPollFailure(err.message || 'An unexpected error occurred'));
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
            disabled={loading}
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
            disabled={loading}
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
                disabled={loading}
              />
              {pollData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-option-btn"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={loading}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={addOption} 
            disabled={loading || pollData.options.length >= 10} 
            className="add-option-btn"
          >
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
            disabled={loading}
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
