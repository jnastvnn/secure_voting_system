import { useState, useEffect } from 'react';

function Home({ onLogout }) {
  const [user, setUser] = useState(null);
  const [votes, setVotes] = useState([]);
  const [currentVote, setCurrentVote] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load current user from localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    
    // Fetch votes from API
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setIsLoading(true);
      const apiUrl = `${import.meta.env.VITE_API_URL}/votes`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch votes: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Parse JSONB strings from PostgreSQL if needed
        const processedVotes = data.map(vote => ({
          ...vote,
          options: typeof vote.options === 'string' ? JSON.parse(vote.options) : vote.options,
          votes: typeof vote.votes === 'string' ? JSON.parse(vote.votes) : vote.votes
        }));
        
        setVotes(processedVotes);
        setCurrentVote(processedVotes[0]);
      }
    } catch (err) {
      console.error('Error fetching votes:', err);
      setError('Failed to load votes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    if (onLogout) onLogout();
  };

  const handleVoteChange = (voteId) => {
    const selectedVote = votes.find(v => v.id === parseInt(voteId));
    setCurrentVote(selectedVote);
    setSelectedOption('');
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption || !currentVote || !user) return;
    
    try {
      setIsLoading(true);
      
      const apiUrl = `${import.meta.env.VITE_API_URL}/votes/vote`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteId: currentVote.id,
          option: selectedOption,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to submit vote: ${response.status}`);
      }
      
      // Refresh votes after successful submission
      await fetchVotes();
      
      // Reset selection
      setSelectedOption('');
      
      alert('Vote submitted successfully!');
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err.message || 'Failed to submit vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the voting system.</div>;
  }

  if (isLoading && votes.length === 0) {
    return <div className="loading">Loading votes...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!currentVote) {
    return <div>No votes available.</div>;
  }

  return (
    <div className="home-container">
      <div className="user-info">
        <p>Welcome, <strong>{user.username}</strong>!</p>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      <h2>Secure Voting System</h2>
      
      <div className="voting-section">
        <div className="vote-selector">
          <h3>Select a Vote:</h3>
          <select 
            onChange={(e) => handleVoteChange(e.target.value)} 
            value={currentVote.id}
            disabled={isLoading}
          >
            {votes.map(vote => (
              <option key={vote.id} value={vote.id}>{vote.title}</option>
            ))}
          </select>
        </div>
        
        <div className="current-vote">
          <h3>{currentVote.title}</h3>
          <form onSubmit={handleVoteSubmit}>
            {currentVote.options.map(option => (
              <div key={option} className="vote-option">
                <input
                  type="radio"
                  id={option}
                  name="vote"
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  disabled={isLoading}
                />
                <label htmlFor={option}>{option}</label>
              </div>
            ))}
            <button type="submit" disabled={isLoading || !selectedOption}>
              {isLoading ? 'Submitting...' : 'Submit Vote'}
            </button>
          </form>
          
          <div className="results">
            <h3>Current Results:</h3>
            {currentVote.options.map(option => {
              const voteCount = currentVote.votes[option] || 0;
              const totalVotes = Object.values(currentVote.votes || {}).reduce((sum, count) => sum + count, 0);
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              
              return (
                <div key={option} className="result-item">
                  <span>{option}:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span>{voteCount} votes ({percentage.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 