import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './App.css'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Home from './components/Home'
import CreatePoll from './components/createPoll'
import { logoutUser, validateSession } from './store/slices/authSlice'

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);

  // Validate the session when the component mounts
  useEffect(() => {
    dispatch(validateSession());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowCreatePoll(false);
  };

  // Show a loading indicator while checking authentication
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>Voting System</h1>
        {isAuthenticated && (
          <div className="header-actions">
            <button onClick={() => setShowCreatePoll(!showCreatePoll)}>
              {showCreatePoll ? 'View Polls' : 'Create Poll'}
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      
      <main>
        {isAuthenticated ? (
          showCreatePoll ? (
            <CreatePoll onCancel={() => setShowCreatePoll(false)} />
          ) : (
            <Home 
              onLogout={handleLogout} 
            />
          )
        ) : (
          <div className="auth-container">
            <div className="tabs">
              <button
                className={activeTab === 'login' ? 'active' : ''}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={activeTab === 'signup' ? 'active' : ''}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'login' ? (
                <Login onLoginSuccess={() => {}} />
              ) : (
                <SignUp onSignupSuccess={() => setActiveTab('login')} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App