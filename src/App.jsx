import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const TEAMS = {
  A: 'White Phoenix', B: "Winter's Roar", C: 'Biting Roses', D: 'Speaker to the Win',
  E: 'Golden Opportunity', F: 'Crimson Claws', G: 'Reach of the Heaven', H: 'Noble Heroes',
  I: 'Tiranzek Titans', J: 'Fourfold Sorcery', K: 'The Jade Monkey', L: 'Nightmares',
  M: 'Arms of Balance', N: 'Steps of the Sun', O: 'Tino Toughest', P: 'Lightkeeper',
}

const team = (id) => ({ type: 'team', id })
const winner = (id) => ({ type: 'winner', id })
const loser = (id) => ({ type: 'loser', id })

const MATCHES = {
  M1: [team('A'), team('B')], M2: [team('C'), team('D')],
  M3: [team('E'), team('F')], M4: [team('G'), team('H')],
  M5: [team('I'), team('J')], M6: [team('K'), team('L')],
  M7: [team('M'), team('N')], M8: [team('O'), team('P')],
  M9: [loser('M1'), loser('M2')], M10: [loser('M3'), loser('M4')],
  M11: [loser('M5'), loser('M6')], M12: [loser('M7'), loser('M8')],
  M13: [winner('M1'), winner('M2')], M14: [winner('M3'), winner('M4')],
  M15: [winner('M5'), winner('M6')], M16: [winner('M7'), winner('M8')],
  M17: [winner('M9'), loser('M13')], M18: [winner('M10'), loser('M14')],
  M19: [winner('M11'), loser('M15')], M20: [winner('M12'), loser('M16')],
  M21: [winner('M13'), winner('M14')], M22: [winner('M15'), winner('M16')],
  M23: [winner('M17'), winner('M18')], M24: [winner('M19'), winner('M20')],
  M25: [winner('M23'), loser('M21')], M26: [winner('M24'), loser('M22')],
  M27: [winner('M21'), winner('M22')], M28: [winner('M25'), winner('M26')],
  M29: [winner('M28'), loser('M27')], M30: [winner('M27'), winner('M29')],
  M31: [winner('M27'), winner('M29')],
}

const INITIAL_WINNERS = {
  M1: 'A', M2: 'D', M3: 'E', M4: 'H', M5: 'J', M6: 'L', M7: 'N', M8: 'P',
  M13: 'A', M16: 'P',
}

const WINNERS_ROUNDS = [
  { title: 'Ronda 1', subtitle: '16 equipos', matches: ['M1','M2','M3','M4','M5','M6','M7','M8'] },
  { title: 'Cuartos', subtitle: '8 equipos', matches: ['M13','M14','M15','M16'] },
  { title: 'Semifinales', subtitle: '4 equipos', matches: ['M21','M22'] },
  { title: 'Final de ganadores', subtitle: '2 equipos', matches: ['M27'] },
]

const LOSERS_ROUNDS = [
  { title: 'Ronda 1', subtitle: 'Eliminación', matches: ['M9','M10','M11','M12'] },
  { title: 'Ronda 2', subtitle: 'Cruce', matches: ['M17','M18','M19','M20'] },
  { title: 'Ronda 3', subtitle: 'Supervivencia', matches: ['M23','M24'] },
  { title: 'Ronda 4', subtitle: 'Cruce', matches: ['M25','M26'] },
  { title: 'Semifinal', subtitle: 'Última oportunidad', matches: ['M28'] },
  { title: 'Final de perdedores', subtitle: '2 equipos', matches: ['M29'] },
]

const STORAGE_KEY = 'arena-bracket-winners'
const stateRef = doc(db, 'tournaments', 'main')

function resolveSource(source, winners) {
  if (source.type === 'team') return source.id
  const matchWinner = winners[source.id]
  if (!matchWinner) return null
  if (source.type === 'winner') return matchWinner
  const participants = resolveParticipants(source.id, winners)
  return participants.find((id) => id && id !== matchWinner) ?? null
}

function resolveParticipants(matchId, winners) {
  return MATCHES[matchId].map((source) => resolveSource(source, winners))
}

function sanitizeWinners(input) {
  const next = { ...input }
  let changed = true
  while (changed) {
    changed = false
    Object.keys(next).forEach((matchId) => {
      if (!MATCHES[matchId] || !resolveParticipants(matchId, next).includes(next[matchId])) {
        delete next[matchId]
        changed = true
      }
    })
  }
  if (next.M31 && next.M30 !== next.M29) delete next.M31
  return next
}

function useTournamentState() {
  const [winners, setWinners] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || INITIAL_WINNERS
    } catch {
      return INITIAL_WINNERS
    }
  })
  const [connection, setConnection] = useState('connecting')

  useEffect(() => {
    const unsubscribe = onSnapshot(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const clean = sanitizeWinners(snapshot.data().winners || {})
        setWinners(clean)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
        setConnection('live')
      } else {
        setDoc(stateRef, { winners: INITIAL_WINNERS, updatedAt: new Date().toISOString() })
          .then(() => setConnection('live'))
          .catch(() => setConnection('local'))
      }
    }, () => setConnection('local'))
    return unsubscribe
  }, [])

  const update = async (next) => {
    const clean = sanitizeWinners(next)
    setWinners(clean)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
    try {
      await setDoc(stateRef, { winners: clean, updatedAt: new Date().toISOString() }, { merge: true })
      setConnection('live')
    } catch {
      setConnection('local')
    }
  }

  return { winners, update, connection }
}

function Trophy({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 140" fill="none" aria-hidden="true">
      <path d="M30 24H12v20c0 17 10 27 28 27M90 24h18v20c0 17-10 27-28 27" stroke="currentColor" strokeWidth="6" />
      <path d="M29 13h62v36c0 25-13 38-31 38S29 74 29 49V13Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="4" />
      <path d="m60 29 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-12Z" fill="currentColor" />
      <path d="M60 88v27m-22 0h44l7 12H31l7-12Z" stroke="currentColor" strokeWidth="5" />
    </svg>
  )
}

function TeamRow({ teamId, selected, disabled, onSelect, placeholder }) {
  const hue = teamId ? ((teamId.charCodeAt(0) - 65) * 43 + 160) % 360 : 210
  return (
    <button className={`team-row ${selected ? 'selected' : ''}`} disabled={disabled} onClick={onSelect} aria-pressed={Boolean(selected)} title={teamId ? TEAMS[teamId] : placeholder}>
      <span className="team-seed" style={{ '--team-hue': hue }}>{teamId || '?'}</span>
      <span className="team-name">{teamId ? TEAMS[teamId] : placeholder || 'Por definir'}</span>
      <span className="team-check" aria-hidden="true">{selected ? '✓' : ''}</span>
    </button>
  )
}

function MatchCard({ id, winners, onWinner }) {
  const participants = resolveParticipants(id, winners)
  const selected = winners[id]
  const ready = participants.every(Boolean)
  const placeholder = (index) => `${MATCHES[id][index].type === 'loser' ? 'Perdedor' : 'Ganador'} ${MATCHES[id][index].id}`
  return (
    <article className={`match-card ${selected ? 'decided' : ready ? 'ready' : ''}`} aria-label={`Partida ${id}`}>
      <header><span>{id}<span className="match-label"> / MATCH</span></span><span className="match-status">{selected ? 'Finalizado' : ready ? 'Listo para jugar' : 'Por definir'}</span></header>
      <TeamRow teamId={participants[0]} selected={selected === participants[0]} disabled={!participants[0]} placeholder={placeholder(0)} onSelect={() => onWinner(id, participants[0])} />
      <div className="divider"><span>VS</span></div>
      <TeamRow teamId={participants[1]} selected={selected === participants[1]} disabled={!participants[1]} placeholder={placeholder(1)} onSelect={() => onWinner(id, participants[1])} />
    </article>
  )
}

function Bracket({ rounds, winners, onWinner }) {
  return (
    <div className="bracket-scroll" tabIndex={0} role="region" aria-label="Cuadro del torneo, desplázate horizontalmente para ver todas las rondas">
      <div className="bracket-grid" style={{ '--rounds': rounds.length }}>
        {rounds.map((round, index) => (
          <section className="round" key={round.title}>
            <div className="round-heading"><span className="round-number">0{index + 1}</span><div><span>{round.title}</span><small>{round.subtitle}</small></div></div>
            <div className="round-matches">
              {round.matches.map((id) => <MatchCard key={id} id={id} winners={winners} onWinner={onWinner} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Finals({ winners, onWinner }) {
  const lbChampion = winners.M29
  const resetRequired = Boolean(lbChampion && winners.M30 === lbChampion)
  const champion = resetRequired ? winners.M31 : winners.M30
  return (
    <div className="finals-layout">
      <div className="finals-copy">
        <span className="eyebrow">Todo o nada</span>
        <h2>La gran final</h2>
        <p>El campeón del Winners’ Bracket llega con una vida extra. Si pierde el M30, se activa el reset y todo se decide en el M31.</p>
        <div className={`rule-card ${resetRequired ? 'active' : ''}`}>
          <span>{resetRequired ? 'Reset activado' : 'Regla de reset'}</span>
          <p>{resetRequired ? 'El ganador del Losers’ Bracket venció en M30. Hay un último encuentro.' : 'M31 permanece bloqueado salvo que el ganador de M29 gane el M30.'}</p>
        </div>
      </div>
      <div className="finals-matches">
        <MatchCard id="M30" winners={winners} onWinner={onWinner} />
        <div className={`reset-connector ${resetRequired ? 'active' : ''}`}><span>BRACKET RESET</span></div>
        {resetRequired ? <MatchCard id="M31" winners={winners} onWinner={onWinner} /> : <div className="locked-match"><span>⌁</span><strong>M31 bloqueado</strong><small>Solo se habilita si hay reset</small></div>}
      </div>
      <div className={`champion-card ${champion ? 'revealed' : ''}`}>
        <Trophy className="crown" />
        <small>{champion ? 'Campeón del torneo' : 'El trono espera'}</small>
        <strong>{champion ? TEAMS[champion] : 'Por coronar'}</strong>
        {champion && <span className="champion-seed">Equipo {champion}</span>}
      </div>
    </div>
  )
}

export default function App() {
  const { winners, update, connection } = useTournamentState()
  const [view, setView] = useState('winners')
  const [confirmReset, setConfirmReset] = useState(false)
  const progress = useMemo(() => Object.keys(winners).length, [winners])
  const resetRequired = Boolean(winners.M29 && winners.M30 === winners.M29)
  const champion = resetRequired ? winners.M31 : winners.M30
  const totalMatches = resetRequired ? 31 : 30

  const selectWinner = (matchId, teamId) => {
    if (!teamId) return
    const next = { ...winners }
    if (next[matchId] === teamId) delete next[matchId]
    else next[matchId] = teamId
    update(next)
  }

  const reset = () => {
    update(INITIAL_WINNERS)
    setConfirmReset(false)
    setView('winners')
  }

  return (
    <div className={`app-shell theme-${view}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Arena Bracket, inicio"><span className="brand-mark">A</span><span>ARENA<small>BRACKET</small></span></a>
        <span className="topbar-label">TOURNAMENT CONTROL <span>/ 16 TEAMS</span></span>
        <div className="header-actions">
          <span className={`status ${connection}`}><i />{connection === 'live' ? 'En vivo' : connection === 'local' ? 'Modo local' : 'Conectando'}</span>
          <button className="reset-button" onClick={() => setConfirmReset(true)}><span aria-hidden="true">↺</span> Reiniciar</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="tag">TORNEO</span> DOBLE ELIMINACIÓN</span>
            <h1>16 EQUIPOS.<br/><em>UN CAMPEÓN.</em></h1>
            <p>Cada partida cuenta. Sigue los enfrentamientos y decide quién avanza hasta conquistar la arena.</p>
            <a className="hero-cta" href="#bracket">EXPLORAR EL BRACKET <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-emblem">
            <span className="emblem-orbit orbit-one" aria-hidden="true" />
            <span className="emblem-orbit orbit-two" aria-hidden="true" />
            <div className="trophy-shield"><Trophy /></div>
            <span className="emblem-caption">{champion ? 'CAMPEÓN DE LA ARENA' : 'EL TRONO TE ESPERA'}</span>
            <strong>{champion ? TEAMS[champion] : 'CLAIM THE CROWN'}</strong>
          </div>
        </section>

        <section className="tournament-stats" aria-label="Resumen del torneo">
          <div className="stat-item"><span className="stat-index">01</span><div><strong>16</strong><span>EQUIPOS</span></div></div>
          <div className="stat-item"><span className="stat-index">02</span><div><strong>{progress}<small> / {totalMatches}</small></strong><span>PARTIDAS DECIDIDAS</span></div></div>
          <div className="stat-item"><span className="stat-index">03</span><div><strong>2<small> VIDAS</small></strong><span>DOBLE ELIMINACIÓN</span></div></div>
          <div className="tournament-progress"><div><span>PROGRESO DEL TORNEO</span><strong>{Math.round(progress / totalMatches * 100)}%</strong></div><progress value={progress} max={totalMatches} aria-label="Progreso del torneo" /></div>
        </section>

        <div id="bracket" className="bracket-anchor" />
        <nav className="tabs" aria-label="Secciones del torneo">
          {[['winners', "Winner's Bracket"], ['losers', "Loser's Bracket"], ['finals', 'Grand Final']].map(([id, label], index) => (
            <button key={id} className={view === id ? 'active' : ''} aria-pressed={view === id} onClick={() => setView(id)}><span className="tab-index">0{index + 1}</span>{label}<span className="tab-arrow" aria-hidden="true">↗</span></button>
          ))}
        </nav>

        <section className="board">
          <div className="board-head">
            <div><span className="section-kicker">{view === 'winners' ? 'Camino superior' : view === 'losers' ? 'Última oportunidad' : 'El duelo definitivo'}</span><h2>{view === 'winners' ? "Winner's Bracket" : view === 'losers' ? "Loser's Bracket" : 'Grand Final'}</h2></div>
            <div className="board-guide"><p>Selecciona un equipo para marcarlo como ganador.</p><span><i /> Ganador confirmado <span className="scroll-hint">· Desliza para ver las rondas →</span></span></div>
          </div>
          {view === 'winners' && <Bracket rounds={WINNERS_ROUNDS} winners={winners} onWinner={selectWinner} />}
          {view === 'losers' && <Bracket rounds={LOSERS_ROUNDS} winners={winners} onWinner={selectWinner} />}
          {view === 'finals' && <Finals winners={winners} onWinner={selectWinner} />}
        </section>
      </main>

      <footer><span>ARENA BRACKET</span><p>Los cambios se guardan automáticamente.</p></footer>

      {confirmReset && <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmReset(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(e) => e.stopPropagation()}><span className="modal-icon">↺</span><h2 id="reset-title">¿Reiniciar el torneo?</h2><p>Se conservarán los resultados iniciales incluidos en el bracket original y se borrará todo el progreso posterior.</p><div><button onClick={() => setConfirmReset(false)}>Cancelar</button><button className="danger" onClick={reset}>Sí, reiniciar</button></div></div></div>}
    </div>
  )
}
