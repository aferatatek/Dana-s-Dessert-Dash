import "./App.css"
import { useEffect, useRef, useState } from "react"

const desserts = ["/dango.png", "/cheesecake.png"]
const vegetables = ["/pepper.png", "/beet.png", "/broccoli.png", "/carrot.png"]

const createClouds = () => {
  const count = 5
  const spacing = 1200 / count

  return Array.from({ length: count }, (_, index) => ({
    x: 60 + index * spacing + (Math.random() * 90 - 45),
    y: 25 + (index % 2) * 75 + Math.random() * 30,
    scale: 0.9 + Math.random() * 0.5,
  }))
}

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [yPosition, setYPosition] = useState(300)
  const [visible, setVisible] = useState(true)
  const [showAvatars, setShowAvatars] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [gameRunning, setGameRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [fallingObjects, setFallingObjects] = useState([])
  const [avatarX, setAvatarX] = useState(500)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const storedHighScore = localStorage.getItem("highScore")
    return storedHighScore ? parseInt(storedHighScore, 10) : 0
  })
  const [clouds] = useState(() => createClouds())

  const avatarXRef = useRef(500)
  const lifeCooldownRef = useRef(false)

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("highScore", score.toString())
    }
  }, [score, highScore])

  useEffect(() => {
    avatarXRef.current = avatarX
  }, [avatarX])

  const getSpeedMultiplier = (currentScore) => {
    if (currentScore <= 300) {
      return 1
    }

    return Math.min(1.9, 1 + (currentScore - 300) / 250)
  }

  const createFood = () => {
    const isDessert = Math.random() < 0.75
    const foodArray = isDessert ? desserts : vegetables
    const food = foodArray[Math.floor(Math.random() * foodArray.length)]
    const xPosition = Math.floor(Math.random() * 1100) + 50
    const yPosition = -40
    const speed = (Math.random() * 3 + 3) * getSpeedMultiplier(score)
    const type = isDessert ? "dessert" : "vegetable"

    return { food, xPosition, yPosition, speed, type }
  }




  const startAnimation = () => {
    setTimeout(() => setVisible(false), 200)
    setTimeout(() => setVisible(true), 375)
    setTimeout(() => setVisible(false), 550)
    setTimeout(() => setVisible(true), 725)

    setTimeout(() => {
      const interval = setInterval(() => {
        setYPosition((prev) => {
          if (prev <= 100) {
            clearInterval(interval)
            setShowAvatars(true)
            return prev
          }

          return prev - 1
        })
      }, 5)
    }, 900)
  }

  const startGame = () => {
    setScore(0)
    setLives(3)
    lifeCooldownRef.current = false
    setGameOver(false)
    setGameRunning(true)
    setFallingObjects([createFood()])
    setAvatarX(500)
    avatarXRef.current = 500
  }

  useEffect(() => {
    if (!gameRunning || gameOver) {
      return
    }

    const moveFoods = () => {
      const avatarLeft = avatarXRef.current - 75
      const avatarRight = avatarLeft + 150
      const avatarTop = 635
      const avatarBottom = 760
      const currentSpeedMultiplier = getSpeedMultiplier(score)

      setFallingObjects((prev) =>
        prev
          .map((item) => ({ ...item, yPosition: item.yPosition + item.speed * currentSpeedMultiplier }))
          .filter((item) => {
            const foodLeft = item.xPosition
            const foodRight = foodLeft + 70
            const foodTop = item.yPosition
            const foodBottom = foodTop + 70

            const isColliding =
              avatarLeft < foodRight &&
              avatarRight > foodLeft &&
              avatarTop < foodBottom &&
              avatarBottom > foodTop

            if (isColliding) {
              if (item.type === "dessert") {
                setScore((prevScore) => prevScore + 10)
              } else {
                if (lifeCooldownRef.current) {
                  return false
                }

                lifeCooldownRef.current = true
                setTimeout(() => {
                  lifeCooldownRef.current = false
                }, 500)

                setLives((prevLives) => {
                  const nextLives = Math.max(0, prevLives - 1)

                  if (nextLives <= 0) {
                    setGameRunning(false)
                    setGameOver(true)
                  }

                  return nextLives
                })
              }

              return false
            }

            return item.yPosition <= 780
          })
      )
    }

    const spawnFood = () => {
      setFallingObjects((prev) => [...prev, createFood()])
    }

    const moveInterval = window.setInterval(moveFoods, 16)
    const spawnDelay = Math.max(700, 1300 / getSpeedMultiplier(score))
    const spawnInterval = window.setInterval(spawnFood, spawnDelay)

    return () => {
      window.clearInterval(moveInterval)
      window.clearInterval(spawnInterval)
    }
  }, [gameOver, gameRunning, score])

  return (
    <div>
      {!gameStarted ? (
        <div
          className="start-screen"
          style={{
            backgroundImage: "url('/game screen.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: "100vh",
            position: "relative",
            cursor: "url('/cursor.png') 4 4, auto",
          }}
        >
          <h1 className="title">Dana's Dessert Dash 🍰</h1>
          <h2 className="subtitle">Catch the falling desserts and avoid vegetables!</h2>
          <button
            onClick={() => {
              setGameStarted(true)
              setTimeout(() => {
                startAnimation()
              }, 100)
            }}
            className="start-button"
          >
            {">"} Start Game
          </button>
        </div>
      ) : (
        <div
          className="game-screen"
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            const nextX = event.clientX - bounds.left
            setAvatarX(Math.min(Math.max(nextX, 75), bounds.width - 75))
          }}
        >
          {visible && !selectedAvatar && (
            <h1 className="choose-avatar-text">Choose an avatar:</h1>
          )}

          {showAvatars && (
            <div className="avatar-row">
              <img
                src="/avatar1.png"
                className="avatar"
                onClick={() => {
                  setSelectedAvatar("/avatar1.png")
                  setShowAvatars(false)
                }}
              />

              <img
                src="/avatar2.png"
                className="avatar"
                onClick={() => {
                  setSelectedAvatar("/avatar2.png")
                  setShowAvatars(false)
                }}
              />

              <img
                src="/avatar3.png"
                className="avatar"
                onClick={() => {
                  setSelectedAvatar("/avatar3.png")
                  setShowAvatars(false)
                }}
              />
            </div>
          )}

          {selectedAvatar && !gameRunning && !gameOver && (
            <div className="overlay-card" onClick={startGame}>
              <h2>
                Catch as many desserts as you can with your avatar, while avoiding the vegetables!
                <br />
                (Click anywhere to start)
              </h2>
            </div>
          )}

          {gameRunning && (
            <>
              <div className="ground" />
              <img src="/tree.png" alt="Tree" className="tree" />

              <img
                src={selectedAvatar}
                width={150}
                className="player-avatar"
                style={{ left: `${avatarX - 75}px` }}
              />

              <h2 className="lives-display">{"❤️".repeat(Math.max(0, lives))}</h2>
              <h2 className="score-display">Points: {score}</h2>
              <h2 className="high-score-display">High Score: {highScore}</h2>
            </>
          )}

          {clouds.map((cloud, index) => (
            <img
              key={index}
              src="/cloud.png"
              alt="Cloud"
              className="cloud"
              style={{
                left: `${cloud.x}px`,
                top: `${cloud.y}px`,
                transform: `scale(${cloud.scale})`,
              }}
            />
          ))}

          {fallingObjects.map((item, index) => (
            <img
              key={`${item.type}-${index}`}
              src={item.food}
              width={70}
              className="falling-item"
              style={{ left: `${item.xPosition}px`, top: `${item.yPosition}px` }}
            />
          ))}

          

          {gameOver && (
            <div className="overlay-card game-over-card">
              <h1>Game Over!</h1>
              <p>You scored {score} points.</p>
              <p>High Score: {highScore}</p>
              <button className="start-button" onClick={startGame}>
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App