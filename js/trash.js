const TrashTypes = {
    PAPER: 'paper',
    SNACK: 'snack', 
    MOUSE: 'mouse',
    CONFETTI: 'confetti'
};

class Trash {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.velocity = { x: 0, y: 0 };
        this.isThrown = false;
        this.isOnGround = false;
        this.isDead = false;
        
        this.setTrashProperties();
    }

    setTrashProperties() {
        switch (this.type) {
            case TrashTypes.PAPER:
                this.mass = 0.1;
                this.airResistance = 0.02;
                this.bounce = 0.3;
                this.radius = 12;
                this.points = 1;
                this.emoji = '📄';
                this.color = '#ffffff';
                this.strokeColor = '#ddd';
                break;
                
            case TrashTypes.SNACK:
                this.mass = 0.3;
                this.airResistance = 0.01;
                this.bounce = 0.5;
                this.radius = 10;
                this.points = 2;
                this.emoji = '🍪';
                this.color = '#8B4513';
                this.strokeColor = '#5D2F02';
                break;
                
            case TrashTypes.MOUSE:
                this.mass = 0.8;
                this.airResistance = 0.005;
                this.bounce = 0.7;
                this.radius = 15;
                this.points = 5;
                this.emoji = '🐭';
                this.color = '#808080';
                this.strokeColor = '#505050';
                break;
                
            case TrashTypes.CONFETTI:
                this.mass = 0.05;
                this.airResistance = 0.05;
                this.bounce = 0.2;
                this.radius = 8;
                this.points = 3;
                this.emoji = '🎊';
                this.color = this.getRandomConfettiColor();
                this.strokeColor = '#ff6b6b';
                break;
        }
    }

    getRandomConfettiColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    throw(velocityX, velocityY) {
        this.velocity.x = velocityX;
        this.velocity.y = velocityY;
        this.isThrown = true;
    }

    draw(ctx) {
        ctx.save();
        
        if (this.type === TrashTypes.CONFETTI) {
            this.drawConfetti(ctx);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.font = `${this.radius * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.fillText(this.emoji, this.x, this.y);
        }
        
        ctx.restore();
    }

    drawConfetti(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'];
        const pieces = 6;
        for (let i = 0; i < pieces; i++) {
            const angle = (i / pieces) * Math.PI * 2;
            const offsetX = Math.cos(angle) * (this.radius * 0.3);
            const offsetY = Math.sin(angle) * (this.radius * 0.3);
            
            ctx.beginPath();
            ctx.rect(offsetX - 2, offsetY - 2, 4, 4);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
        }
        
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        ctx.restore();
    }

    getTrajectoryPreview(startX, startY, endX, endY, physics) {
        const velocity = physics.getThrowVelocity(startX, startY, endX, endY);
        return physics.calculateTrajectory(startX, startY, velocity.x, velocity.y, this.airResistance);
    }
}

class TrashManager {
    constructor() {
        this.activeTrash = null;
        this.deadTrash = [];
        this.currentTrashType = this.getRandomTrashType();
    }

    getRandomTrashType() {
        const types = [TrashTypes.PAPER, TrashTypes.SNACK, TrashTypes.MOUSE];
        const weights = [40, 35, 25]; // Paper: 40%, Snack: 35%, Mouse: 25%
        
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return types[i];
            }
        }
        
        return TrashTypes.PAPER;
    }

    createNewTrash(x, y, forceType = null) {
        const type = forceType || this.currentTrashType;
        this.activeTrash = new Trash(type, x, y);
        
        if (!forceType) {
            this.currentTrashType = this.getRandomTrashType();
        }
        
        return this.activeTrash;
    }

    createConfetti(x, y) {
        this.activeTrash = new Trash(TrashTypes.CONFETTI, x, y);
        this.currentTrashType = this.getRandomTrashType();
        return this.activeTrash;
    }

    throwActiveTrash(velocityX, velocityY) {
        if (this.activeTrash && !this.activeTrash.isThrown) {
            this.activeTrash.throw(velocityX, velocityY);
        }
    }

    updateTrash(physics) {
        if (this.activeTrash && this.activeTrash.isThrown) {
            physics.applyPhysics(this.activeTrash);
            
            if (this.activeTrash.isOnGround && !this.activeTrash.isDead) {
                this.activeTrash.isDead = true;
                this.deadTrash.push({
                    x: this.activeTrash.x,
                    y: this.activeTrash.y,
                    type: this.activeTrash.type,
                    emoji: this.activeTrash.emoji,
                    color: this.activeTrash.color,
                    radius: this.activeTrash.radius
                });
            }
        }
    }

    drawTrash(ctx) {
        this.deadTrash.forEach(trash => {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(trash.x, trash.y, trash.radius, 0, Math.PI * 2);
            ctx.fillStyle = trash.color;
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.font = `${trash.radius}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.globalAlpha = 0.8;
            ctx.fillText(trash.emoji, trash.x, trash.y);
            ctx.restore();
        });
        
        if (this.activeTrash) {
            this.activeTrash.draw(ctx);
        }
    }

    reset() {
        this.activeTrash = null;
        this.deadTrash = [];
        this.currentTrashType = this.getRandomTrashType();
    }

    getActiveTrash() {
        return this.activeTrash;
    }

    isTrashReadyForNext() {
        return !this.activeTrash || this.activeTrash.isDead;
    }
}