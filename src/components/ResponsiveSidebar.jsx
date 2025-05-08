import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaUsers, FaCalendarAlt, FaBookmark, FaCog, 
  FaBars, FaTimes, FaBell, FaSearch, FaUserFriends,
  FaSignOutAlt, FaChevronRight
} from 'react-icons/fa';
import { IoMdPhotos } from 'react-icons/io';
import { MdOutlineExplore } from 'react-icons/md';
import { auth } from '../firebase/firebase';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import ExploreIcon from '@mui/icons-material/Explore';
import EventIcon from '@mui/icons-material/Event';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Tooltip from '@mui/material/Tooltip';

function Sidebar({ user, onSelect, selected }) {
  const [expanded, setExpanded] = useState(false);
  const icons = [
    { id: 'org', icon: <img src="/org-icon.svg" alt="Org" />, label: 'Sisyphus Ventures' },
    { id: 'dashboard', icon: <img src="/dashboard-icon.svg" alt="Dashboard" />, label: 'Dashboard' },
    { id: 'charts', icon: <img src="/charts-icon.svg" alt="Charts" />, label: 'All charts' },
    { id: 'analytics', icon: <img src="/analytics-icon.svg" alt="Analytics" />, label: 'Analytics' },
    // Add more as needed
  ];

  // Conditionally add the Management option for admin users
  if (user && user.isOpAccount) {
    icons.unshift({ id: 'management', icon: <img src="/management-icon.svg" alt="Management" />, label: 'Management' });
  }

  return (
    <div className="flex h-screen">
      {/* Icon-only sidebar */}
      <div className="flex flex-col items-center bg-white border-r w-16 py-4 space-y-2 shadow-lg">
        {icons.map((item) => (
          <button
            key={item.id}
            className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition ${selected === item.id ? 'bg-gray-200' : ''}`}
            onClick={() => { onSelect(item.id); setExpanded(true); }}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
export default function ResponsiveSidebar({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeItem, setActiveItem] = useState('/');
  const [expandedSection, setExpandedSection] = useState(null);
  const location = useLocation();
  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  const menuItems = [
    // Add Management Page for op accounts at the top
    ...(user.isOpAccount ? [{ name: 'Management', path: '/management', icon: <FaCog className="text-xl" /> }] : []),
    { name: 'Home Feed', path: '/', icon: <FaHome className="text-xl" /> },
    { name: 'Explore', path: '/explore', icon: <MdOutlineExplore className="text-xl" /> },
    { 
      name: 'Groups', 
      path: '/groups', 
      icon: <FaUsers className="text-xl" />,
      subItems: [
        { name: 'My Groups', path: '/groups/my' },
        { name: 'Discover', path: '/groups/discover' },
        { name: 'Create New', path: '/groups/create' }
      ]
    },
    { name: 'Events', path: '/events', icon: <FaCalendarAlt className="text-xl" /> },
    { name: 'Photos', path: '/photos', icon: <IoMdPhotos className="text-xl" /> },
    { name: 'Friends', path: '/friends', icon: <FaUserFriends className="text-xl" /> },
    { name: 'Saved Posts', path: '/saved', icon: <FaBookmark className="text-xl" /> },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      width: isMobile ? '272px' : '272px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.07,
        delayChildren: 0.2
      }
    },
    closed: {
      x: isMobile ? '-100%' : 0,
      width: isMobile ? '0px' : '64px',
      opacity: isMobile ? 0 : 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    closed: {
      y: 20,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 0.5,
      display: 'block',
      transition: { duration: 0.3 }
    },
    closed: {
      opacity: 0,
      transitionEnd: { display: 'none' },
      transition: { duration: 0.3 }
    }
  };

  const toggleSection = (sectionName) => {
    if (expandedSection === sectionName) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionName);
    }
  };

  return (
    <>
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black z-30"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            exit="closed"
            variants={sidebarVariants}
            className={`fixed top-0 left-0 h-full z-40 bg-[#1a1b1d] shadow-xl overflow-hidden
                      ${isMobile ? 'w-72' : isOpen ? 'w-72' : 'w-16'} 
                      transition-all duration-300 ease-in-out`}
          >
            <motion.div 
              variants={itemVariants}
              className="flex items-center h-16 border-b border-gray-800 px-4"
            >
              <div className={`flex items-center ${isMobile || isOpen ? 'justify-between w-full' : 'justify-center'}`}>
                {/* Logo removed */}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="px-4 py-4 border-b border-gray-800"
            >
              <div className={`flex items-center ${!isMobile && !isOpen ? 'justify-center' : ''}`}>
                <img 
                  src={user?.photoURL || "/default-avatar.png"} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                />
                <div className={`ml-3 transition-opacity duration-300 ${(!isMobile && !isOpen) ? 'opacity-0 hidden' : 'opacity-100'}`}>
                  <p className="text-white font-medium truncate">{user?.displayName || "User"}</p>
                  <p className="text-gray-400 text-xs truncate">{user?.email || ""}</p>
                </div>
              </div>
            </motion.div>

            {(isMobile || isOpen) && (
              <motion.div
                variants={itemVariants}
                className="px-4 py-3"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
                </div>
              </motion.div>
            )}

            <div className="py-4 overflow-y-auto h-[calc(100%-12rem)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'scroll' }}>
              <nav>
                <ul className="space-y-1 px-2">
                  {menuItems.map((item) => (
                    <motion.li key={item.path} variants={itemVariants}>
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => toggleSection(item.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group
                                      ${activeItem.startsWith(item.path) 
                                        ? 'bg-purple-600/20 text-purple-400' 
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                          >
                            <div className="flex items-center">
                              <div className={`flex justify-center ${!isMobile && !isOpen ? 'w-full' : 'w-8'}`}>
                                {item.icon}
                              </div>
                              {(isMobile || isOpen) && (
                                <span className="ml-3">{item.name}</span>
                              )}
                            </div>
                            {(isMobile || isOpen) && (
                              <ChevronRightIcon
                                className={`transition-transform duration-200 ${expandedSection === item.name ? 'rotate-90' : ''}`}
                                fontSize="small"
                              />
                            )}
                          </button>
  
                          <AnimatePresence>
                            {expandedSection === item.name && (isMobile || isOpen) && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-10 mt-1 space-y-1 overflow-hidden"
                              >
                                {item.subItems.map((subItem) => (
                                  <li key={subItem.path}>
                                    <Link
                                      to={subItem.path}
                                      onClick={() => isMobile && setIsOpen(false)}
                                      className={`block py-2 px-3 rounded-md text-sm transition-colors duration-200
                                                ${activeItem === subItem.path 
                                                  ? 'text-purple-400 bg-purple-600/10' 
                                                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Tooltip title={!isMobile && !isOpen ? item.name : ""} placement="right">
                          <Link
                            to={item.path}
                            onClick={() => isMobile && setIsOpen(false)}
                            className={`flex items-center p-3 rounded-lg transition-all duration-200 group
                                      ${activeItem === item.path 
                                        ? 'bg-purple-600/20 text-purple-400' 
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                          >
                            <div className="w-8 flex justify-center">
                              {item.icon}
                            </div>
                            {(isMobile || isOpen) && (
                              <span className="ml-3">{item.name}</span>
                            )}
                          </Link>
                        </Tooltip>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Logout Button */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800"
            >
              <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
              >
                <div className="w-8 flex justify-center">
                  <LogoutIcon fontSize="medium" />
                </div>
                {(isMobile || isOpen) && (
                  <span className="ml-3">Sign Out</span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${isMobile ? '' : isOpen ? 'lg:ml-72' : 'lg:ml-16'}`}></div>
    </>
  );
}