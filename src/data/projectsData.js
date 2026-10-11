export const projects = [
  {
    id: "autox-live",
    title: "AutoX Live",
    description: "Free iOS app for autocross timing and results, covering Evergreen Speedway, the Golden Gate Lotus Club, and every event on MyLaps Speedhive. Star yourself and your friends for head-to-head run comparisons and gap charts, get notified the moment new times post, and build your own public or invite-only leaderboards. Apple Watch app included; backed by a FastAPI server wrapping the Speedhive API.",
    image: "/images/projects/autox.jpg",
    liveUrl: "https://autox.romangarms.com/",
    githubUrl: "https://github.com/romangarms/Evergreen-AutoX-App",
    downloadUrl: "https://testflight.apple.com/join/txjt9rzr",
    downloadLabel: "Join the TestFlight",
    tags: ["iOS", "Cars", "Programming"],
    date: "2026-08-10",
    status: "Active",
    blogPostUrl: "https://romangarms.com/portfolio/an-actually-good-autocross-timing-app-and-it-s-free-autox-live",
    // This one lives on the App Store, not on GitHub, so the card ranks and
    // badges it by how many phones have installed it rather than by stars.
    userCount: {
      url: "https://autox.romangarms.com/api/stats",
      field: "devices",
      label: "users"
    }
  },
  {
    id: "spotify-recommender",
    title: "Spotify Song Recommender",
    description: "Generates Spotify playlists based on user input—either by providing an existing public playlist or describing music preferences in text. Uses AI to understand musical preferences and create personalized recommendations.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEikGYfnY2MvzdkGsOsg4S6KLF2pixRhUW0U_ZbXRdZQYQ9yyqsiwPoBUDbLzNNihoKAGYCXkEp1TgOGsTlY0r3MkaBA_jDEgsQV0M3iUsKQB5I2ul7ccuRDGc6CHkQRJZFqyK4tuisEF4zc_DUfeCWbVBUMFdNg8fiBREdNmwVNqRCwmOkLz2Xn0HqTrksh",
    liveUrl: "https://song-rec.romangarms.com/",
    githubUrl: "https://github.com/romangarms/Spotify-Song-Recommender",
    downloadUrl: null,
    tags: ["AI", "Music", "Spotify API"],
    date: "2026-02-07",
    status: "Maintained",
    blogPostUrl: "https://romangarms.com/portfolio/spotify-song-recommender-using-the-spotify-api-in-2026"
  },
  {
    id: "concepts-file-viewer",
    title: "Concepts File Viewer",
    description: "A web-based viewer application that displays Concepts drawing files (proprietary app format) in your browser by reverse-engineering the .concept file format. View your Concepts artwork without needing the iPad app.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEj2ROYjm1fZlc2apbErT41P4-vbF81rf7UMu7_r4Y2gfZyETij_a524RjGhY3_NGPVU4rqfF20dWG5Dsj5pVPMHEAkBQDGUFMXx_7LtdaRrntmMBSf_d3oUfx7tJEsfPgbOf9PwlMbtnL2BPmm6A5cMBg-jTpSy78IvXNxZ2HjlvM0xE2GyF4zbD3ho_xAY",
    liveUrl: "https://romangarms.com/Concepts-File-Viewer/",
    githubUrl: "https://github.com/romangarms/Concepts-File-Viewer",
    downloadUrl: null,
    tags: ["Concepts", "Programming"],
    date: "2025-11-03",
    status: "Maintained",
    blogPostUrl: "https://romangarms.com/portfolio/concepts-file-viewer-web-app"
  },
  {
    id: "opz-sample-manager",
    title: "OP-Z Sample Manager",
    description: "Desktop application that simplifies the process of loading audio samples onto a Teenage Engineering OP-Z synthesizer, with automatic format conversion and folder organization. Available for macOS and Windows.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEg3z_1x9jlxXkbHZNoUdu24y0Wsx6AQQ5-_LVMIOwMzkw1OTybaFv6kfyqof_1T61TV2hrEhKriqDbw-59t60nA83-6wOIYvkZpdywkWLMCjW7APr5Gg81Bry3aPZssKPO_BbhoyvanXCTwjtN-CYJlDRKmTiFgVgF85Hwh6VtmSWQsjOpYs9HKWvm1m22x",
    liveUrl: null,
    githubUrl: "https://github.com/romangarms/OPZ-Sample-Manager",
    downloadUrl: "https://github.com/romangarms/OPZ-Sample-Manager/releases",
    tags: ["Music", "Programming"],
    date: "2025-10-12",
    status: "Active",
    blogPostUrl: "https://romangarms.com/portfolio/op-z-sample-manager-software-to-make-the-op-z-usable"
  },
  {
    id: "wherehaveibeen",
    title: "WhereHaveIBeen",
    description: "GPS tracking application that displays traveled roads on a map, inspired by Forza Horizon's road exploration mechanic. Uses OwnTracks for location tracking and OSRM routing to visualize your real-world journeys.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEhC2NB6cUXxZlwG2H9Y7vZoGZjlAazW5neTIRIjZP-7gb7hTz1KD4amEQB8qGxvyV2C-vzk0hp-ZL9e52-B_emOvIaG17cdeiRCYDQRJvYQBj_SH8V_rTc_4U3y_LNcJKPOMIBDVChfkolsUAF3R-v3m17I5lhZG1ZHbICrd1ggJYVCP_kt3z494W-ktA70=w328-h184",
    liveUrl: "https://tracker.romangarms.com/",
    githubUrl: "https://github.com/Romano-Garmez/wherehaveibeen",
    downloadUrl: null,
    tags: ["Programming"],
    date: "2024-11-25",
    status: "Active",
    blogPostUrl: "https://romangarms.com/portfolio/programming-a-forza-horizon-style-map-tracker-wherehaveibeen"
  },
  {
    id: "ultimate-tic-tac-toe",
    title: "Ultimate Tic Tac Toe",
    description: "A recursive game where each square of a standard tic tac toe board contains another complete tic tac toe game, creating strategic depth beyond traditional gameplay. Available on web, Windows, Mac, Android, iOS, and PlayStation 3.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEheXQDW_806AGEBofmPOo2Az-TEyJd40dbXbPRG6vKBpHjWaatBlckcBuneJ_cvx3vOx9lTJohhWnyuGVoikXcrbGDogaWr8D7xszSwUYDHaEsLjcW-M7nYfeCihi1h376kt8sAAMmuiWU_G_ms0U-9OvGMJ5qpdKuGCVopj9shjg92pl-MDvu19zyeiTwh=w200-h200",
    liveUrl: "https://romangarms.com/UltimateTicTacToe/index.html",
    githubUrl: null,
    githubUrls: [
      { url: "https://github.com/alterednode/UltimateTicTacToe", label: "Web" },
      { url: "https://github.com/romangarms/UltimateTicTacToePS3", label: "PS3" }
    ],
    downloadUrl: "https://github.com/alterednode/UltimateTicTacToe/releases",
    tags: ["Game", "Programming"],
    date: "2023-10-01",
    status: "Archived",
    blogPostUrl: null,
    blogPostUrls: [
      { url: "https://romangarms.com/portfolio/ultimate-tic-tac-toe-a-group-project", label: "Original" },
      { url: "https://romangarms.com/portfolio/making-a-playstation-3-game-in-2024-ps3-unity-sdk", label: "PS3" }
    ]
  },
  {
    id: "now-playing",
    title: "Now Playing",
    description: "Web-based application that displays real-time Spotify playback information with dynamic styling based on album art colors. Shows what you're currently listening to with beautiful, responsive design.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEhxBxLwdJTWQMV2l_l5UirjOQYmZZOC_SdKBQDfWj0xCddcriXXM9v4Qm7knu5HP3NFzKZ6vM4UTcTN_Twe1DQgbFHPj2jy4vJ3hFlL0tARuAq5nNPvDe6C8tfmHh5wXGqDYewLRkYIWBNkwYPjaHn8p0FsFiaKJt1m9mR5HUibqfyqcBq6y3oA2k2dnA",
    liveUrl: "https://nowplaying.romangarms.com/",
    githubUrl: "https://github.com/Romano-Garmez/Raspberry-Pi-Spotify-Status",
    downloadUrl: null,
    tags: ["Music", "Programming"],
    date: "2023-03-26",
    status: "Maintained",
    blogPostUrl: "https://romangarms.com/portfolio/raspberry-pi-spotify-status-the-sequel"
  },
  {
    id: "videopaks-opz",
    title: "Videopaks for the OP-Z",
    description: "Custom visual tools for the OP-Z synthesizer through the Videolab platform. Features a spinning drum interface that generates visuals when playing notes, and a mobile controller with sliders and gyro controls that send MIDI output to the synthesizer.",
    image: "https://blogger.googleusercontent.com/img/a/AVvXsEiR4lm1l47za4bWS57JimOPEpEY79vJ-wJkmWrMZ0504CRybKH86WEc1UKAYUYr2QPSksgBbuX236f-uMHgvMQbpJfguBwHyvlJWiDlbpihQ3ymjoU1T8iAOh9kZmFdHy5EfBRWvmZMjqNm9RHfEw4ylkcP_Q3r3NZJoRX1qv55em3LTlA3jlFgJMUeFemc",
    liveUrl: null,
    githubUrl: "https://github.com/Romano-Garmez/Romans-VideoPaks",
    downloadUrl: "https://github.com/romangarms/Romans-VideoPaks/releases",
    tags: ["Music", "Programming"],
    date: "2023-10-01",
    status: "Archived",
    blogPostUrl: "https://romangarms.com/portfolio/videopaks-for-the-op-z"
  }
];
