import { memo } from 'react';
import { motion } from 'framer-motion';
import { getPostDescription } from '../data/postDescriptions';
import { resizeBloggerImage } from '../utils/bloggerImages';

// Generate URL-friendly slug from post title (matches Portfolio/PortfolioPost)
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Cards are 300px+ wide, so ask Blogger for something that still looks sharp at
// 2x DPR instead of whatever small size the post happened to embed.
const CARD_IMAGE_SIZE = 'w700-h400-c';

const extractImageFromContent = (content) => {
  if (!content) return null;
  const imgMatch = content.match(/<img[^>]+src=["']([^"'>]+)["']/);
  return imgMatch?.[1] ? resizeBloggerImage(imgMatch[1], CARD_IMAGE_SIZE) : null;
};

// Fallback snippet: strip the post HTML down to plain text and truncate.
const extractExcerpt = (content, maxLength = 250) => {
  if (!content) return 'Click to read more about this project.';

  // Create a temporary DOM element to decode HTML entities
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // Get the text content (this decodes entities and strips tags)
  const text = tempDiv.textContent.replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Prefer a hand-written description; fall back to an auto-generated snippet.
const getExcerpt = (post) => {
  const manual = getPostDescription(generateSlug(post.title));
  return manual || extractExcerpt(post.content);
};

const SkeletonCard = memo(({ index }) => {
  return (
    <motion.div
      className="portfolio-card skeleton-card"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
      style={{ pointerEvents: 'none' }}
    >
      <div className="box" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '550px'
      }}>
        {/* Image at the top - fixed height matching real cards */}
        <div className="skeleton-image" style={{
          width: '100%',
          height: '200px',
          backgroundColor: 'var(--skeleton-bg, #1a1a1a)',
          borderRadius: '10px',
          marginBottom: '15px',
          flexShrink: 0
        }} />

        {/* Title skeleton bars */}
        <div style={{
          width: '100%',
          margin: '15px 0 10px 0',
          flexShrink: 0,
          display: 'block'
        }}>
          <div style={{
            width: '90%',
            height: '20px',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'block'
          }} />
          <div style={{
            width: '60%',
            height: '20px',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            display: 'block'
          }} />
        </div>

        {/* Excerpt skeleton bars */}
        <div style={{
          width: '100%',
          margin: '10px 0',
          flexGrow: 1,
          minHeight: '60px',
          display: 'block'
        }}>
          <div style={{
            width: '100%',
            height: '14px',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'block'
          }} />
          <div style={{
            width: '95%',
            height: '14px',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'block'
          }} />
          <div style={{
            width: '88%',
            height: '14px',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            display: 'block'
          }} />
        </div>

        {/* Categories placeholder */}
        <div style={{
          display: 'flex',
          gap: '6px',
          margin: '10px 0 5px 0',
          flexShrink: 0
        }}>
          <div style={{
            width: '60px',
            height: '22px',
            backgroundColor: 'var(--skeleton-bg, #3a3a3a)',
            borderRadius: '15px'
          }} />
          <div style={{
            width: '70px',
            height: '22px',
            backgroundColor: 'var(--skeleton-bg, #3a3a3a)',
            borderRadius: '15px'
          }} />
        </div>

        {/* Date */}
        <div style={{
          width: '30%',
          height: '14px',
          backgroundColor: 'var(--skeleton-bg, #3a3a3a)',
          borderRadius: '4px',
          marginTop: 'auto',
          paddingTop: '10px',
          flexShrink: 0
        }} />
      </div>
    </motion.div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

const PortfolioCard = memo(({ post, onCardClick, index }) => {
  const imageUrl = extractImageFromContent(post.content);
  const excerpt = getExcerpt(post);
  const date = new Date(post.published);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  });

  return (
    <motion.div
      className="portfolio-card"
      onClick={() => onCardClick(post)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(post);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Read post: ${post.title}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="box">
        {imageUrl && <img src={imageUrl} className="preview-image" alt={post.title} />}
        <h4>{post.title}</h4>
        <p className="post-excerpt">{excerpt}</p>
        {post.categories && post.categories.length > 0 && (
          <div className="post-categories-card">
            {post.categories.slice(0, 4).map(cat => (
              <span key={cat} className="post-category-card">{cat}</span>
            ))}
          </div>
        )}
        <p className="post-date-preview">{formattedDate}</p>
      </div>
    </motion.div>
  );
});

PortfolioCard.displayName = 'PortfolioCard';

function PortfolioGrid({ posts, loading, error, onCardClick }) {
  // Show skeleton cards while loading (estimated 12 posts visible on first screen)
  const skeletonCount = 12;

  return (
    <div className="portfolio-grid-container">
      <div className="container" id="portfolio-container">
        {loading && (
          <>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} index={index} />
            ))}
          </>
        )}

        {error && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: '#dc3545' }}>Error Loading Posts</h3>
            <p>{error}</p>
            <p style={{ marginTop: '20px' }}>
              <small>Please check the browser console for more details.</small>
            </p>
          </div>
        )}

        {!loading && !error && posts.map((post, index) => (
          <PortfolioCard key={post.url} post={post} onCardClick={onCardClick} index={index} />
        ))}
      </div>
    </div>
  );
}

export default PortfolioGrid;
