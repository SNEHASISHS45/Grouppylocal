import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import Cropper from 'react-easy-crop';
import { FiImage, FiX, FiSliders, FiSave, FiRotateCw, FiZoomIn, FiClock, FiUsers, FiFolder } from 'react-icons/fi';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import { MdOutlineLocationOn, MdOutlineTag, MdFormatQuote } from 'react-icons/md';
import { BiBold, BiItalic, BiUnderline, BiListUl, BiListOl } from 'react-icons/bi';
import { Slider, Button, IconButton, Tooltip, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';

// Cloudinary configuration - make sure these are correct
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Check this value in your Cloudinary settings
const CLOUDINARY_CLOUD_NAME = 'dzn369qpk';

// Post categories
const POST_CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'announcement', name: 'Announcement' },
  { id: 'event', name: 'Event' },
  { id: 'question', name: 'Question' },
  { id: 'discussion', name: 'Discussion' },
  { id: 'media', name: 'Media' },
];

// Audience options
const AUDIENCE_OPTIONS = [
  { id: 'public', name: 'Public', icon: <FiUsers /> },
  { id: 'friends', name: 'Friends Only', icon: <FiUsers /> },
  { id: 'private', name: 'Private', icon: <FiUsers /> },
];

export default function CreatePost({ user }) {
  // Basic post data
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  // Group selection
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // New features
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [audience, setAudience] = useState('public');
  const [category, setCategory] = useState('general');
  const [draftId, setDraftId] = useState(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef(null);
  const textEditorRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      
      try {
        const groupsCollection = collection(db, "groups");
        const groupsSnapshot = await getDocs(groupsCollection);
        const groupsList = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGroups(groupsList);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };
    
    fetchGroups();
  }, [user]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use a free geocoding service
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
              setLocation(data.display_name);
            }
          } catch (error) {
            console.error("Error fetching location:", error);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const saveDraft = async () => {
    if (!user) return;
    
    try {
      const currentDraftId = draftId || uuidv4();
      
      // Save to Firestore - make sure the structure matches your security rules
      await setDoc(doc(db, 'users', user.uid, 'drafts', currentDraftId), {
        text: postText || "",
        hasImage: !!postImage,
        location: location || "",
        tags: tags || [],
        audience: audience || "public",
        category: category || "general",
        updatedAt: serverTimestamp(),
      });
      
      if (!draftId) {
        setDraftId(currentDraftId);
      }
      
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setPostText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText && !postImage) return;
    
    setIsLoading(true);
    try {
      let imageUrl = '';
      if (postImage) {
        const formData = new FormData();
        formData.append('file', postImage);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `grouppy/posts/${user.uid}`);
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        imageUrl = data.secure_url;
      }

      const postData = {
        text: postText || "",
        image: imageUrl || null, // Ensure this is never undefined
        createdAt: isScheduled ? new Date(scheduledDate) : serverTimestamp(),
        scheduledFor: isScheduled ? new Date(scheduledDate) : null,
        isScheduled: isScheduled || false,
        user: {
          uid: user.uid,
          displayName: user.displayName || "",
          photoURL: user.photoURL || ""
        },
        likes: [],
        location: location || "",
        tags: tags || [],
        audience: audience || "public",
        category: category || "general",
        commentCount: 0
      };
      
      // Add group-specific data if posting to a group
      if (audience === 'group' && selectedGroup) {
        postData.groupId = selectedGroup;
        
        // Get group info if available
        try {
          const groupDoc = await getDoc(doc(db, "groups", selectedGroup));
          if (groupDoc.exists()) {
            postData.groupName = groupDoc.data().name || "";
          }
        } catch (error) {
          console.error('Error fetching group info:', error);
        }
      }

      await addDoc(collection(db, 'posts'), postData);

      // If this was a draft, delete it
      if (draftId) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'drafts', draftId), { deleted: true }, { merge: true });
        } catch (error) {
          console.error('Error deleting draft:', error);
        }
      }

      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18191a] to-[#232526] p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#242526] rounded-xl shadow-xl p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Create New Post</h1>
          {isDraftSaved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-green-400 text-sm"
            >
              Draft saved
            </motion.div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category & Audience Selection */}
          <div className="flex flex-wrap gap-4">
            <FormControl size="small" className="min-w-[120px]">
              <InputLabel id="category-label" className="text-gray-300">Category</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#3a3b3c] text-white"
                label="Category"
              >
                {POST_CATEGORIES.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" className="min-w-[150px]">
              <InputLabel id="audience-label" className="text-gray-300">Audience</InputLabel>
              <Select
                labelId="audience-label"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="bg-[#3a3b3c] text-white"
                label="Audience"
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <MenuItem key={opt.id} value={opt.id}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.name}</span>
                    </div>
                  </MenuItem>
                ))}
                <MenuItem value="group" className="flex items-center gap-2">
                  <FiUsers />
                  <span>Specific Group</span>
                </MenuItem>
              </Select>
            </FormControl>

            {audience === 'group' && (
              <FormControl size="small" className="min-w-[150px]">
                <InputLabel id="group-label" className="text-gray-300">Select Group</InputLabel>
                <Select
                  labelId="group-label"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="bg-[#3a3b3c] text-white"
                  label="Select Group"
                >
                  {groups.map(group => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name || 'Unnamed Group'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>
          
          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textEditorRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 bg-[#3a3b3c] text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <HiOutlineEmojiHappy size={24} />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 z-10"
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="contained"
                component="label"
                startIcon={<FiImage />}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </Button>
              {imagePreview && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FiX />}
                  onClick={() => {
                    setImagePreview(null);
                    setPostImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>

            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#3a3b3c] rounded-lg p-3 flex items-center">
              <MdOutlineLocationOn className="text-gray-400" size={20} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="bg-transparent text-white focus:outline-none flex-1 ml-2"
              />
            </div>
            <Button
              variant="contained"
              size="small"
              onClick={detectLocation}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Detecting..." : "Auto-detect"}
            </Button>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#3a3b3c] rounded-lg p-3">
              <MdOutlineTag className="text-gray-400" size={20} />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tags"
                className="bg-transparent text-white focus:outline-none flex-1"
              />
              <Button
                size="small"
                onClick={addTag}
                disabled={!tagInput}
                className="text-purple-500 hover:text-purple-400"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-300 hover:text-purple-200"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Post */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="schedule-post"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="schedule-post" className="text-white flex items-center gap-1">
                <FiClock />
                Schedule Post
              </label>
            </div>
          </div>

          {isScheduled && (
            <div className="mb-4 w-full">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Schedule Post"
                  value={scheduledDate}
                  onChange={(newValue) => setScheduledDate(newValue)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      variant: "outlined",
                      className: "bg-[#3a3b3c] text-white rounded-lg" 
                    } 
                  }}
                />
              </LocalizationProvider>
            </div>
          )}

          {/* Preview Toggle Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowPreview(!showPreview)}
              startIcon={showPreview ? <FiX /> : <FiSave />}
              className="mr-2"
            >
              {showPreview ? "Close Preview" : "Preview Post"}
            </Button>
          </div>

          {/* Post Preview */}
          {showPreview && (
            <div className="bg-[#1a1b1d] rounded-xl shadow-lg overflow-hidden mb-6 p-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={user?.photoURL || "https://via.placeholder.com/40"} 
                  alt={user?.displayName || "User"} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-white">{user?.displayName || "User"}</h3>
                  {location && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <MdOutlineLocationOn size={14} />
                      {location}
                    </p>
                  )}
                </div>
              </div>
              
              <div 
                className="mb-4 whitespace-pre-wrap text-white"
                dangerouslySetInnerHTML={{ 
                  __html: postText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/__(.*?)__/g, '<u>$1</u>')
                    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
                    .replace(/^• (.*)$/gm, '<li>$1</li>')
                    .replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>')
                    .replace(/<li>/g, '<ul><li>')
                    .replace(/<\/li>/g, '</li></ul>')
                    .replace(/<\/ul><ul>/g, '')
                }}
              />
              
              {/* Rest of preview content */}
              {imagePreview && (
                <div className="rounded-lg overflow-hidden mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Post preview" 
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-purple-600/30 text-white px-2 py-0.5 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-400 mt-2">
                <span className="mr-3">Category: {POST_CATEGORIES.find(c => c.id === category)?.name}</span>
                <span>Audience: {audience === 'group' ? `Group: ${groups.find(g => g.id === selectedGroup)?.name || 'Selected Group'}` : AUDIENCE_OPTIONS.find(a => a.id === audience)?.name}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between">
            <Button
              variant="outlined"
              color="primary"
              onClick={saveDraft}
              startIcon={<FiSave />}
              disabled={isLoading}
            >
              Save Draft
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading || (!postText && !postImage)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // Add state for formatting
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  // Add text formatting functions
  const applyFormatting = (format) => {
    if (!textEditorRef.current) return;
    
    const textarea = textEditorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postText.substring(start, end);
    
    let formattedText = '';
    let cursorPosition = end;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPosition = end + 4;
        setIsBold(!isBold);
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorPosition = end + 2;
        setIsItalic(!isItalic);
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        cursorPosition = end + 4;
        setIsUnderline(!isUnderline);
        break;
      case 'list-ul':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'list-ol':
        formattedText = selectedText.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n');
        break;
      case 'quote':
        formattedText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
        break;
      default:
        return;
    }
    
    const newText = postText.substring(0, start) + formattedText + postText.substring(end);
    setPostText(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18191a] to-[#232526] p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#242526] rounded-xl shadow-xl p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Create New Post</h1>
          {isDraftSaved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-green-400 text-sm"
            >
              Draft saved
            </motion.div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category & Audience Selection */}
          <div className="flex flex-wrap gap-4">
            <FormControl size="small" className="min-w-[120px]">
              <InputLabel id="category-label" className="text-gray-300">Category</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#3a3b3c] text-white"
                label="Category"
              >
                {POST_CATEGORIES.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" className="min-w-[150px]">
              <InputLabel id="audience-label" className="text-gray-300">Audience</InputLabel>
              <Select
                labelId="audience-label"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="bg-[#3a3b3c] text-white"
                label="Audience"
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <MenuItem key={opt.id} value={opt.id}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.name}</span>
                    </div>
                  </MenuItem>
                ))}
                <MenuItem value="group" className="flex items-center gap-2">
                  <FiUsers />
                  <span>Specific Group</span>
                </MenuItem>
              </Select>
            </FormControl>

            {audience === 'group' && (
              <FormControl size="small" className="min-w-[150px]">
                <InputLabel id="group-label" className="text-gray-300">Select Group</InputLabel>
                <Select
                  labelId="group-label"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="bg-[#3a3b3c] text-white"
                  label="Select Group"
                >
                  {groups.map(group => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name || 'Unnamed Group'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>
          
          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textEditorRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 bg-[#3a3b3c] text-white rounded-b-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <HiOutlineEmojiHappy size={24} />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 z-10"
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="contained"
                component="label"
                startIcon={<FiImage />}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </Button>
              {imagePreview && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FiX />}
                  onClick={() => {
                    setImagePreview(null);
                    setPostImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>

            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#3a3b3c] rounded-lg p-3 flex items-center">
              <MdOutlineLocationOn className="text-gray-400" size={20} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="bg-transparent text-white focus:outline-none flex-1 ml-2"
              />
            </div>
            <Button
              variant="contained"
              size="small"
              onClick={detectLocation}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Detecting..." : "Auto-detect"}
            </Button>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#3a3b3c] rounded-lg p-3">
              <MdOutlineTag className="text-gray-400" size={20} />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tags"
                className="bg-transparent text-white focus:outline-none flex-1"
              />
              <Button
                size="small"
                onClick={addTag}
                disabled={!tagInput}
                className="text-purple-500 hover:text-purple-400"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-300 hover:text-purple-200"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Post */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="schedule-post"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="schedule-post" className="text-white flex items-center gap-1">
                <FiClock />
                Schedule Post
              </label>
            </div>
          </div>

          {isScheduled && (
            <div className="mb-4 w-full">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Schedule Post"
                  value={scheduledDate}
                  onChange={(newValue) => setScheduledDate(newValue)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      variant: "outlined",
                      className: "bg-[#3a3b3c] text-white rounded-lg" 
                    } 
                  }}
                />
              </LocalizationProvider>
            </div>
          )}

          {/* Preview Toggle Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowPreview(!showPreview)}
              startIcon={showPreview ? <FiX /> : <FiSave />}
              className="mr-2"
            >
              {showPreview ? "Close Preview" : "Preview Post"}
            </Button>
          </div>

          {/* Post Preview */}
          {showPreview && (
            <div className="bg-[#1a1b1d] rounded-xl shadow-lg overflow-hidden mb-6 p-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={user?.photoURL || "https://via.placeholder.com/40"} 
                  alt={user?.displayName || "User"} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-white">{user?.displayName || "User"}</h3>
                  {location && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <MdOutlineLocationOn size={14} />
                      {location}
                    </p>
                  )}
                </div>
              </div>
              
              <div 
                className="mb-4 whitespace-pre-wrap text-white"
                dangerouslySetInnerHTML={{ 
                  __html: postText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/__(.*?)__/g, '<u>$1</u>')
                    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
                    .replace(/^• (.*)$/gm, '<li>$1</li>')
                    .replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>')
                    .replace(/<li>/g, '<ul><li>')
                    .replace(/<\/li>/g, '</li></ul>')
                    .replace(/<\/ul><ul>/g, '')
                }}
              />
              
              {/* Rest of preview content */}
              {imagePreview && (
                <div className="rounded-lg overflow-hidden mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Post preview" 
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-purple-600/30 text-white px-2 py-0.5 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-400 mt-2">
                <span className="mr-3">Category: {POST_CATEGORIES.find(c => c.id === category)?.name}</span>
                <span>Audience: {audience === 'group' ? `Group: ${groups.find(g => g.id === selectedGroup)?.name || 'Selected Group'}` : AUDIENCE_OPTIONS.find(a => a.id === audience)?.name}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between">
            <Button
              variant="outlined"
              color="primary"
              onClick={saveDraft}
              startIcon={<FiSave />}
              disabled={isLoading}
            >
              Save Draft
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading || (!postText && !postImage)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}