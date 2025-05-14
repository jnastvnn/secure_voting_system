import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VotePoll from './VotePoll';
import SecureVotePoll from './SecureVotePoll';
import { fetchPollsStart, fetchPollsSuccess, fetchPollsFailure, setSelectedPoll } from '../store/slices/pollsSlice';

function Home({ onLogout, onCreatePoll }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { polls, loading, error, selectedPoll } = useSelector(state => state.polls);
  
  // State for secure voting
  const [secureMode, setSecureMode] = useState(false);
  const [securePolls, setSecurePolls] = useState([]);
  const [loadingSecurePolls, setLoadingSecurePolls] = useState(false);
  const [selectedSecurePoll, setSelectedSecurePoll] = useState(null);
  const [secureError, setSecureError] = useState(null);

  useEffect(() => {
    fetchPolls();
    fetchSecurePolls();
  }, []);

  const fetchPolls = async () => {
    try {
      dispatch(fetchPollsStart());
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to load polls');
      
      const data = await response.json();
      dispatch(fetchPollsSuccess(data));
    } catch (err) {
      dispatch(fetchPollsFailure(err.message));
    }
  };

  const fetchSecurePolls = async () => {
    try {
      setLoadingSecurePolls(true);
      setSecureError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/secure-polls`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to load secure polls');
      
      const data = await response.json();
      setSecurePolls(data);
    } catch (err) {
      console.error('Error loading secure polls:', err);
      setSecureError(err.message);
    } finally {
      setLoadingSecurePolls(false);
    }
  };

  if (!user) return <div>Please login to view polls</div>;
  
  // Show selected poll if any
  if (selectedPoll && !secureMode) {
    return <VotePoll poll={selectedPoll} onBack={() => dispatch(setSelectedPoll(null))} />;
  }
  
  // Show selected secure poll if any
  if (selectedSecurePoll && secureMode) {
    return <SecureVotePoll poll={selectedSecurePoll} onBack={() => setSelectedSecurePoll(null)} />;
  }

  // Helper function to render poll item
  const renderPollItem = (poll, isSecure = false) => (
    <div 
      key={poll.id}
      onClick={() => isSecure ? setSelectedSecurePoll(poll) : dispatch(setSelectedPoll(poll))}
      className="poll-item"
    >
      <div className="poll-content">
        <div className="poll-header">
          <h3>{poll.title}</h3>
          {isSecure && <span className="secure-badge">Secure</span>}
        </div>
        
        {poll.description && <p className="poll-description">{poll.description}</p>}
        
        <div className="poll-meta">
          <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
          {!isSecure && (
            <>
              <span>•</span>
              <span>By: {poll.created_by || 'Anonymous'}</span>
              <span>•</span>
              <span className={`status ${poll.is_active ? 'active' : 'closed'}`}>
                {poll.is_active ? 'Active' : 'Closed'}
              </span>
            </>
          )}
          {isSecure && <span>Options: {poll.options.length}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="home-container">
      <div className="header">
        <h1>{secureMode ? 'Secure Voting System' : 'Current Polls'}</h1>
        <div className="header-actions">
          <button
            onClick={() => setSecureMode(!secureMode)}
            className={`toggle-mode-btn ${secureMode ? 'secure' : 'standard'}`}
          >
            {secureMode ? 'Standard Polls' : 'Secure Voting'}
          </button>
          <button
            onClick={onCreatePoll}
            className="create-poll-btn"
          >
            Create Poll
          </button>
          <span className="username">{user.username}</span>
          <button 
            onClick={onLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      {secureMode ? (
        // Secure Voting UI
        <div className="polls-container">
          {secureError && <div className="error-message">{secureError}</div>}
          {loadingSecurePolls ? (
            <div>Loading secure polls...</div>
          ) : securePolls.length === 0 ? (
            <div className="no-polls">
              <p>No secure polls available yet.</p>
              <p className="info-text">
                Secure polls implement: Ballot Secrecy, Individual Verifiability, and Homomorphic-like Vote Counting.
              </p>
            </div>
          ) : (
            <div className="polls-grid">
              {securePolls.map(poll => renderPollItem(poll, true))}
            </div>
          )}
        </div>
      ) : (
        // Standard Polls UI
        <div className="polls-container">
          {loading ? (
            <div>Loading polls...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : polls.length === 0 ? (
            <div className="no-polls">No polls available</div>
          ) : (
            <div className="polls-grid">
              {polls.map(poll => renderPollItem(poll))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home; 