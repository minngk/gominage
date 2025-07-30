class PhysicsEngine {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gravity = 0.5;
        this.groundY = canvasHeight - 50;
    }

    applyPhysics(object, deltaTime = 1) {
        if (!object.isThrown || object.isOnGround) return;

        object.velocity.y += this.gravity * deltaTime;

        const airResistance = object.airResistance || 0.01;
        object.velocity.x *= (1 - airResistance);
        object.velocity.y *= (1 - airResistance * 0.5);

        object.x += object.velocity.x * deltaTime;
        object.y += object.velocity.y * deltaTime;

        if (object.y >= this.groundY - object.radius) {
            object.y = this.groundY - object.radius;
            object.velocity.y *= -object.bounce;
            object.velocity.x *= 0.8;
            
            if (Math.abs(object.velocity.y) < 2 && Math.abs(object.velocity.x) < 1) {
                object.velocity.x = 0;
                object.velocity.y = 0;
                object.isOnGround = true;
            }
        }

        if (object.x < object.radius) {
            object.x = object.radius;
            object.velocity.x *= -0.6;
        } else if (object.x > this.canvasWidth - object.radius) {
            object.x = this.canvasWidth - object.radius;
            object.velocity.x *= -0.6;
        }
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }

    checkPointInCircle(pointX, pointY, circleX, circleY, radius) {
        const dx = pointX - circleX;
        const dy = pointY - circleY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    checkTrashBinCollision(trash, bin) {
        if (trash.y + trash.radius < bin.y - bin.height) {
            return false;
        }

        const trashCenterX = trash.x;
        const trashCenterY = trash.y;
        
        const binLeft = bin.x - bin.width / 2;
        const binRight = bin.x + bin.width / 2;
        const binTop = bin.y - bin.height;
        const binBottom = bin.y;

        if (trashCenterY > binTop && trashCenterY < binBottom) {
            if (trashCenterX > binLeft && trashCenterX < binRight) {
                return true;
            }
        }

        return false;
    }

    deflectObject(object, deflectionAngle, deflectionForce) {
        const angle = deflectionAngle + (Math.random() - 0.5) * 0.5;
        object.velocity.x = Math.cos(angle) * deflectionForce;
        object.velocity.y = Math.sin(angle) * deflectionForce;
    }

    calculateTrajectory(startX, startY, velocityX, velocityY, airResistance = 0.01, steps = 50) {
        const trajectory = [];
        let x = startX;
        let y = startY;
        let vx = velocityX;
        let vy = velocityY;

        for (let i = 0; i < steps; i++) {
            trajectory.push({ x: x, y: y });
            
            vy += this.gravity;
            vx *= (1 - airResistance);
            vy *= (1 - airResistance * 0.5);
            
            x += vx;
            y += vy;

            if (y >= this.groundY) {
                trajectory.push({ x: x, y: this.groundY });
                break;
            }

            if (x < 0 || x > this.canvasWidth) {
                break;
            }
        }

        return trajectory;
    }

    getThrowVelocity(startX, startY, endX, endY, powerMultiplier = 0.3) {
        const dx = endX - startX;
        const dy = endY - startY;
        
        return {
            x: dx * powerMultiplier,
            y: dy * powerMultiplier
        };
    }
}