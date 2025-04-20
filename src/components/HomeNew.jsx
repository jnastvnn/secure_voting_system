import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VotePoll from './VotePoll';
import { fetchPollsStart, fetchPollsSuccess, fetchPollsFailure, setSelectedPoll } from '../store/slices/pollsSlice';

function Home({ onLogout }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { polls, loading, error, selectedPoll } = useSelector(state => state.polls);

  useEffect(() => {
    const token = getJWTToken();
    if (!token) {
      onLogout();
      return;
    }
    fetchPolls(token);
  }, []);

  const getJWTToken = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) return null;
      return JSON.parse(userData).token;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  };

  const fetchPolls = async (token) => {
    try {
      dispatch(fetchPollsStart());
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
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

  if (!user) return <div>Please login to view polls</div>;
  if (loading) return <div>Loading polls...</div>;
  if (error) return <div>Error: {error}</div>;

  if (selectedPoll) {
    return <VotePoll poll={selectedPoll} onBack={() => dispatch(setSelectedPoll(null))} />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ margin: 0 }}>Current Polls</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#666' }}>{user.username}</span>
          <button 
            onClick={onLogout}
            style={{ 
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {polls.map(poll => (
          <div 
            key={poll.id}
            onClick={() => dispatch(setSelectedPoll(poll))}
            style={{
              padding: '20px',
              border: '1px solid #eee',
              borderRadius: '8px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{poll.title}</h3>
              {poll.description && (
                <p style={{ 
                  margin: '0 0 10px 0', 
                  color: '#666',
                  fontSize: '0.9em'
                }}>
                  {poll.description}
                </p>
              )}
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                fontSize: '0.85em',
                color: '#888',
                flexWrap: 'wrap'
              }}>
                <span>Created: {new Date(poll.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
                <span>•</span>
                <span>By: {poll.created_by || 'Anonymous'}</span>
                <span>•</span>
                <span style={{ 
                  color: poll.is_active ? '#4CAF50' : '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: poll.is_active ? '#4CAF50' : '#f44336'
                  }} />
                  {poll.is_active ? 'Active' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;