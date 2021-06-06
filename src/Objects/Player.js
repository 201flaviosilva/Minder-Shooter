import Configs from "../Config/Configs";
import Shoots from "./Shoots";

import Settings from "../State/Settings";

const SCENE_WIDTH = Configs.world.width;
const SCENE_HEIGHT = Configs.world.height;

export default class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y) {
		const settings = Settings.getInstance();
		const selectedTexture = settings.playTexture;
		super(scene, x, y, selectedTexture);

		// Set variables
		this.speed = 200;
		this.nextTimeFired = 0;
		this.lives = 3;
		this.maxLives = 10;
		this.ammunition = 10;
		this.selectedTexture = selectedTexture;

		// Controllers
		const controllers = Configs.controllers;
		this.keys = this.scene.input.keyboard.addKeys({
			left1: controllers.left1,
			right1: controllers.right1,
			up1: controllers.up1,
			down1: controllers.down1,
			left2: controllers.left2,
			right2: controllers.right2,
			up2: controllers.up2,
			down2: controllers.down2,
			shoot: controllers.shoot,
		});

		// Shoots
		this.shoots = this.scene.physics.add.group({
			classType: Shoots,
			runChildUpdate: true,
		});

		// Particles
		this.particles = this.scene.add.particles(selectedTexture).createEmitter({
			lifespan: 750,
			delay: 100,
			scale: { start: 0.2, end: 0 },
			alpha: { start: 0.5, end: 0 },
			speed: { min: 50, max: 150 },
			rotate: { onEmit: () => this.angle },
			follow: this,
			on: false,
		});

		// Pointer
		this.pointer = this.scene.input.activePointer;
	}

	generate() {
		this.setDepth(10);
		// Player Bounds
		const bounds = new Phaser.Geom.Rectangle(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
		this.body.setBoundsRectangle(bounds);

		// Set camera follow player
		this.scene.cameras.main.setBounds(0, 0, SCENE_WIDTH, SCENE_HEIGHT, this);
		this.scene.cameras.main.startFollow(this, false, 0.1, 0.1);
	}

	removeLife() {
		this.lives--;
		this.scene.tweens.add({
			targets: [this],
			duration: 250,
			ease: "Linear",
			alpha: { from: this.alpha, to: 0.9 },
			scale: { from: this.scale, to: 0.9 },
			tint: { from: 0xffffff, to: 0xff0000, },
			yoyo: true,
		});

	}

	update(time) {
		const keys = this.keys;

		// Angle
		this.checkAngle();

		// X
		if (keys.left1.isDown || keys.left2.isDown) this.setVelocityX(-this.speed);
		else if (keys.right1.isDown || keys.right2.isDown) this.setVelocityX(this.speed);
		else this.setVelocityX(0);

		// Y
		if (keys.up1.isDown || keys.up2.isDown) this.setVelocityY(-this.speed);
		else if (keys.down1.isDown || keys.down2.isDown) this.setVelocityY(this.speed);
		else this.setVelocityY(0);

		if (this.body.velocity.x || this.body.velocity.y) this.particles.on = true;
		else this.particles.on = false;

		// Shoot
		if ((keys.shoot.isDown || this.pointer.isDown) && this.nextTimeFired < time && this.ammunition) this.shoot(time);
	}

	checkAngle() {
		const angle = Phaser.Math.RAD_TO_DEG * Phaser.Math.Angle.Between(this.x, this.y, this.pointer.worldX, this.pointer.worldY);
		this.setAngle(angle);
	}

	shoot(time) {
		this.nextTimeFired = time + 100;
		const shoot = this.shoots.get(this.x, this.y, this.selectedTexture);
		if (shoot) {
			shoot.fire(this.x, this.y, this.rotation);
			this.ammunition--;
			this.scene.events.emit("UpdateAmmunition", { ammunition: this.ammunition, });
		}
	}

	addAmmunition() {
		this.ammunition += Phaser.Math.Between(5, 20);
		this.scene.events.emit("UpdateAmmunition", { ammunition: this.ammunition, });
	}
}
