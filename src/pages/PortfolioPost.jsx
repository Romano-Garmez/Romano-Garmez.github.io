import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BloggerRSSClient, BLOGGER_CONFIG } from '../services/bloggerAPI';
import { resizeBloggerImage } from '../utils/bloggerImages';
import { trackView } from '../services/statsService';
import Footer from '../components/Footer';
import Comments from '../components/Comments';
import './PortfolioPost.css';

// Generate URL-friendly slug from post title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Extract headings from HTML content for table of contents
const extractHeadings = (htmlContent) => {
  if (!htmlContent) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4');

  return Array.from(headings).map((heading, index) => ({
    id: `heading-${index}`,
    text: heading.textContent,
    level: parseInt(heading.tagName.charAt(1)),
  }));
};

// Extract thumbnail from post content (smaller size for cards)
const getPostThumbnail = (postContent) => {
  if (!postContent) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(postContent, 'text/html');
  const firstImg = doc.querySelector('img');
  if (!firstImg?.src) return null;
  return resizeBloggerImage(firstImg.src, 's400');
};

// Prepare the post body: give headings IDs for scroll targeting, and ask
// Blogger for image sources that hold up on high-DPI screens. Posts often embed
// at ~150px, which is half what a 2x display needs. The width/height attributes
// are left alone, so the layout is unchanged -- only the pixels behind it.
// 300 is tuned to the ~148px these render at; raising it costs real page weight
// (the phone screenshots here are PNGs: w300 is ~530KB, w600 is ~1.4MB).
const IN_POST_IMAGE_SIZE = 'w300';

const preparePostBody = (htmlContent) => {
  if (!htmlContent) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  doc.querySelectorAll('h1, h2, h3, h4').forEach((heading, index) => {
    heading.id = `heading-${index}`;
  });

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) img.setAttribute('src', resizeBloggerImage(src, IN_POST_IMAGE_SIZE));
  });

  return doc.body.innerHTML;
};

function PortfolioPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const client = new BloggerRSSClient(BLOGGER_CONFIG);
        const posts = await client.fetchPosts();

        const matchingPost = posts.find(
          (p) => generateSlug(p.title) === slug
        );

        if (matchingPost) {
          setPost(matchingPost);
          setAllPosts(posts);
        } else {
          setError('Post not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Update browser tab title when post loads
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Roman Garms`;
    }
    return () => {
      document.title = 'Roman Garms';
    };
  }, [post]);

  // Track page view when post loads
  useEffect(() => {
    if (post && slug) {
      trackView(slug);
    }
  }, [post, slug]);

  const headings = useMemo(() => {
    return post ? extractHeadings(post.content) : [];
  }, [post]);

  const contentWithIds = useMemo(() => {
    return post ? preparePostBody(post.content) : '';
  }, [post]);

  // Find related posts based on shared categories
  const relatedPosts = useMemo(() => {
    if (!post?.categories || allPosts.length === 0) return [];
    return allPosts
      .filter(p => generateSlug(p.title) !== slug &&
                   p.categories?.some(cat => post.categories.includes(cat)))
      .slice(0, 3);
  }, [post, allPosts, slug]);

  // Track if user clicked a TOC link (to temporarily disable scroll detection)
  const isManualScrollRef = useRef(false);
  const manualScrollTimeoutRef = useRef(null);

  const scrollToHeading = (headingId) => {
    const element = document.getElementById(headingId);
    if (element) {
      // Immediately set active heading and disable scroll detection
      setActiveHeadingId(headingId);
      isManualScrollRef.current = true;

      // Clear any existing timeout
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Re-enable scroll detection after animation completes
      manualScrollTimeoutRef.current = setTimeout(() => {
        isManualScrollRef.current = false;
      }, 1000);
    }
  };

  // Extract first image from post content for hero (get full resolution)
  const heroImage = useMemo(() => {
    if (!post?.content) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const firstImg = doc.querySelector('img');
    if (!firstImg?.src) return null;

    return resizeBloggerImage(firstImg.src, 's1600');
  }, [post]);

  // Preload hero image and track loading state
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  useEffect(() => {
    if (!heroImage) return;

    setHeroImageLoaded(false);
    const img = new Image();
    img.onload = () => setHeroImageLoaded(true);
    img.src = heroImage;
  }, [heroImage]);

  // Track active heading for TOC highlighting
  const [activeHeadingId, setActiveHeadingId] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (headings.length === 0 || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const handleScroll = () => {
      // Skip scroll detection if user just clicked a TOC link
      if (isManualScrollRef.current) return;

      const scrollTop = container.scrollTop;
      // Use 1/3 of viewport height so clicked sections stay highlighted
      const triggerPoint = scrollTop + container.clientHeight / 3;

      let currentHeading = headings[0]?.id || null; // Default to first heading

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const elementTop = element.offsetTop - container.offsetTop;
          // Select heading if it's above the trigger point
          if (elementTop <= triggerPoint) {
            currentHeading = heading.id;
          }
        }
      }

      // If scrolled to bottom, highlight last heading
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      if (isAtBottom && headings.length > 0) {
        currentHeading = headings[headings.length - 1].id;
      }

      setActiveHeadingId(currentHeading);
    };

    // Initial check after content renders
    const timeoutId = setTimeout(handleScroll, 100);

    container.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timeoutId);
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
      container.removeEventListener('scroll', handleScroll);
    };
  }, [headings, contentWithIds]);

  if (loading) {
    return (
      <div className="portfolio-post-page">
        <div className="post-loading">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="portfolio-post-page">
        <div className="post-error">
          <h2>Post Not Found</h2>
          <p>{error || 'The requested post could not be found.'}</p>
          <Link to="/portfolio" className="back-to-portfolio">
            ← Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-post-page" ref={scrollContainerRef}>
      {/* Hero Section */}
      <div
        className={`post-hero ${heroImageLoaded ? 'image-loaded' : ''}`}
        style={heroImage ? { '--hero-image': `url(${heroImage})` } : {}}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <Link to="/portfolio" className="back-link">
              ← Back to Portfolio
            </Link>
            <h1 className="hero-title">{post.title}</h1>
            <div className="hero-meta">
              <span className="hero-date">
                {new Date(post.published).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="hero-author">by {post.author}</span>
            </div>
            {post.categories && post.categories.length > 0 && (
              <div className="hero-categories">
                {post.categories.map(cat => (
                  <span key={cat} className="hero-category">{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="post-container">
        {/* Table of Contents Sidebar */}
        {headings.length > 0 && (
          <aside className="toc-sidebar">
            <div className="toc-sticky">
              <h3 className="toc-title">Contents</h3>
              <nav className="toc-nav">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    className={`toc-link toc-level-${heading.level} ${activeHeadingId === heading.id ? 'toc-active' : ''}`}
                    onClick={() => scrollToHeading(heading.id)}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Post Content */}
        <article className={`post-content ${headings.length === 0 ? 'no-toc' : ''}`}>
          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />
        </article>
      </div>

      {/* Portfolio Post Footer */}
      <section className="portfolio-post-footer">
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="related-posts">
            <h3>Related Posts</h3>
            <div className="related-posts-grid">
              {relatedPosts.map(relPost => (
                <Link
                  key={relPost.id}
                  to={`/portfolio/${generateSlug(relPost.title)}`}
                  className="related-post-card"
                >
                  <div
                    className="related-post-thumbnail"
                    style={{ backgroundImage: `url(${getPostThumbnail(relPost.content)})` }}
                  />
                  <span className="related-post-title">{relPost.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Section */}
        <div className="author-section">
          <img src="/images/sunsetpfp.jpg" alt="Roman Garms" className="author-avatar" />
          <div className="author-info">
            <h3>Roman Garms</h3>
            <p>CS major at UC Santa Cruz. I like computers, cars, and making tech do things it shouldn't.</p>
            <Link to="/about" className="author-link">Learn more →</Link>
          </div>
          <div className="author-social">
            <a href="https://github.com/romangarms" target="_blank" rel="noopener noreferrer">
              <img src="/images/github.svg" alt="GitHub" />
            </a>
            <a href="https://www.linkedin.com/in/roman-garms/" target="_blank" rel="noopener noreferrer">
              <img src="/images/linkedIn.svg" alt="LinkedIn" />
            </a>
            <a href="https://www.instagram.com/romangarms" target="_blank" rel="noopener noreferrer">
              <img src="/images/instagram.svg" alt="Instagram" />
            </a>
            <a href="mailto:romangarms@gmail.com">
              <img src="/images/mail.svg" alt="Email" />
            </a>
          </div>
        </div>

        {/* Comments (loaded from the Blogger comments feed) */}
        <Comments
          commentsUrl={post.commentsUrl}
          commentCount={post.commentCount}
          postUrl={post.url}
          postAuthorUri={post.authorUri}
        />
      </section>

      <Footer />
    </div>
  );
}

export default PortfolioPost;
