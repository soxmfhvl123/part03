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

    getAudioData() {
        if (!this.analyser || !this.isPlaying) return { bass: 0, treble: 0, overall: 0 };

        this.analyser.getByteFrequencyData(this.dataArray);

        let bassSum = 0;
        // Focus on sub-bass and bass (0-60Hz approx) for kicks
        for (let i = 0; i < 6; i++) {
            bassSum += this.dataArray[i];
        }
        
        // Focus on high hats / treble (approx 5kHz+)
        let trebleSum = 0;
        for (let i = 40; i < 100; i++) {
            trebleSum += this.dataArray[i];
        }

        // NON-LINEAR SCALING (DYNAMIC CONTRAST)
        // Squaring the values forces quiet sounds to stay very low (e.g. 0.3^2 = 0.09)
        // and loud sounds to remain high (e.g. 0.9^2 = 0.81).
        // This makes the visualizer sharply distinguish between silence/ambience and actual beats.
        
        let rawBass = (bassSum / (6 * 255));
        let rawTreble = (trebleSum / (60 * 255));

        // Apply a slight threshold gate to cut out pure static
        let bass = rawBass < 0.1 ? 0 : Math.pow(rawBass, 2.5) * 1.5;
        let treble = rawTreble < 0.1 ? 0 : Math.pow(rawTreble, 2.0) * 1.5;
        let overall = (bass + treble) / 2;

        // Cap at 1.0
        bass = Math.min(bass, 1.0);
        treble = Math.min(treble, 1.0);
        overall = Math.min(overall, 1.0);

        return { bass, treble, overall };
    }

    updateData() {
        requestAnimationFrame(this.updateData.bind(this));

        if (window.monoApp) {
            if (this.analyser && this.isPlaying) {
                const { bass, treble } = this.getAudioData();

                // Send normalized data to our global app instance using LERP for smooth buttery transitions!
                // Ultra smooth morph (0.015 instead of 0.05)
                window.monoApp.audioData.bass += (bass - window.monoApp.audioData.bass) * 0.015;
                // Ultra slow easing for treble (0.01 instead of 0.03)
                window.monoApp.audioData.treble += (treble - window.monoApp.audioData.treble) * 0.01;
            } else {
                // If paused, slowly fade out the values
                window.monoApp.audioData.bass += (0 - window.monoApp.audioData.bass) * 0.01;
                window.monoApp.audioData.treble += (0 - window.monoApp.audioData.treble) * 0.01;
            }
        }
    }
}

// Instantiate the analyzer
new AudioVisualizer();
