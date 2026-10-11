import Phaser from 'phaser'
import { lines } from './dialogues'
import { emit, events, held, type Input } from './events'
import { load, save, type Progress } from './save'
import { animatePokemon, loadPokemon, pokemonDirectionRows, pokemonTextures } from './pmd'
import { animatePeople, loadPeople } from './people'

const T = 16, W = 60, H = 45
type Direction = keyof typeof pokemonDirectionRows
let musicStarted = false
type Thing = { x: number; y: number; name: string; action: () => void; character?: boolean }
export class WorldScene extends Phaser.Scene {
  progress!: Progress
  px = 13; py = 36; facing: Direction = 'up'; moving = false
  player!: Phaser.GameObjects.Sprite
  companion?: Phaser.GameObjects.Sprite
  pikachuCompanion?: Phaser.GameObjects.Sprite
  pikachuNPC?: Phaser.GameObjects.Sprite
  eeveeCompanion?: Phaser.GameObjects.Sprite
  eeveeNPC?: Phaser.GameObjects.Sprite
  eeveeLabel?: Phaser.GameObjects.Text
  ballFollower?: Phaser.GameObjects.Image
  capturing = false
  followerTrail: {x:number;y:number}[] = []
  interactionHint?: Phaser.GameObjects.Container
  blocked = new Set<string>()
  things: Thing[] = []
  overlays: Phaser.GameObjects.GameObject[] = []
  dialog: string[] = []; dialogIndex = 0; typing = false; full = ''; dialogText?: Phaser.GameObjects.Text; dialogHint?: Phaser.GameObjects.Text; dialogBg?: Phaser.GameObjects.Rectangle; dialogInner?: Phaser.GameObjects.Rectangle; dialogTitle?: Phaser.GameObjects.Text; dialogTimer?: Phaser.Time.TimerEvent
  afterDialog?: () => void
  status!: Phaser.GameObjects.Text
  bridgeLights: Phaser.GameObjects.Arc[] = []
  gateForest?: Phaser.GameObjects.Image; gateBridge?: Phaser.GameObjects.Image; gateRival?: Phaser.GameObjects.Image
  bridgeStarted = 0
  songInput: number[] = []
  keys?: Record<string,Phaser.Input.Keyboard.Key>
  constructor() { super('world') }
  preload() {
    loadPokemon(this)
    loadPeople(this)
    for(const name of ['world-ground','tree','bush','flower','lab','home','francisco','pokeball','bubbles','leaf-pedestal-v2','bolt-pedestal-v2','star-pedestal-v2','sign','generator','note0-v3','note1-v3','note2-v3','forest-gate','bridge-gate','rival-gate']) this.load.image(`env-${name}`, `/assets/environment/${name}.png`)
    for (const sound of ['click_001','confirmation_001','error_001','open_001','close_001']) this.load.audio(sound, `/assets/${sound}.ogg`)
    this.load.audio('theme', '/assets/theme-v2.m4a')
  }
  create() {
    this.progress = load()
    this.px = 13; this.py = 36; this.facing = 'up'; this.moving = false
    this.blocked.clear(); this.things = []; this.overlays = []; this.dialog = []
    this.dialogIndex = 0; this.typing = false; this.afterDialog = undefined
    this.bridgeLights = []; this.bridgeStarted = 0; this.songInput = []
    this.companion = undefined; this.pikachuCompanion = undefined; this.pikachuNPC = undefined; this.eeveeCompanion = undefined; this.eeveeNPC = undefined; this.eeveeLabel = undefined; this.ballFollower = undefined; this.capturing = false; this.followerTrail = []; this.interactionHint = undefined
    animatePokemon(this); animatePeople(this)
    this.cameras.main.setBounds(0, 0, W*T, H*T).setBackgroundColor('#86a644')
    this.drawWorld()
    if (this.progress.invitation) { this.px = 55; this.py = 23 }
    else if (this.progress.battle) { this.px = 52; this.py = 22 }
    else if (this.progress.bridge) { this.px = 47; this.py = 22 }
    else if (this.progress.forest) { this.px = 39; this.py = 22 }
    else if (this.progress.chapter) { this.px = 20; this.py = 28 }
    this.player = this.add.sprite(this.px*T+8, this.py*T+16, 'person-hero', 1).setOrigin(.5,1).setDepth(20)
    if (this.progress.chapter) this.addCompanion()
    if (this.progress.pikachuJoined) this.addPikachuCompanion()
    if (this.progress.eeveeCaught) this.addEeveeCompanion()
    else if (this.progress.ballReturned) this.addBallFollower()
    this.cameras.main.startFollow(this.player, true, 0.13, 0.13)
    this.drawCompass()
    this.drawInteractionHint()
    this.status = this.add.text(8, 7, '', { fontFamily: 'DM Sans', fontStyle: 'bold', fontSize: '11px', color: '#253b31', backgroundColor: '#f8f0c5', padding: { x: 6, y: 4 } }).setScrollFactor(0).setDepth(90)
    this.updateStatus()
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key> | undefined
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      this.startMusic()
      const k = e.key.toLowerCase()
      if (['arrowup','arrowdown','arrowleft','arrowright',' ','enter','escape','w','a','s','d'].includes(k)) e.preventDefault()
      if (k === ' ' || k === 'enter') this.act()
      if (k === 'escape') this.cancel()
    })
    const input = (e: Event) => { this.startMusic(); const key = (e as CustomEvent<Input>).detail; if (key === 'a') this.act(); if (key === 'b') this.cancel() }
    events.addEventListener('input', input); this.events.once('shutdown', () => events.removeEventListener('input', input))
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.startMusic()
      if (this.dialog.length) { this.act(); return }
      if (this.capturing) return
      const tx = Math.floor(pointer.worldX / T), ty = Math.floor(pointer.worldY / T)
      if (Math.abs(tx - this.px) + Math.abs(ty - this.py) <= 1) { const thing = this.things.find(t => t.x === tx && t.y === ty); if (thing) thing.action() }
    })
    if (!this.progress.chapter) this.say('BOAS-VINDAS', lines.intro)
  }
  sfx(name = 'click_001') { try { this.sound.play(name, { volume: 0.35 }) } catch { /* audio may be disabled */ } }
  startMusic() { if(!musicStarted) { try { this.sound.play('theme', {volume:.10,loop:true});musicStarted=true } catch { /* autoplay blocked */ } } }
  key(x: number, y: number) { return `${x},${y}` }
  block(x: number, y: number) { this.blocked.add(this.key(x,y)) }
  label(x: number, y: number, text: string, color = '#fff4cd') { return this.add.text(x*T+8, y*T+2, text, { fontFamily: 'DM Sans', fontStyle: 'bold', fontSize: '9px', color, stroke: '#29453b', strokeThickness: 2 }).setOrigin(.5, 0).setDepth(11) }
  tree(x: number, y: number) {
    this.block(x,y)
    this.add.image(x*T+8,(y+1)*T,'env-tree').setOrigin(.5,1).setDepth(5)
  }
  house(x: number, y: number, type: string, title: string) {
    this.add.image(x*T,y*T,`env-${type}`).setOrigin(0).setDepth(5)
    for (let dx=0;dx<4;dx++) for(let dy=0;dy<3;dy++) if (!(dx===1 && dy===2)) this.block(x+dx,y+dy)
    this.label(type==='lab'?x+1:x+2,type==='lab'?y-2:y-1,title)
  }
  addCompanion() {
    if (this.companion) return
    const offsets: Record<Direction,[number,number]> = {up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}
    const [dx,dy]=offsets[this.facing]
    const behindBlocked=this.blocked.has(this.key(this.px+dx,this.py+dy))
    const cx=behindBlocked?this.px:this.px+dx
    const cy=behindBlocked?this.py:this.py+dy
    this.companion = this.add.sprite(cx*T+8,cy*T+8,'pmd-charmander',pokemonDirectionRows[this.facing]*4).setOrigin(.5,.75).setDepth(19)
    this.companion.setAlpha(0)
    this.tweens.add({ targets:this.companion, alpha:1, duration:350 })
  }
  addPikachuCompanion(actor?:Phaser.GameObjects.Sprite) {
    if (this.pikachuCompanion) return
    if (actor) {
      this.pikachuCompanion=actor.setDepth(18)
    } else {
      const charmX=this.companion?Math.round((this.companion.x-8)/T):this.px
      const charmY=this.companion?Math.round((this.companion.y-8)/T):this.py
      const dx=charmX-this.px,dy=charmY-this.py
      const candidates=[{x:this.px+dx*2,y:this.py+dy*2},{x:charmX-1,y:charmY},{x:charmX+1,y:charmY},{x:charmX,y:charmY-1},{x:charmX,y:charmY+1}]
      const spot=candidates.find(p=>p.x>0&&p.x<W-1&&p.y>0&&p.y<H-1&&!this.blocked.has(this.key(p.x,p.y))&&(p.x!==this.px||p.y!==this.py)&&(p.x!==charmX||p.y!==charmY))||{x:this.px,y:this.py}
      this.pikachuCompanion=this.add.sprite(spot.x*T+8,spot.y*T+8,'pmd-pikachu',pokemonDirectionRows[this.facing]*4).setOrigin(.5,.75).setDepth(18)
    }
    this.pikachuCompanion.stop().setFrame(pokemonDirectionRows[this.facing]*4)
    this.followerTrail=[{x:this.companion?Math.round((this.companion.x-8)/T):this.px,y:this.companion?Math.round((this.companion.y-8)/T):this.py}]
  }
  joinPikachu() {
    if (!this.pikachuNPC || this.progress.pikachuJoined) return
    this.progress.pikachuJoined=true; save(this.progress)
    this.things=this.things.filter(t=>!(t.x===53&&t.y===21&&t.name==='PIKACHU'))
    this.blocked.delete(this.key(53,21))
    this.addPikachuCompanion(this.pikachuNPC)
    this.pikachuNPC=undefined
    this.updateInteractionHint();this.updateStatus();this.sfx('confirmation_001')
  }
  addBallFollower(fromChild=false) {
    if (this.ballFollower || this.progress.eeveeCaught) return
    const last=this.pikachuCompanion||this.companion||this.player
    const offset={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[this.facing]
    const bx=last.x+offset[0]*T,by=last.y+offset[1]*T
    const spot=this.blocked.has(this.key(Math.floor(bx/T),Math.floor(by/T)))?{x:last.x,y:last.y}:{x:bx,y:by}
    this.ballFollower=this.add.image(fromChild?17*T+8:spot.x,fromChild?34*T+8:spot.y,'env-pokeball').setDepth(17)
    if(fromChild) this.tweens.add({targets:this.ballFollower,x:spot.x,y:spot.y,duration:400,ease:'Sine.easeInOut'})
  }
  addEeveeCompanion() {
    if(this.eeveeCompanion) return
    const last=this.pikachuCompanion||this.companion||this.player
    const offset={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[this.facing]
    const ex=last.x+offset[0]*T,ey=last.y+offset[1]*T
    const spot=this.blocked.has(this.key(Math.floor(ex/T),Math.floor(ey/T)))?{x:last.x,y:last.y}:{x:ex,y:ey}
    this.eeveeCompanion=this.add.sprite(spot.x,spot.y,'pmd-eevee',pokemonDirectionRows[this.facing]*4).setOrigin(.5,.75).setDepth(18)
  }
  captureEevee() {
    const ball=this.ballFollower,eevee=this.eeveeNPC
    if(!ball||!eevee||this.capturing)return
    this.capturing=true;this.interactionHint?.setVisible(false)
    this.tweens.killTweensOf(ball)
    const targetX=eevee.x,targetY=eevee.y
    this.sfx('open_001')
    this.tweens.add({targets:ball,x:(ball.x+targetX)/2,y:Math.min(ball.y,targetY)-45,angle:360,scale:1.5,duration:390,ease:'Quad.easeOut',onComplete:()=>{
      this.tweens.add({targets:ball,x:targetX,y:targetY,scale:1,duration:240,ease:'Quad.easeIn',onComplete:()=>{
        this.sfx('confirmation_001')
        const flash=this.add.circle(targetX,targetY,5,0xffe7a1).setDepth(30)
        this.tweens.add({targets:flash,scale:5,alpha:0,duration:440,onComplete:()=>flash.destroy()})
        this.tweens.add({targets:eevee,scale:0,alpha:0,duration:330,onComplete:()=>{
          eevee.destroy();this.eeveeNPC=undefined
          this.eeveeLabel?.destroy();this.eeveeLabel=undefined
          this.tweens.add({targets:ball,y:targetY-9,duration:160,yoyo:true,repeat:2,ease:'Sine.easeInOut',onComplete:()=>{
            this.sfx('confirmation_001')
            ball.destroy();this.ballFollower=undefined
            this.things=this.things.filter(t=>t.name!=='EEVEE');this.blocked.delete(this.key(6,12))
            this.progress.eeveeCaught=true;save(this.progress)
            this.addEeveeCompanion();this.capturing=false;this.updateStatus()
            this.say('EEVEE',lines.eeveeCaught)
          }})
        }})
      }})
    }})
  }
  drawCompass() {
    const compass=this.add.container(443,36).setScrollFactor(0).setDepth(95)
    const g=this.add.graphics()
    g.fillStyle(0xfff6d9,.92).fillCircle(0,0,19)
    g.lineStyle(2,0x344f5b).strokeCircle(0,0,19)
    g.lineStyle(1,0xa9a687).strokeCircle(0,0,13)
    g.fillStyle(0xc75853).fillTriangle(0,-13,-5,7,0,3)
    g.fillStyle(0x547981).fillTriangle(0,13,5,-7,0,-3)
    compass.add(g)
    const letter=(text:string,x:number,y:number)=>this.add.text(x,y,text,{fontFamily:'DM Sans',fontSize:'8px',fontStyle:'bold',color:'#304a51'}).setOrigin(.5)
    compass.add([letter('N',0,-25),letter('S',0,25),letter('O',-25,0),letter('E',25,0)])
  }
  drawInteractionHint() {
    const hint=this.add.container(0,0).setDepth(30).setVisible(false)
    const circle=this.add.circle(0,0,10,0xfff7d9).setStrokeStyle(2,0x41545a)
    const letter=this.add.text(0,0,'A',{fontFamily:'DM Sans',fontSize:'11px',fontStyle:'bold',color:'#b54e53'}).setOrigin(.5)
    hint.add([circle,letter]); this.interactionHint=hint
    this.tweens.add({targets:hint,scale:1.2,duration:560,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})
  }
  updateInteractionHint() {
    const hint=this.interactionHint
    if (!hint || this.dialog.length || this.capturing) { hint?.setVisible(false); return }
    const available=(t:Thing)=>!(t.name==='POKÉBOLA'&&this.progress.ballFound) && !(t.name==='BOLHAS'&&this.progress.magikarp)
    const nearby=this.things.find(t=>available(t) && t.x===this.px+(this.facing==='left'?-1:this.facing==='right'?1:0) && t.y===this.py+(this.facing==='up'?-1:this.facing==='down'?1:0))
      || this.things.find(t=>available(t) && Math.abs(t.x-this.px)+Math.abs(t.y-this.py)===1)
    hint.setVisible(!!nearby)
    if (nearby) hint.setPosition(nearby.x*T+8,nearby.y*T-(nearby.character?9:14))
  }
  drawWorld() {
    this.add.image(0,0,'env-world-ground').setOrigin(0).setDepth(-10)
    for (let y=26;y<40;y++) for (let x=2;x<19;x++) {
      if ((x*7+y*11)%19===0 && (x<9||x>15)) this.add.image(x*T+8,y*T+8,'env-flower').setDepth(2)
    }
    for (let y=13;y<30;y++) for (let x=19;x<38;x++) {
      if ((x*13+y*7)%23===0 && (y<19||y>25)) this.add.image(x*T+8,y*T+8,'env-bush').setDepth(2)
    }
    // The lake occupies the western branch.
    for(let y=13;y<23;y++) for(let x=3;x<15;x++) if ((x-9)**2/36+(y-18)**2/25<1) {
      this.block(x,y)
    }
    for(const [x,y] of [[6,16],[9,19],[12,17],[44,19],[45,24]]) {
      const ripple=this.add.rectangle(x*T+8,y*T+8,7,2,0xb6eee0).setAlpha(.18).setDepth(1)
      this.tweens.add({targets:ripple,alpha:.8,duration:1050+(x%3)*270,yoyo:true,repeat:-1})
    }
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x===0||y===0||x===W-1||y===H-1) this.tree(x,y)
    for(let y=5;y<36;y++) for(let x=19;x<39;x++) {
      const clear = (y>=18&&y<=26&&x>=22&&x<=38) || (x>=19&&x<=24&&y>=20&&y<=32)
      if (!clear && (x+y*3)%5<2 && (x*11+y*5)%7!==0) this.tree(x,y)
    }
    for(let x=2;x<19;x++) { if(x%3===0) this.tree(x,10); if(x%4===0 && x!==12) this.tree(x,39) }
    for(let y=27;y<41;y++) { if(y%3===0) this.tree(4,y); if(y%4===0) this.tree(18,y) }
    this.house(9,32,'lab','LABORATÓRIO'); this.house(5,35,'home','CASA'); this.house(54,19,'francisco','FRANCISCO')
    // The eastern corridor is fenced so gates cannot be bypassed.
    for(let x=38;x<59;x++) for(let y=0;y<H;y++) if(y<19||y>24) this.block(x,y)
    if(!this.progress.eeveeCaught) this.eeveeLabel=this.label(8,11,'EEVEE')
    this.gateForest = this.add.image(38*T,19*T,'env-forest-gate').setOrigin(0).setDepth(9).setVisible(!this.progress.forest)
    this.gateBridge = this.add.image(46*T,19*T,'env-bridge-gate').setOrigin(0).setDepth(9).setVisible(!this.progress.bridge)
    this.gateRival = this.add.image(51*T,19*T,'env-rival-gate').setOrigin(0).setDepth(9).setVisible(!this.progress.battle)
    if (!this.progress.bridge) this.tweens.add({targets:this.gateBridge,alpha:.65,duration:650,yoyo:true,repeat:-1})
    this.label(22,16,'✦ FLORESTA DO PIKACHU ✦'); this.label(40,16,'PONTE ELÉTRICA'); this.label(6,32,'VILA DO TROVÃO')
    this.character(13,31,'oak','CARVALHO', () => {
      if (!this.progress.chapter) this.say('PROF. CARVALHO', lines.oak, () => { this.progress.chapter=1; save(this.progress); this.addCompanion(); this.updateStatus(); this.sfx('confirmation_001') })
      else this.say('PROF. CARVALHO', lines.oakAgain)
    })
    this.character(17,34,'child','CRIANÇA', () => {
      if(this.progress.ballReturned) this.say('CRIANÇA',this.progress.eeveeCaught?lines.childCaught:lines.childAfter)
      else if(this.progress.ballFound) this.say('CRIANÇA',lines.childDone,()=>{this.progress.ballReturned=true;this.progress.potions++;save(this.progress);this.addBallFollower(true);this.updateStatus();this.sfx('confirmation_001')})
      else this.say('CRIANÇA',lines.child)
    })
    this.character(16,21,'fisher','PESCADOR',()=> this.say('PESCADOR',this.progress.magikarp?lines.fisherDone:lines.fisher))
    this.character(8,29,'puff','JIGGLYPUFF',()=> {
      if(this.progress.song) this.say('JIGGLYPUFF',['♪ ♫ ♪  Que linda melodia! Encontramo-nos na festa!'])
      else this.say('JIGGLYPUFF',lines.melody,()=>{this.songInput=[];this.showNotes()})
    })
    this.character(29,24,'explorer','EXPLORADOR',()=>this.say('EXPLORADOR',['A floresta canta: a folha nasce, o raio brilha e a estrela aparece por último.']))
    this.character(41,24,'technician','TÉCNICO',()=>this.say('TÉCNICO',[this.bridgeStarted && this.time.now-this.bridgeStarted>45000 ? 'Dica: às vezes basta ativar o gerador mais perto da saída!' : 'Cada gerador muda também os vizinhos. Liga os três para abrir a ponte!']))
    this.character(50,21,'rival','RIVAL',()=>{ if(this.progress.battle) this.say('RIVAL',['Muito bem, treinador! O Pikachu está à tua espera.']); else this.say('RIVAL',lines.rival,()=>this.scene.start('battle')) })
    if (!this.progress.pikachuJoined) this.pikachuNPC=this.character(53,21,'pika','PIKACHU',()=>{
      if(!this.progress.battle) this.say('PIKACHU',['Pika? Ainda falta vencer o rival!'])
      else this.say('PIKACHU',lines.pikachu,()=>this.joinPikachu())
    })
    if(!this.progress.eeveeCaught) this.eeveeNPC=this.character(6,12,'eevee','EEVEE',()=>{
      if(!this.progress.ballFound) this.say('EEVEE',lines.eeveeWithoutBall)
      else if(!this.progress.ballReturned) this.say('EEVEE',lines.eeveeReturnBall)
      else this.say('EEVEE',lines.eeveeReady,()=>this.captureEevee())
    })
    this.thing(55,21,'PORTA',()=>{
      if(!this.progress.battle) this.say('PORTA',['A casa está fechada.'])
      else this.finale()
    })
    const ballIcon=this.thing(7,30,'POKÉBOLA',()=>{
      if(!this.progress.ballFound) {this.progress.ballFound=true;ballIcon?.setVisible(false);save(this.progress);this.sfx('confirmation_001');this.say('POKÉBOLA',['Encontraste a Pokébola perdida! Leva-a à criança junto do laboratório.'])}
    },this.progress.ballFound?undefined:'pokeball')
    this.thing(14,22,'BOLHAS',()=>{
      if(!this.progress.magikarp) {this.progress.magikarp=true;save(this.progress);this.add.sprite(14*T+8,22*T+8,'pmd-magikarp').setOrigin(.5,.75).setDepth(12).play('pmd-magikarp-idle');this.say('MAGIKARP',['Magikarp! Encontraste-o! Volta ao pescador para ouvires uma pista.'])}
    },this.progress.magikarp?undefined:'bubbles')
    ;([[26,20,'FOLHA','leaf-pedestal-v2'],[30,19,'RAIO','bolt-pedestal-v2'],[34,21,'ESTRELA','star-pedestal-v2']] as const).forEach(([x,y,name,texture],index)=> {this.thing(x,y,name,()=>this.pedestal(index),texture);this.label(x,y-2,name)})
    this.thing(25,24,'PLACA',()=>this.say('PLACA',['Primeiro, algo que cresce na floresta...']),'sign')
    this.thing(33,24,'PLACA',()=>this.say('PLACA',['O brilho no céu vem depois do trovão.']),'sign')
    for(let i=0;i<3;i++) {
      const x=40+i*2; const light=this.add.circle(x*T+12,19*T+4,3,this.progress.generators[i]?0xf6dd62:0x33475a).setDepth(12);this.bridgeLights.push(light)
      this.thing(x,19,`GERADOR ${i+1}`,()=>this.generator(i),'generator')
    }
    for(let i=0;i<3;i++) {const symbol=i===1?'♫':'♪';this.thing(6+i*2,26,`NOTA ${i+1}`,()=>this.note(i),`note${i}-v3`);this.label(6+i*2,24,`${i+1} ${symbol}`)}
  }
  character(x:number,y:number,sprite:string,name:string,action:()=>void) { const pokemon=pokemonTextures[sprite];const actor=pokemon ? this.add.sprite(x*T+8,y*T+8,pokemon).setOrigin(.5,.75).play(`${pokemon}-idle`) : this.add.sprite(x*T+8,y*T+16,`person-${sprite}`,1).setOrigin(.5,1);actor.setDepth(12);this.block(x,y);this.things.push({x,y,name,action,character:true});return actor }
  thing(x:number,y:number,name:string,action:()=>void,texture?:string) {
    const image=texture?this.add.image(x*T+8,y*T+8,`env-${texture}`).setDepth(10):undefined
    if(image&&texture?.endsWith('-v2')) this.tweens.add({targets:image,y:y*T+6,duration:850+x%3*170,yoyo:true,repeat:-1})
    this.block(x,y);this.things.push({x,y,name,action});return image
  }
  openGate(gate?:Phaser.GameObjects.Image) {
    if (!gate) return
    this.tweens.killTweensOf(gate)
    this.tweens.add({targets:gate,alpha:0,duration:360,onComplete:()=>gate.setVisible(false)})
  }
  pedestal(index:number) {
    if(!this.progress.chapter) {this.say('PEDESTAL',['Fala primeiro com o Professor Carvalho no laboratório.']);return}
    if(this.progress.forest) {this.say('PEDESTAL',['Os símbolos já abriram a passagem!']);return}
    if(index===this.progress.symbols.length) {
      this.progress.symbols.push(index);this.sfx('click_001')
       if(this.progress.symbols.length===3) {this.progress.forest=true;this.progress.chapter=2;this.openGate(this.gateForest);this.sfx('confirmation_001');this.say('FLORESTA',lines.forestDone)}
      else this.say('PEDESTAL',[`${['Folha','Raio','Estrela'][index]} ativado! ${this.progress.symbols.length}/3`])
    } else {
      this.progress.symbols=[];this.progress.mistakes++;this.sfx('error_001')
      this.say('PEDESTAL',[this.progress.mistakes>=2?'A sequência reiniciou. Dica: Folha → Raio → Estrela.':'A sequência reiniciou. Lê as placas para encontrares a ordem!'])
    }
    save(this.progress);this.updateStatus()
  }
  generator(index:number) {
    if(!this.progress.forest) {this.say('GERADOR',['A passagem da floresta continua fechada.']);return}
    if(this.progress.bridge) {this.say('GERADOR',['Todos os geradores estão ligados!']);return}
    if(!this.bridgeStarted) this.bridgeStarted=this.time.now
    for(let i=Math.max(0,index-1);i<=Math.min(2,index+1);i++) {this.progress.generators[i]=!this.progress.generators[i];this.bridgeLights[i].setFillStyle(this.progress.generators[i]?0xf6dd62:0x33475a)}
    this.sfx('click_001')
    if(this.progress.generators.every(Boolean)) {this.progress.bridge=true;this.progress.chapter=3;this.openGate(this.gateBridge);this.say('PONTE',['Os três geradores estão ligados! A ponte abriu-se.']);this.sfx('confirmation_001')}
    else this.say('GERADORES',[`Estado: ${this.progress.generators.map(v=>v?'●':'○').join('  ')} — ativa todos os três!`])
    save(this.progress);this.updateStatus()
  }
  showNotes() { this.say('MELODIA',['Vai até às três notas coloridas perto do Jigglypuff. Repete: ♪ (esquerda) → ♫ (centro) → ♪ (esquerda).']) }
  note(i:number) {
    if(this.progress.song) {this.say('NOTA',['A melodia já foi completada!']);return}
    this.songInput.push(i);this.sfx('click_001')
    const target=[0,1,0]
    if(this.songInput.some((v,n)=>v!==target[n])) {this.songInput=[];this.say('MELODIA',['Não foi desta! Tenta: ♪ → ♫ → ♪.'])}
    else if(this.songInput.length===3) {this.progress.song=true;save(this.progress);this.say('JIGGLYPUFF',['♪ ♫ ♪  Perfeito! Haverá uma surpresa especial no fim!']);this.sfx('confirmation_001')}
    else this.say('MELODIA',[`Nota certa! ${this.songInput.length}/3`])
  }
  updateStatus() {
    const p=this.progress
    const main=p.invitation?'MISSÃO CONCLUÍDA  ★':!p.chapter?'OBJETIVO  ▸ Professor Carvalho':!p.forest?'OBJETIVO  ▸ Folha → Raio → Estrela':!p.bridge?'OBJETIVO  ▸ Ligar os geradores':!p.battle?'OBJETIVO  ▸ Vencer o rival':!p.pikachuJoined?'OBJETIVO  ▸ Falar com Pikachu':'OBJETIVO  ▸ Casa do Francisco'
    this.status?.setText(main+(p.ballReturned&&!p.eeveeCaught&&!p.invitation?'\nEXTRA  ▸ Eevee junto ao lago':''))
  }
  say(name:string,text:readonly string[],after?:()=>void) {
    if(this.dialog.length) return
    this.afterDialog=after;this.dialog=[...text];this.dialogIndex=0
    const boxWidth=Math.min(464,this.scale.width-16)
    this.dialogBg=this.add.rectangle(this.scale.width/2,0,boxWidth,83,0xfff9dd).setStrokeStyle(4,0x344f5b).setScrollFactor(0).setDepth(100)
    this.dialogInner=this.add.rectangle(this.scale.width/2,0,boxWidth-11,72).setStrokeStyle(1,0xa3a38c).setScrollFactor(0).setDepth(101)
    this.dialogTitle=this.add.text(18,0,name,{fontFamily:'DM Sans',fontSize:'13px',color:'#a4444d',fontStyle:'bold'}).setScrollFactor(0).setDepth(102)
    this.dialogText=this.add.text(18,0,'',{fontFamily:'DM Sans',fontSize:'14px',color:'#273e47',wordWrap:{width:boxWidth-36},lineSpacing:2}).setScrollFactor(0).setDepth(102)
    this.dialogHint=this.add.text(this.scale.width/2,0,'',{fontFamily:'DM Sans',fontSize:'9px',fontStyle:'bold',color:'#a4444d'}).setOrigin(.5).setScrollFactor(0).setDepth(102)
    this.overlays=[this.dialogBg,this.dialogInner,this.dialogTitle,this.dialogText,this.dialogHint];this.nextLine()
  }
  nextLine() {
    this.full=this.dialog[this.dialogIndex];let position=0;this.typing=true;this.dialogHint?.setText('')
    // Measure the fully wrapped line before the typewriter effect starts.
    this.dialogText?.setText(this.full)
    const boxHeight=Math.max(83,(this.dialogText?.height??0)+49)
    const bottom=this.scale.height>500?this.scale.height-165:314
    const top=bottom-boxHeight
    this.dialogBg?.setPosition(this.scale.width/2,top+boxHeight/2).setSize(this.dialogBg.width,boxHeight)
    this.dialogInner?.setPosition(this.scale.width/2,top+boxHeight/2).setSize(this.dialogInner.width,boxHeight-11)
    this.dialogTitle?.setY(top+7)
    this.dialogText?.setY(top+25).setText('')
    this.dialogHint?.setY(bottom-12)
    this.dialogTimer=this.time.addEvent({delay:22,repeat:this.full.length-1,callback:()=>{position++;this.dialogText?.setText(this.full.slice(0,position));if(position>=this.full.length){this.typing=false;this.updateDialogHint()}}})
  }
  updateDialogHint() {
    this.dialogHint?.setText(this.dialogIndex===this.dialog.length-1?'A / ENTER PARA FECHAR':'A / ENTER PARA CONTINUAR')
  }
  act() {
    if(this.capturing) return
    if(this.dialog.length) {
      if(this.typing) {this.dialogTimer?.remove();this.dialogText?.setText(this.full);this.typing=false;this.updateDialogHint();return}
      this.dialogIndex++;this.sfx()
      if(this.dialogIndex<this.dialog.length) this.nextLine()
      else {this.overlays.forEach(o=>o.destroy());this.overlays=[];this.dialog=[];const done=this.afterDialog;this.afterDialog=undefined;done?.()}
      return
    }
    const dx=this.facing==='left'?-1:this.facing==='right'?1:0,dy=this.facing==='up'?-1:this.facing==='down'?1:0
    const thing=this.things.find(t=>t.x===this.px+dx&&t.y===this.py+dy) || this.things.find(t=>Math.abs(t.x-this.px)+Math.abs(t.y-this.py)<=1)
    if(thing) thing.action()
  }
  cancel() { if(this.dialog.length && !this.afterDialog) {this.dialogTimer?.remove();this.overlays.forEach(o=>o.destroy());this.overlays=[];this.dialog=[]} }
  update(_time:number,delta:number) {
    this.updateInteractionHint()
    if(this.dialog.length||this.moving||this.capturing) return
    const keys=this.keys
    const direction: Direction | null = (keys?.UP?.isDown||keys?.W?.isDown||held==='up')?'up':(keys?.DOWN?.isDown||keys?.S?.isDown||held==='down')?'down':(keys?.LEFT?.isDown||keys?.A?.isDown||held==='left')?'left':(keys?.RIGHT?.isDown||keys?.D?.isDown||held==='right')?'right':null
    if(!direction) return
    this.facing=direction
    for (const follower of [this.companion,this.pikachuCompanion,this.eeveeCompanion]) if (follower) { follower.stop(); follower.setFrame(pokemonDirectionRows[direction]*4) }
    const nx=this.px+(direction==='left'?-1:direction==='right'?1:0),ny=this.py+(direction==='up'?-1:direction==='down'?1:0)
    if(nx<1||ny<1||nx>=W-1||ny>=H-1) return
    if(nx===38&&ny>=19&&ny<=24&&!this.progress.forest) {this.say('PASSAGEM',lines.forestLocked);return}
    if(nx===46&&ny>=19&&ny<=24&&!this.progress.bridge) {this.say('PONTE',['Os geradores bloqueiam a ponte. Liga os três!']);return}
    if(nx===51&&ny>=19&&ny<=24&&!this.progress.battle) {this.say('RIVAL',lines.rival,()=>this.scene.start('battle'));return}
    if(this.blocked.has(this.key(nx,ny))) return
    const previousX=this.px,previousY=this.py
    this.px=nx;this.py=ny;this.moving=true
    this.followerTrail.unshift({x:previousX,y:previousY});this.followerTrail.length=Math.min(this.followerTrail.length,4)
    this.player.play(`person-hero-${direction}`,true)
    this.tweens.add({targets:this.player,x:nx*T+8,y:ny*T+16,duration:230,ease:'Sine.easeInOut',onComplete:()=>{this.moving=false;this.player.stop();this.player.setFrame(({down:0,left:1,right:2,up:3} as const)[direction]*3+1)}})
    const followers=[this.companion,this.pikachuCompanion,this.eeveeCompanion,this.ballFollower].filter((f):f is Phaser.GameObjects.Sprite|Phaser.GameObjects.Image=>!!f)
    followers.forEach((follower,index)=>{
      const target=this.followerTrail[index]||this.followerTrail[this.followerTrail.length-1]
      this.tweens.killTweensOf(follower)
      if(follower instanceof Phaser.GameObjects.Sprite) follower.play(`${follower.texture.key}-${direction}`)
      this.tweens.add({targets:follower,x:target.x*T+8,y:target.y*T+8,duration:230,delay:55+index*35,ease:'Sine.easeInOut',onComplete:()=>{
        if(follower instanceof Phaser.GameObjects.Sprite){follower.stop();follower.setFrame(pokemonDirectionRows[direction]*4)}
      }})
    })
  }
  finale() {this.progress.invitation=true;this.progress.chapter=5;save(this.progress);this.sfx('open_001');this.cameras.main.fadeOut(450,255,249,221);this.time.delayedCall(500,()=>this.scene.start('finale'))}
}
