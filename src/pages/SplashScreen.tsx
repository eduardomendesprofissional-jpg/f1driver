import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-f1driver.jpeg";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => navigate("/login"), 400);
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1.2 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(210 100% 56%) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.95 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-8"
      >
        <motion.img
          src={logo}
          alt="F1 Driver"
          className="w-36 h-36 object-contain rounded-3xl shadow-2xl"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg font-bold text-gradient-blue tracking-wide"
        >
          F1 Driver
        </motion.p>

        {/* Loading bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "6rem" }}
          transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
          className="h-0.5 rounded-full bg-primary/60"
        />
      </motion.div>
    </div>
  );
};

export default SplashScreen;
