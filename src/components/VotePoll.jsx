
const VotePoll = ({ poll, onBack }) => {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Back
        </button>
        <h1>Poll Details</h1>
        <p>Poll Title: {poll.title}</p>
        <p>This is an empty layout for your poll details. Extend it as needed.</p>
      </div>
    );
  };
  
  export default VotePoll;
  