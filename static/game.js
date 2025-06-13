import { levels, SHAPES } from "./maps.js"

let currentLevel = 1
let isStory = false
let enteredSecondLevel = false
let enteredThirdLevel = false
let enteredLastLevel = false

let gameLoopRunning = false

let game_grid = []
let currentBlock 
let nextBlockIndex = -1
let score = 0
let gamePaused = false
let gameSession
let userName
let currentPage = 0;

//timer variables
let gameStartTime = 0;
let gameTimerInterval

//frame updates counters
let lastTime = 0
let deltaTime = 0
let frameCounter = 0

//fps counters
let fpsCounter = 0;
let lastFpsUpdate = 0;
let displayedFps = 0;


// Constants
const ROWS = 20
const COLS = 10
const usersPerPage = 5;

// Add event listener for when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  MainMenu()
  getScores()
})

function MainMenu(pause) {
    let container = document.getElementById('container')
    let startButton = document.getElementById('start')
    let storyButton = document.getElementById('startStory')
    let input = document.getElementById('userInput')
    if (pause) {
      for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
              let tile = document.getElementById(x+'-'+y)
              tile.remove()
          }
      }
      startButton.hidden = false
      input.hidden = false
    } else {
      startButton.addEventListener('click', () => {
        if (input.value !== '' && input.value.length < 20) {
          startButton.hidden = true
          storyButton.hidden = true
          input.hidden = true
          userName = input.value
          initializeMap()
          startGame()
        } else {  
          alert("Please enter a valid username")
        }
      })
      storyButton.addEventListener('click', () => {
        if (input.value !== '' && input.value.length < 20) {
        startButton.hidden = true
        storyButton.hidden = true
        input.hidden = true
        container.className = 'game-container'
        userName = input.value
        isStory = true
        alert(userName+" was on his quest to defeat the creator of tetrominos, when he was attacked")
        initializeMap(levels[currentLevel])
        document.getElementById('score').textContent = score + '/50'
        startGame()
        } else {
          alert("Please enter your hero's name")
        }
      })
    }
}

function changeStyle(container) {
  // container.style = 'background-color: green'
  // for (let y = 0; y < ROWS; y++) {
  //   for (let x = 0; x < COLS; x++) {
  //     let tile = game_grid[y][x];
  //     if (tile.value === 2) {
  //       continue
  //     } else {
  //       tile.style = 'background-color: green'
  //     }
  //   }
  // }
} 

function initializeMap(level) {
  let container = document.getElementById('container')
  clearGrid()

  if (level === undefined) {
    for (let y = 0; y < ROWS; y++) {
      game_grid[y] = []
        for (let x = 0; x < COLS; x++) {
            let tile = createElem('div', 'tile', x+'-'+y)
            tile.value = 0
            game_grid[y][x] = tile
            container.appendChild(tile)
        }
    }
  } else {
    for (let y = 0; y < level.length; y++) {
      game_grid[y] = [];
      for (let x = 0; x < level[y].length; x++) {
        let tile = createElem('div', 'tile', x + '-' + y);
        tile.value = level[y][x];
        game_grid[y][x] = tile;

        if (level[y][x] === 2) {
          tile.classList.add('blocked')
        }

        container.appendChild(tile)
      }
    }
  }
}

function clearGrid() {
  let container = document.getElementById('container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}


function startGame() {
  if (enteredSecondLevel) {
    document.getElementById('score').textContent = score + '/100'
  } else if (enteredThirdLevel) {
    document.getElementById('score').textContent = score + '/150'
  } else if (enteredLastLevel) {
    document.getElementById('score').textContent = score + '/200'
  }
  if (gameStartTime === 0 || gamePaused) {
    gameStartTime = performance.now() - (gamePaused ? temporaryPauseTime : 0)
  }

  gameTimerInterval = setInterval(updateTimer, 1000)
  if (!gameLoopRunning) {
    gameLoopRunning = true
    gameSession = requestAnimationFrame(gameLoop)
  }
}

function updateTimer() {
  if (!gamePaused) {
    // Calculate the elapsed time in milliseconds
    let currentTime = performance.now();
    let elapsedTimeInMilliseconds = currentTime - gameStartTime;

    // Calculate the elapsed minutes and seconds
    let minutes = Math.floor(elapsedTimeInMilliseconds / 60000); // 60000 milliseconds in a minute
    let seconds = Math.floor((elapsedTimeInMilliseconds % 60000) / 1000);

    // Update the timer display element with the new timer value
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
      timerDisplay.textContent = 'Time: ' + minutes + 'm ' + seconds + 's';
    }
  }
}


function stopGame() {
  currentBlock = null
  document.getElementById('score').textContent = 0
  cancelAnimationFrame(gameSession)
  clearInterval(gameTimerInterval)
  gamePaused = false
}

function gameLoop(timeStamp) {
  if (!gamePaused) {
    // Move the current block down by one step
    deltaTime = timeStamp - lastTime
    lastTime = timeStamp
    frameCounter++

    if (frameCounter >= 60 / 2) { 
      // 60 frames per second divided by 2 to move twice per second
      moveBlockDown()
      frameCounter = 0
    }

    //update fps
    fpsCounter++
    if (timeStamp - lastFpsUpdate >= 1000) {
      displayedFps = fpsCounter
      fpsCounter = 0
      lastFpsUpdate = timeStamp
      updateFpsDisplay(displayedFps); // Update the displayed FPS value
    }

    // Generate a new block if there's no current block
    if (!currentBlock) {
      generateBlock(nextBlockIndex);
      nextBlockIndex = updateNextBlockWindow();
    }

    requestAnimationFrame(gameLoop)
  }
}

function updateFpsDisplay(fps) {
  // Update the FPS display element with the new FPS count
  const fpsDisplay = document.getElementById('fps');
  if (fpsDisplay) {
    fpsDisplay.textContent = 'FPS: ' + fps;
  }
}

function generateBlock(next) {
  let shapeIndex = Math.floor(Math.random() * SHAPES.length)
  let shape = SHAPES[shapeIndex]
  if (next >= 0) {
    shape = SHAPES[next]
  }

  currentBlock = {
    shape: shape,
    x: Math.floor(COLS / 2-2), // Start the block at the middle of the grid
    y: 0,
  }

  if (checkCollision(currentBlock)) {
    // The newly generated block collides with existing blocks at the top, Game over
    stopGame();
    clearInterval(gameTimerInterval)
    submitScore(userName, score)
    score = 0
    alert('YOU DIED')
    getScores()
    location.reload()
    return
  }

  drawBlock()
}

function  drawBlock() {
  let { shape, x, y } = currentBlock;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        // Calculate the coordinates for the block in the grid
        let gridX = x + col
        let gridY = y + row
        game_grid[gridY][gridX].classList.add('block')
        game_grid[gridY][gridX].value = 1
      }
    }
  }
}

function deleteBlock() {
  // Remove the current block from the grid
  let { shape, x, y } = currentBlock;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        // Calculate the coordinates for the block in the grid
        let gridX = x + col;
        let gridY = y + row;
        game_grid[gridY][gridX].classList.remove('block');
        game_grid[gridY][gridX].value = 0;
      }
    }
  }
}

function checkCollision(block) {
  // Temporarily remove the current block from the grid during the collision check
  deleteBlock()

  // Check if the block collides with the game borders or existing blocks
  let { shape, x, y } = block
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        let gridX = x + col
        let gridY = y + row

        // Check for collisions with game borders and existing blocks
        if (
          gridY < 0 ||
          gridX < 0 ||
          gridX >= COLS ||
          gridY >= ROWS ||
          game_grid[gridY][gridX].value === 1 ||
          game_grid[gridY][gridX].value === 2
        ) {
          return true
        }
      }
    }
  }

  return false
}


const createElem = (htmlElem, className, id) => {
  let x = document.createElement(htmlElem)
  if (id !== undefined) {
      x.id = id
  }
  if (className !== undefined) {
      x.className = className
  }

  return x
}

document.addEventListener('keydown', (event) => {
  if (currentBlock && !gamePaused) {
    switch (event.key) {
      case 'ArrowLeft':
        moveBlockLeft();
        break;
      case 'ArrowRight':
        moveBlockRight();
        break;
      case 'ArrowDown':
        moveBlockDown();
        break;
      case 'ArrowUp':
        rotateBlock();
        break;
      case ' ':
        dropBlock()
        break
      case 'Escape':
        pauseGame()
        break
    }
  }
})

function moveBlockLeft() {
  if (!checkCollision({ ...currentBlock, x: currentBlock.x - 1 })) {
    deleteBlock();
    currentBlock.x--;
    drawBlock();
  }
}

function moveBlockRight() {
  if (!checkCollision({ ...currentBlock, x: currentBlock.x + 1 })) {
    deleteBlock();
    currentBlock.x++;
    drawBlock();
  }
}

function  moveBlockDown() {
  if (!checkCollision({ ...currentBlock, y: currentBlock.y + 1 })) {
    currentBlock.y++
    drawBlock();
  } else {
    if (currentBlock.y <= 0) {
      stopGame()
      clearInterval(gameTimerInterval)
      submitScore(userName, score)
      score = 0
      alert('YOU DIED')
      getScores()
      location.reload()
      return;
    }
    deleteBlock();
    lockBlock()
    clearCompletedRows()
    generateBlock(nextBlockIndex)
    nextBlockIndex = updateNextBlockWindow()
  }
}

function lockBlock() {
// Lock the current block in its position on the grid
let { shape, x, y } = currentBlock
for (let row = 0; row < shape.length; row++) {
  for (let col = 0; col < shape[row].length; col++) {
    if (shape[row][col] === 1) {
      let gridX = x + col
      let gridY = y + row
      game_grid[gridY][gridX].classList.add('locked')
      game_grid[gridY][gridX].value = 1
      }
    }
  }
}

function rotateBlock() {
  let rotatedBlock = []

  for (let col = 0; col < currentBlock.shape[0].length; col++) {
    let newRow = []
    for (let row = currentBlock.shape.length - 1; row >= 0; row--) {
      newRow.push(currentBlock.shape[row][col])
    }
    rotatedBlock.push(newRow)
  }

  if (!checkCollision({ ...currentBlock, shape: rotatedBlock })) {
    deleteBlock()
    currentBlock.shape = rotatedBlock
    drawBlock()
  }
}

function dropBlock() {
  while (!checkCollision({ ...currentBlock, y: currentBlock.y + 1 })) {
    currentBlock.y++
  }
}

function clearCompletedRows() {
  // Check and clear completed rows
  let completedRows = [];
  for (let y = 0; y < ROWS; y++) {
    let isRowCompleted = true;
    for (let x = 0; x < COLS; x++) {
      if (game_grid[y][x].value === 0) {
        isRowCompleted = false;
        break;
      }
    }
    if (isRowCompleted) {
      completedRows.push(y);
    }
  }

  if (completedRows.length > 0) {
    // Update score
    score += completedRows.length * 10;
    if (!isStory) {
      document.getElementById('score').textContent = score
    } else {
      if (!enteredSecondLevel && !enteredThirdLevel && !enteredLastLevel) {
        document.getElementById('score').textContent = score+'/50'
      } else if (enteredSecondLevel) {
        document.getElementById('score').textContent = score + '/100'
      } else if (enteredThirdLevel) {
        document.getElementById('score').textContent = score + '/150'
      } else if (enteredLastLevel) {
        document.getElementById('score').textContent = score + '/200'
      }
    }
    
    if (isStory && score >= 50 && !enteredSecondLevel) {
      enteredSecondLevel = true
      alert(userName + " defeated evil tetrominos on the field and entered a cave")
      newLevel()
    } else if (isStory && score >= 100 && !enteredThirdLevel) {
      enteredThirdLevel = true
      enteredSecondLevel = false
      alert("Suddenly the roof starts falling!")
      newLevel()
    } else if (isStory && score >= 150 && !enteredLastLevel) {
      enteredThirdLevel = false
      enteredLastLevel = true
      alert("Finally," + userName + " stands before the evil creator of tetrominos")
      newLevel()
    }

    // Sort completedRows in ascending order
    completedRows.sort((a, b) => a - b);

    // Clear completed rows
    for (let i = completedRows.length - 1; i >= 0; i--) {
      let clearedRow = completedRows[i];
      for (let x = 0; x < COLS; x++) {
        game_grid[clearedRow][x].classList.remove('locked');
        game_grid[clearedRow][x].value = 0;
      }
    }

    // Move rows above clearedRows down
    for (let i = completedRows[0] - 1; i >= 0; i--) {
      for (let x = 0; x < COLS; x++) {
        let tileValue = game_grid[i][x].value;
        game_grid[i + completedRows.length][x].classList.toggle('locked', tileValue === 1);
        game_grid[i + completedRows.length][x].value = tileValue;
      }
    }
  }
}

function newLevel() {
  currentLevel++
  currentBlock = null
  cancelAnimationFrame(gameSession)

  if (currentLevel < levels.length) {
    initializeMap(levels[currentLevel])
    startGame();
  } else {
    alert("Congratulations, "+ userName +", you won!")
    stopGame();
    clearInterval(gameTimerInterval)
    submitScore(userName, score)
    score = 0
    getScores()
    location.reload()
    return
  }
}

function updateNextBlockWindow() {
  let nextBlockContainer = document.getElementById('next-block-grid');
  nextBlockContainer.innerHTML = ''; // Clear the previous content

  // Get the shape of the next block
  let randomNumber =Math.floor(Math.random() * SHAPES.length)
  let nextBlockShape = SHAPES[randomNumber];

  // Create the grid elements for the next block
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let nextBlockTile = createElem('div', 'next-block-tile');
      if (nextBlockShape[row] && nextBlockShape[row][col] === 1) {
        nextBlockTile.classList.add('block');
      }
      nextBlockContainer.appendChild(nextBlockTile);
    }
  }
  return randomNumber
}

// PAUSE MENU

const pauseOverlay = document.getElementById('pause-overlay')
const resumeBtn = document.getElementById('resume-btn')
const restartBtn = document.getElementById('restart-btn')
const mainMenuBtn = document.getElementById('main-menu-btn')

let temporaryPauseTime = 0

function pauseGame() {
  gamePaused = true
  clearInterval(gameTimerInterval)
  temporaryPauseTime = performance.now()
  pauseOverlay.style.display = 'flex'
}

function hidePauseMenu() {
  pauseOverlay.style.display = 'none'
}

resumeBtn.addEventListener('click', () => {
  gamePaused = false;
  gameLoopRunning = false

  gameStartTime = temporaryPauseTime

  hidePauseMenu();
  startGame();
});



// Event listener to restart the game when the "Restart" button is clicked
restartBtn.addEventListener('click', () => {
  hidePauseMenu()
  stopGame()
  clearInterval(gameTimerInterval)
  currentBlock = null
  gameStartTime = 0
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
        let tile = document.getElementById(x+'-'+y)
        tile.value = 0
        tile.classList.remove('locked')
        tile.classList.remove('block')
    }
  }
  if (isStory) {
    currentLevel = 0
  }
  startGame()
})

mainMenuBtn.addEventListener('click', () => {
  hidePauseMenu()
  stopGame()
  clearInterval(gameTimerInterval)
  gameStartTime = 0
  MainMenu(true)
})

// Submit score to the server
function submitScore(name, score) {
    let elapsedTimeInMilliseconds = performance.now() - gameStartTime;
    let minutes = Math.floor(elapsedTimeInMilliseconds / 60000)
    let seconds = Math.floor((elapsedTimeInMilliseconds % 60000) / 1000)
    let gameTime = minutes + 'm' + ' ' + seconds + 's'
  const data = { name: name, score: score, time: gameTime }
  fetch('/submit-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => {
      updateScoresTable(data)
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Get scores from the server
function getScores() {
  fetch('/get-scores')
    .then(response => response.json())
    .then(data => {
      updateScoresTable(data)
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

const backButton = document.getElementById('Back')
const forwardButton = document.getElementById('Forward')
const currentPageElement = document.getElementById('currentPage')

// Function to update the current page number
function updatePageNumber() {
  currentPageElement.textContent = `Page ${currentPage + 1}`;
}

function updateScoresTable(users) {
  let table = document.getElementById('users')
  table.innerHTML = ''
  
  let sortedUsers = users
  sortedUsers.sort((a, b) => b.score - a.score)

  let startIndex = currentPage * usersPerPage
  let endIndex = startIndex + usersPerPage
  let displayedUsers = sortedUsers.slice(startIndex, endIndex)

  for (let i = 0; i < displayedUsers.length; i++) {
    let user = createElem('div', 'userDiv')

    let id = createElem('p', 'userTableData')
    id = displayedUsers[i].id + '. '
    
    let name = createElem('p', 'userTableData')
    name = displayedUsers[i].name + ' | '
    
    let userScore = createElem('p', 'userTableData')
    userScore = displayedUsers[i].score + ' points | '
    
    let userTime = createElem('p', 'userTableData')
    userTime = displayedUsers[i].time+ ' | '
    
    user.append(id, name, userScore, userTime)
    table.appendChild(user)
  }

  forwardButton.addEventListener('click', () => {
    if ((currentPage+1) * usersPerPage < sortedUsers.length) {
      currentPage++
      updateScoresTable(sortedUsers)
      updatePageNumber()
    }
  })

  backButton.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      updateScoresTable(sortedUsers)
      updatePageNumber()
    }
  })
}
