import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase/firebase';
import Login from './pages/Login';
import Profile from './components/Profile';
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
  getDoc
} from "firebase/firestore";
import { db } from './firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { orderBy } from "firebase/firestore";
import ShareIcon from '@mui/icons-material/Share';

function Home({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showProfile, setShowProfile] = useState(false); // <-- Add this line

  // Add these state definitions to the existing Home component
  const [events, setEvents] = useState([
    { title: 'Birthday Party', date: '2023-12-15' },
    { title: 'Team Meeting', date: '2023-12-20' }
  ]);
  
  const [specialMoments, setSpecialMoments] = useState([
    { title: 'Graduation', date: '2023-05-10', desc: 'College graduation day' },
    { title: 'First Job', date: '2023-06-01', desc: 'Started first professional job' }
  ]);

  const [groupMemories, setGroupMemories] = useState([
    'Summer Trip 2023',
    'New Year Celebration'
  ]);

  const [sharedMoments, setSharedMoments] = useState([
    'Beach Vacation',
    'Mountain Hike'
  ]);

  const [sharedExperiences, setSharedExperiences] = useState([
    'Concert Night',
    'Food Festival'
  ]);
  // Fetch posts from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    });
    return unsubscribe;
  }, []);

  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPostImage(e.target.files[0]);
    }
  };

  // Upload image to Cloudinary and create post
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  const handleShare = async () => {
    setIsSharing(true);
    setShareError(null);
    try {
      let imageUrl = '';
      if (postImage) {
        const formData = new FormData();
        formData.append('file', postImage);
        formData.append('upload_preset', 'ml_default'); // Update with actual preset
        
        // Update Cloudinary URL with your actual cloud name
        const res = await fetch('https://api.cloudinary.com/v1_1/dzn369qpk/image/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) throw new Error('Image upload failed - check Cloudinary settings');
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      // Allow image-only posts
      if (!postText && !imageUrl) {
        throw new Error('Cannot share empty post');
      }
  
      await addDoc(collection(db, 'posts'), {
        text: postText,
        image: imageUrl,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        createdAt: new Date(),
      });
      
      setPostText('');
      setPostImage(null);
      
    } catch (error) {
      console.error('Share error:', error);
      setShareError('Failed to share post. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Add this handleAddComment function inside the Home component
  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
  
    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        user: user.displayName,
        photoURL: user.photoURL,
        text: commentText,
        timestamp: new Date()
      };
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentText('');
  
      // Optimistically update selectedPost if it's open
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments: selectedPost.comments
            ? [...selectedPost.comments, newComment]
            : [newComment]
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Update the existing handleLike function with real-time refresh
  // Update handleLike with optimistic updates
  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
  
      if (postDoc.exists()) {
        const currentLikes = postDoc.data().likes || [];
        const newLikes = currentLikes.includes(user.uid)
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid);
  
        // Optimistic update
        setPosts(posts.map(post => 
          post.id === postId ? {
            ...post,
            likes: currentLikes.includes(user.uid)
              ? currentLikes.filter(uid => uid !== user.uid)
              : [...currentLikes, user.uid]
          } : post
        ));
  
        // Also update selectedPost if it's the same post
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            likes: currentLikes.includes(user.uid)
              ? currentLikes.filter(uid => uid !== user.uid)
              : [...currentLikes, user.uid]
          });
        }
  
        await updateDoc(postRef, { likes: newLikes });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback on error
      setPosts(posts);
    }
  };

  // Add this logout handler inside Home
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login"; // Or use navigate("/login") if you have access to navigate
    } catch (error) {
      alert("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#18191A] text-gray-100 flex font-sans">
      {/* Error message display */}
      {shareError && (
        <p className="text-red-500 text-sm mt-2">{shareError}</p>
      )}
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#23272A] flex flex-col py-8 px-6 min-h-screen border-r border-gray-800">
        <h1 className="text-3xl font-extrabold text-white mb-10 tracking-wide">Discove</h1>
        <nav className="flex-1">
          <ul className="space-y-4 text-lg font-semibold">
            <li><a href="#" className="hover:text-indigo-400 flex items-center gap-2" onClick={() => setShowProfile(false)}>
              🏠 Home
            </a>
          </li>
          <li><a href="#" className="hover:text-indigo-400 flex items-center gap-2">🔍 Search</a></li>
          <li><a href="#" className="hover:text-indigo-400 flex items-center gap-2">🖼 My</a></li>
          <li><a href="#" className="hover:text-indigo-400 flex items-center gap-2">➕ Create</a></li>
          <li><a href="#" className="hover:text-indigo-400 flex items-center gap-2">⭐ Favorite</a></li>
          <li>
            <a href="#" className="hover:text-indigo-400 flex items-center gap-2" onClick={() => setShowProfile(true)}>
              👤 Profile
            </a>
          </li>
          </ul>
        </nav>
        <div className="mt-10 space-y-2 text-md">
          <a href="#" className="hover:text-indigo-400 flex items-center gap-2">⚙️ Settings</a>
          <a href="#" className="hover:text-indigo-400 flex items-center gap-2" onClick={handleLogout}>🚪 Log out</a>
        </div>
      </aside>

      {/* Main Feed - Instagram-style Gallery */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 bg-[#18191A] min-h-screen">
        {showProfile ? (
          <Profile user={user} />
        ) : (
          <>
            {/* Post Creation Bar */}
            <div className="w-full max-w-6xl mx-auto px-4 mb-6">
              <div className="bg-[#242526] rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="text-white font-medium">{user.displayName}</div>
                </div>
                
                <textarea
                  placeholder="Share a caption for your photo..."
                  className="w-full bg-[#3A3B3C] rounded-lg p-3 text-white placeholder-gray-400 outline-none resize-none mb-3"
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  rows="2"
                />
                
                {postImage && (
                  <div className="relative mb-3">
                    <img 
                      src={URL.createObjectURL(postImage)} 
                      alt="Preview" 
                      className="w-full max-h-60 object-contain rounded-lg"
                    />
                    <button 
                      className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white"
                      onClick={() => setPostImage(null)}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="flex items-center gap-2 text-indigo-400 cursor-pointer hover:text-indigo-300 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 transition-colors"
                    >
                      <span className="text-xl">📸</span>
                      Add Photo
                    </label>
                  </div>
                  
                  <button
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleShare}
                    disabled={(!postText && !postImage) || isSharing}
                  >
                    {isSharing ? 'Posting...' : 'Share Post'}
                  </button>
                </div>
              </div>
            </div>
            {/* Explorer Header */}
            <div className="w-full max-w-6xl mx-auto px-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Explore</h2>
              <p className="text-gray-400">Discover beautiful moments from around the world</p>
            </div>
            {/* Posts Gallery */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {posts.map((post, idx) => (
                <div key={post.id} className="bg-[#242526] rounded-lg shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPost({ ...post, idx })}>
                  {post.image && (
                    <img src={post.image} alt="Post" className="w-full h-60 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {post.user?.photoURL ? (
                        <img src={post.user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {post.user?.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <span className="text-white font-medium">{post.user?.displayName}</span>
                    </div>
                    <div className="text-gray-200">{post.text}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Photo Modal for Like, Comment, Share */}
            {selectedPost && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setSelectedPost(null)}>
                <div className="bg-[#23272A] rounded-xl p-8 relative flex flex-col md:flex-row max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                  {/* Photo Section */}
                  <div className="md:w-3/5 flex items-center justify-center">
                    <img src={selectedPost.image} alt="Post" className="max-h-[70vh] rounded-lg object-contain" />
                  </div>
                  {/* Content Section */}
                  <div className="md:w-2/5 p-6 flex flex-col h-full max-h-[80vh] overflow-y-auto">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      {selectedPost.user?.photoURL ? (
                        <img src={selectedPost.user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {selectedPost.user?.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">{selectedPost.user?.displayName}</div>
                        <div className="text-gray-400 text-xs">
                          {/* Show date if available */}
                          {selectedPost.createdAt?.toDate ? selectedPost.createdAt.toDate().toLocaleDateString() : ""}
                        </div>
                      </div>
                    </div>
                    {/* Caption */}
                    <div className="mb-6 text-gray-200 text-lg font-semibold">{selectedPost.text}</div>
                    {/* Interaction Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{selectedPost.likes?.length || 0} likes</span>
                      <span>{selectedPost.comments?.length || 0} comments</span>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                      <button 
                        className={`flex items-center gap-2 ${
                          selectedPost.likes?.includes(user.uid) ? 'text-pink-500' : 'text-pink-400 hover:text-pink-300'
                        }`}
                        onClick={() => handleLike(selectedPost.id)}
                      >
                        <span className="text-xl">♥</span> 
                        {selectedPost.likes?.includes(user.uid) ? 'Liked' : 'Like'}
                      </button>
                      <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                        <span className="text-xl">💬</span> Comment
                      </button>
                      <button
                        className="flex items-center gap-2 text-green-400 hover:text-green-300"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'Grouppy Post',
                              text: selectedPost.text,
                              url: window.location.href
                            });
                          } else {
                            alert('Share not supported on this browser.');
                          }
                        }}
                      >
                        <span className="text-xl">↗</span> Share
                      </button>
                    </div>
                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto mb-4">
                      <h4 className="text-white font-medium mb-3">Comments</h4>
                      {selectedPost.comments?.length > 0 ? (
                        <div className="space-y-3">
                          {selectedPost.comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-2">
                              {comment.photoURL ? (
                                <img src={comment.photoURL} alt="Profile" className="w-8 h-8 rounded-full flex-shrink-0" />
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0">
                                    {comment.user?.charAt(0) || "U"}
                                  </div>
                                </>
                              )}
                              <div className="bg-[#3A3B3C] p-2 rounded-lg flex-1">
                                <div className="text-sm font-medium">{comment.user}</div>
                                <div className="text-sm">{comment.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No comments yet. Be the first to comment!</div>
                      )}
                    </div>
                    {/* Add Comment */}
                    <div className="mt-auto">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="flex-1 bg-[#3A3B3C] rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button 
                          className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700"
                          onClick={() => handleAddComment(selectedPost.id)}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Close Button */}
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl z-10"
                    onClick={() => setSelectedPost(null)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {/* Right Sidebar */}
      <aside className="w-80 bg-[#23272A] border-l border-gray-800 px-6 py-8 flex flex-col gap-8 min-h-screen">
        {/* Upcoming Events */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-white">Upcoming events</h3>
          <ul className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="bg-[#18191A] rounded p-2 flex flex-col">
                <span className="font-semibold">{e.title}</span>
                <span className="text-xs text-gray-400">{e.date}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Special Moments */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-white">Special Moments</h3>
          <ul className="space-y-2">
            {specialMoments.map((m, i) => (
              <li key={i} className="bg-[#18191A] rounded p-2">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-gray-400">{m.date} - {m.desc}</div>
              </li>
            ))}
          </ul>
        </div>
        {/* Group Memories */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-white">Group memories</h3>
          <ul className="space-y-1">
            {groupMemories.map((g, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Shared Moments */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-white">Shared moments</h3>
          <ul className="space-y-1">
            {sharedMoments.map((g, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Shared Experiences */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-white">Shared experiences</h3>
          <ul className="space-y-1">
            {sharedExperiences.map((g, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={user ? <Home user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={user ? <Profile user={user} /> : <Navigate to="/login" replace />}
        />
      </Routes>
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

export default App;
