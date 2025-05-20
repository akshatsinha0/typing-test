import { motion } from 'framer-motion';

const floatingVariants = {
  float: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const AnimatedBackground = () => (
  <div className="animated-bg-container">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="floating-bubble"
        style={{
          width: Math.random() * 50 + 20,
          height: Math.random() * 50 + 20,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          borderRadius: `${Math.random() * 50}%`
        }}
        variants={floatingVariants}
        animate="float"
      />
    ))}
  </div>
);
