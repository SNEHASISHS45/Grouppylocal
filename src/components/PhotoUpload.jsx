import { useState } from 'react';
import { v2 as cloudinary } from 'cloudinary';

export default function PhotoUpload() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Configure Cloudinary
  cloudinary.config({ 
    cloud_name: 'dzn369qpk', 
    api_key: '274266766631951',
    api_secret: 'YOUR_API_SECRET', // Replace with your actual secret
    secure: true
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ml_default', 'dzn369qpk'); // Set your preset

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dzn369qpk/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      setImageUrl(data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <input 
        type="file" 
        onChange={handleUpload}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && <p className="text-gray-500">Uploading...</p>}
      {imageUrl && (
        <div className="mt-4">
          <img 
            src={imageUrl} 
            alt="Uploaded preview" 
            className="max-w-full h-auto rounded shadow"
          />
          <p className="mt-2 text-sm text-gray-600">Image uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}