import { motion } from 'framer-motion';
import StarField from './components/StarField';
import { GitHubIcon, LinkedInIcon, EmailIcon } from './components/Icons';
import './App.css';

function App() {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const socialVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="app">
      <StarField />
      
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
            variants={socialVariants}
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
            variants={socialVariants}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <LinkedInIcon />
          </motion.a>
          <motion.a 
            href="mailto:mohamedchiboub97@gmail.com" 
            className="social-link"
            aria-label="Send Email"
            variants={socialVariants}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <EmailIcon />
          </motion.a>
        </motion.nav>
      </motion.main>
    </div>
  );
}

export default App;
