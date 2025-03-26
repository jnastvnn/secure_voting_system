import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Home from './components/Home'

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Secure Voting System</h1>
      </header>
      <main>
        {isLoggedIn ? (
          <Home onLogout={handleLogout} />
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
