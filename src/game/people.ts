import Phaser from 'phaser'

const people = ['hero', 'oak', 'child', 'fisher', 'explorer', 'technician', 'rival', 'francisco']
export type Person = typeof people[number]

export function loadPeople(scene: Phaser.Scene) {
  for (const person of people) scene.load.spritesheet(`person-${person}`, `/assets/people/${person}.png`, { frameWidth: 16, frameHeight: 32 })
}

export function animatePeople(scene: Phaser.Scene) {
  for (const person of people) {
    for (const [direction, row] of Object.entries({ down: 0, left: 1, right: 2, up: 3 })) {
      const key = `person-${person}-${direction}`
      if (!scene.anims.exists(key)) scene.anims.create({ key, frames: [row*3, row*3+1, row*3+2, row*3+1].map(frame => ({ key: `person-${person}`, frame })), frameRate: 12, repeat: -1 })
    }
  }
}
