let currentSong = new Audio();
let songs = [];
let currentIndex = 0;

// Elements
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("previous");

const songNameEl = document.querySelector(".playbar .song-name");
const songTimeEl = document.querySelector(".playbar .song-time");
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

// Fetch songs
async function getsongs(folder = "") {
  let a = await fetch(`http://127.0.0.1:3000/songs/${folder}`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let as = div.getElementsByTagName("a");
  let songList = [];

  for (let i = 0; i < as.length; i++) {
    if (as[i].href.endsWith(".mp3")) {
      songList.push(as[i].href.split("songs")[1]);
    }
  }
  return songList;
}

// Render song list in sidebar
function renderSongList(songArray, folder = "") {
  const songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";

  songArray.forEach((song, index) => {
    let folderName = folder ? decodeURIComponent(folder.replace("/", "")) : "";
    let songName = decodeURIComponent(song)
      .split('/').pop()
      .replace(".mp3", "")
      .replaceAll("\\", "")
      .replaceAll("/", "");

    let cleanName = songName.startsWith(folderName) ? songName.slice(folderName.length) : songName;

    songUL.innerHTML += `
      <li data-song="${song}" data-index="${index}">
        <img class="invert" src="img/music.svg">
        <div class="info">
          <div>${cleanName}</div>
        </div>
        <img class="invert" src="img/plays.svg">
      </li>
    `;
  });

  // Click song
  document.querySelectorAll(".songlist li").forEach((li) => {
    li.addEventListener("click", () => {
      playMusic(li.dataset.song, parseInt(li.dataset.index));
    });
  });
}

// Format time mm:ss
function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  let m = Math.floor(sec / 60);
  let s = Math.floor(sec % 60);
  if (s < 10) s = "0" + s;
  return `${m}:${s}`;
}

// Update seekbar + time
function updateSeekbar() {
  if (!isNaN(currentSong.duration)) {
    const percent =
      (currentSong.currentTime / currentSong.duration) * 100;

    circle.style.left = percent + "%";

    seekbar.style.background = `linear-gradient(
      to right,
      black ${percent}%,
      rgba(255,255,255,0.3) ${percent}%
    )`;

    songTimeEl.innerText = `${formatTime(
      currentSong.currentTime
    )} / ${formatTime(currentSong.duration)}`;
  }
}

// Play selected song
function playMusic(track, index) {
  currentSong.src = "/songs" + track;
  currentSong.play();
  currentIndex = index;

  playBtn.src = "img/pause.svg";

  let decodedTrack = decodeURIComponent(track);
  let pathParts = decodedTrack.split(/[/\\]/).filter(p => p); // split by / or \ and remove empty
  let songName = pathParts.pop().replace(".mp3", "");
  let folderName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
  let cleanName = songName.startsWith(folderName) ? songName.slice(folderName.length).trim() : songName;
  songNameEl.innerText = cleanName;

  circle.style.left = "0%";
  seekbar.style.background =
    "linear-gradient(to right, black 0%, rgba(255,255,255,0.3) 0%)";
}

// Main
async function main() {
  songs = await getsongs();
  renderSongList(songs);

  // Add event listeners to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', async () => {
      const cardTitle = card.querySelector('h2').innerText;
      let folder = '';
      if (cardTitle === 'English Hits') {
        folder = 'English%20Hits/';
      } else if (cardTitle === 'Hindi Hits') {
        folder = 'Hindi%20Hits/';
      } else if (cardTitle === 'Punjabi Hits') {
        folder = 'Punjabi%20Hits/';
      } else if (cardTitle === 'South India Hits') {
        folder = 'South%20Indian%20Hits/';
      } else if (cardTitle === 'All in One') {
        folder = 'All%20in%20One/';
      }
      if (folder) {
        songs = await getsongs(folder);
        renderSongList(songs, folder);
        currentIndex = 0; // reset index
        // Update the heading text
        document.querySelector('.heading h2').innerText = "Listening " + cardTitle;
        // Auto-open sidebar on mobile
        if (window.innerWidth <= 800) {
          sidebar.classList.add('active');
        }
      }
    });
  });

  // Play / Pause
  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "img/pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "img/plays.svg";
    }
  });

  // ▶️ NEXT
  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
  });

  // ⏮️ PREVIOUS
  prevBtn.addEventListener("click", () => {
    if (currentSong.currentTime > 3) {
      currentSong.currentTime = 0;
    } else {
      currentIndex =
        (currentIndex - 1 + songs.length) % songs.length;
      playMusic(songs[currentIndex], currentIndex);
    }
  });

  // Seekbar click → jump to time
  seekbar.addEventListener("click", (e) => {
    const rect = seekbar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;

    currentSong.currentTime = percent * currentSong.duration;
    updateSeekbar();
  });

  // Live seekbar update
  currentSong.addEventListener("timeupdate", updateSeekbar);

  // Auto next song
  currentSong.addEventListener("ended", () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
  });
}

// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger img');
const closeBtn = document.querySelector('.close-sidebar img');
const sidebar = document.querySelector('.left');

hamburger.addEventListener('click', () => {
  sidebar.classList.add('active');
});

closeBtn.addEventListener('click', () => {
  sidebar.classList.remove('active');
});

// Start
main();