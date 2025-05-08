import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaEllipsisH, FaTrash, FaFlag, FaCopy, FaReply } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import TimeAgo from 'react-timeago';
import { FaSmile, FaThumbsUp, FaLaugh, FaSurprise, FaSadTear, FaAngry } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import ProgressiveImage from './ProgressiveImage';
import ImageZoomModal from './ImageZoomModal';

export default function EnhancedPost({ post, currentUser, onCommentClick, onShare }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const [reactions, setReactions] = useState(post.reactions || {});
  const [showReactions, setShowReactions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [showCommentReactions, setShowCommentReactions] = useState(null);
  const [isDoubleTapped, setIsDoubleTapped] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const commentInputRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const replyInputRef = useRef(null);

  // Animation for like button
  const likeAnimation = useSpring({
    transform: liked ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  });
  
  // Double tap animation for liking posts
  const doubleTapAnimation = useSpring({
    opacity: isDoubleTapped ? 1 : 0,
    transform: isDoubleTapped ? 'scale(1)' : 'scale(0.5)',
    config: { tension: 300, friction: 10 }
  });
  
  // Handle double tap to like
  const handleDoubleTap = () => {
    if (!liked) {
      setIsDoubleTapped(true);
      handleLike();
      setTimeout(() => setIsDoubleTapped(false), 1000);
    }
  };
  
  // Image zoom gesture handler
  const bindGestures = useGesture({
    onPinch: ({ offset: [scale] }) => {
      setPinchScale(scale < 1 ? 1 : scale > 3 ? 3 : scale);
    },
    onPinchEnd: () => {
      setIsZoomed(pinchScale > 1.2);
      if (pinchScale < 1.2) setPinchScale(1);
    }
  });

  // Check if post is saved and if user has liked the post
  useEffect(() => {
    const checkSavedAndLiked = async () => {
      try {
        // Check if post is saved
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setSaved(userDoc.exists() && (userDoc.data().savedPosts || []).includes(post.id));
        
        // Check if post is liked by current user
        setLiked(post.likes?.includes(currentUser.uid) || false);
      } catch (error) {
        console.error("Error checking saved/liked status:", error);
      }
    };
    
    if (currentUser && post.id) {
      checkSavedAndLiked();
    }
  }, [currentUser, post.id, post.likes]);

  // Fetch comments from Firestore
  useEffect(() => {
    if (!post.id) return;
    
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        replies: []
      }));
      setComments(commentsData);
      
      // Initialize showReplies state for each comment
      const repliesState = {};
      commentsData.forEach(comment => {
        repliesState[comment.id] = false;
      });
      setShowReplies(prev => ({...prev, ...repliesState}));
      
      // Fetch replies for each comment
      commentsData.forEach(comment => {
        fetchReplies(comment.id);
      });
    });
    
    return () => unsubscribe();
  }, [post.id]);
  
  // Fetch replies for a specific comment
  const fetchReplies = (commentId) => {
    const repliesRef = collection(db, 'posts', post.id, 'comments', commentId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    
    onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? {...comment, replies: repliesData} 
            : comment
        )
      );
    });
  };
  
  // Fetch comment reactions
  useEffect(() => {
    if (!post.id) return;
    
    const reactionsRef = collection(db, 'posts', post.id, 'commentReactions');
    
    const unsubscribe = onSnapshot(reactionsRef, (snapshot) => {
      const reactionsData = {};
      
      snapshot.docs.forEach(doc => {
        reactionsData[doc.id] = doc.data();
      });
      
      setCommentReactions(reactionsData);
    });
    
    return () => unsubscribe();
  }, [post.id]);

  // Fetch reactions from Firestore
  useEffect(() => {
    if (!post.id) return;
    
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setReactions(doc.data().reactions || {});
      }
    });
    
    return () => unsubscribe();
  }, [post.id]);

  // Handle like functionality with animation
  const handleLike = async () => {
    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (liked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Add notification for the post owner if it's not the current user
        if (post.user.uid !== currentUser.uid) {
          const notificationRef = collection(db, 'users', post.user.uid, 'notifications');
          await addDoc(notificationRef, {
            type: 'like',
            postId: post.id,
            from: {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL
            },
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

  // Handle save functionality
  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (saved) {
        await updateDoc(userRef, { savedPosts: arrayRemove(post.id) });
        setSaved(false);
      } else {
        await updateDoc(userRef, { savedPosts: arrayUnion(post.id) });
        setSaved(true);
      }
    } catch (error) {
      console.error("Error updating saved status:", error);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setShowOptions(false);
    } catch (err) {
      alert('Failed to delete post.');
    }
    setDeleting(false);
  };

  // Handle report post
  const handleReport = async () => {
    await addDoc(collection(db, 'reports'), {
      postId: post.id,
      reportedBy: currentUser.uid,
      createdAt: serverTimestamp(),
      reason: 'User reported this post'
    });
    setShowOptions(false);
    alert('Post reported. Thank you for your feedback!');
  };

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    setShowOptions(false);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      // Check if user is authenticated
      if (!currentUser || !currentUser.uid) {
        throw new Error("You must be logged in to comment");
      }
      
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      
      // Add the comment
      const newComment = {
        text: comment,
        user: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous',
          photoURL: currentUser.photoURL || '/default-avatar.png'
        },
        createdAt: serverTimestamp(),
        replyCount: 0
      };
      
      await addDoc(commentsRef, newComment);
      
      // Clear comment input after posting
      setComment('');
      
      // Add notification for post owner if it's not the current user
      if (post.user && post.user.uid && post.user.uid !== currentUser.uid) {
        try {
          const notificationRef = collection(db, 'users', post.user.uid, 'notifications');
          await addDoc(notificationRef, {
            type: 'comment',
            postId: post.id,
            from: {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Anonymous',
              photoURL: currentUser.photoURL || '/default-avatar.png'
            },
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Unable to add comment: " + error.message);
    }
  };

  // Add reply to comment
  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;
    
    try {
      const repliesRef = collection(db, 'posts', post.id, 'comments', commentId, 'replies');
      
      // Add the reply
      const newReply = {
        text: replyText,
        user: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous',
          photoURL: currentUser.photoURL || '/default-avatar.png'
        },
        createdAt: serverTimestamp()
      };
      
      await addDoc(repliesRef, newReply);
      
      // Update reply count on the parent comment
      const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (commentDoc.exists()) {
        const currentCount = commentDoc.data().replyCount || 0;
        await updateDoc(commentRef, { replyCount: currentCount + 1 });
      }
      
      // Clear reply input and reset state
      setReplyText('');
      setReplyingTo(null);
      
      // Make sure replies are shown for this comment
      setShowReplies(prev => ({...prev, [commentId]: true}));
      
      // Add notification for comment owner if it's not the current user
      const commentData = comments.find(c => c.id === commentId);
      if (commentData && commentData.user.uid !== currentUser.uid) {
        try {
          const notificationRef = collection(db, 'users', commentData.user.uid, 'notifications');
          await addDoc(notificationRef, {
            type: 'reply',
            postId: post.id,
            commentId: commentId,
            from: {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Anonymous',
              photoURL: currentUser.photoURL || '/default-avatar.png'
            },
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
        }
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Unable to add reply: " + error.message);
    }
  };

  // Handle reaction to comment
  const handleCommentReaction = async (commentId, emoji) => {
    try {
      const reactionRef = doc(db, 'posts', post.id, 'commentReactions', commentId);
      const reactionDoc = await getDoc(reactionRef);
      
      let updatedReactions = {};
      
      if (reactionDoc.exists()) {
        updatedReactions = {...reactionDoc.data()};
      }
      
      // Toggle user's reaction
      if (updatedReactions[currentUser.uid] === emoji) {
        // Remove reaction if clicking the same emoji
        delete updatedReactions[currentUser.uid];
      } else {
        // Set new reaction
        updatedReactions[currentUser.uid] = emoji;
      }
      
      // Update or set the document
      await updateDoc(reactionRef, updatedReactions);
      
      // Hide reaction picker
      setShowCommentReactions(null);
    } catch (error) {
      console.error("Error updating comment reaction:", error);
    }
  };

  // Handle post reaction
  const handleReaction = async (emoji) => {
    try {
      const postRef = doc(db, 'posts', post.id);
      const userReactions = { ...(reactions[currentUser.uid] || {}) };
      
      // Toggle the reaction
      if (userReactions[emoji]) {
        delete userReactions[emoji];
      } else {
        userReactions[emoji] = true;
      }
      
      // Update the reactions in Firestore
      const updatedReactions = { ...reactions };
      
      if (Object.keys(userReactions).length === 0) {
        delete updatedReactions[currentUser.uid];
      } else {
        updatedReactions[currentUser.uid] = userReactions;
      }
      
      await updateDoc(postRef, { reactions: updatedReactions });
      setShowReactions(false);
    } catch (error) {
      console.error("Error updating post reaction:", error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await deleteDoc(doc(db, 'posts', post.id, 'comments', commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment.");
    }
  };

  // Delete reply
  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      await deleteDoc(doc(db, 'posts', post.id, 'comments', commentId, 'replies', replyId));
      
      // Update reply count on the parent comment
      const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (commentDoc.exists()) {
        const currentCount = commentDoc.data().replyCount || 0;
        if (currentCount > 0) {
          await updateDoc(commentRef, { replyCount: currentCount - 1 });
        }
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Failed to delete reply.");
    }
  };

  // Check if text is long and needs to be truncated
  const isLongText = post.text && post.text.length > 150;
  const displayText = isLongText && !isExpanded
    ? post.text.substring(0, 150) + '...'
    : post.text;

  // Get total reactions count for a comment
  const getCommentReactionsCount = (commentId) => {
    const reactions = commentReactions[commentId] || {};
    return Object.keys(reactions).length;
  };

  // Get user's reaction to a comment
  const getUserCommentReaction = (commentId) => {
    const reactions = commentReactions[commentId] || {};
    return reactions[currentUser.uid];
  };

  // Format reactions for display
  const formatReactions = (reactionsObj) => {
    const counts = {};
    
    // Count each reaction type
    Object.values(reactionsObj).forEach(reaction => {
      Object.keys(reaction).forEach(emoji => {
        counts[emoji] = (counts[emoji] || 0) + 1;
      });
    });
    
    return counts;
  };

  // Get emoji icon component
  const getEmojiIcon = (emoji, size = 16) => {
    switch(emoji) {
      case 'like': return <FaThumbsUp size={size} className="text-blue-500" />;
      case 'love': return <FaHeart size={size} className="text-red-500" />;
      case 'haha': return <FaLaugh size={size} className="text-yellow-500" />;
      case 'wow': return <FaSurprise size={size} className="text-yellow-500" />;
      case 'sad': return <FaSadTear size={size} className="text-yellow-500" />;
      case 'angry': return <FaAngry size={size} className="text-orange-500" />;
      default: return <FaThumbsUp size={size} className="text-blue-500" />;
    }
  };

  // New side-by-side layout with enhanced UI
  return (
    <div className="flex flex-col md:flex-row w-full max-h-[90vh] bg-[#1a1b1d] rounded-xl overflow-hidden shadow-2xl">
      {/* Left side - Image with enhanced interactions */}
      <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative overflow-auto">
        <motion.div 
          className="relative w-full h-full flex items-center justify-center p-2"
          onDoubleClick={handleDoubleTap}
          {...bindGestures()}
        >
          <ProgressiveImage 
            src={post.image} 
            alt="Post" 
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
            style={{ 
              transform: isZoomed ? `scale(${pinchScale})` : 'scale(1)',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (isZoomed) {
                setPinchScale(1);
                setIsZoomed(false);
              } else {
                setShowFullScreenImage(true);
              }
            }}
          />
          
          {/* Heart animation on double tap */}
          <animated.div 
            style={doubleTapAnimation} 
            className="absolute pointer-events-none"
          >
            <FaHeart size={80} className="text-pink-500 drop-shadow-lg" />
          </animated.div>
        </motion.div>
      </div>
      
      {/* Right side - Content */}
      <div className="w-full md:w-2/5 flex flex-col h-[90vh] overflow-hidden bg-gradient-to-b from-[#1e1f23] to-[#18191c]">
        {/* Post header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1e1f23] shadow-md">
          <div className="flex items-center gap-3">
            <motion.img 
              src={post.user?.photoURL || '/default-avatar.png'} 
              alt={post.user?.displayName || 'User'} 
              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-lg"
              whileHover={{ scale: 1.1 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <div>
              <h3 className="font-semibold text-white text-base">{post.user?.displayName || 'Anonymous'}</h3>
              <p className="text-xs text-gray-400">
                {post.createdAt ? <TimeAgo date={new Date(post.createdAt.seconds * 1000)} /> : 'Recently'}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <motion.button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaEllipsisH />
            </motion.button>
            
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-[#2d2e32] rounded-lg shadow-xl z-10 py-1 border border-gray-700"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentUser.uid === post.user?.uid && (
                    <motion.button 
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                      whileHover={{ backgroundColor: '#3a3b40' }}
                    >
                      <FaTrash size={14} /> {deleting ? 'Deleting...' : 'Delete Post'}
                    </motion.button>
                  )}
                  <motion.button 
                    onClick={handleReport}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                    whileHover={{ backgroundColor: '#3a3b40' }}
                  >
                    <FaFlag size={14} /> Report Post
                  </motion.button>
                  <motion.button 
                    onClick={handleCopyLink}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                    whileHover={{ backgroundColor: '#3a3b40' }}
                  >
                    <FaCopy size={14} /> {copied ? 'Copied!' : 'Copy Link'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Post content */}
        {post.text && (
          <div className="p-4 border-b border-gray-800">
            <p className="text-gray-200 leading-relaxed">
              {displayText}
              {isLongText && (
                <motion.button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-1 text-purple-400 hover:text-purple-300 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </motion.button>
              )}
            </p>
          </div>
        )}
        
        {/* Post actions */}
        <div className="p-4 border-b border-gray-800 flex justify-between">
          <div className="flex gap-4">
            <div className="relative">
              <animated.button 
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-300 hover:text-pink-500 transition-colors"
                style={likeAnimation}
              >
                {liked ? <FaHeart className="text-pink-500" /> : <FaRegHeart />}
                <span>{likeCount}</span>
              </animated.button>
              
              <motion.button
                onClick={() => setShowReactions(!showReactions)}
                className="absolute -top-8 left-0 text-xs text-gray-400 hover:text-gray-300"
                whileHover={{ scale: 1.1 }}
              >
                <FaSmile />
              </motion.button>
              
              <AnimatePresence>
                {showReactions && (
                  <motion.div 
                    className="absolute -top-16 left-0 bg-[#2d2e32] rounded-full shadow-xl p-2 flex gap-2 z-10 border border-gray-700"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <motion.button 
                      onClick={() => handleReaction('like')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaThumbsUp className="text-blue-500" />
                    </motion.button>
                    <motion.button 
                      onClick={() => handleReaction('love')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaHeart className="text-red-500" />
                    </motion.button>
                    <motion.button 
                      onClick={() => handleReaction('haha')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaLaugh className="text-yellow-500" />
                    </motion.button>
                    <motion.button 
                      onClick={() => handleReaction('wow')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaSurprise className="text-yellow-500" />
                    </motion.button>
                    <motion.button 
                      onClick={() => handleReaction('sad')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaSadTear className="text-yellow-500" />
                    </motion.button>
                    <motion.button 
                      onClick={() => handleReaction('angry')}
                      className="p-2 hover:bg-gray-700 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaAngry className="text-orange-500" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors"
            >
              <FaComment />
              <span>{comments.length}</span>
            </button>
          </div>
          
          <div className="flex gap-4">
            <motion.button 
              onClick={onShare || handleCopyLink}
              className="text-gray-300 hover:text-green-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaShare />
            </motion.button>
            
            <motion.button 
              onClick={handleSave}
              className="text-gray-300 hover:text-yellow-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {saved ? <FaBookmark className="text-yellow-400" /> : <FaRegBookmark />}
            </motion.button>
          </div>
        </div>
        
        {/* Reactions summary */}
        {Object.keys(reactions).length > 0 && (
          <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2">
            <div className="flex -space-x-1">
              {Object.entries(formatReactions(reactions)).slice(0, 3).map(([emoji, count]) => (
                <div key={emoji} className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                  {getEmojiIcon(emoji, 12)}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {Object.values(reactions).length} {Object.values(reactions).length === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        )}
        
        {/* Comments section */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900" ref={commentsContainerRef}>
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-4">Comments ({comments.length})</h4>
                
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={comment.user?.photoURL || '/default-avatar.png'} 
                            alt={comment.user?.displayName || 'User'} 
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className="bg-[#2d2e32] rounded-lg p-3 flex-1 relative group">
                            <div className="flex justify-between items-start">
                              <h5 className="font-semibold text-sm text-white">{comment.user?.displayName || 'Anonymous'}</h5>
                              {comment.createdAt && (
                                <span className="text-xs text-gray-400">
                                  <TimeAgo date={new Date(comment.createdAt.seconds * 1000)} />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-200 mt-1">{comment.text}</p>
                            
                            {/* Comment actions */}
                            <div className="mt-2 flex items-center gap-3">
                              {/* Comment reaction button */}
                              <div className="relative">
                                <button 
                                  onClick={() => setShowCommentReactions(showCommentReactions === comment.id ? null : comment.id)}
                                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                                >
                                  {getUserCommentReaction(comment.id) ? 
                                    getEmojiIcon(getUserCommentReaction(comment.id), 14) : 
                                    <span>Like</span>
                                  }
                                </button>
                                
                                <AnimatePresence>
                                  {showCommentReactions === comment.id && (
                                    <motion.div 
                                      className="absolute -top-10 left-0 bg-[#2d2e32] rounded-full shadow-xl p-1 flex gap-1 z-10 border border-gray-700"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                      <motion.button 
                                        onClick={() => handleCommentReaction(comment.id, 'like')}
                                        className="p-1 hover:bg-gray-700 rounded-full"
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <FaThumbsUp size={12} className="text-blue-500" />
                                      </motion.button>
                                      <motion.button 
                                        onClick={() => handleCommentReaction(comment.id, 'love')}
                                        className="p-1 hover:bg-gray-700 rounded-full"
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <FaHeart size={12} className="text-red-500" />
                                      </motion.button>
                                      <motion.button 
                                        onClick={() => handleCommentReaction(comment.id, 'haha')}
                                        className="p-1 hover:bg-gray-700 rounded-full"
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <FaLaugh size={12} className="text-yellow-500" />
                                      </motion.button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              
                              {/* Reply button */}
                              <button 
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                              >
                                <FaReply size={12} /> Reply
                              </button>
                              
                              {/* Show replies button */}
                              {comment.replies && comment.replies.length > 0 && (
                                <button 
                                  onClick={() => setShowReplies(prev => ({...prev, [comment.id]: !prev[comment.id]}))}
                                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                                >
                                  {showReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </button>
                              )}
                              
                              {/* Delete comment button (only for comment owner) */}
                              {currentUser.uid === comment.user?.uid && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-red-400 hover:text-red-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </div>
                            
                            {/* Comment reactions count */}
                            {getCommentReactionsCount(comment.id) > 0 && (
                              <div className="absolute -bottom-2 right-3 bg-[#2d2e32] rounded-full px-2 py-0.5 text-xs text-gray-400 border border-gray-700 flex items-center gap-1">
                                {getEmojiIcon(Object.values(commentReactions[comment.id] || {})[0], 10)}
                                <span>{getCommentReactionsCount(comment.id)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Reply input */}
                        <AnimatePresence>
                          {replyingTo === comment.id && (
                            <motion.div 
                              className="ml-11 flex gap-2"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <img 
                                src={currentUser?.photoURL || '/default-avatar.png'} 
                                alt={currentUser?.displayName || 'User'} 
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/default-avatar.png';
                                }}
                              />
                              <div className="flex-1 flex">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to ${comment.user?.displayName || 'Anonymous'}...`}
                                  className="flex-1 bg-[#2d2e32] border border-gray-700 rounded-l-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                                  ref={replyInputRef}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleAddReply(comment.id);
                                  }}
                                />
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-r-lg text-xs transition"
                                >
                                  Reply
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Replies */}
                        <AnimatePresence>
                          {showReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                            <motion.div 
                              className="ml-11 space-y-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              {comment.replies.map(reply => (
                                <motion.div 
                                  key={reply.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2 group"
                                >
                                  <img 
                                    src={reply.user?.photoURL || '/default-avatar.png'} 
                                    alt={reply.user?.displayName || 'User'} 
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/default-avatar.png';
                                    }}
                                  />
                                  <div className="bg-[#2d2e32] rounded-lg p-2 flex-1 relative">
                                    <div className="flex justify-between items-start">
                                      <h5 className="font-semibold text-xs text-white">{reply.user?.displayName || 'Anonymous'}</h5>
                                      {reply.createdAt && (
                                        <span className="text-xs text-gray-400">
                                          <TimeAgo date={new Date(reply.createdAt.seconds * 1000)} />
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-200 mt-0.5">{reply.text}</p>
                                    
                                    {/* Delete reply button (only for reply owner) */}
                                    {currentUser.uid === reply.user?.uid && (
                                      <button 
                                        onClick={() => handleDeleteReply(comment.id, reply.id)}
                                        className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <FaTrash size={10} />
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.p 
                    className="text-center text-gray-500 my-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No comments yet. Be the first to comment!
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Comment input */}
        <div className="p-4 border-t border-gray-800 bg-[#1e1f23]">
          <div className="flex gap-3">
            <motion.img 
              src={currentUser?.photoURL || '/default-avatar.png'} 
              alt={currentUser?.displayName || 'User'} 
              className="w-8 h-8 rounded-full object-cover shadow-md"
              whileHover={{ scale: 1.1 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className="flex-1 flex">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-[#2d2e32] border border-gray-700 rounded-l-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                ref={commentInputRef}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                }}
              />
              <motion.button
                onClick={handleAddComment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg transition"
                whileHover={{ backgroundColor: '#8b5cf6' }}
                whileTap={{ scale: 0.95 }}
              >
                Post
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full screen image modal */}
      <ImageZoomModal 
        isOpen={showFullScreenImage}
        onClose={() => setShowFullScreenImage(false)}
        imageSrc={post.image}
        alt={`Post by ${post.user?.displayName || 'Anonymous'}`}
      />
    </div>
  );
}