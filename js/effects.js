class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = Math.random() * -5 - 2;
        this.color = this.getRandomColor();
        this.size = Math.random() * 4 + 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // gravity
        this.vx *= 0.99; // air resistance
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ConfettiSystem {
    constructor() {
        this.particles = [];
        this.isActive = false;
    }

    trigger(x, y, count = 30) {
        this.isActive = true;
        for (let i = 0; i < count; i++) {
            this.particles.push(new ConfettiParticle(x, y));
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });

        if (this.particles.length === 0) {
            this.isActive = false;
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    isFinished() {
        return !this.isActive && this.particles.length === 0;
    }
}

class Cat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.isActive = false;
        this.activeDuration = 0;
        this.maxActiveDuration = 120; // 2 seconds at 60fps
        this.deflectionRadius = 80;
    }

    activate() {
        this.isActive = true;
        this.activeDuration = 0;
    }

    update() {
        if (this.isActive) {
            this.activeDuration++;
            if (this.activeDuration >= this.maxActiveDuration) {
                this.isActive = false;
                this.activeDuration = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.isActive) return;

        ctx.save();
        
        // Draw cat shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height + 5, this.width * 0.6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat body
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width * 0.4, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat head
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - this.height * 0.2, this.width * 0.3, this.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat ears
        ctx.fillStyle = '#E07A35';
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.height * 0.3);
        ctx.lineTo(this.x - 8, this.y - this.height * 0.5);
        ctx.lineTo(this.x - 2, this.y - this.height * 0.3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - this.height * 0.3);
        ctx.lineTo(this.x + 8, this.y - this.height * 0.5);
        ctx.lineTo(this.x + 2, this.y - this.height * 0.3);
        ctx.fill();

        // Cat stripes
        ctx.strokeStyle = '#D96828';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y - 5 + i * 6, this.width * 0.25, 0, Math.PI);
            ctx.stroke();
        }

        // Cat tail
        ctx.strokeStyle = '#FF8C42';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y);
        ctx.quadraticCurveTo(this.x + this.width * 0.5, this.y - 20, this.x + this.width * 0.4, this.y - 35);
        ctx.stroke();

        // Cat eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x - 6, this.y - this.height * 0.25, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 6, this.y - this.height * 0.25, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat nose
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - this.height * 0.15, 1.5, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat whiskers
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + side * 8, this.y - this.height * 0.15 + (i - 1) * 3);
                ctx.lineTo(this.x + side * 20, this.y - this.height * 0.15 + (i - 1) * 2);
                ctx.stroke();
            }
        }

        // Emoji fallback for simpler rendering
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.8;
        ctx.fillText('🐱', this.x, this.y - 10);

        ctx.restore();
    }

    canDeflect(trashX, trashY) {
        if (!this.isActive) return false;
        
        const dx = trashX - this.x;
        const dy = trashY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.deflectionRadius;
    }

    deflectTrash(trash) {
        if (!this.canDeflect(trash.x, trash.y)) return false;
        
        // 50% chance to deflect
        if (Math.random() > 0.5) return false;

        // Calculate deflection angle
        const dx = trash.x - this.x;
        const dy = trash.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        // Add some randomness to the deflection
        const deflectionAngle = angle + (Math.random() - 0.5) * 1.0;
        const deflectionForce = 8 + Math.random() * 4;
        
        trash.velocity.x = Math.cos(deflectionAngle) * deflectionForce;
        trash.velocity.y = Math.sin(deflectionAngle) * deflectionForce;
        
        return true;
    }
}

class TrashBin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 100;
        this.openingWidth = 70;
    }

    draw(ctx) {
        ctx.save();
        
        // Bin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, this.width * 0.6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bin body
        ctx.fillStyle = '#2d3436';
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 3;
        
        const bottomWidth = this.width;
        const topWidth = this.openingWidth;
        const height = this.height;
        
        ctx.beginPath();
        ctx.moveTo(this.x - bottomWidth/2, this.y);
        ctx.lineTo(this.x - topWidth/2, this.y - height);
        ctx.lineTo(this.x + topWidth/2, this.y - height);
        ctx.lineTo(this.x + bottomWidth/2, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bin rim
        ctx.fillStyle = '#636e72';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - height, topWidth/2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bin opening (dark interior)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - height, topWidth/2 - 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bin label
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('🗑️', this.x, this.y - height/2);

        ctx.restore();
    }

    getCollisionBounds() {
        return {
            x: this.x,
            y: this.y - this.height,
            width: this.openingWidth,
            height: this.height
        };
    }
}