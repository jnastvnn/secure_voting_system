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
    // Load both standard and secure polls when component mounts
    loadData();
  }, []);

  // Consolidated function to load all data
  const loadData = () => {
    fetchPolls();
    fetchSecurePolls();
  };

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

  // Helper function for handling poll selection
  const handlePollSelect = (poll, isSecure) => {
    if (isSecure) {
      setSelectedSecurePoll(poll);
    } else {
      dispatch(setSelectedPoll(poll));
    }
  };

  // Helper function to go back from a poll
  const handleBack = (isSecure) => {
    if (isSecure) {
      setSelectedSecurePoll(null);
    } else {
      dispatch(setSelectedPoll(null));
    }
  };

  if (!user) return <div>Please login to view polls</div>;
  
  // Show selected poll if any
  if (selectedPoll && !secureMode) {
    return <VotePoll poll={selectedPoll} onBack={() => handleBack(false)} />;
  }
  
  // Show selected secure poll if any
  if (selectedSecurePoll && secureMode) {
    return <SecureVotePoll poll={selectedSecurePoll} onBack={() => handleBack(true)} />;
  }

  // Helper function to render poll item
  const renderPollItem = (poll, isSecure = false) => (
    <div 
      key={poll.id}
      onClick={() => handlePollSelect(poll, isSecure)}
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

  const renderPollsList = (pollsList, isLoading, errorMsg, isSecure) => (
    <div className="polls-container">
      {errorMsg && <div className="error-message">{errorMsg}</div>}
      {isLoading ? (
        <div>Loading polls...</div>
      ) : pollsList.length === 0 ? (
        <div className="no-polls">
          <p>No {isSecure ? 'secure ' : ''}polls available yet.</p>
          {isSecure && (
            <p className="info-text">
              Secure polls implement: Ballot Secrecy, Individual Verifiability, and Homomorphic-like Vote Counting.
            </p>
          )}
        </div>
      ) : (
        <div className="polls-grid">
          {pollsList.map(poll => renderPollItem(poll, isSecure))}
        </div>
      )}
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

      {secureMode
        ? renderPollsList(securePolls, loadingSecurePolls, secureError, true)
        : renderPollsList(polls, loading, error, false)
      }
    </div>
  );
}

export default Home; 