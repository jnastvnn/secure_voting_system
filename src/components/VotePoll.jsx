import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitVoteStart, submitVoteSuccess, submitVoteFailure } from '../store/slices/pollsSlice';

const VotePoll = ({ poll, onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.polls);
  const { user } = useSelector(state => state.auth);

  const fetchVoteCounts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls/poll/${poll.id}/votes`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch votes');
      const data = await response.json();
      
      // Convert string vote counts to numbers
      const parsedCounts = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, parseInt(value, 10)])
      );
      
      // Calculate total votes using the parsed numbers
      const total = Object.values(parsedCounts).reduce((sum, count) => sum + count, 0);
      setTotalVotes(total);
      setVoteCounts(parsedCounts);
    } catch (error) {
      console.error('Failed to fetch vote counts:', error);
    }
  };

  useEffect(() => {
    if (poll.id && user?.token) {
      fetchVoteCounts();
    }
  }, [poll.id, user?.token]);

  const handleVote = async () => {
    if (!selectedOption || !user) return;
    
    dispatch(submitVoteStart());
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/polls/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          pollId: poll.id,
          optionId: selectedOption.id,
          userId: user.id
        })
      });
  
      if (!response.ok) throw new Error('Failed to submit vote');
      const data = await response.json();
      dispatch(submitVoteSuccess(data));
      await fetchVoteCounts();
    } catch (error) {
      dispatch(submitVoteFailure(error.message));
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Back
      </button>
      <h1>{poll.title}</h1>
      <div style={{ display: 'grid', gap: '15px' }}>
        {poll.options.map(option => (
          <div 
            onClick={() => setSelectedOption(option)}
            key={option.id}
            style={{
              padding: '20px',
              border: '1px solid #eee',
              borderRadius: '8px',
              backgroundColor: selectedOption?.id === option.id ? '#e6f3ff' : '#fff',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <h3 style={{ margin: '0 0 5px 0', position: 'relative', zIndex: 1 }}>
              {option.text}
            </h3>
            {voteCounts[option.id] !== undefined && totalVotes > 0 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${(voteCounts[option.id] / totalVotes) * 100}%`,
                    backgroundColor: '#bdbdbd',
                    opacity: 0.5,
                    transition: 'width 0.3s ease'
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {Math.round((voteCounts[option.id] / totalVotes) * 100)}% 
                  ({voteCounts[option.id]} votes)
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleVote}
        disabled={!selectedOption || loading}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: !selectedOption || loading ? 'not-allowed' : 'pointer',
          opacity: !selectedOption || loading ? 0.6 : 1
        }}
      >
        {loading ? 'Submitting...' : 'Submit Vote'}
      </button>
    </div>
  );
};

export default VotePoll;