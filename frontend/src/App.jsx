import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { nakamaManager } from './NakamaClient'
import { Trophy, RefreshCcw, User } from 'lucide-react'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [match, setMatch] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [status, setStatus] = useState('Initializing...')

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

  const startMatchmaking = async () => {
    setStatus('Looking for opponent...')
    const m = await nakamaManager.findMatch((state) => {
      setGameState(state)
    })
    setMatch(m)
    setStatus('Match Found!')
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
            {session && status !== 'Looking for opponent...' && (
              <button 
                className="button" 
                onClick={startMatchmaking}
              >
                Find Match
              </button>
            )}
            {status === 'Looking for opponent...' && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
              >
                <RefreshCcw size={32} color="var(--primary)" />
              </motion.div>
            )}
          </div>
        ) : (
          <div className="game-screen">
            <div className="player-info">
              {Object.keys(gameState?.marks || {}).map((uid) => (
                <div key={uid} className={`player-card ${gameState?.turn === uid ? 'active' : ''}`}>
                  <User size={20} color={gameState?.marks[uid] === 'X' ? 'var(--primary)' : 'var(--secondary)'} />
                  <div className="symbol">{gameState?.marks[uid]}</div>
                  <div className="label">{uid === session?.user_id ? 'You' : 'Opponent'}</div>
                </div>
              ))}
            </div>

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
                        <Trophy color="#ffd700" size={64} />
                        <h2 className="win-title">
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
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default App
