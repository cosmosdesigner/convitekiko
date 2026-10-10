import Phaser from 'phaser'

export const pokemonTextures: Record<string, string> = {
  pika: 'pmd-pikachu', char: 'pmd-charmander', rat: 'pmd-rattata',
  fish: 'pmd-magikarp', puff: 'pmd-jigglypuff', eevee: 'pmd-eevee',
}
export const pokemonDirectionRows = { down:0, right:3, up:4, left:5 } as const

const names = ['pikachu', 'charmander', 'rattata', 'magikarp', 'jigglypuff', 'eevee']

export function loadPokemon(scene: Phaser.Scene) {
  for (const name of names) scene.load.spritesheet(`pmd-${name}`, `/assets/pmd/${name}.png`, { frameWidth: 32, frameHeight: 32 })
}

export function animatePokemon(scene: Phaser.Scene) {
  for (const name of names) {
    const key = `pmd-${name}-idle`
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(`pmd-${name}`, { start: 0, end: 3 }), frameRate: 6, repeat: -1 })
  }
  for (const name of ['charmander','pikachu','eevee']) for (const [direction,row] of Object.entries(pokemonDirectionRows)) {
    const key=`pmd-${name}-${direction}`
    if (!scene.anims.exists(key)) scene.anims.create({key,frames:scene.anims.generateFrameNumbers(`pmd-${name}`,{start:row*4,end:row*4+3}),frameRate:8,repeat:-1})
  }
}
