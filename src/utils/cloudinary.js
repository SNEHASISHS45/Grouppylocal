import { Cloudinary } from '@cloudinary/url-gen';

// Create a Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: 'dzn369qpk' // Replace with your Cloudinary cloud name
  }
});

export default cld;