import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { nakamaManager } from './NakamaClient'
import { Trophy, RefreshCcw, User, Skull } from 'lucide-react'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [match, setMatch] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [status, setStatus] = useState('Connecting...')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const s = await nakamaManager.authenticate()
        setSession(s)
        setStatus('Ready to Play')
      } catch (err) {
        console.error(err)
        setStatus('Connection Failed')
      }
    }
    init()
  }, [])

  const onMatchStateUpdate = (state) => {
    setGameState(state)
  }

  const startMatchmaking = async () => {
    setStatus('Looking for opponent...')
    const m = await nakamaManager.findMatch(onMatchStateUpdate)
    setMatch(m)
    setStatus('Match Found!')
  }

  const handleCreateMatch = async () => {
    setStatus('Creating Private Room...')
    const m = await nakamaManager.createMatch(onMatchStateUpdate)
    setMatch(m)
    setStatus('Private Room Created')
  }

  const handleJoinMatch = async () => {
    if (!joinCode) return
    setStatus('Joining Room...')
    try {
      const m = await nakamaManager.joinMatchById(joinCode, onMatchStateUpdate)
      setMatch(m)
      setStatus('Joined Room')
    } catch (err) {
      console.error(err)
      setStatus('Failed to join room. Check code.')
    }
  }

  const handleCellClick = (index) => {
    console.log("Cell clicked:", index, "Turn ID:", gameState?.turn, "My ID:", session?.user_id, "State:", gameState);
    if (gameState?.turn === session?.user_id && !gameState?.board[index] && !gameState?.winner && !gameState?.draw) {
      console.log("Move validation passed, sending to server...");
      nakamaManager.makeMove(index)
    } else {
      console.log("Move validation failed locally.");
    }
  }

  const board = gameState?.board || Array(9).fill("")
  const isMyTurn = gameState?.turn === session?.user_id
  const mySymbol = session ? gameState?.marks[session.user_id] : ""

  console.log("[DEBUG] My ID:", session?.user_id, "| Server Turn:", gameState?.turn, "| Match:", isMyTurn);

  const handleLeave = async () => {
    await nakamaManager.leaveMatch()
    setMatch(null)
    setGameState(null)
    setStatus('Ready to Play')
  }

  return (
    <div className="container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
      >
        <h1 className="title">MP TTT</h1>

        {!match ? (
          <div className="lobby">
            <p className="matchmaking-status">{status}</p>
            {session && !status.includes('Looking') && !status.includes('Room') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="button" 
                  onClick={startMatchmaking}
                >
                  Quick Match
                </button>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 0' }} />
                
                <button 
                  className="button" 
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  onClick={handleCreateMatch}
                >
                  Create Private Room
                </button>

                <div className="join-manual">
                  <input 
                    type="text" 
                    placeholder="Enter Room Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="input"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', marginBottom: '8px' }}
                  />
                  <button 
                    className="button" 
                    style={{ background: 'var(--secondary)', color: '#fff' }}
                    onClick={handleJoinMatch}
                  >
                    Join with Code
                  </button>
                </div>
              </div>
            )}
            
            {(status.includes('Looking') || status.includes('Room')) && (
              <div style={{ textAlign: 'center' }}>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
                >
                  <RefreshCcw size={32} color="var(--primary)" />
                </motion.div>
                {match && (
                  <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Share this code with your friend:</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', userSelect: 'all' }}>{match.id}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="game-screen">
            {Object.keys(gameState?.marks || {}).length < 2 && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Waiting for opponent...</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', margin: '4px 0', userSelect: 'all' }}>{match.id || match.match_id}</p>
                    <p style={{ fontSize: '0.6rem', opacity: 0.5, margin: 0 }}>Share this code to play</p>
                </div>
              </div>
            )}

            <div className="player-info">
              {Object.keys(gameState?.marks || {}).map((uid) => (
                <div key={uid} className={`player-card ${gameState?.turn === uid ? 'active' : ''}`}>
                  <User size={20} color={gameState?.marks[uid] === 'X' ? 'var(--primary)' : 'var(--secondary)'} />
                  <div className="symbol">{gameState?.marks[uid]}</div>
                  <div className="label">{uid === session?.user_id ? 'You' : 'Opponent'}</div>
                </div>
              ))}
            </div>

            {Object.keys(gameState?.marks || {}).length >= 2 ? (
              <>
                <div className="board">
                  {board.map((cell, i) => (
                    <div 
                      key={i} 
                      className={`cell ${cell.toLowerCase()}`}
                      onClick={() => handleCellClick(i)}
                    >
                      <AnimatePresence>
                        {cell && (
                          <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            style={{ fontSize: '2rem', fontWeight: 'bold' }}
                          >
                            {cell}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  
                  {/* Victory/Draw Overlay */}
                  <AnimatePresence>
                    {(gameState?.winner || gameState?.draw) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="overlay"
                      >
                        {gameState.winner ? (
                          <div className="result-content">
                            {gameState.winner === session.user_id ? (
                              <Trophy color="#ffd700" size={64} />
                            ) : (
                              <Skull color="#ff4d4d" size={64} />
                            )}
                        <h2 className={gameState.winner === session.user_id ? "title-victory" : "title-defeat"}>
                          {gameState.winner === session.user_id ? "VICTORY!" : "DEFEAT"}
                        </h2>
                            <p className="win-subtitle">
                              {gameState.winner === session.user_id ? "You dominated the board!" : "Better luck next time!"}
                            </p>
                          </div>
                        ) : (
                          <div className="result-content">
                            <RefreshCcw color="#fff" size={64} />
                            <h2 className="win-title">DRAW!</h2>
                            <p className="win-subtitle">A perfect match.</p>
                          </div>
                        )}
                        <button className="button play-again" onClick={() => window.location.reload()}>
                          Play Again
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="game-status">
                  {!gameState?.winner && !gameState?.draw && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                      <p className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
                        {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                      </p>
                      <button 
                        className="button" 
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ff4d4d', fontSize: '0.8rem', width: 'auto' }}
                        onClick={handleLeave}
                      >
                        Leave Match
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5 }}>
                <p>Waiting for someone to join...</p>
                <button 
                    className="button" 
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ff4d4d', fontSize: '0.8rem', width: 'auto', marginTop: '20px' }}
                    onClick={handleLeave}
                  >
                    Cancel & Leave
                  </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default App
