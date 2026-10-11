/**
 * Blogger bakes the size an image was embedded at into the image URL itself, so
 * a post that embeds a 148px-wide screenshot hands us a 148px-wide file no
 * matter how large we end up rendering it. Rewriting that size hint lets us ask
 * for the resolution we actually need.
 *
 * Two URL shapes show up in the feed:
 *   .../img/b/<ns>/<id>/<size>/<filename>  - size as a path segment
 *   .../img/a/<id>=<size>                  - size as a "=" suffix
 * In both, the size is optional: a URL without one serves the original.
 *
 * `size` is a Blogger size spec, e.g. "s1600" (longest edge), "w800" (width),
 * or "w700-h400-c" (exact box, centre-cropped).
 */

// e.g. "s1600", "w148-h320", "w700-h400-c"
const SIZE_SEGMENT = /^[swh]\d+(?:-[swh]\d+)?(?:-[a-z]+)*$/;

export function resizeBloggerImage(url, size) {
  if (!url || !url.includes('blogger.googleusercontent.com')) return url;

  // Legacy form: the size rides on the end of the id as "=w328-h184".
  if (url.includes('/img/a/')) {
    return `${url.split('=')[0]}=${size}`;
  }

  // Current form: the size is its own path segment just before the filename.
  const parts = url.split('/');
  const sizeIndex = parts.length - 2;
  if (SIZE_SEGMENT.test(parts[sizeIndex])) {
    parts[sizeIndex] = size;
  } else {
    parts.splice(parts.length - 1, 0, size);
  }
  return parts.join('/');
}

export default resizeBloggerImage;
