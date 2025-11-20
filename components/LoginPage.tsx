import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 无论输入什么，直接登录
    onLogin();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a1a]">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(139, 0, 139, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0, 100, 150, 0.4) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(139, 0, 139, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0, 100, 150, 0.4) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(139, 0, 139, 0.4) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(0, 100, 150, 0.4) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(139, 0, 139, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0, 100, 150, 0.4) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.6) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(0, 200, 255, 0.6) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Neon horizon line */}
      <motion.div
        className="absolute left-0 right-0 h-1"
        style={{
          top: '60%',
          background: 'linear-gradient(90deg, rgba(255, 0, 128, 0) 0%, rgba(255, 0, 128, 0.8) 30%, rgba(0, 200, 255, 0.8) 70%, rgba(0, 200, 255, 0) 100%)',
          boxShadow: '0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 200, 255, 0.5)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Login form container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md px-6"
        >
          {/* LOGIN title with neon effect */}
          <div className="flex justify-center mb-12">
            <motion.h1
              className="text-center tracking-wider whitespace-nowrap"
              style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#ff0080',
                textShadow: '0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 200, 255, 0.5)',
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 200, 255, 0.5)',
                  '0 0 25px rgba(255, 0, 128, 0.6), 0 0 50px rgba(0, 200, 255, 0.6)',
                  '0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(0, 200, 255, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              INTERACTIVE LED SYSTEM
            </motion.h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <label
                htmlFor="email"
                className="block text-center mb-2 tracking-widest"
                style={{
                  color: '#8dd7ff',
                  fontSize: '0.75rem',
                }}
              >
                EMAIL/USERNAME
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-2 rounded-none h-12 text-center focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  borderColor: '#4a90a4',
                  color: '#ffffff',
                  boxShadow: '0 0 5px rgba(74, 144, 164, 0.2)',
                }}
              />
            </motion.div>

            {/* Password input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <label
                htmlFor="password"
                className="block text-center mb-2 tracking-widest"
                style={{
                  color: '#8dd7ff',
                  fontSize: '0.75rem',
                }}
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-2 rounded-none h-12 text-center focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  borderColor: '#4a90a4',
                  color: '#ffffff',
                  boxShadow: '0 0 10px rgba(74, 144, 164, 0.3)',
                }}
              />
            </motion.div>

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="pt-4"
            >
              <button
                type="submit"
                className="w-full bg-transparent border-2 rounded-none h-12 tracking-widest transition-all relative overflow-hidden group focus:outline-none"
                style={{
                  borderColor: '#ff0080',
                  color: '#ff0080',
                  boxShadow: '0 0 10px rgba(255, 0, 128, 0.3)',
                }}
              >
                <span className="relative z-10">LOGIN</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </button>
            </motion.div>
          </form>

          {/* Footer text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 text-center"
            style={{
              fontSize: '0.75rem',
              color: '#666',
              letterSpacing: '0.05em',
            }}
          >
            <p>Powered by Zys</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? '#ff0080' : '#00c8ff',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default LoginPage;

