import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import StarField from './components/starfield';
import { GitHubIcon, LinkedInIcon, EmailIcon } from './components/Icons';
import './App.css';

function App() {
  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.0, ease: "easeOut" }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <StarField />
      </motion.div>
      
      <div className="content-fade-wrapper">
        <main className="content">
        <h1 className="name">
          Mohamed Chiboub
        </h1>
        <h2 className="title">
          Software Engineer
        </h2>
        <nav className="social-links">
          <motion.a 
            href="https://github.com/chibounisme" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="GitHub Profile"
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <GitHubIcon />
          </motion.a>
          <motion.a 
            href="https://www.linkedin.com/in/chiboub/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="LinkedIn Profile"
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <LinkedInIcon />
          </motion.a>
          <motion.a 
            href="mailto:mohamedchiboub97@gmail.com" 
            className="social-link"
            aria-label="Send Email"
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <EmailIcon />
          </motion.a>
        </nav>
      </main>
      </div>
    </div>
  );
}

export default App;
