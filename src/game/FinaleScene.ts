import Phaser from 'phaser'
import { emit, events, type Input } from './events'
import { load } from './save'
import { animatePokemon } from './pmd'

export class FinaleScene extends Phaser.Scene {
  constructor(){super('finale')}
  create(){
    animatePokemon(this)
    const g=this.add.graphics();g.fillStyle(0x20394b).fillRect(0,0,480,320)
    for(let i=0;i<80;i++){const x=(i*73)%480,y=(i*137)%300;g.fillStyle(i%3?0x55758a:0xf8d879);g.fillRect(x,y,2,2)}
    g.fillStyle(0xf7e7ae).fillRect(65,57,350,238);g.fillStyle(0xacc4ab).fillRect(70,62,340,228)
    g.fillStyle(0x689a83).fillRect(79,71,322,210);g.fillStyle(0xfff5d4).fillRect(84,76,312,200)
    this.add.text(240,97,'MISSÃO CONCLUÍDA!',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#284650'}).setOrigin(.5)
    const trainer=this.add.sprite(193,177,'person-hero',1).setScale(3).setAlpha(0)
    const pika=this.add.sprite(286,177,'pmd-pikachu').setScale(3).setAlpha(0).play('pmd-pikachu-idle')
    this.tweens.add({targets:[trainer,pika],alpha:1,y:160,duration:500,delay:250})
    this.add.text(240,218,'FRANCISCO  ★  7 ANOS',{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#a44751'}).setOrigin(.5)
    const ball=this.add.image(240,158,'env-pokeball').setScale(0).setAlpha(0)
    this.time.delayedCall(950,()=>{ball.setAlpha(1);this.tweens.add({targets:ball,scale:4,duration:390,yoyo:true,hold:140,onComplete:()=>{
      ball.destroy();this.cameras.main.flash(360,255,244,177)
      if(load().song) {for(let i=0;i<12;i++){const b=this.add.circle(30+i*39,330,7+i%3*3,[0xe75b70,0xf4d774,0x73b6d1][i%3]);this.tweens.add({targets:b,y:45+(i%4)*22,duration:1100+i*80,onComplete:()=>b.destroy()})}}
      this.time.delayedCall(450,()=>this.showChoices())
    }})})
  }
  showChoices(){
    const button=(x:number,label:string,action:()=>void,primary=false)=>{
      this.add.rectangle(x,256,143,32,0x294652).setDepth(3)
      const face=this.add.rectangle(x,253,143,32,primary?0xc65352:0xfff4d4).setStrokeStyle(2,0x294652).setDepth(4).setInteractive({useHandCursor:true})
      this.add.text(x,253,label,{fontFamily:'Press Start 2P',fontSize:'8px',color:primary?'#ffffff':'#294652'}).setOrigin(.5).setDepth(5)
      face.on('pointerover',()=>face.setFillStyle(primary?0xdb6962:0xffffff))
      face.on('pointerout',()=>face.setFillStyle(primary?0xc65352:0xfff4d4))
      face.on('pointerdown',action)
    }
    button(160,'VER CONVITE',()=>emit('invitation'),true)
    button(320,'REINICIAR',()=>emit('replay'))
    const input=(event:Event)=>{
      const key=(event as CustomEvent<Input>).detail
      if(key==='a') emit('invitation')
      if(key==='b') emit('replay')
    }
    const enter=()=>emit('invitation')
    events.addEventListener('input',input)
    this.input.keyboard?.on('keydown-ENTER',enter)
    this.events.once('shutdown',()=>{events.removeEventListener('input',input);this.input.keyboard?.off('keydown-ENTER',enter)})
  }
}
