import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function SecureVotePoll({ poll, onBack }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (poll?.id) {
      checkVoteStatus();
      fetchVoteCounts();
    }
  }, [poll?.id]);

  const checkVoteStatus = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(
        `${baseUrl}/api/polls/${poll.id}/user-voted?secure=true`, 
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.hasVoted);
      }
    } catch (err) {
      console.error('Failed to check vote status:', err);
    }
  };

  const fetchVoteCounts = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(
        `${baseUrl}/api/polls/${poll.id}/counts?secure=true`, 
        { credentials: 'include' }
      );
  
      if (!response.ok) throw new Error('Failed to fetch votes');
      
      const data = await response.json();
      setVoteCounts(data);
      
      // Calculate total votes
      const total = Object.values(data).reduce((sum, count) => sum + Number(count), 0);
      setTotalVotes(total);
    } catch (error) {
      console.error('Failed to fetch vote counts:', error);
      setError('Failed to load votes. Please try again.');
    }
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/polls/vote?secure=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pollId: poll.id,
          optionId: selectedOption.id
        })
      });
  
      if (!response.ok) throw new Error('Failed to submit vote');
      
      const data = await response.json();
      // Save verification token for later use
      setVerificationToken(data.verificationToken);
      setHasVoted(true);
      
      await fetchVoteCounts();
    } catch (error) {
      setError(error.message || 'Failed to submit vote');
    } finally {
      setLoading(false);
    }
  };

  const verifyVote = async () => {
    if (!verificationToken) return;
    
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/polls/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pollId: poll.id,
          verificationToken
        })
      });
      
      if (!response.ok) throw new Error('Verification failed');
      
      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      setError('Vote verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!poll) return <div>No poll selected</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          border: '1px solid #ddd',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Back
      </button>
      
      <h1>{poll.title}</h1>
      {poll.description && <p>{poll.description}</p>}
      
      {/* Verification Information */}
      {hasVoted && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          marginBottom: '20px' 
        }}>
          <h3>You have voted in this poll</h3>
          
          {verificationToken && (
            <div>
              <p>
                <strong>Your verification token:</strong>
                <br />
                <textarea 
                  readOnly 
                  value={verificationToken}
                  style={{ width: '100%', marginTop: '5px', padding: '5px' }}
                />
              </p>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Save this token to verify your vote was counted correctly
              </p>
              
              <button
                onClick={verifyVote}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Verifying...' : 'Verify My Vote'}
              </button>
            </div>
          )}
          
          {verificationResult && (
            <div style={{ 
              marginTop: '15px',
              padding: '10px',
              backgroundColor: verificationResult.verified ? '#d4edda' : '#f8d7da',
              color: verificationResult.verified ? '#155724' : '#721c24'
            }}>
              {verificationResult.verified ? (
                <p><strong>✓ Vote verified!</strong> Your vote has been securely counted.</p>
              ) : (
                <p><strong>✗ Verification failed:</strong> {verificationResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Vote Options */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {poll.options.map(option => (
          <div 
            onClick={() => !hasVoted && setSelectedOption(option)}
            key={option.id}
            style={{
              padding: '20px',
              border: '1px solid #eee',
              backgroundColor: selectedOption?.id === option.id ? '#e6f3ff' : '#fff',
              cursor: hasVoted ? 'default' : 'pointer',
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
                    backgroundColor: '#e9ecef',
                    opacity: 0.7,
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
      
      {/* Vote Button */}
      {!hasVoted && (
        <button
          onClick={handleVote}
          disabled={!selectedOption || loading}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: !selectedOption || loading ? 'not-allowed' : 'pointer',
            opacity: !selectedOption || loading ? 0.6 : 1
          }}
        >
          {loading ? 'Submitting...' : 'Submit Vote'}
        </button>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '0.9em', color: '#666' }}>
        <h3>About Secure Voting</h3>
        <ul>
          <li><strong>Ballot Secrecy:</strong> Your vote is encrypted and stored separately from your identity</li>
          <li><strong>Individual Verifiability:</strong> Your verification token allows you to confirm your vote was counted</li>
          <li><strong>Homomorphic Counting:</strong> Votes are tallied securely without revealing individual choices</li>
        </ul>
      </div>
    </div>
  );
}

export default SecureVotePoll; 