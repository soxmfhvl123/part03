class AudioVisualizer {
    constructor() {
        this.audioEl = document.getElementById('main-audio');
        this.trackItems = document.querySelectorAll('.track-item');
        this.currentTrackNameEl = document.getElementById('current-track-name');
        this.playPauseBtn = document.getElementById('btn-play-pause');
        this.indicator = document.querySelector('.playing-indicator');

        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;

        this.isPlaying = false;

        this.initEvents();
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // High resolution
            this.analyser.smoothingTimeConstant = 0.8;

            const source = this.audioContext.createMediaElementSource(this.audioEl);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
        }
    }

    initEvents() {
        // Track Selection
        this.trackItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Initialize audio context on first user interaction
                this.initAudioContext();
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }

                // Remove active class from all
                this.trackItems.forEach(i => i.classList.remove('active'));

                // Set new track
                e.target.classList.add('active');
                const src = e.target.getAttribute('data-src');
                this.currentTrackNameEl.innerText = e.target.innerText;

                this.audioEl.src = src;
                this.audioEl.play().then(() => {
                    this.isPlaying = true;
                    this.playPauseBtn.disabled = false;
                    this.playPauseBtn.innerText = "PAUSE";
                    this.indicator.classList.add('active');

                    // Animation now stays continuous as requested
                }).catch(err => {
                    console.log("Audio play error (usually means missing mp3 file):", err);
                    this.currentTrackNameEl.innerText = "[FILE NOT FOUND] Place MP3 in /audio/";
                    this.isPlaying = false;
                    this.indicator.classList.remove('active');
                    this.playPauseBtn.innerText = "PLAY";
                });
            });
        });

        // Play/Pause Button
        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.audioEl.pause();
                this.isPlaying = false;
                this.playPauseBtn.innerText = "PLAY";
                this.indicator.classList.remove('active');
            } else {
                this.audioEl.play();
                this.isPlaying = true;
                this.playPauseBtn.innerText = "PAUSE";
                this.indicator.classList.add('active');
            }
        });

        // Auto-Play Next Track when current track ends
        this.audioEl.addEventListener('ended', () => {
            this.playNextTrack();
        });

        // Loop the update logic
        this.updateData();
    }

    playNextTrack() {
        let currentIndex = -1;
        // Find currently active track index
        this.trackItems.forEach((item, index) => {
            if (item.classList.contains('active')) {
                currentIndex = index;
            }
        });

        if (currentIndex !== -1) {
            // Calculate next index, loop back to 0 if at the end
            const nextIndex = (currentIndex + 1) % this.trackItems.length;

            // Programmatically click the next track to trigger all the UI/Audio logic
            this.trackItems[nextIndex].click();
        }
    }

    updateData() {
        requestAnimationFrame(this.updateData.bind(this));

        if (this.analyser && this.isPlaying) {
            this.analyser.getByteFrequencyData(this.dataArray);

            // Calculate Bass (lower frequencies)
            let bassSum = 0;
            const bassCount = 10; // First 10 bins
            for (let i = 0; i < bassCount; i++) {
                bassSum += this.dataArray[i];
            }
            const targetBass = (bassSum / bassCount) / 255.0; // Normalize 0-1

            // Calculate Treble (higher frequencies)
            let trebleSum = 0;
            const trebleStart = 100;
            const trebleCount = 50;
            for (let i = trebleStart; i < trebleStart + trebleCount; i++) {
                trebleSum += this.dataArray[i];
            }
            const targetTreble = (trebleSum / trebleCount) / 255.0;

            // Send normalized data to our global app instance using LERP for smooth buttery transitions!
            if (window.monoApp) {
                // Ultra smooth morph (0.015 instead of 0.05)
                window.monoApp.audioData.bass += (targetBass - window.monoApp.audioData.bass) * 0.015;
                // Ultra slow easing for treble (0.01 instead of 0.03)
                window.monoApp.audioData.treble += (targetTreble - window.monoApp.audioData.treble) * 0.01;
            }
        } else {
            // Decay very smoothly
            if (window.monoApp) {
                window.monoApp.audioData.bass *= 0.98;
                window.monoApp.audioData.treble *= 0.98;
            }
        }
    }
}

// Instantiate the analyzer
new AudioVisualizer();
