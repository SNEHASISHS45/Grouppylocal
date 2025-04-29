import { auth } from "../firebase/firebase";
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function Login() {
  const [showVideo, setShowVideo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Hide the video after 2.5 seconds
    const timer = setTimeout(() => setShowVideo(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      alert("Google login failed");
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      alert("Facebook login failed");
    }
  };

  const handleEmailLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("Email login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Login animation video */}
      {showVideo && (
        <video
          autoPlay
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-50 transition-opacity duration-700"
          style={{ pointerEvents: 'none', opacity: showVideo ? 1 : 0 }}
        >
          <source src="/Logo-3.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: showVideo ? 0.7 : 0 }}
        className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 flex flex-col items-center w-full max-w-md border border-white/30 z-10 relative"
      >
        {/* Brand Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg mb-6"
        >
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="white" opacity="0.9"/>
            <path d="M7 13V11C7 9.343 8.343 8 10 8H14C15.657 8 17 9.343 17 11V13C17 14.657 15.657 16 14 16H10C8.343 16 7 14.657 7 13Z" fill="#c084fc"/>
            <circle cx="10" cy="12" r="1.5" fill="#f472b6"/>
            <circle cx="14" cy="12" r="1.5" fill="#60a5fa"/>
          </svg>
        </motion.div>

        {/* Headings */}
        <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300">Grouppy</span>
        </h1>
        <p className="text-center text-white/80 text-sm mb-8">
          Join and explore memories with your favorite groups
        </p>

        {/* Login Buttons */}
        <div className="w-full space-y-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-white/80 hover:bg-white text-gray-700 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <img src="https://www.svgrepo.com/show/475700/facebook-color.svg" alt="Facebook" className="w-6 h-6 bg-white rounded-full" />
            Continue with Facebook
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 h-px bg-white/30"></div>
          <span className="px-3 text-white/70 text-sm">or</span>
          <div className="flex-1 h-px bg-white/30"></div>
        </div>

        {/* Email login */}
        <div className="w-full">
          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full px-4 py-3 mb-3 rounded-xl border-none bg-white/60 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
          <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-all">
            Continue with Email
          </button>
        </div>

        {/* Terms */}
        <p className="mt-8 text-[11px] text-white/60 text-center">
          By continuing, you agree to our <a href="#" className="underline hover:text-white">Terms</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
