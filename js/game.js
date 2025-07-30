class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game systems
        this.physics = new PhysicsEngine(this.canvas.width, this.canvas.height);
        this.trashManager = new TrashManager();
        this.uiManager = new UIManager();
        this.inputManager = new InputManager(this.canvas, this);
        this.confettiSystem = new ConfettiSystem();
        
        // Game objects
        this.trashBin = new TrashBin(this.canvas.width - 150, this.canvas.height - 50);
        this.cat = new Cat(this.canvas.width - 300, this.canvas.height - 100);
        
        // Game state
        this.gameState = 'playing'; // 'playing', 'waitingForNext', 'confettiTime'
        this.waitTimer = 0;
        this.maxWaitTime = 60; // 1 second at 60fps
        this.lastTime = 0;
        
        // Initialize first trash
        this.createNewTrash();
        
        // Start game loop
        this.gameLoop();
        
        // Make game accessible globally for reset button
        window.game = this;
    }

    createNewTrash(forceType = null) {
        const startX = 100;
        const startY = this.canvas.height - 200;
        
        if (forceType === TrashTypes.CONFETTI) {
            this.trashManager.createConfetti(startX, startY);
        } else {
            this.trashManager.createNewTrash(startX, startY, forceType);
        }
        
        this.uiManager.updateTrashTypeDisplay(this.trashManager.getActiveTrash().type);
    }

    throwTrash(velocityX, velocityY) {
        const activeTrash = this.trashManager.getActiveTrash();
        if (!activeTrash || activeTrash.isThrown) return;

        // Activate cat if throwing mouse toy
        if (activeTrash.type === TrashTypes.MOUSE) {
            this.cat.activate();
        }

        this.trashManager.throwActiveTrash(velocityX, velocityY);
        this.gameState = 'waitingForNext';
    }

    checkCollisions() {
        const activeTrash = this.trashManager.getActiveTrash();
        if (!activeTrash || !activeTrash.isThrown || activeTrash.isDead) return;

        // Check cat deflection for mouse toy
        if (activeTrash.type === TrashTypes.MOUSE && this.cat.isActive) {
            if (this.cat.deflectTrash(activeTrash)) {
                // Cat deflected the trash - visual feedback could be added here
                console.log('Cat deflected the mouse toy!');
            }
        }

        // Check trash bin collision
        if (this.physics.checkTrashBinCollision(activeTrash, this.trashBin)) {
            this.handleSuccessfulThrow(activeTrash);
        }
    }

    handleSuccessfulThrow(trash) {
        // Add score
        this.uiManager.addScore(trash.points);
        
        // Trigger confetti effect
        this.confettiSystem.trigger(
            this.trashBin.x, 
            this.trashBin.y - this.trashBin.height,
            40
        );
        
        // Remove the successful trash
        trash.isDead = true;
        
        // Set game state to confetti time
        this.gameState = 'confettiTime';
        this.waitTimer = 0;
    }

    update(deltaTime) {
        // Update all systems
        this.trashManager.updateTrash(this.physics);
        this.cat.update();
        this.confettiSystem.update();
        this.checkCollisions();
        
        // Game state management
        switch (this.gameState) {
            case 'playing':
                // Normal gameplay - waiting for user input
                break;
                
            case 'waitingForNext':
                this.waitTimer++;
                
                // Check if current trash is settled or out of bounds
                const activeTrash = this.trashManager.getActiveTrash();
                if (activeTrash && (activeTrash.isDead || this.isTrashOutOfBounds(activeTrash))) {
                    this.waitTimer = this.maxWaitTime; // Skip waiting
                }
                
                if (this.waitTimer >= this.maxWaitTime) {
                    this.createNewTrash();
                    this.gameState = 'playing';
                    this.waitTimer = 0;
                }
                break;
                
            case 'confettiTime':
                // Wait for confetti to finish, then create confetti trash
                if (this.confettiSystem.isFinished()) {
                    this.createNewTrash(TrashTypes.CONFETTI);
                    this.gameState = 'playing';
                }
                break;
        }
    }

    isTrashOutOfBounds(trash) {
        return trash.x < -50 || 
               trash.x > this.canvas.width + 50 || 
               trash.y > this.canvas.height + 50;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient (already in CSS, but we can add effects)
        this.drawBackground();
        
        // Draw game objects
        this.trashBin.draw(this.ctx);
        this.cat.draw(this.ctx);
        this.trashManager.drawTrash(this.ctx);
        
        // Draw drag indicator
        this.inputManager.drawDragIndicator(this.ctx);
        
        // Draw confetti
        this.confettiSystem.draw(this.ctx);
        
        // Draw game state information
        this.drawGameInfo();
    }

    drawBackground() {
        // Draw floor line
        this.ctx.strokeStyle = '#636e72';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.physics.groundY);
        this.ctx.lineTo(this.canvas.width, this.physics.groundY);
        this.ctx.stroke();
        
        // Draw some environmental details
        this.drawRoom();
    }

    drawRoom() {
        // Draw simple room elements
        this.ctx.save();
        
        // Wall line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 50);
        this.ctx.lineTo(this.canvas.width, 50);
        this.ctx.stroke();
        
        // Simple window
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(50, 60, 80, 60);
        this.ctx.beginPath();
        this.ctx.moveTo(90, 60);
        this.ctx.lineTo(90, 120);
        this.ctx.moveTo(50, 90);
        this.ctx.lineTo(130, 90);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawGameInfo() {
        // Draw waiting state indicator
        if (this.gameState === 'waitingForNext') {
            this.ctx.save();
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('準備中...', this.canvas.width / 2, 50);
            this.ctx.restore();
        }
        
        // Draw confetti state indicator
        if (this.gameState === 'confettiTime') {
            this.ctx.save();
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#f9ca24';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('成功！ 🎉', this.canvas.width / 2, 50);
            this.ctx.restore();
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    reset() {
        // Reset all game systems
        this.trashManager.reset();
        this.uiManager.reset();
        this.confettiSystem = new ConfettiSystem();
        this.cat.isActive = false;
        
        // Reset game state
        this.gameState = 'playing';
        this.waitTimer = 0;
        
        // Create new trash
        this.createNewTrash();
    }
}

// Auto-start game when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        new Game();
        console.log('ゴミ投げゲーム started successfully!');
    } catch (error) {
        console.error('Failed to start game:', error);
        alert('ゲームの読み込みに失敗しました。ブラウザを更新してください。');
    }
});