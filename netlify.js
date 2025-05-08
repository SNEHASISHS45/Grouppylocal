// netlify.js - Install this as a Netlify Build Plugin in the Netlify UI
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Preparing build for SPA routing...');
  },
  onBuild: () => {
    console.log('Build complete!');
  },
};