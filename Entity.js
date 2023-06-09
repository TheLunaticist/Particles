"use strict";

class Entity {
	constructor(x, y, asCenter, width, height, colliderShape) {
		if(asCenter) {
			this.rect = new Rectangle(x - width / 2, y - height / 2, width, height);
		} else {
			this.rect = new Rectangle(x, y, width, height);
		}
		
		if(colliderShape == ColliderShapes.CIRCLE && width != height){
			alert("Error: Oval circle colliders are not supported for now.");
			this.colliderShape = ColliderShapes.SQUARE;
		} else {
			this.colliderShape = colliderShape;
		}
	}
	
	doesEntityCollideWith(other) {
		if(this.colliderShape == ColliderShapes.SQUARE && other.colliderShape == ColliderShapes.SQUARE) {
			return this.rect.intersects(other.rect);
		} else {
			throw "Other colliders are not implemented yet.";
		}
	}
}

class HQ extends Entity {
	static SIZE = new Vector2(40, 40);
	
	constructor(x, y, asCenter) {	
		super(x, y, asCenter, HQ.SIZE.x, HQ.SIZE.y, ColliderShapes.SQUARE);
	}
	
	draw() {
		Game.CTX.drawImage(AssetManager.HQ_SPRITE, this.rect.left, this.rect.top);
	}
}

class TowerType {
	static MG = new TowerType(new Vector2(48, 48), 2, 60, 6);
	static SNIPER = new TowerType(new Vector2(32, 32), 8, 40, 30);

	constructor(size, damage, cost, maxShootCooldown) {
		this.size = size;
		this.damage = damage;
		this.cost = cost;
		this.maxShootCooldown = maxShootCooldown;
	}
}

class Tower extends Entity {
	static drawBlueprint(x, y, type) {
		if(Game.state.money >= 40 && Tower.canPlace(x, y, type)) {
			Game.CTX.fillStyle = Colors.BP;
		} else {
			Game.CTX.fillStyle = Colors.BP_INVALID;
		}
		
		Game.CTX.fillRect(x - type.size.x / 2, y - type.size.y / 2, type.size.x, type.size.y);
	}
	
	static canPlace(xCenter, yCenter, tType) {
		let mockRect = new Rectangle(xCenter - tType.size.x / 2, yCenter - tType.size.y / 2, tType.size.x, tType.size.y);
		
		//HQ
		if(mockRect.intersects(Game.state.hq.rect)) {
			return false;
		}
		
		//Towers
		for(let i = 0; i < Game.state.towers.length; i++) {
			let tRect = Game.state.towers[i].rect;
			
			if(mockRect.intersects(tRect)) {
				return false;
			}
		}
		
		if(Game.state.money < tType.cost) {
			return false;
		}
		
		return true;
	}
	
	constructor(x, y, asCenter, type) {
		super(x, y, asCenter, type.size.x, type.size.y, ColliderShapes.SQUARE);
		
		this.shootCooldown = type.maxShootCooldown;
		this.type = type;
		this.target = undefined;
	}
	
	draw() {
		if(this.type == TowerType.SNIPER) {
			let HEAD_SIZE = 32;
			//drawing base
			Game.CTX.drawImage(AssetManager.SNIPER_TURRET_BASE, this.rect.left, this.rect.top);
			
			//drawing head
			Game.CTX.save();
			
			let angle;
			if(this.target != undefined) {
				let targetVector = Vector2.subtract(this.target.rect.getCenter(), this.rect.getCenter());
				angle = Math.atan2(targetVector.y, targetVector.x) + 2*Math.PI * (3/4);
			} else {
				angle = 0;
			}
			
			
			let center = this.rect.getCenter();
			Game.CTX.translate(center.x, center.y);
			Game.CTX.rotate(angle);
			Game.CTX.drawImage(AssetManager.SNIPER_TURRET_HEAD, -HEAD_SIZE / 2, -HEAD_SIZE / 2);
			
			Game.CTX.restore();
			
		} else if(this.type == TowerType.MG) {
			Game.CTX.drawImage(AssetManager.MG_TURRET_BASE, this.rect.left, this.rect.top);
			
			Game.CTX.save();
			
			let angle;
			if(this.target != undefined) {
				let targetVector = Vector2.subtract(this.target.rect.getCenter(), this.rect.getCenter());
				angle = Math.atan2(targetVector.y, targetVector.x) + 2*Math.PI * (3/4);
			} else {
				angle = 0;
			}
			
			
			let center = this.rect.getCenter();
			Game.CTX.translate(center.x, center.y);
			Game.CTX.rotate(angle);
			Game.CTX.drawImage(AssetManager.MG_TURRET_HEAD, -48 / 2, -48 / 2);
			
			Game.CTX.restore();
		} else {
			//Unknown tower type
			debugger;
		}
	}
	

	
	update() {
		this.target = this.acquireTarget();
		
		if(this.shootCooldown < 1) {
			if(this.tryShoot()) {
				this.shootCooldown = this.type.maxShootCooldown;
			}
		} else {
			this.shootCooldown -= 1;
		}
	}
	
	tryShoot() {
		if(this.target != undefined) {
			let vecToTarget = Vector2.subtract(this.target.rect.getCenter(), this.rect.getCenter());
			let speedToEnemy = Vector2.scaleVec(vecToTarget.getNormalized(), 6);
			if(this.type == TowerType.MG) {
				speedToEnemy.x += (Math.random() - 0.5) * 4;
				speedToEnemy.y += (Math.random() - 0.5) * 4;
			}
			
			let myCenter = this.rect.getCenter();	
			Game.state.projectiles.push(new Projectile(myCenter.x, myCenter.y, true, speedToEnemy.x, speedToEnemy.y, this.type.damage));
			return true;
		} else {
			return false;
		}
	}
	
	acquireTarget() {
		if(Game.state.enemies[0] != undefined) {
			let vecToEnemy;
			let enemy;
			let smallestDistance = Infinity;
			for(let i = 0; i < Game.state.enemies.length; i++) {
				vecToEnemy = Vector2.subtract(Game.state.enemies[i].rect.getCenter(), this.rect.getCenter());
				if(vecToEnemy.getLength() < smallestDistance) {
					enemy = Game.state.enemies[i];
					smallestDistance = vecToEnemy.getLength();
				}
			}
			
			if(enemy == undefined) {
				return false;
			}
			return enemy;
		}
		else {
			return;
		}
	}
}

class Projectile extends Entity {
	static SIZE = new Vector2(16, 16);
	
	constructor(x, y, asCenter, startVelX, startVelY, damage) {
		super(x, y, asCenter, Projectile.SIZE.x, Projectile.SIZE.y, ColliderShapes.SQUARE);
		this.vel = new Vector2(startVelX, startVelY);
		this.damage = damage;
	}
	
	draw() {
		Game.CTX.fillStyle = "blue";
		Game.CTX.drawImage(AssetManager.PROJECTILE_SPRITE, this.rect.left, this.rect.top);
	}
	
	update(index) {
		this.rect.upperLeft.x += this.vel.x;
		this.rect.upperLeft.y += this.vel.y;
		
		if(this.rect.bottom < 0 || this.rect.top > Game.CANV.height ||
			this.rect.right < 0 || this.rect.left > Game.CANV.width) {
			Game.state.projectiles.splice(index, 1);
		}
	}
}

class EnemyType {
	static SMALL = new EnemyType(new Vector2(8, 8), 1);
	static BIG = new EnemyType(new Vector2(16, 16), 2);
	static BOSS = new EnemyType(new Vector2(48, 48), 10);
	
	constructor(size, reward) {
		this.size = size;
		this.reward = reward;
	}
}

class Enemy extends Entity {
	constructor(x, y, asCenter, type, startArmor) {
		super(x, y, asCenter, type.size.x, type.size.y, ColliderShapes.SQUARE);
		this.hasTarget = false;
		this.vel = new Vector2(0, 0);
		this.armor = startArmor;
		this.isDead = false;
		this.type = type;
	}
	
	draw() {
		if(this.armor >= 8) {
			Game.CTX.fillStyle = "green";
		} else if(this.armor >= 4) {
			Game.CTX.fillStyle = "yellow";
		} else {
			Game.CTX.fillStyle = "red";
		}
		
		Game.CTX.fillRect(this.rect.upperLeft.x, this.rect.upperLeft.y, this.type.size.x, this.type.size.y);
	}
		
	update() {
		if(this.hasTarget == false) {
			this.targetPos = Game.state.hq.rect.getCenter();
			this.vel = Vector2.scaleVec(Vector2.subtract(this.targetPos, this.rect.getCenter()).getNormalized(), 3);
			
			this.hasTarget = true;
		}
		
		this.rect.upperLeft = Vector2.add(this.rect.upperLeft, this.vel);
	}
	
	takeDamage(damage, index) {	
		if(this.armor > 0) {	
			this.armor = this.armor - damage;
		} else {
			Game.state.enemies.splice(index, 1);
			this.isDead = true;

			Game.state.money += this.type.reward;
			return true;
		}
	}
}