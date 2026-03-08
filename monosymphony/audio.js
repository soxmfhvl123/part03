class AudioVisualizer {
    constructor() {
        this.audio = document.getElementById('main-audio');
        this.trackItems = document.querySelectorAll('.track-item');
        this.playPauseBtn = document.getElementById('btn-play-pause');
        this.currentTrackName = document.getElementById('current-track-name');
        this.playingIndicator = document.querySelector('.playing-indicator');
        this.playlistTitle = document.getElementById('playlist-title-text');
        
        // Language State
        this.currentLang = 'kr';
        this.langBtns = {
            'kr': document.getElementById('lang-kr'),
            'en': document.getElementById('lang-en')
        };

        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;

        this.isPlaying = false;
        
        this.initLangToggle();
        this.initEvents();
        this.updateLangUI(); // Apply default language
    }
    
    initLangToggle() {
        if (!this.langBtns.kr || !this.langBtns.en) return;
        
        this.langBtns.kr.addEventListener('click', () => this.switchLang('kr'));
        this.langBtns.en.addEventListener('click', () => this.switchLang('en'));
    }
    
    switchLang(lang) {
        if (this.currentLang === lang) return;
        
        // Update active class
        this.langBtns[this.currentLang].classList.remove('active');
        this.langBtns[lang].classList.add('active');
        
        this.currentLang = lang;
        this.updateLangUI();
    }
    
    updateLangUI() {
        // Update playlist title
        if (this.playlistTitle) {
            this.playlistTitle.textContent = this.currentLang === 'kr' ? '추천 플레이리스트' : 'CURATED TRACKLIST';
        }

        // Update all track items in the list
        this.trackItems.forEach(item => {
            const title = item.getAttribute(`data-title-${this.currentLang}`);
            if (title) {
                item.textContent = title;
            }
        });
        
        // Update Now Playing text
        if (this.currentTrackName) {
            // Is a track currently playing?
            const activeTrack = document.querySelector('.track-item.active');
            if (activeTrack) {
                this.currentTrackName.textContent = activeTrack.getAttribute(`data-title-${this.currentLang}`);
            } else {
                // Not playing, use default text
                this.currentTrackName.textContent = this.currentTrackName.getAttribute(`data-default-${this.currentLang}`);
            }
        }
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // High resolution
            this.analyser.smoothingTimeConstant = 0.8;

            const source = this.audioContext.createMediaElementSource(this.audio);
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
        // CLASSICAL TUNING: Expand "bass" to cover up to ~800Hz (Cellos, lower strings, piano left hand)
        // 40 bins * ~21Hz = ~840Hz.
        const bassBins = 40;
        for (let i = 0; i < bassBins; i++) {
            bassSum += this.dataArray[i];
        }
        
        // Focus on violins, flutes, piano right hand (approx 2kHz - 10kHz)
        let trebleSum = 0;
        const trebleStart = 100;
        const trebleEnd = 200;
        for (let i = trebleStart; i < trebleEnd; i++) {
            trebleSum += this.dataArray[i];
        }

        // NON-LINEAR SCALING (CLASSICAL CONTRAST)
        // Classical music is dynamic but rarely has hard kicks.
        // We tame the Math.pow exponent from 2.5 down to 1.5.
        // This makes it respond to swells and crescendos gracefully without needing a sharp hit.
        
        let rawBass = (bassSum / (bassBins * 255));
        let rawTreble = (trebleSum / ((trebleEnd - trebleStart) * 255));

        // Lower the threshold to pick up quiet string intro parts
        let bass = rawBass < 0.05 ? 0 : Math.pow(rawBass, 1.5) * 1.8;
        let treble = rawTreble < 0.05 ? 0 : Math.pow(rawTreble, 1.5) * 1.8;
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
