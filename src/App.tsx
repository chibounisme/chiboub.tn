import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import StarField from './components/starfield';
import { GitHubIcon, LinkedInIcon, EmailIcon } from './components/Icons';
import './App.css';

function App() {
  const [driftAmount, setDriftAmount] = useState(0);
  
  // Content fades to 30% opacity when drifting
  const contentOpacity = 1 - driftAmount * 0.7;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <div className="app">
      <StarField onDriftChange={setDriftAmount} />
      
      <div 
        className="content-fade-wrapper"
        style={{ 
          opacity: contentOpacity,
          transition: 'opacity 0.3s ease-out'
        }}
      >
        <motion.main
          className="content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        <motion.h1 className="name" variants={itemVariants}>
          Mohamed Chiboub
        </motion.h1>
        <motion.h2 className="title" variants={itemVariants}>
          Software Engineer
        </motion.h2>
        <motion.nav 
          className="social-links"
          variants={itemVariants}
        >
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
        </motion.nav>
      </motion.main>
      </div>
    </div>
  );
}

export default App;
