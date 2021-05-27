import Configs from "../Config/Configs";

import Player from "../Objects/Player";
import Enemy from "../Objects/Enemy";
import Background from "../Objects/Background";

const SCENE_WIDTH = Configs.world.width;
const SCENE_HEIGHT = Configs.world.height;

export default class Play extends Phaser.Scene {
	constructor() {
		super({ key: "Play", active: false, });
	}

	create() {
		const { width, height, middleWidth, middleHeight } = Configs.screen;

		if (Configs.debug) this.drawDebugGraphics();

		const background = new Background(this);

		// Player
		const playersGroup = this.physics.add.group({
			classType: Player,
			collideWorldBounds: true,
			runChildUpdate: true,
		});
		this.player = playersGroup.get(50, 130);
		this.player.generate();

		// Enemies
		this.enemiesGroup = this.physics.add.group({
			classType: Enemy,
			collideWorldBounds: true,
		});

		for (let i = 0; i < 5; i++) {
			const enemy = this.enemiesGroup.get(width, height);
			if (enemy) enemy.generate();
		}

		// Timer
		const timer = this.time.addEvent({
			delay: 1500,
			callback: () => {
				const enemy = this.enemiesGroup.get(width, height);
				if (enemy) enemy.generate();
			},
			repeat: -1,
		});

		// Collision
		this.physics.add.overlap(this.player.shoots, this.enemiesGroup, this.playerShootsCollideEnemy, null, this);
		this.physics.add.overlap(this.player, this.enemiesGroup, this.playerCollideEnemy, null, this);
		this.physics.add.collider(this.enemiesGroup);

		// UI Scene
		this.scene.launch("PlayUI");
	}

	playerShootsCollideEnemy(s, e) {
		if (!e.alive) return;
		s.kill();
		e.kill();
		this.events.emit("UpdateScore");
	}

	playerCollideEnemy(p, e) {
		if (e.alive) {
			e.kill();
			this.killPlayer();
		}
	}

	killPlayer(p) {
		this.player.removeLife();
		this.events.emit("UpdateLife", { lives: this.player.lives, });
		if (this.player.lives <= 0) {
			this.scene.start("Home");
			this.scene.stop("PlayUI");
			this.scene.stop();
		}
	}

	drawDebugGraphics() {
		const graphics = this.add.graphics().setDepth(0);
		graphics.lineStyle(1, 0xff0000, 1);
		const xSpace = 250;
		for (let i = 0; i < SCENE_WIDTH / xSpace; i++) {
			const x = i * xSpace;
			graphics.lineBetween(x, 0, x, SCENE_HEIGHT);
			this.add.text(x, 10, x);
		}
	}

	update() {
		const enemies = this.enemiesGroup.getChildren();
		for (let i = 0; i < enemies.length; i++) {
			const enemy = enemies[i];
			if (enemy.alive) {
				this.physics.moveToObject(enemy, this.player, enemy.speed);
				enemy.fixRotation();
			}
		}
	}
}
