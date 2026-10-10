import Phaser from 'phaser'
import { events, type Input } from './events'
import { load, save } from './save'
import { animatePokemon } from './pmd'

type Menu = 'main' | 'fight' | 'bag' | 'pokemon' | 'result'
export class BattleScene extends Phaser.Scene {
  hp=24; enemy=20; potions=1; growl=false; turn=0; menu:Menu='main'; busy=false; over=false; selected=0
  bg!:Phaser.GameObjects.Graphics; info!:Phaser.GameObjects.Text; options!:Phaser.GameObjects.Text
  playerBar!:Phaser.GameObjects.Rectangle; enemyBar!:Phaser.GameObjects.Rectangle
  foe!:Phaser.GameObjects.Sprite
  menuTop=226
  get mobile(){return this.scale.scaleMode===Phaser.Scale.RESIZE}
  constructor() {super('battle')}
  create() {
    animatePokemon(this);this.potions=load().potions
    this.cameras.main.setBackgroundColor('#e9efd7')
    if(this.mobile) this.drawMobileBattle()
    else this.drawDesktopBattle()
    this.bg=this.add.graphics().setDepth(10)
    this.info=this.add.text(this.mobile?18:18,this.mobile?this.menuTop+12:239,'',{fontFamily:'monospace',fontSize:this.mobile?'13px':'14px',color:'#253e49',wordWrap:{width:this.mobile?this.scale.width-36:258},lineSpacing:5}).setDepth(12)
    this.options=this.add.text(304,241,'',{fontFamily:'monospace',fontSize:'13px',color:'#263c43',lineSpacing:12}).setDepth(12)
    this.drawMenu();this.message('Um Rattata desafia-te! Escolhe o teu comando.')
    this.input.keyboard?.on('keydown-ESC',()=>this.back())
    this.input.keyboard?.on('keydown-UP',()=>this.navigate('up'))
    this.input.keyboard?.on('keydown-DOWN',()=>this.navigate('down'))
    this.input.keyboard?.on('keydown-LEFT',()=>this.navigate('left'))
    this.input.keyboard?.on('keydown-RIGHT',()=>this.navigate('right'))
    this.input.keyboard?.on('keydown-W',()=>this.navigate('up'))
    this.input.keyboard?.on('keydown-S',()=>this.navigate('down'))
    this.input.keyboard?.on('keydown-A',()=>this.navigate('left'))
    this.input.keyboard?.on('keydown-D',()=>this.navigate('right'))
    this.input.keyboard?.on('keydown-SPACE',()=>this.confirmKeyboard())
    this.input.keyboard?.on('keydown-ENTER',()=>this.confirmKeyboard())
    const listener=(e:Event)=>{const key=(e as CustomEvent<Input>).detail;if(key==='b')this.back();else if(key==='a')this.confirmKeyboard();else this.navigate(key)}
    events.addEventListener('input',listener);this.events.once('shutdown',()=>events.removeEventListener('input',listener))
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      if(this.busy) return
      if(this.mobile){
        if(p.y<this.menuTop+78||p.y>this.menuTop+176)return
        this.select((p.y>=this.menuTop+128?2:0)+(p.x>=this.scale.width/2?1:0))
      } else {
        if(p.y<236)return
        this.select((p.y>277?2:0)+(p.x>380?1:0))
      }
    })
  }
  drawDesktopBattle(){
    const g=this.add.graphics()
    g.fillStyle(0xd9e8d4).fillRect(0,0,480,320)
    for(let y=0;y<210;y+=8) {g.fillStyle(y%16?0xe1e9d6:0xd8e3cf);g.fillRect(0,y,480,4)}
    g.fillStyle(0x9dbca3).fillEllipse(345,119,180,29);g.fillEllipse(105,210,170,24)
    g.fillStyle(0x40565d).fillRoundedRect(19,20,179,64,5);g.fillStyle(0xfff9dc).fillRoundedRect(23,24,171,56,3)
    g.fillStyle(0x40565d).fillRoundedRect(278,151,182,62,5);g.fillStyle(0xfff9dc).fillRoundedRect(282,155,174,54,3)
    this.add.sprite(345,99,'pmd-rattata').setScale(3).setDepth(5).play('pmd-rattata-idle')
    this.foe=this.add.sprite(105,177,'pmd-charmander').setScale(4).setFlipX(true).setDepth(5).play('pmd-charmander-idle')
    this.add.text(31,30,'RATTATA    Nv.5',{fontFamily:'monospace',fontSize:'14px',color:'#253b45',fontStyle:'bold'})
    this.add.text(292,160,'CHARMANDER Nv.5',{fontFamily:'monospace',fontSize:'14px',color:'#253b45',fontStyle:'bold'})
    this.add.text(31,58,'PS',{fontFamily:'monospace',fontSize:'11px',color:'#3d5b55'})
    this.add.text(292,188,'PS',{fontFamily:'monospace',fontSize:'11px',color:'#3d5b55'})
    g.fillStyle(0x303e4b).fillRect(51,59,128,9);g.fillRect(312,189,128,9)
    this.enemyBar=this.add.rectangle(53,61,124,5,0x6abe72).setOrigin(0)
    this.playerBar=this.add.rectangle(314,191,124,5,0x6abe72).setOrigin(0)
  }
  drawMobileBattle(){
    const w=this.scale.width,h=this.scale.height
    this.menuTop=h-350
    const foeY=Math.min(180,this.menuTop-139),playerY=this.menuTop-55
    const g=this.add.graphics()
    g.fillStyle(0xd9e8d4).fillRect(0,0,w,h)
    for(let y=0;y<this.menuTop;y+=16){g.fillStyle(y%32?0xe1e9d6:0xd8e3cf);g.fillRect(0,y,w,4)}
    g.fillStyle(0x9dbca3).fillEllipse(w-82,foeY+30,135,22).fillEllipse(w-82,playerY+35,145,25)
    const panel=(y:number)=>{g.fillStyle(0x40565d).fillRoundedRect(12,y,188,62,5);g.fillStyle(0xfff9dc).fillRoundedRect(16,y+4,180,54,3)}
    panel(46);panel(this.menuTop-103)
    this.add.sprite(w-82,foeY,'pmd-rattata').setScale(2).setDepth(5).play('pmd-rattata-idle')
    this.foe=this.add.sprite(w-82,playerY,'pmd-charmander').setScale(2.6).setFlipX(true).setDepth(5).play('pmd-charmander-idle')
    this.add.text(25,55,'RATTATA    Nv.5',{fontFamily:'monospace',fontSize:'13px',color:'#253b45',fontStyle:'bold'})
    this.add.text(25,this.menuTop-94,'CHARMANDER Nv.5',{fontFamily:'monospace',fontSize:'13px',color:'#253b45',fontStyle:'bold'})
    this.add.text(25,82,'PS',{fontFamily:'monospace',fontSize:'11px',color:'#3d5b55'})
    this.add.text(25,this.menuTop-67,'PS',{fontFamily:'monospace',fontSize:'11px',color:'#3d5b55'})
    g.fillStyle(0x303e4b).fillRect(45,84,128,9).fillRect(45,this.menuTop-65,128,9)
    this.enemyBar=this.add.rectangle(47,86,124,5,0x6abe72).setOrigin(0)
    this.playerBar=this.add.rectangle(47,this.menuTop-63,124,5,0x6abe72).setOrigin(0)
  }
  soundEffect(name:string) {try{this.sound.play(name,{volume:.4})}catch{/* audio unavailable */}}
  drawMenu() {
    if(this.mobile){
      const w=this.scale.width,y=this.menuTop
      this.bg.clear().fillStyle(0x354e59).fillRect(8,y,w-16,180).fillStyle(0xfff9df).fillRect(12,y+4,w-24,172).lineStyle(2,0xadb5a2).strokeRect(16,y+8,w-32,164)
      this.bg.lineStyle(2,0xadb5a2).lineBetween(16,y+75,w-16,y+75)
    } else {
    this.bg.clear().fillStyle(0x354e59).fillRect(4,226,472,90).fillStyle(0xfff9df).fillRect(8,230,464,82).lineStyle(2,0xadb5a2).strokeRect(12,234,456,74)
    this.bg.lineStyle(3,0x354e59).lineBetween(290,232,290,310)
    }
    const labels=this.menu==='main'?['LUTAR','MOCHILA','POKÉMON','FUGIR']:this.menu==='fight'?['SCRATCH','EMBER','GROWL','VOLTAR']:this.menu==='bag'?[`POÇÃO ×${this.potions}`,'VOLTAR']:this.menu==='pokemon'?['CHARMANDER','VOLTAR']:this.menu==='result'?['REPETIR','VOLTAR']:[]
    this.options.setText(labels.map((v,i)=>`${i===0||i===2?'▸':' '} ${v.padEnd(10,' ')}`).join('  '))
    this.options.setWordWrapWidth(166)
    // Explicit grid, rather than relying on whitespace in proportional rendering.
    this.options.setVisible(false)
    this.choiceTexts?.forEach(t=>t.destroy());this.choiceTexts=[]
    labels.forEach((s,i)=>this.choiceTexts!.push(this.add.text(this.mobile?22+(i%2)*(this.scale.width/2-7):301+(i%2)*83,this.mobile?this.menuTop+94+Math.floor(i/2)*42:243+Math.floor(i/2)*36,(i===this.selected?'▸ ':'  ')+s,{fontFamily:'monospace',fontSize:this.mobile?'13px':'11px',color:i===this.selected?'#ba4d52':'#263c43'}).setDepth(12)))
  }
  choiceTexts?:Phaser.GameObjects.Text[]
  message(text:string){this.info.setText(text)}
  back(){if(this.busy||this.over)return;this.menu='main';this.selected=0;this.drawMenu();this.message('O que deve fazer o Charmander?')}
  navigate(direction:Input){if(this.busy)return;const count=this.menu==='bag'||this.menu==='pokemon'||this.menu==='result'?2:4;const next=direction==='up'?this.selected-2:direction==='down'?this.selected+2:direction==='left'?this.selected-1:this.selected+1;if(next>=0&&next<count){this.selected=next;this.drawMenu()}}
  confirmKeyboard(){if(!this.busy)this.select(this.selected)}
  select(i:number) {
    if(this.busy)return
    this.soundEffect('click_001')
    if(this.menu==='result') {if(i===0)this.restartBattle();else this.scene.start('world');return}
    if(this.menu==='main') {
      if(i===0){this.menu='fight';this.selected=0;this.message('Escolhe um ataque.');this.drawMenu()}
      if(i===1){this.menu='bag';this.selected=0;this.message(`Tens ${this.potions} ${this.potions===1?'poção':'poções'}.`);this.drawMenu()}
      if(i===2){this.menu='pokemon';this.selected=0;this.message('Charmander é o teu único Pokémon!');this.drawMenu()}
      if(i===3)this.message('Não podes fugir de uma batalha de treinador!')
      return
    }
    if(this.menu==='pokemon'){this.back();return}
    if(this.menu==='bag') {
      if(i!==0){this.back();return}
      if(this.potions===0){this.message('Não tens mais poções!');return}
      if(this.hp===24){this.message('O Charmander já tem os PS no máximo!');return}
      this.potions--;const p=load();p.potions=this.potions;save(p);this.hp=Math.min(24,this.hp+10);this.updateBars();this.turnAction('Usaste uma poção! O Charmander recuperou 10 PS.');return
    }
    if(this.menu==='fight') {
      if(i===3){this.back();return}
      if(i===2){this.growl=true;this.turnAction('Charmander usou GROWL! O próximo ataque será mais fraco.');return}
      const damage=i===0?6:8;this.enemy=Math.max(0,this.enemy-damage);this.updateBars();this.tweens.add({targets:this.foe,alpha:.2,duration:80,yoyo:true,repeat:2})
      this.turnAction(`Charmander usou ${i===0?'SCRATCH':'EMBER'}! Rattata perdeu ${damage} PS.`)
    }
  }
  updateBars(){this.enemyBar.width=124*this.enemy/20;this.playerBar.width=124*this.hp/24;this.playerBar.setFillStyle(this.hp<=8?0xd66758:0x6abe72);this.enemyBar.setFillStyle(this.enemy<=7?0xd66758:0x6abe72)}
  turnAction(text:string){
    this.busy=true;this.message(text);this.soundEffect('confirmation_001')
    this.time.delayedCall(850,()=>{
      if(this.enemy===0){this.victory();return}
      const base=[4,5,6][this.turn%3];this.turn++;const damage=Math.max(1,base-(this.growl?3:0));this.growl=false
      this.hp=Math.max(0,this.hp-damage);this.updateBars();this.cameras.main.shake(130,.008);this.message(`Rattata atacou! Charmander perdeu ${damage} PS.`)
      this.time.delayedCall(900,()=>{
        if(this.hp===0){this.defeat();return}
        this.menu='main';this.selected=0;this.drawMenu();this.message('O que deve fazer o Charmander?');this.busy=false
      })
    })
  }
  victory(){const p=load();p.battle=true;p.chapter=4;save(p);this.message('Vitória! O rival deixou-te passar! Procura o Pikachu.');this.soundEffect('confirmation_001');this.time.delayedCall(1500,()=>this.scene.start('world'))}
  defeat(){this.over=true;this.busy=false;this.menu='result';this.drawMenu();this.message('O Charmander ficou sem PS. Podes tentar outra vez já!')}
  restartBattle(){this.scene.restart()}
}
