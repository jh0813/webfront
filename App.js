import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 });
    const [obstacles, setObstacles] = useState([]);
    const [obstacleSpeed, setObstacleSpeed] = useState(5);
    const [spawnInterval, setSpawnInterval] = useState(2000);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0); // 점수 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
    const [username, setUsername] = useState(''); // 사용자명
    const [highScores, setHighScores] = useState([]); // 최고 점수 리스트
    const speed = 10;
    const keys = new Set(); // 키를 추적하는 Set

    // 로그인 상태 변경
    const handleLogin = (e) => {
        e.preventDefault();
        if (username.trim() !== '') {
            setIsLoggedIn(true);
        }
    };

    // 로그아웃
    const handleLogout = () => {
        // 로그아웃 시 상태 초기화
        setIsLoggedIn(false);
        setScore(0); // 점수 초기화
        setObstacles([]); // 장애물 초기화
        setPosition({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 }); // 캐릭터 위치 초기화
        setGameOver(false); // 게임 오버 상태 초기화
        setSpawnInterval(2000); // 장애물 생성 간격 초기화
    };

    useEffect(() => {
        // 점수를 2초마다 100점씩 증가시키는 타이머 설정
        const scoreInterval = setInterval(() => {
            if (isLoggedIn && !gameOver) { // 게임이 진행 중일 때만 점수 증가
                setScore((prevScore) => prevScore + 100);
            }
        }, 2000); // 2초마다

        return () => clearInterval(scoreInterval); // 컴포넌트가 언마운트될 때 인터벌 제거
    }, [isLoggedIn, gameOver]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            keys.add(e.key);
            if (e.key === 'r' || e.key === 'R') {
                // R 키가 눌리면 순위 초기화
                resetHighScores();
            }
        };

        const handleKeyUp = (e) => {
            keys.delete(e.key);
        };

        const moveCharacter = () => {
            setPosition((prevPosition) => {
                let newX = prevPosition.x;
                let newY = prevPosition.y;

                if (keys.has('ArrowUp')) {
                    newY = Math.max(0, newY - speed);
                }
                if (keys.has('ArrowDown')) {
                    newY = Math.min(window.innerHeight - 100, newY + speed);
                }
                if (keys.has('ArrowLeft')) {
                    newX = Math.max(0, newX - speed);
                }
                if (keys.has('ArrowRight')) {
                    newX = Math.min(window.innerWidth - 100, newX + speed);
                }

                return { x: newX, y: newY };
            });
        };

        if (isLoggedIn) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            const interval = setInterval(moveCharacter, 20); // 일정 간격으로 이동

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                clearInterval(interval);
            };
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const createObstacle = () => {
            if (isLoggedIn) {
                const edge = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                const obstacle = {
                    id: Date.now() + Math.random(),
                    x: edge === 'horizontal' ? (Math.random() < 0.5 ? 0 : window.innerWidth) : Math.random() * window.innerWidth,
                    y: edge === 'vertical' ? (Math.random() < 0.5 ? 0 : window.innerHeight) : Math.random() * window.innerHeight,
                    direction: edge,
                    reverse: edge === 'horizontal' ? (Math.random() < 0.5 ? true : false) : (Math.random() < 0.5 ? true : false),
                };
                setObstacles((prev) => [...prev, obstacle]);
            }
        };

        const interval = setInterval(createObstacle, spawnInterval); // 장애물 생성 간격

        return () => clearInterval(interval);
    }, [spawnInterval, isLoggedIn]);

    useEffect(() => {
        const moveObstacles = () => {
            if (isLoggedIn) {
                setObstacles((prevObstacles) =>
                    prevObstacles
                        .map((obstacle) => {
                            if (obstacle.direction === 'horizontal') {
                                return {
                                    ...obstacle,
                                    x: obstacle.reverse
                                        ? obstacle.x - obstacleSpeed
                                        : obstacle.x + obstacleSpeed,
                                };
                            } else {
                                return {
                                    ...obstacle,
                                    y: obstacle.reverse
                                        ? obstacle.y - obstacleSpeed
                                        : obstacle.y + obstacleSpeed,
                                };
                            }
                        })
                        .filter(
                            (obstacle) =>
                                obstacle.x >= -100 && obstacle.x <= window.innerWidth + 100 &&
                                obstacle.y >= -100 && obstacle.y <= window.innerHeight + 100
                        ) // 화면 밖으로 완전히 나간 장애물 제거
                );
            }
        };

        const interval = setInterval(moveObstacles, 20);

        return () => clearInterval(interval);
    }, [obstacleSpeed, isLoggedIn]);

    useEffect(() => {
        const checkCollision = () => {
            if (isLoggedIn && !gameOver) { // 게임 오버 상태에서 점수를 저장하지 않음
                for (let obstacle of obstacles) {
                    if (
                        position.x < obstacle.x + 40 &&
                        position.x + 40 > obstacle.x &&
                        position.y < obstacle.y + 40 &&
                        position.y + 40 > obstacle.y
                    ) {
                        setGameOver(true);
                        // 게임 오버 상태에서만 점수를 저장하고 한 번만 저장하도록
                        if (!gameOver) {
                            const newHighScore = { username, score };
                            const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
                            storedScores.push(newHighScore);
                            // 점수 내림차순으로 정렬 후 로컬 스토리지에 저장
                            storedScores.sort((a, b) => b.score - a.score);
                            localStorage.setItem('highScores', JSON.stringify(storedScores));
                            setHighScores(storedScores); // 최신 순위 업데이트
                        }
                        break;
                    }
                }
            }
        };

        const interval = setInterval(checkCollision, 20);

        return () => clearInterval(interval);
    }, [obstacles, position, isLoggedIn, username, score, gameOver]);

    useEffect(() => {
        // 로컬 스토리지에서 기존 점수 목록 불러오기
        const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
        setHighScores(storedScores);
    }, []);

    const resetHighScores = () => {
        // 순위를 리셋
        localStorage.removeItem('highScores');
        setHighScores([]); // 화면에서 순위 초기화
    };

    return (
        <div className="app">
            {!isLoggedIn ? (
                <div className="login-screen">
                    <h2>빨강 피하기</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="닉네임을 입력해주세요!"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <button type="submit">게임 시작</button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="game-container">
                        {gameOver && <div className="game-over">Game Over</div>}
                        <div
                            className="character"
                            style={{
                                left: position.x,
                                top: position.y,
                            }}
                        ></div>
                        {obstacles.map((obstacle) => (
                            <div
                                key={obstacle.id}
                                className="obstacle"
                                style={{
                                    left: obstacle.x,
                                    top: obstacle.y,
                                }}
                            ></div>
                        ))}
                        <div className="score">
                            점수: {score}
                        </div>
                        <button onClick={handleLogout} className="logout-button">로그아웃</button>
                    </div>

                    {gameOver && (
                        <div className="high-scores">
                            <h2>순위</h2>
                            <ul>
                                {highScores.map((scoreData, index) => (
                                    <li key={index}>
                                        {index + 1}등. {scoreData.username}: {scoreData.score} 점
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
