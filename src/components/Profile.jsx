import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { FaInstagram, FaTwitter, FaFacebook, FaGlobe, FaCheckCircle, FaRegCopy, FaMapMarkerAlt, FaQrcode, FaShareAlt, FaEdit } from "react-icons/fa";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";

export default function Profile({ user }) {
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(user);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [coverPhotoURL, setCoverPhotoURL] = useState("");
  const [bio, setBio] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [editBio, setEditBio] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [socialLinks, setSocialLinks] = useState({ instagram: "", twitter: "", facebook: "", website: "" });
  const [editSocial, setEditSocial] = useState(false);
  const [socialInput, setSocialInput] = useState({ instagram: "", twitter: "", facebook: "", website: "" });
  const [location, setLocation] = useState("");
  const [editLocation, setEditLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Only allow editing for own profile
  const isOwnProfile = user.uid === (profileUser?.uid || user.uid);

  // Follow/Unfollow state
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch profile data (for self or other user)
  useEffect(() => {
    async function fetchProfileUser() {
      let uidToFetch = id || user.uid;
      if (uidToFetch !== user.uid) {
        const userDocRef = doc(db, "users", uidToFetch);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setProfileUser({ uid: uidToFetch, ...userDoc.data() });
      } else {
        setProfileUser(user);
      }
    }
    fetchProfileUser();
  }, [id, user]);

  useEffect(() => {
    async function fetchData() {
      if (!profileUser || !profileUser.uid) return;
      const userDocRef = doc(db, "users", profileUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      setDisplayName(profileUser.displayName || "");
      setBio(userData.bio || "");
      setBioInput(userData.bio || "");
      setPhotoURL(profileUser.photoURL || "");
      setCoverPhotoURL(userData.coverPhotoURL || "");
      setSocialLinks(userData.socialLinks || { instagram: "", twitter: "", facebook: "", website: "" });
      setSocialInput(userData.socialLinks || { instagram: "", twitter: "", facebook: "", website: "" });
      setLocation(userData.location || "");
      setLocationInput(userData.location || "");
      setJoinedDate(userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "");
      setIsVerified(userData.verified || false);
      const following = userData.following || [];
      setFollowingCount(following.length);

      // Following list
      if (following.length > 0) {
        const q = query(collection(db, "users"), where("uid", "in", following.slice(0, 10)));
        const snap = await getDocs(q);
        setFollowingList(snap.docs.map(d => d.data()));
      } else setFollowingList([]);

      // Followers
      const usersSnap = await getDocs(collection(db, "users"));
      let followers = [];
      usersSnap.forEach((docu) => {
        const data = docu.data();
        if ((data.following || []).includes(profileUser.uid)) followers.push(data);
      });
      setFollowersCount(followers.length);
      setFollowersList(followers);

      // Posts/photos
      const postsSnap = await getDocs(query(collection(db, "posts"), where("user.uid", "==", profileUser.uid)));
      setPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchData();
  }, [profileUser]);

  // Check if current user is following this profile
  useEffect(() => {
    if (!profileUser || !profileUser.uid || isOwnProfile) return;
    const fetchFollow = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const following = userDoc.exists() ? userDoc.data().following || [] : [];
      setIsFollowing(following.includes(profileUser.uid));
    };
    fetchFollow();
  }, [profileUser, user, isOwnProfile]);

  // Upload handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      const res = await fetch("https://api.cloudinary.com/v1_1/dzn369qpk/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setPhotoURL(data.secure_url);
      await updateDoc(doc(db, "users", user.uid), { photoURL: data.secure_url, updatedAt: new Date() });
      await updateProfile(auth.currentUser, { photoURL: data.secure_url });
      setMessage("Profile photo updated!");
    } catch (err) {
      setMessage(err.message || "Failed to upload photo.");
    }
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      const res = await fetch("https://api.cloudinary.com/v1_1/dzn369qpk/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      setCoverPhotoURL(data.secure_url);
      await updateDoc(doc(db, "users", user.uid), { coverPhotoURL: data.secure_url });
      setMessage("Cover photo updated!");
    } catch {
      setMessage("Failed to upload cover photo.");
    }
    setCoverUploading(false);
  };

  // Save bio/social/location
  const handleSaveBio = async () => {
    await updateDoc(doc(db, "users", user.uid), { bio: bioInput });
    setBio(bioInput);
    setEditBio(false);
    setMessage("Bio updated!");
  };
  const handleSaveSocial = async () => {
    await updateDoc(doc(db, "users", user.uid), { socialLinks: socialInput });
    setSocialLinks(socialInput);
    setEditSocial(false);
    setMessage("Social links updated!");
  };
  const handleSaveLocation = async () => {
    await updateDoc(doc(db, "users", user.uid), { location: locationInput });
    setLocation(locationInput);
    setEditLocation(false);
    setMessage("Location updated!");
  };

  // Follow/Unfollow handlers
  const handleFollow = async () => {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      following: arrayUnion(profileUser.uid)
    });
    setIsFollowing(true);
    setFollowersCount(prev => prev + 1);
  };

  const handleUnfollow = async () => {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      following: arrayRemove(profileUser.uid)
    });
    setIsFollowing(false);
    setFollowersCount(prev => Math.max(0, prev - 1));
  };

  // Copy profile link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setMessage("Profile link copied!");
  };

  // Share profile
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: displayName, url: window.location.href });
    } else {
      handleCopyLink();
    }
  };

  // Animations
  const fade = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 30 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#232526] to-[#414345] text-white flex flex-col items-center pb-12">
      {/* Cover Photo */}
      <motion.div className="w-full relative h-60 md:h-72 bg-[#18191a] flex items-end justify-center overflow-hidden shadow-lg"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        {coverPhotoURL && (
          <motion.img src={coverPhotoURL} alt="Cover" className="absolute inset-0 w-full h-full object-cover object-center"
            initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.2 }} />
        )}
        {isOwnProfile && (
          <label className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg cursor-pointer hover:bg-black/80 transition">
            <FaEdit className="inline mr-2" /> {coverUploading ? "Uploading..." : "Edit Cover"}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
          </label>
        )}
      </motion.div>

      {/* Profile Card */}
      <motion.div className="relative w-full max-w-2xl bg-[#23272f] rounded-2xl shadow-2xl -mt-24 z-10 p-6 flex flex-col items-center glass"
        {...fade} transition={{ duration: 0.7, delay: 0.2 }}>
        {/* Profile Photo */}
        <motion.div className="relative -mt-24 mb-2">
          <motion.img src={photoURL || "/default-avatar.png"} alt={displayName}
            className="w-36 h-36 rounded-full border-4 border-purple-500 shadow-xl object-cover bg-black"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px #a78bfa" }} />
          {isOwnProfile && (
            <label className="absolute bottom-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full cursor-pointer hover:bg-purple-700 transition text-xs">
              <FaEdit className="inline" /> {uploading ? "..." : "Edit"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </motion.div>
        {/* Name and Verification */}
        <div className="flex items-center gap-2 mt-2">
          <h2 className="text-3xl font-bold gradient-text-purple">{displayName}</h2>
          {isVerified && <FaCheckCircle className="text-blue-400" title="Verified" />}
        </div>
        {/* Username and Joined */}
        <div className="text-gray-400 text-sm mb-2">
          @{profileUser.username || profileUser.uid?.slice(0, 8)} • Joined {joinedDate}
        </div>
        {/* Follow/Unfollow Button */}
        {!isOwnProfile && (
          <div className="my-2">
            {isFollowing ? (
              <button
                className="px-6 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                onClick={handleUnfollow}
              >
                Unfollow
              </button>
            ) : (
              <button
                className="px-6 py-2 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                onClick={handleFollow}
              >
                Follow
              </button>
            )}
          </div>
        )}
        {/* Bio */}
        <div className="w-full text-center mb-3">
          {editBio ? (
            <div className="flex flex-col items-center gap-2">
              <textarea className="w-full rounded-lg p-2 bg-[#18191a] text-white" rows={2} value={bioInput} onChange={e => setBioInput(e.target.value)} />
              <div className="flex gap-2">
                <button className="bg-purple-600 px-4 py-1 rounded-lg" onClick={handleSaveBio}>Save</button>
                <button className="bg-gray-600 px-4 py-1 rounded-lg" onClick={() => setEditBio(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-2">
              <span className="text-lg">{bio || "No bio yet."}</span>
              {isOwnProfile && (
                <button className="ml-2 text-purple-400 hover:text-purple-300" onClick={() => setEditBio(true)} title="Edit bio"><FaEdit /></button>
              )}
            </div>
          )}
        </div>
        {/* Social Links */}
        <div className="flex gap-4 justify-center mb-3">
          {["instagram", "twitter", "facebook", "website"].map((key) => (
            socialLinks[key] && (
              <a key={key} href={key === "website" ? socialLinks[key] : `https://${key}.com/${socialLinks[key]}`} target="_blank" rel="noopener noreferrer"
                className="text-2xl hover:text-purple-400 transition">
                {key === "instagram" && <FaInstagram />}
                {key === "twitter" && <FaTwitter />}
                {key === "facebook" && <FaFacebook />}
                {key === "website" && <FaGlobe />}
              </a>
            )
          ))}
          {isOwnProfile && (
            <button className="ml-2 text-purple-400 hover:text-purple-300" onClick={() => setEditSocial(!editSocial)} title="Edit social"><FaEdit /></button>
          )}
        </div>
        {/* Edit Social Modal */}
        <AnimatePresence>
          {editSocial && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="bg-[#23272f] rounded-xl p-6 shadow-2xl w-full max-w-md"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                <h3 className="text-xl font-bold mb-4">Edit Social Links</h3>
                {["instagram", "twitter", "facebook", "website"].map((key) => (
                  <input key={key} className="w-full mb-2 rounded-lg p-2 bg-[#18191a] text-white"
                    placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={socialInput[key]} onChange={e => setSocialInput({ ...socialInput, [key]: e.target.value })} />
                ))}
                <div className="flex gap-2 mt-2">
                  <button className="bg-purple-600 px-4 py-1 rounded-lg" onClick={handleSaveSocial}>Save</button>
                  <button className="bg-gray-600 px-4 py-1 rounded-lg" onClick={() => setEditSocial(false)}>Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Location */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaMapMarkerAlt className="text-purple-400" />
          {editLocation ? (
            <div className="flex gap-2">
              <input className="rounded-lg p-1 bg-[#18191a] text-white" value={locationInput} onChange={e => setLocationInput(e.target.value)} />
              <button className="bg-purple-600 px-2 py-1 rounded-lg" onClick={handleSaveLocation}>Save</button>
              <button className="bg-gray-600 px-2 py-1 rounded-lg" onClick={() => setEditLocation(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <span>{location || "Unknown"}</span>
              {isOwnProfile && (
                <button className="ml-2 text-purple-400 hover:text-purple-300" onClick={() => setEditLocation(true)} title="Edit location"><FaEdit /></button>
              )}
            </>
          )}
        </div>
        {/* Follower/Following */}
        <div className="flex gap-8 justify-center mb-4">
          <button className="hover:text-purple-400 transition" onClick={() => setShowFollowers(true)}>
            <span className="font-bold text-lg">{followersCount}</span> Followers
          </button>
          <button className="hover:text-purple-400 transition" onClick={() => setShowFollowing(true)}>
            <span className="font-bold text-lg">{followingCount}</span> Following
          </button>
        </div>
        {/* QR, Copy, Share */}
        <div className="flex gap-4 justify-center mb-4">
          <button className="hover:text-purple-400 transition" onClick={() => setShowQR(true)} title="Show QR"><FaQrcode /></button>
          <button className="hover:text-purple-400 transition" onClick={handleCopyLink} title="Copy link"><FaRegCopy /></button>
          <button className="hover:text-purple-400 transition" onClick={handleShare} title="Share"><FaShareAlt /></button>
        </div>
        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div className="mb-2 px-4 py-2 rounded-lg bg-green-600/80 text-white font-semibold shadow-lg"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}>
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Posts */}
        <div className="w-full mt-6">
          <h3 className="text-xl font-bold mb-4">Posts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.length === 0 ? (
              <div className="col-span-2 md:col-span-3 text-center text-gray-400 py-8">
                No posts yet.
              </div>
            ) : (
              posts.map(post => (
                <motion.div
                  key={post.id}
                  className="relative rounded-xl overflow-hidden shadow-lg bg-[#18191a] cursor-pointer group"
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setSelectedPost(post)}
                >
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-40 object-cover group-hover:brightness-90 transition"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex items-center gap-2">
                    <img
                      src={photoURL || "/default-avatar.png"}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover"
                    />
                    <span className="text-white font-semibold text-sm truncate">{displayName}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[#23272f] rounded-xl p-6 shadow-2xl w-full max-w-md"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3 className="text-xl font-bold mb-4">Followers</h3>
              <div className="max-h-72 overflow-y-auto">
                {followersList.length === 0 ? (
                  <div className="text-gray-400">No followers yet.</div>
                ) : (
                  followersList.map(f => (
                    <div key={f.uid} className="flex items-center gap-3 mb-3">
                      <img src={f.photoURL || "/default-avatar.png"} alt={f.displayName} className="w-10 h-10 rounded-full object-cover" />
                      <span className="font-semibold">{f.displayName || f.username || f.uid.slice(0, 8)}</span>
                    </div>
                  ))
                )}
              </div>
              <button className="mt-4 bg-purple-600 px-4 py-1 rounded-lg" onClick={() => setShowFollowers(false)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following Modal */}
      <AnimatePresence>
        {showFollowing && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[#23272f] rounded-xl p-6 shadow-2xl w-full max-w-md"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3 className="text-xl font-bold mb-4">Following</h3>
              <div className="max-h-72 overflow-y-auto">
                {followingList.length === 0 ? (
                  <div className="text-gray-400">Not following anyone yet.</div>
                ) : (
                  followingList.map(f => (
                    <div key={f.uid} className="flex items-center gap-3 mb-3">
                      <img src={f.photoURL || "/default-avatar.png"} alt={f.displayName} className="w-10 h-10 rounded-full object-cover" />
                      <span className="font-semibold">{f.displayName || f.username || f.uid.slice(0, 8)}</span>
                    </div>
                  ))
                )}
              </div>
              <button className="mt-4 bg-purple-600 px-4 py-1 rounded-lg" onClick={() => setShowFollowing(false)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[#23272f] rounded-xl p-6 shadow-2xl w-full max-w-xs flex flex-col items-center"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3 className="text-xl font-bold mb-4">Scan to view profile</h3>
              <QRCode value={window.location.href} size={180} bgColor="#23272f" fgColor="#a78bfa" />
              <button className="mt-6 bg-purple-600 px-4 py-1 rounded-lg" onClick={() => setShowQR(false)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      { }
      <AnimatePresence>
        {selectedPost && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}>
            <motion.div className="bg-[#23272f] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <button className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
                onClick={() => setSelectedPost(null)}>&times;</button>
              <div className="flex items-center gap-3 mb-4">
                <img src={photoURL || "/default-avatar.png"} alt={displayName} className="w-10 h-10 rounded-full border-2 border-purple-500 object-cover" />
                <span className="font-semibold text-white text-base">{displayName}</span>
              </div>
              {selectedPost.image && (
                <img src={selectedPost.image} alt="Post" className="w-full max-h-96 object-contain rounded-xl mb-4" />
              )}
              {selectedPost.text && (
                <div className="mb-3 text-gray-100 text-[1.05rem] leading-relaxed break-words font-medium">{selectedPost.text}</div>
              )}
              <div className="flex gap-6 items-center mb-3">
                <span className="text-gray-400">{selectedPost.likes?.length || 0} Likes</span>
                <span className="text-gray-400">{selectedPost.comments?.length || 0} Comments</span>
              </div>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-2">
                {selectedPost.comments?.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <img src={c.photoURL || "/default-avatar.png"} alt={c.user} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <span className="font-semibold text-sm text-white">{c.user}</span>
                      <span className="ml-2 text-gray-300 text-sm">{c.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}