const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: 'https://grouppy.netlify.app' });
  const writeStream = createWriteStream(path.resolve(__dirname, 'public', 'sitemap.xml'));

  sitemap.pipe(writeStream);

  // Add your routes here
  sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
  sitemap.write({ url: '/GroupChat', changefreq: 'weekly', priority: 0.8 });
  sitemap.write({ url: '/explore', changefreq: 'weekly', priority: 0.8 });
  // Add more routes as needed

  sitemap.end();

  await streamToPromise(sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(console.error);