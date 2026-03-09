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
      setTimeout(() => navigate("/login"), 500);
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <img src={logo} alt="F1 Driver" className="w-64 h-64 object-contain rounded-2xl" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "8rem" }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          className="h-1 rounded-full bg-primary"
        />
      </motion.div>
    </div>
  );
};

export default SplashScreen;
