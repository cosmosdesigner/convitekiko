import React from 'react'
import { createRoot } from 'react-dom/client'
import Phaser from 'phaser'
import { WorldScene } from './game/WorldScene'
import { BattleScene } from './game/BattleScene'
import { FinaleScene } from './game/FinaleScene'
import { events, press, setHeld, type Input } from './game/events'
import { load, reset } from './game/save'
import { party, whatsappUrl } from './data/config'
import './style.css'

function Invitation({ close, replay }: { close: () => void; replay: () => void }) {
  return <div className="modal-backdrop"><article className="invitation" role="dialog" aria-modal="true" aria-label="Convite de aniversário">
    <button className="close" onClick={close} aria-label="Fechar convite">×</button>
    <div className="invitation-top"><span>★ MISSÃO CONCLUÍDA! ★</span><img className="ball-icon" src="/assets/environment/pokeball.png" alt=""/></div>
    <p className="intro-copy">TREINADOR, CONSEGUISTE!<br/>O PIKACHU TEM UMA MENSAGEM ESPECIAL PARA TI...</p>
    <h1>O FRANCISCO<br/><em>VAI FAZER 7 ANOS!</em></h1>
    <p>Estás convidado para a sua <strong>festa Pokémon!</strong></p>
    <div className="details"><div><small>QUANDO</small><strong>Domingo, 8 de novembro de 2026</strong></div><div><small>HORA</small><strong>Às 15h00</strong></div><div><small>LOCAL</small><strong>{party.location}</strong></div></div>
    <p className="footer-copy">Prepara as tuas Pokébolas e vem celebrar esta aventura!</p>
    <div className="actions"><a className={whatsappUrl?'primary':'disabled'} href={whatsappUrl||undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!whatsappUrl} onClick={e=>{if(!whatsappUrl)e.preventDefault()}}>Confirmar presença</a><a className={party.mapUrl?'secondary':'disabled'} href={party.mapUrl||undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!party.mapUrl} onClick={e=>{if(!party.mapUrl)e.preventDefault()}}>Ver localização</a><button className="secondary" onClick={replay}>Jogar novamente</button></div>
    {(!whatsappUrl||!party.mapUrl||party.location==='Local a anunciar')&&<small className="config-note">Localização e confirmação de presença disponíveis em breve.</small>}
  </article></div>
}

function App() {
  const mount=React.useRef<HTMLDivElement>(null)
  const game=React.useRef<Phaser.Game|null>(null)
  const pausedScenes=React.useRef<Phaser.Scene[]>([])
  const gameFrame=React.useRef<HTMLDivElement>(null)
  const [started,setStarted]=React.useState(false)
  const [showHelp,setShowHelp]=React.useState(false)
  const [invitation,setInvitation]=React.useState(false)
  const [showOptions,setShowOptions]=React.useState(false)
  const [showCredits,setShowCredits]=React.useState(false)
  const [showGameHelp,setShowGameHelp]=React.useState(false)
  const [muted,setMuted]=React.useState(()=>{try{return localStorage.getItem('francisco-sound-muted')==='true'}catch{return false}})
  const [unlocked,setUnlocked]=React.useState(load().invitation)
  React.useEffect(()=>{
    const reveal=()=>{setUnlocked(true);setInvitation(true)}
    events.addEventListener('invitation',reveal)
    const restart=()=>replay()
    events.addEventListener('replay',restart)
    return()=>{events.removeEventListener('invitation',reveal);events.removeEventListener('replay',restart)}
  },[])
  React.useEffect(()=>{
    if(!started||!mount.current)return
    const mobile=window.matchMedia('(max-width: 600px)').matches
    game.current=new Phaser.Game({type:Phaser.AUTO,parent:mount.current,width:mobile?window.innerWidth:480,height:mobile?window.innerHeight:320,backgroundColor:'#79b865',pixelArt:true,roundPixels:true,scale:{mode:mobile?Phaser.Scale.RESIZE:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[WorldScene,BattleScene,FinaleScene],render:{antialias:false}})
    game.current.sound.mute=muted
    return()=>{game.current?.destroy(true);game.current=null}
  },[started])
  function replay(){if(!confirm('Reiniciar a aventura? O progresso guardado será apagado.'))return;closeGameHelp();reset();setHeld(null);setUnlocked(false);setInvitation(false);setShowHelp(false);if(game.current){game.current.scene.stop('finale');game.current.scene.stop('battle');game.current.scene.start('world')}else setStarted(true)}
  function fullscreen(){const element=gameFrame.current;if(!element)return;if(document.fullscreenElement)document.exitFullscreen?.();else element.requestFullscreen?.()}
  function toggleSound(){const next=!muted;setMuted(next);if(game.current)game.current.sound.mute=next;try{localStorage.setItem('francisco-sound-muted',String(next))}catch{/* Storage may be unavailable */}}
  function openGameHelp(){pausedScenes.current=game.current?.scene.getScenes(true)??[];pausedScenes.current.forEach(scene=>scene.scene.pause());setShowOptions(false);setShowGameHelp(true)}
  function closeGameHelp(){pausedScenes.current.forEach(scene=>scene.scene.resume());pausedScenes.current=[];setShowGameHelp(false)}
  function control(key:Input){return {onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press(key);if(key!=='a'&&key!=='b')setHeld(key)},onPointerUp:()=>setHeld(null),onPointerCancel:()=>setHeld(null)}}
  return <main className={`page${started?' game-started':''}`}><header className="header"><div className="eyebrow">✦ UMA AVENTURA ESPECIAL ✦</div><h1>A MISSÃO SECRETA<br/><span>DO FRANCISCO</span></h1><p>Uma mensagem desapareceu. Um Pikachu está à tua espera.</p></header>
    <section className="console" aria-label="Jogo interativo">
      <div className="console-top"><span className="power-dot"/> VILA DO TROVÃO <span>★ EDIÇÃO 7 ANOS</span></div>
      <div className="game-frame" ref={gameFrame}>
        <div className="game-mount" ref={mount}/>
        {!started&&<div className="welcome-screen"><img src="/assets/environment/welcome-v2.png" alt="" className="welcome-art"/><div className="welcome-panel">{showHelp?<><h2>COMO JOGAR</h2><div className="welcome-instructions"><p><strong>EXPLORA</strong> com as setas, WASD ou o comando no ecrã.</p><p><strong>INTERAGE</strong> com A ou Enter quando vires o símbolo junto de uma personagem ou objeto.</p><p><strong>VOLTA</strong> com B ou Esc. Segue as pistas para encontrares o Pikachu!</p></div><div className="welcome-actions"><button className="welcome-primary" onClick={()=>setStarted(true)}>COMEÇAR</button><button className="welcome-quiet" onClick={()=>setShowHelp(false)}>← VOLTAR</button></div></>:<><div className="welcome-heading"><span>✦ UMA AVENTURA POKÉMON ✦</span><h2>A TUA MISSÃO<br/>COMEÇA AQUI!</h2><p>Encontra o Pikachu e descobre a mensagem secreta.</p></div><div className="welcome-actions"><button className="welcome-primary" onClick={()=>setStarted(true)}>{unlocked?'CONTINUAR':'COMEÇAR'}</button><button className="welcome-secondary" onClick={()=>setShowHelp(true)}>COMO JOGAR</button><button className="welcome-quiet" onClick={()=>setInvitation(true)}>◉ Ver convite</button></div></>}</div></div>}
        {started&&<><div className="mobile-game-controls"><div className="mobile-dpad"><button aria-label="Cima" {...control('up')}>▲</button><button aria-label="Esquerda" {...control('left')}>◀</button><button aria-label="Direita" {...control('right')}>▶</button><button aria-label="Baixo" {...control('down')}>▼</button></div><div className="mobile-actions"><button className="action b" {...control('b')}>B</button><button className="action a" {...control('a')}>A</button></div><button className="options-button" onClick={()=>setShowOptions(v=>!v)} aria-label="Opções" aria-expanded={showOptions}>☰<span>OPÇÕES</span></button>{showOptions&&<div className="options-menu"><span className="options-title">✦ OPÇÕES ✦</span><button onClick={openGameHelp}>? Como jogar</button><button onClick={()=>setInvitation(true)}>◉ Ver convite</button><button onClick={replay}>↺ Reiniciar</button><button onClick={()=>setShowCredits(true)}>★ Créditos</button><button onClick={toggleSound} aria-pressed={muted}>{muted?'🔇 Ligar som':'🔊 Desligar som'}</button><button onClick={fullscreen}>⛶ Ecrã inteiro</button></div>}</div>{showCredits&&<div className="credits-panel"><button onClick={()=>setShowCredits(false)} aria-label="Fechar créditos">×</button><strong>CRÉDITOS</strong><span>Cenário: Shade</span><span>Personagens: finalbossblues</span><span>Pokémon: PMD Sprite Repository · Spike Chunsoft e JFain</span><small>Ver detalhes no rodapé.</small></div>}</>}
        {showGameHelp&&<div className="game-help" role="dialog" aria-modal="true" aria-label="Como jogar"><img src="/assets/environment/welcome-v2.png" alt="" className="welcome-art"/><div className="welcome-panel"><h2>COMO JOGAR</h2><div className="welcome-instructions"><p><strong>EXPLORA</strong> com as setas, WASD ou o comando no ecrã.</p><p><strong>INTERAGE</strong> com A ou Enter quando vires o símbolo junto de uma personagem ou objeto.</p><p><strong>VOLTA</strong> com B ou Esc. Segue as pistas para encontrares o Pikachu!</p></div><div className="welcome-actions"><button className="welcome-primary" onClick={closeGameHelp}>VOLTAR AO JOGO</button></div></div></div>}
      </div>
      <div className="console-bottom"><span>FRANCISCO <b>◆</b> 2026</span><span>PRESS START TO EXPLORE</span></div>
    </section>
    {started&&<div className="below"><div className="controls"><div className="dpad" aria-label="Controlos de movimento"><button className="up" aria-label="Cima" {...control('up')}>▲</button><button className="left" aria-label="Esquerda" {...control('left')}>◀</button><button className="right" aria-label="Direita" {...control('right')}>▶</button><button className="down" aria-label="Baixo" {...control('down')}>▼</button></div><div className="action-buttons"><button className="action b" {...control('b')}>B</button><button className="action a" {...control('a')}>A</button></div></div>
      <div className="help"><span>↑ ↓ ← → / WASD <b>MOVER</b></span><span>ENTER / ESPAÇO <b>INTERAGIR</b></span><span>ESC <b>VOLTAR</b></span></div>
      <div className="links"><button onClick={openGameHelp}>? Como jogar</button><button onClick={()=>setInvitation(true)}>◉ Ver convite</button><button onClick={replay}>↺ Reiniciar jogo</button><button onClick={toggleSound} aria-pressed={muted}>{muted?'🔇 Ligar som':'🔊 Desligar som'}</button></div>
      {unlocked&&<p className="saved">★ Convite desbloqueado — podes voltar a vê-lo quando quiseres.</p>}
    </div>}
    <footer><span>Uma aventura para os amigos do Francisco · Feita com carinho ♥</span><small className="sprite-credits">Cenário: <a href="https://opengameart.org/content/16x16-puny-world-tileset" target="_blank" rel="noopener noreferrer">Shade</a><br/>Personagens: <a href="https://finalbossblues.itch.io/16-char-sprite-collection-modern-chibis-asset-alliance" target="_blank" rel="noopener noreferrer">finalbossblues</a><br/>Pokémon: <a href="https://sprites.pmdcollab.org/" target="_blank" rel="noopener noreferrer">PMD Sprite Repository</a> · Spike Chunsoft e JFain · © titulares</small></footer>
    {invitation&&<Invitation close={()=>setInvitation(false)} replay={replay}/>}
  </main>
}

createRoot(document.getElementById('root')!).render(<App/>)
