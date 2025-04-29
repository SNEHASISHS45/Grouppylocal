import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function Profile({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle profile picture upload (to Cloudinary)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default"); // Replace with your Cloudinary preset
      const res = await fetch("https://api.cloudinary.com/v1_1/dzn369qpk/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPhotoURL(data.secure_url);
      setMessage("Photo uploaded! Click 'Update Profile' to save.");
    } catch (err) {
      setMessage("Failed to upload photo.");
    }
    setUploading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 bg-white/10 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Profile Settings</h2>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="photo-upload" className="cursor-pointer">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-indigo-500 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {displayName?.charAt(0) || "U"}
              </div>
            )}
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
          <span className="text-indigo-300 text-xs">
            Click image to upload new photo
          </span>
        </div>
        <label className="text-white">
          Display Name:
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded mt-1"
          />
        </label>
        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Update Profile"}
        </button>
      </form>
      {message && <p className="mt-4 text-white">{message}</p>}
    </div>
  );
}