class UIManager {
    constructor() {
        this.currentScore = 0;
        this.highScore = this.loadHighScore();
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.showTrajectoryPreview = false;
        
        this.updateScoreDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (window.game) {
                    window.game.reset();
                }
            });
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('trashThrowHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        localStorage.setItem('trashThrowHighScore', this.highScore.toString());
    }

    addScore(points) {
        this.currentScore += points;
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
        }
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        const currentScoreElement = document.getElementById('currentScore');
        const highScoreElement = document.getElementById('highScore');
        
        if (currentScoreElement) {
            currentScoreElement.textContent = this.currentScore.toString();
        }
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore.toString();
        }
    }

    updateTrashTypeDisplay(trashType) {
        const trashIcon = document.getElementById('trashIcon');
        if (trashIcon) {
            switch (trashType) {
                case 'paper':
                    trashIcon.textContent = '📄';
                    break;
                case 'snack':
                    trashIcon.textContent = '🍪';
                    break;
                case 'mouse':
                    trashIcon.textContent = '🐭';
                    break;
                case 'confetti':
                    trashIcon.textContent = '🎊';
                    break;
                default:
                    trashIcon.textContent = '📄';
            }
        }
    }

    reset() {
        this.currentScore = 0;
        this.updateScoreDisplay();
        this.isDragging = false;
        this.showTrajectoryPreview = false;
    }
}

class InputManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.canvasRect = null;
        
        this.setupEventListeners();
        this.updateCanvasRect();
    }

    updateCanvasRect() {
        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    getMousePos(event) {
        this.updateCanvasRect();
        const scaleX = this.canvas.width / this.canvasRect.width;
        const scaleY = this.canvas.height / this.canvasRect.height;
        
        return {
            x: (event.clientX - this.canvasRect.left) * scaleX,
            y: (event.clientY - this.canvasRect.top) * scaleY
        };
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Touch events for tablet support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.handleMouseUp(mouseEvent);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.updateCanvasRect();
        });
    }

    handleMouseDown(event) {
        const mousePos = this.getMousePos(event);
        const activeTrash = this.game.trashManager.getActiveTrash();
        
        if (activeTrash && !activeTrash.isThrown) {
            const dx = mousePos.x - activeTrash.x;
            const dy = mousePos.y - activeTrash.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= activeTrash.radius + 10) {
                this.isDragging = true;
                this.dragStart = { x: mousePos.x, y: mousePos.y };
                this.dragCurrent = { x: mousePos.x, y: mousePos.y };
                this.canvas.style.cursor = 'grabbing';
            }
        }
    }

    handleMouseMove(event) {
        const mousePos = this.getMousePos(event);
        
        if (this.isDragging) {
            this.dragCurrent = { x: mousePos.x, y: mousePos.y };
        } else {
            // Update cursor based on hover
            const activeTrash = this.game.trashManager.getActiveTrash();
            if (activeTrash && !activeTrash.isThrown) {
                const dx = mousePos.x - activeTrash.x;
                const dy = mousePos.y - activeTrash.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= activeTrash.radius + 10) {
                    this.canvas.style.cursor = 'grab';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    handleMouseUp(event) {
        if (this.isDragging) {
            const activeTrash = this.game.trashManager.getActiveTrash();
            if (activeTrash && !activeTrash.isThrown) {
                const velocity = this.game.physics.getThrowVelocity(
                    this.dragStart.x, 
                    this.dragStart.y,
                    this.dragCurrent.x, 
                    this.dragCurrent.y
                );
                
                this.game.throwTrash(velocity.x, velocity.y);
            }
        }
        
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }

    drawDragIndicator(ctx) {
        if (!this.isDragging) return;
        
        const activeTrash = this.game.trashManager.getActiveTrash();
        if (!activeTrash || activeTrash.isThrown) return;

        ctx.save();
        
        // Draw trajectory preview
        const velocity = this.game.physics.getThrowVelocity(
            this.dragStart.x, 
            this.dragStart.y,
            this.dragCurrent.x, 
            this.dragCurrent.y
        );
        
        const trajectory = this.game.physics.calculateTrajectory(
            activeTrash.x, 
            activeTrash.y, 
            velocity.x, 
            velocity.y, 
            activeTrash.airResistance,
            30
        );
        
        // Draw trajectory line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        trajectory.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw power indicator
        const dx = this.dragCurrent.x - this.dragStart.x;
        const dy = this.dragCurrent.y - this.dragStart.y;
        const power = Math.sqrt(dx * dx + dy * dy);
        const maxPower = 200;
        const powerRatio = Math.min(power / maxPower, 1);
        
        // Power bar
        const barWidth = 100;
        const barHeight = 10;
        const barX = activeTrash.x - barWidth / 2;
        const barY = activeTrash.y - activeTrash.radius - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const powerColor = powerRatio < 0.5 ? '#00b894' : powerRatio < 0.8 ? '#fdcb6e' : '#e17055';
        ctx.fillStyle = powerColor;
        ctx.fillRect(barX, barY, barWidth * powerRatio, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Power text
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`Power: ${Math.round(powerRatio * 100)}%`, activeTrash.x, barY - 5);
        
        ctx.restore();
    }

    isDraggingActive() {
        return this.isDragging;
    }
}