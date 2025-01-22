class Game {
    constructor() {
        this.currentMode = null;
        this.sounds = {};
        this.currentSound = null;
        this.targetPosition = null;
        this.currentSoundLevel = null;
        this.gameStartTime = null;
        this.hasFoundTarget = false;
        this.isMouseInGame = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-yohann').addEventListener('click', () => this.startGame('yohann'));
        document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());

        // Game area interactions
        const gameArea = document.getElementById('game-area');
        gameArea.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        gameArea.addEventListener('click', (e) => this.handleClick(e));
        
        // Mouse enter/leave events
        gameArea.addEventListener('mouseenter', () => {
            this.isMouseInGame = true;
            if (this.currentSoundLevel && !this.hasFoundTarget) {
                this.playSound(`${this.currentMode}_${this.currentSoundLevel}`);
            }
        });
        
        gameArea.addEventListener('mouseleave', () => {
            this.isMouseInGame = false;
            if (this.currentSound && !this.hasFoundTarget) {
                this.currentSound.pause();
            }
        });
    }

    loadSounds(mode) {
        const soundLevels = ['far', 'medium', 'close', 'victory'];
        
        soundLevels.forEach(level => {
            const audio = new Audio(`sounds/${mode}/${level}.mp3`);
            if (level !== 'victory') {
                audio.addEventListener('ended', () => {
                    if (this.currentSoundLevel === level && !this.hasFoundTarget && this.isMouseInGame) {
                        audio.currentTime = 0;
                        audio.play();
                    }
                });
            }
            audio.load();
            this.sounds[`${mode}_${level}`] = audio;
        });
    }

    startGame(mode) {
        this.currentMode = mode;
        this.hasFoundTarget = false;
        this.gameStartTime = Date.now();
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        // Position aléatoire pour la cible
        const gameArea = document.getElementById('game-area');
        this.targetPosition = {
            x: Math.random() * (gameArea.offsetWidth - 100),
            y: Math.random() * (gameArea.offsetHeight - 100)
        };

        // Charger les sons
        this.loadSounds(mode);
        
        // Commencer avec le son "far"
        this.currentSoundLevel = 'far';
        this.playSound(`${mode}_far`);
    }

    showMenu() {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('main-menu').classList.add('active');
        this.stopSound();
        this.currentSoundLevel = null;
        this.hasFoundTarget = false;
        
        // Nettoyer l'écran de victoire s'il existe
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.remove();
        }
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    handleMouseMove(e) {
        if (!this.targetPosition || this.hasFoundTarget) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const distance = this.calculateDistance(x, y, this.targetPosition.x, this.targetPosition.y);
        const maxDistance = Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));
        
        this.updateSound(distance / maxDistance);
    }

    updateSound(distanceRatio) {
        if (this.hasFoundTarget) return;

        // Déterminer le niveau sonore approprié
        let newSoundLevel;
        if (distanceRatio < 0.1) newSoundLevel = 'close';
        else if (distanceRatio < 0.3) newSoundLevel = 'medium';
        else newSoundLevel = 'far';

        // Ne changer le son que si le niveau a changé
        if (newSoundLevel !== this.currentSoundLevel) {
            this.currentSoundLevel = newSoundLevel;
            this.playSound(`${this.currentMode}_${newSoundLevel}`);
        }
    }

    playSound(soundKey) {
        if (!this.sounds[soundKey] || (!this.isMouseInGame && soundKey.indexOf('victory') === -1)) return;

        // Arrêter le son actuel s'il existe
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
        }

        this.currentSound = this.sounds[soundKey];
        this.currentSound.play();
    }

    stopSound() {
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
            this.currentSound = null;
        }
    }

    handleClick(e) {
        if (this.hasFoundTarget) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const distance = this.calculateDistance(x, y, this.targetPosition.x, this.targetPosition.y);
        
        if (distance < 50) { // Zone de tolérance de 50 pixels
            this.characterFound();
        }
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    createFirework(x, y) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        
        // Créer les particules du feu d'artifice
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 100 + Math.random() * 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            const color = this.getRandomColor();
            
            particle.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: ${color};
                box-shadow: 0 0 6px ${color};
                transform: translate(0, 0);
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation: fireworkParticles 1s ease-out forwards;
            `;
            
            firework.appendChild(particle);
        }
        
        document.body.appendChild(firework);
        setTimeout(() => firework.remove(), 1000);
    }

    launchFirework() {
        const startX = Math.random() * window.innerWidth;
        const endX = Math.random() * window.innerWidth;
        const endY = Math.random() * (window.innerHeight * 0.5); // Limite supérieure à la moitié de l'écran
        
        // Créer la trainée
        const trail = document.createElement('div');
        trail.className = 'firework-trail';
        trail.style.cssText = `
            left: ${startX}px;
            bottom: 0;
            --target-y: ${-window.innerHeight + endY}px;
        `;
        
        document.body.appendChild(trail);
        
        // Créer l'explosion après que la trainée atteigne sa cible
        setTimeout(() => {
            this.createFirework(endX, endY);
            trail.remove();
        }, 400);
    }

    startFireworks() {
        // Lancer des feux d'artifice toutes les 500-1500ms
        const launchFirework = () => {
            if (document.getElementById('victory-screen')) {
                this.launchFirework();
                setTimeout(launchFirework, Math.random() * 1000 + 500);
            }
        };
        
        launchFirework();
    }

    characterFound() {
        this.hasFoundTarget = true;
        const timeTaken = Date.now() - this.gameStartTime;
        
        // Arrêter les sons de proximité et jouer le son de victoire
        this.stopSound();
        this.playSound(`${this.currentMode}_victory`);

        // Définir le texte de victoire en fonction du mode
        const victoryTexts = {
            'yohann': 'Tu as retrouvé Yohann, les memes du CrocoJambe sont saufs !'
            // Ajouter d'autres modes ici avec leurs textes
        };
        
        // Créer l'écran de victoire semi-transparent
        const victoryScreen = document.createElement('div');
        victoryScreen.id = 'victory-screen';
        victoryScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: rgba(26, 26, 46, 0);
            backdrop-filter: blur(0px);
            z-index: 1000;
            transition: all 1s ease;
            pointer-events: none;
            padding-top: 15vh;
        `;
        
        // Créer le personnage à sa position initiale
        const character = document.createElement('div');
        character.className = 'character found';
        character.style.cssText = `
            position: fixed;
            left: ${this.targetPosition.x}px;
            top: ${this.targetPosition.y}px;
            width: 100px;
            height: 100px;
            background-image: url(images/${this.currentMode}.png);
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            transform-origin: center;
            z-index: 1002;
        `;
        
        // Créer les particules
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 15 + 5;
            const angle = (Math.random() * Math.PI * 2);
            const velocity = Math.random() * 150 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.cssText = `
                left: ${this.targetPosition.x + 50}px;
                top: ${this.targetPosition.y + 50}px;
                width: ${size}px;
                height: ${size}px;
                --tx: ${tx}px;
                --ty: ${ty}px;
                z-index: 1001;
                background: radial-gradient(circle, ${this.getRandomColor()} 0%, transparent 70%);
            `;
            document.body.appendChild(particle);
            
            // Nettoyer les particules après l'animation
            setTimeout(() => particle.remove(), 1000);
        }
        
        // Ajouter le personnage et l'écran de victoire
        document.body.appendChild(victoryScreen);
        document.body.appendChild(character);

        // Démarrer les feux d'artifice après un court délai
        setTimeout(() => this.startFireworks(), 1000);

        // Après 1 seconde, commencer la transition vers le centre
        setTimeout(() => {
            // Calculer la position centrale
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const finalSize = 200;
            
            character.style.cssText = `
                position: fixed;
                left: ${(windowWidth - finalSize) / 2}px;
                top: ${windowHeight * 0.25}px;
                width: ${finalSize}px;
                height: ${finalSize}px;
                background-image: url(images/${this.currentMode}.png);
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                transform-origin: center;
                z-index: 1002;
            `;
            
            // Afficher le fond semi-transparent avec blur
            victoryScreen.style.backgroundColor = 'rgba(26, 26, 46, 0.97)';
            victoryScreen.style.backdropFilter = 'blur(10px)';
            victoryScreen.style.pointerEvents = 'auto';
        }, 1000);

        // Après la transition, ajouter le texte, le temps et les boutons
        setTimeout(() => {
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: 250px;
            `;

            // Ajouter le texte de victoire
            const victoryText = document.createElement('div');
            victoryText.className = 'victory-text';
            victoryText.textContent = victoryTexts[this.currentMode];

            // Afficher le temps
            const timeDisplay = document.createElement('div');
            timeDisplay.className = 'time-display';
            timeDisplay.textContent = `Temps: ${this.formatTime(timeTaken)}`;
            
            // Créer les boutons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Recommencer';
            restartButton.onclick = () => {
                victoryScreen.remove();
                character.remove();
                this.startGame(this.currentMode);
            };
            
            const menuButton = document.createElement('button');
            menuButton.textContent = 'Menu Principal';
            menuButton.onclick = () => {
                victoryScreen.remove();
                character.remove();
                this.showMenu();
            };
            
            buttonContainer.appendChild(restartButton);
            buttonContainer.appendChild(menuButton);
            
            // Ajouter les éléments au conteneur de contenu
            contentContainer.appendChild(victoryText);
            contentContainer.appendChild(timeDisplay);
            contentContainer.appendChild(buttonContainer);
            
            // Ajouter le conteneur à l'écran de victoire
            victoryScreen.appendChild(contentContainer);
        }, 2000);
    }

    getRandomColor() {
        const colors = [
            '#ff4e50', // Rouge vif
            '#f9d423', // Jaune
            '#00ff87', // Vert néon
            '#00ffff', // Cyan
            '#ff00ff', // Magenta
            '#4facfe', // Bleu clair
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialiser le jeu
window.addEventListener('load', () => {
    new Game();
}); 