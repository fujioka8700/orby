const turnOn = () => {
  mario.classList.add("-hidden");

  if (!gb.classList.toggle("-on")) {
    if (Math.random() > 0.35) {
      pixelLine.style.top = `${Math.floor(Math.random() * 100)}%`;
      display.appendChild(pixelLine);
    }
    clearTimeout(audioTimeoutId);
    audio.src = "";
  } else {
    audioTimeoutId = setTimeout(() => {
      audio.src = audioSrc;
      audio.play();
    }, 4500);
  }
};

let audioTimeoutId;

const audioSrc =
  "https://raw.githubusercontent.com/baumannzone/gameboy-css/master/docs/sound/gameboy-sound.mp3";
const audio = new Audio();
const pixelLine = document.createElement("div");
pixelLine.classList.add("gb__pixelLine");

gb.addEventListener("click", turnOn);
