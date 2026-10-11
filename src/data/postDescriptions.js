/**
 * Hand-written portfolio card descriptions.
 *
 * Keyed by the post's slug (the same slug used in the /portfolio/:slug URL,
 * generated from the title: lowercased, non-alphanumeric runs -> "-").
 *
 * If a post has an entry here, it's shown on the portfolio card. Otherwise the
 * card falls back to an auto-generated snippet from the post's content.
 *
 * To add or edit a description, just add/update an entry below — keep it to a
 * sentence or two so it fits the card cleanly.
 */
const POST_DESCRIPTIONS = {
  'an-actually-good-autocross-timing-app-and-it-s-free-autox-live':
    "A free autocross timing app for iOS: star yourself and your friends, compare runs head-to-head, and get notified the moment new times are published. Apple Watch app included.",

  'spotify-song-recommender-using-the-spotify-api-in-2026':
    "A web app that automatically recommends new Spotify songs, and fighting with the limitations of the Spotify API in 2026.",

  'concepts-file-viewer-web-app':
    "A browser-based viewer for .Concepts drawing files, so you can open your iPad sketches without the app.",

  'op-z-sample-manager-software-to-make-the-op-z-usable':
    "Desktop software for managing samples, projects, and settings on Teenage Engineering's OP-Z",

  'programming-a-forza-horizon-style-map-tracker-wherehaveibeen':
    "WhereHaveIBeen is a web app that tracks the roads you've driven, inspired by Forza Horizon's map exploration.",

  'making-a-playstation-3-game-in-2024-ps3-unity-sdk':
    "Bringing Ultimate Tic Tac Toe to the PlayStation 3 in 2024 using a the Unity SDK.",

  'hacking-my-mazda-infotainment-mzd-aio-and-casdk':
    "My 2015 Mazda's infotainment runs in the Opera web browser on Linux, and uses plain HTML/JS/CSS, so I hacked it.",

  'drtuned-tuning-my-car-with-my-steam-deck':
    "Using a Steam Deck to tune my 2015 Mazda 3's engine - DRTuned Tier 1 tune.",

  'homebridge-making-my-home-a-little-smarter':
    "Smart-home-ifying a PS3, among other things.",

  '1isle-music-on-spotify-apple-music-etc':
    "Getting my music onto Spotify, Apple Music, and beyond under the name 1isle.",

  'doom-on-a-drone-controller':
    "Running DOOM on the touchscreen controller of the GoPro's Karma drone.",

  'the-nautilus-a-group-project':
    "A web-based space game built with a friend around piloting a ship.",

  'ultimate-tic-tac-toe-a-group-project':
    "Tic tac toe, but every square is its own tic tac toe board, released across Windows, Mac, iOS, and Android.",

  'videopaks-for-the-op-z':
    "Creating the Tombola and XY pad Videopaks for Teenage Engineering's OP-Z synthesizer.",

  'raspberry-pi-spotify-status-the-sequel':
    "Rebuilding my Raspberry Pi Spotify display from scratch.",

  'installing-carplay-in-an-11-year-old-audi':
    "Adding modern Apple CarPlay to a 2011 Audi A4.",

  'using-the-steam-deck-as-a-controller-for-my-gaming-pc':
    "Turning a Steam Deck into a Wii U like experience for my gaming PC.",

  'raspberry-pi-spotify-display-auto-screen-control':
    "An update to my Raspberry Pi Spotify display that automatically turns the screen on and off with playback, using a tweaked Nowify and a small Java webserver.",

  'raspberry-pi-spotify-display-nowify-homebridge-and-more':
    "Setting up a Raspberry Pi and touchscreen to show my current Spotify song using Nowify, with Homebridge integration and a handful of custom tweaks.",
};

/**
 * Get the hand-written description for a post slug, or null if none exists
 * (so callers can fall back to an auto-generated snippet).
 */
export function getPostDescription(slug) {
  return POST_DESCRIPTIONS[slug] || null;
}

export default POST_DESCRIPTIONS;
