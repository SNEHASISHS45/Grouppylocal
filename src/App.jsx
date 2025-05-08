import { useEffect, useState, lazy, Suspense, useRef, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase/firebase';
import { 
  collection, 
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from './firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import ShareIcon from '@mui/icons-material/Share';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { FaEllipsisH, FaHeart, FaComment, FaShare, FaBookmark } from 'react-icons/fa';

// Component imports
import BadgeManager from './components/BadgeManager';
import Management from './pages/Management';
import EnhancedModal from './components/EnhancedModal';
import NavigationMenu from './components/NavigationMenu';
import ResponsiveSidebar from './components/ResponsiveSidebar';
import EnhancedPost from './components/EnhancedPost';
import PhotoFeed from './components/PhotoFeed';
import { 
  collection, 
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from './firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveSidebar from './components/ResponsiveSidebar';
import NavigationMenu from './components/NavigationMenu';
import EnhancedPost from './components/EnhancedPost';
import PhotoFeed from './components/PhotoFeed';
import { 
  collection, 
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from './firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';

function Home({ user, searchQuery, setSearchQuery }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all');
  const lastScrollY = useRef(0);
  const [openedPost, setOpenedPost] = useState(null);

  useEffect(() => {
    // Fetch posts from Firestore
    const fetchPosts = async () => {
      const postsSnap = await getDocs(collection(db, "posts"));
      const postsArr = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsArr);
      setFilteredPosts(postsArr); // Initially, filteredPosts is the same as posts
    };
    fetchPosts();
  }, []);

  function getFilteredFeed() {
    // Use filteredPosts so search and filters work
    return filteredPosts;
  }
  console.log(posts);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18191a] to-[#232526] text-white">
      <div className="flex">
        <ResponsiveSidebar user={user} />
        <div className="flex-1 ml-0 md:ml-20 mt-16">
          {/* Use the imported PhotoFeed component */}
          <PhotoFeed posts={getFilteredFeed()} onPhotoClick={setOpenedPost} />

          <AnimatePresence>
            {openedPost && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenedPost(null)}
              >
                <motion.div
                  className="bg-[#1a1b1d] rounded-xl shadow-2xl w-full max-w-6xl relative overflow-hidden"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  onClick={e => e.stopPropagation()}
                >
                  <motion.button
                    className="absolute top-3 right-3 z-50 text-gray-300 hover:text-white text-3xl bg-black/50 rounded-full p-1 shadow-lg transition"
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    onClick={() => setOpenedPost(null)}
                  >
                    &times;
                  </motion.button>
                  <EnhancedPost post={openedPost} currentUser={user} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Lazy load components
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./components/Profile'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Management = lazy(() => import('./pages/Management'));
const BadgeManager = lazy(() => import('./components/BadgeManager'));

function App() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const isOpAccount = userData.isOpAccount || false;
        setUser({ ...firebaseUser, isOpAccount });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <NavigationMenu user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/"
            element={user ? <Home user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile/:id"
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/manage-badges"
            element={user && user.isOpAccount ? <BadgeManager /> : <Navigate to="/" replace />}
          />
          <Route
            path="/management"
            element={user && user.isOpAccount ? <Management /> : <Navigate to="/" replace />}
          />
          <Route
            path="/create-post"
            element={user ? <CreatePost user={user} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Suspense>
    </Router>
  );
}



const fetchMorePhotos = () => {
  if (photos.length >= 32) {
    setHasMore(false);
    return;
  }
  
  // Simulate loading more photos (replace with actual API call)
  setTimeout(() => {
    setPhotos(prev => [...prev, ...Array(8).fill().map((_, i) => i + prev.length + 1)]);
  }, 1000);
};



// Add share button to posts:
<div className="flex gap-4 mt-3">
  <button 
    onClick={() => navigator.share({
      title: 'Grouppy Post',
      text: post.text,
      url: window.location.href
    })}
    className="flex items-center gap-1 hover:text-indigo-400"
  >
    <ShareIcon className="w-5 h-5" /> Share
  </button>
</div>

function Sidebar({ onSelect, selected }) {
  const [expanded, setExpanded] = useState(false);
  const icons = [
    { id: 'org', icon: <img src="/org-icon.svg" alt="Org" />, label: 'Sisyphus Ventures' },
    { id: 'dashboard', icon: <img src="/dashboard-icon.svg" alt="Dashboard" />, label: 'Dashboard' },
    { id: 'charts', icon: <img src="/charts-icon.svg" alt="Charts" />, label: 'All charts' },
    { id: 'analytics', icon: <img src="/analytics-icon.svg" alt="Analytics" />, label: 'Analytics' },

  ];

  return (
    <div className="flex h-screen">
      {/* Icon-only sidebar */}
      <div className="flex flex-col items-center bg-white border-r w-16 py-4 space-y-2 shadow-lg">
        {icons.map((item, idx) => (
          <button
            key={item.id}
            className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition ${selected === item.id ? 'bg-gray-200' : ''}`}
            onClick={() => { onSelect(item.id); setExpanded(true); }}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
        <div className="flex-1" />
        {/* Profile */}
        <div className="mb-2">
          <img src="/profile.jpg" alt="Profile" className="w-10 h-10 rounded-full border" />
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
          <span className="text-2xl">+</span>
        </button>
      </div>
      {/* Expanded sidebar */}
      {expanded && (
        <div className="w-64 bg-white border-r shadow-xl p-6 flex flex-col transition-all">
          <div className="flex items-center mb-8">
            <img src="/org-icon.svg" alt="Org" className="w-8 h-8 mr-3" />
            <div>
              <div className="font-bold">Sisyphus Ventures</div>
              <div className="text-xs text-gray-500">untitledui.com/sisyphus</div>
            </div>
          </div>
          <div className="mb-4 text-xs text-gray-400 font-semibold">DASHBOARD</div>
          <nav className="flex flex-col gap-2 mb-6">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
              <img src="/dashboard-icon.svg" alt="Dashboard" className="w-5 h-5" />
              Summary
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
              <img src="/charts-icon.svg" alt="Charts" className="w-5 h-5" />
              All charts
            </button>
            {/* ...more nav items */}
          </nav>
          <div className="mb-4 text-xs text-gray-400 font-semibold">ORGANIZATION</div>
          <nav className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
              <span className="w-5 h-5 inline-block">⚙️</span>
              Settings
            </button>
            {/* ...more org items */}
          </nav>
          <div className="flex-1" />
          {/* Profile quick view */}
          <div className="flex items-center gap-3 mt-8 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
            <img src="/profile.jpg" alt="Profile" className="w-8 h-8 rounded-full" />
            <div>
              <div className="font-medium text-gray-800">Frankie Sullivan</div>
              <div className="text-xs text-gray-500">frankie@untitledui.com</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





export default App;