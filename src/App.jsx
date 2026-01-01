import BlackHole from './components/BlackHole';
import { GitHubIcon, LinkedInIcon, EmailIcon } from './components/Icons';
import './App.css';

function App() {
  return (
    <div className="app">
      <BlackHole />
      
      <main className="content">
        <p className="greeting">Welcome to my universe</p>
        <h1 className="name">Mohamed Chiboub</h1>
        <h2 className="title">Software Engineer</h2>
        <p className="description">
          Crafting elegant solutions to complex problems. 
          Passionate about building scalable applications 
          and pushing the boundaries of what's possible with code.
        </p>
        
        <nav className="social-links">
          <a 
            href="https://github.com/mohamedchiboub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="GitHub Profile"
          >
            <GitHubIcon />
          </a>
          <a 
            href="https://linkedin.com/in/mohamedchiboub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="LinkedIn Profile"
          >
            <LinkedInIcon />
          </a>
          <a 
            href="mailto:contact@chiboub.tn" 
            className="social-link"
            aria-label="Send Email"
          >
            <EmailIcon />
          </a>
        </nav>
      </main>
      
      <footer className="footer">
        chiboub.tn
      </footer>
    </div>
  );
}

export default App;
