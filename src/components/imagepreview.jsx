export default function ImagePreview({ src, alt }) {
  return (
    <div className="relative group">
      <img 
        src={src} 
        alt={alt}
        className="rounded-lg object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
    </div>
  );
}