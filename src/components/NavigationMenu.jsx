
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaUser, FaUsers, FaBell, FaCog, FaSearch, 
  FaSignOutAlt, FaBookmark, FaUserFriends, FaPlus 
} from 'react-icons/fa';
import { MdOutlineExplore } from 'react-icons/md';
import { auth } from '../firebase/firebase';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

export default function NavigationMenu({ user, searchQuery, setSearchQuery }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch all users once
  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersArr = [];
      usersSnap.forEach(doc => usersArr.push({ id: doc.id, ...doc.data() }));
      setAllUsers(usersArr);
    };
    fetchUsers();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'notifications'),
          where('read', '==', false),
          limit(5)
        );
        const notifSnap = await getDocs(q);
        const notifData = [];
        notifSnap.forEach(doc => notifData.push({ id: doc.id, ...doc.data() }));
        setNotifications(notifData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
  }, [user]);

  // Filter users by username as user types
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers([]);
      return;
    }
    const filtered = allUsers.filter(u =>
      u.displayName &&
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, showNotifications]);

  const handleSignOut = () => {
    auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Home', path: '/', icon: <FaHome className="text-xl" /> },
    { name: 'Groups', path: '/GroupChat', icon: <FaUsers className="text-xl" /> },
  ];

 

  return (
    <>
      {/* Top Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-gradient-to-r from-[#1a1b1d]/95 to-[#23272f]/95 backdrop-blur-lg shadow-xl py-1' 
            : 'bg-gradient-to-r from-[#1a1b1d]/70 to-[#23272f]/70 backdrop-blur-sm py-2'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo with enhanced animation */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group relative"
            >
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/40 transition-all duration-500"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 360,
                  transition: { duration: 0.8, type: "spring" }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="white" opacity="0.9"/>
                  <path d="M7 13V11C7 9.343 8.343 8 10 8H14C15.657 8 17 9.343 17 11V13C17 14.657 15.657 16 14 16H10C8.343 16 7 14.657 7 13Z" fill="#c084fc"/>
                  <circle cx="10" cy="12" r="1.5" fill="#f472b6"/>
                  <circle cx="14" cy="12" r="1.5" fill="#60a5fa"/>
                </svg>
              </motion.div>
              <motion.span 
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative"
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              >
                Grouppy
                <motion.span 
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.span>
            </Link>

            {/* Enhanced Search Bar */}
            <div className="relative flex-1 max-w-lg mx-6" ref={searchRef}>
              <motion.div 
                className={`relative transition-all duration-300 ${searchActive ? 'scale-105' : ''}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FaSearch className={`absolute left-3 top-2.5 text-gray-400 transition-all duration-300 ${
                  searchActive ? 'text-purple-400 scale-110' : ''
                }`} />
                <input
                  type="text"
                  placeholder="Search people by username..."
                  className={`w-full bg-gradient-to-r from-gray-800/70 to-gray-700/70 border rounded-full py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    searchActive 
                      ? 'border-purple-500 ring-purple-500/30 shadow-lg shadow-purple-500/20' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchActive(true)}
                  onBlur={() => setTimeout(() => setSearchActive(false), 200)}
                />
              </motion.div>

              {/* Enhanced Search Results Dropdown */}
              <AnimatePresence>
                {searchActive && filteredUsers.length > 0 && (
                  <motion.ul
                    className="absolute left-0 right-0 mt-2 bg-gradient-to-b from-[#23272f] to-[#1a1b1d] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto border border-gray-700/50 shadow-purple-500/10"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    {filteredUsers.map(u => (
                      <motion.li 
                        key={u.id}
                        whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                      >
                        <Link
                          to={`/profile/${u.id}`}
                          className="flex items-center gap-3 px-4 py-2 transition"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchActive(false);
                          }}
                        >
                          <img
                            src={u.photoURL || "/default-avatar.png"}
                            alt={u.displayName || "User"}
                            className="w-8 h-8 rounded-full object-cover border border-gray-700"
                          />
                          <div className="flex-1">
                            <p className="text-gray-200 font-medium">{u.displayName}</p>
                            {u.username && <p className="text-gray-400 text-sm">@{u.username}</p>}
                          </div>
                          {u.badge && (
                            <span className="text-lg" title="User Badge">
                              {u.badge}
                            </span>
                          )}
                        </Link>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {menuItems.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 shadow-lg shadow-purple-500/20'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}

              {/* Enhanced Create Post Button */}
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
                className="ml-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 relative overflow-hidden group"
                onClick={() => navigate('/create-post')}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                />
                <FaPlus className="relative z-10" />
                <span className="hidden lg:inline relative z-10">Create</span>
              </motion.button>

              {/* Notifications */}
              <div className="relative ml-2" ref={notificationRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full flex items-center justify-center transition-all ${
                    showNotifications 
                      ? 'bg-purple-600/20 text-purple-400' 
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell className="text-xl" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </motion.button>
                
                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-[#23272f] rounded-xl shadow-lg z-50 border border-gray-700 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-medium text-white">Notifications</h3>
                        <button className="text-xs text-purple-400 hover:text-purple-300">
                          Mark all as read
                        </button>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              className="p-3 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                {notif.from?.photoURL && (
                                  <img 
                                    src={notif.from.photoURL} 
                                    alt={notif.from.displayName} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm text-gray-200">
                                    <span className="font-medium">{notif.from?.displayName}</span>
                                    {notif.type === 'like' && ' liked your post'}
                                    {notif.type === 'comment' && ' commented on your post'}
                                    {notif.type === 'follow' && ' started following you'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-400">
                            <p>No new notifications</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2 border-t border-gray-700 text-center">
                        <Link 
                          to="/notifications" 
                          className="text-sm text-purple-400 hover:text-purple-300"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* User Menu */}
              <div className="relative ml-2 user-menu-container" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${isOpen ? 'border-purple-500' : 'border-gray-700'}`}>
                    <img
                      src={user?.photoURL || "/default-avatar.png"}
                      alt={user?.displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-[#23272f] rounded-xl shadow-lg z-50 border border-gray-700 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <img
                            src={user?.photoURL || "/default-avatar.png"}
                            alt={user?.displayName || "User"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                          />
                          <div>
                            <p className="font-medium text-white">{user?.displayName}</p>
                            <p className="text-sm text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <FaUser className="text-purple-400" />
                          <span>Your Profile</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <FaCog className="text-purple-400" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="py-1 border-t border-gray-700">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          <FaSignOutAlt className="text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-[#1a1b1d] border-t border-gray-800 shadow-lg"
          >
            <div className="px-4 py-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-2 rounded-lg text-base font-medium flex items-center gap-3 ${
                    location.pathname === item.path
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-lg text-base font-medium flex items-center gap-3 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <FaUser className="text-xl" />
                <span>Profile</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 rounded-lg text-base font-medium flex items-center gap-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <FaSignOutAlt className="text-xl" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}