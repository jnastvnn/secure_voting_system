import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Home from './components/HomeNew'
import CreatePoll from './components/createPoll' 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('currentUser');
    if (user) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setShowCreatePoll(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Secure Voting System</h1>
        {isLoggedIn && (
          <div className="header-actions">
            <button onClick={() => setShowCreatePoll(!showCreatePoll)}>
              {showCreatePoll ? 'View Polls' : 'Create Poll'}
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      
      <main>
        {isLoggedIn ? (
          showCreatePoll ? (
            <CreatePoll onCancel={() => setShowCreatePoll(false)} />
          ) : (
            <Home onLogout={handleLogout} />
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
                <Login onLoginSuccess={() => setIsLoggedIn(true)} />
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