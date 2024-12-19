// Global variables
var game;
var player, ball, violetBricks, yellowBricks, redBricks, cursors;
var username = localStorage.getItem('username') || '';
var highScore = JSON.parse(localStorage.getItem('highScores')) || {};
var currentScore = 0;
var gameStarted = false;

window.onload = function() {
  var authContainer = document.getElementById('authContainer');
  var loginBox = document.getElementById('usernameInput');
  var passwordBox = document.getElementById('passwordInput');
  var togglePassword = document.getElementById('togglePassword');
  var loginButton = document.getElementById('loginButton');
  var registerButton = document.getElementById('registerButton');
  var highScoresContainer = document.getElementById('highScoresContainer');

  // Initialize game only after ensuring the DOM is fully loaded
  if (username) {
    startGame();
    hideUIElements();
  } else {
    showUIElements();
  }

  loginButton.addEventListener('click', handleLogin);
  registerButton.addEventListener('click', handleRegister);
  togglePassword.addEventListener('change', togglePasswordVisibility);

  function startGame() {
    game = new Phaser.Game(800, 640, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });
  }

  function handleLogin() {
    username = loginBox.value;
    let password = passwordBox.value;

    // For simplicity, we'll assume any non-empty password is valid.
    if (username && password) {
      localStorage.setItem("username", username);
      startGame();
      hideUIElements();
    } else {
      alert('Please enter both username and password.');
    }
  }

  function handleRegister() {
    let newUser = loginBox.value;
    let newPassword = passwordBox.value;

    if (newUser && newPassword && !highScore[newUser]) {
      localStorage.setItem("username", newUser);
      highScore[newUser] = 0; // Initialize user score to 0
      localStorage.setItem('highScores', JSON.stringify(highScore));
      startGame();
      hideUIElements();
    } else {
      alert('This username is already taken, empty, or password not provided.');
    }
  }

  function togglePasswordVisibility() {
    const type = passwordBox.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordBox.setAttribute('type', type);
  }

  function showUIElements() {
    authContainer.style.display = 'block';
  }

  function hideUIElements() {
    authContainer.style.display = 'none';
  }

  function displayHighScores() {
    highScoresContainer.innerHTML = ''; // Clear previous scores
    Object.entries(highScore).sort((a, b) => b[1] - a[1]).forEach(([user, score], index) => {
      if (index < 5) { // Only show top 5 scores
        let div = document.createElement('div');
        div.textContent = `${user}: ${score}`;
        highScoresContainer.appendChild(div);
      }
    });
    highScoresContainer.style.display = 'block';
  }
};

function preload() {
  game.load.image('ball', 'assets/images/ball_32_32.png');
  game.load.image('paddle', 'assets/images/paddle_128_32.png');
  game.load.image('brick1', 'assets/images/brick1_64_32.png');
  game.load.image('brick2', 'assets/images/brick2_64_32.png');
  game.load.image('brick3', 'assets/images/brick3_64_32.png');
}

function create() {
  // Ensure all assets have been loaded before proceeding
  if (!game.cache.isSoundDecoded('ball') || !game.cache.isSoundDecoded('paddle') ||
      !game.cache.isSoundDecoded('brick1') || !game.cache.isSoundDecoded('brick2') ||
      !game.cache.isSoundDecoded('brick3')) {
    return;
  }

  // Initialize the physics engine
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // Create the player paddle
  player = game.add.sprite(game.world.centerX, 565, 'paddle');
  player.anchor.setTo(0.5);
  game.physics.arcade.enable(player);
  player.body.immovable = true;

  // Create the ball
  ball = game.add.sprite(game.world.centerX, 530, 'ball');
  ball.anchor.setTo(0.5);
  game.physics.arcade.enable(ball);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);

  // Create brick groups and populate them with bricks
  violetBricks = game.add.group();
  yellowBricks = game.add.group();
  redBricks = game.add.group();

  for (var i = 0; i < 10; i++) {
    createBrick(violetBricks, 'brick1', 80 + i * 70, 140);
    createBrick(yellowBricks, 'brick2', 80 + i * 70, 90);
    createBrick(redBricks, 'brick3', 80 + i * 70, 40);
  }

  // Initialize keyboard controls
  cursors = game.input.keyboard.createCursorKeys();

  // Add opening text
  openingText = game.add.text(
    game.world.centerX,
    game.world.centerY,
    'Press SPACE to Start',
    { font: '50px Monaco, Courier, monospace', fill: '#fff' },
  ).anchor.setTo(0.5);

  // Add game over and win texts but keep them hidden initially
  gameOverText = game.add.text(
    game.world.centerX,
    game.world.centerY,
    'Game Over',
    { font: '50px Monaco, Courier, monospace', fill: '#fff' },
  ).visible = false;

  playerWonText = game.add.text(
    game.world.centerX,
    game.world.centerY,
    'You won!',
    { font: '50px Monaco, Courier, monospace', fill: '#fff' },
  ).visible = false;

  // Display high score after initializing the game
  displayHighScores();
}

function update() {
  if (!gameStarted) {
    if (cursors && cursors.space && cursors.space.isDown && username) {
      gameStarted = true;
      ball.body.velocity.y = -200;
      openingText.visible = false;
    }
  } else {
    if (isGameOver()) {
      gameOverText.visible = true;
      ball.body.velocity.setTo(0, 0);
      updateHighScore(username, currentScore); // Update high score on game over
    } else if (isWon()) {
      playerWonText.visible = true;
      ball.body.velocity.setTo(0, 0);
      updateHighScore(username, currentScore); // Update high score on win
    } else {
      player.body.velocity.x = 0;
      if (cursors.left.isDown) {
        player.body.velocity.x = -350;
      } else if (cursors.right.isDown) {
        player.body.velocity.x = 350;
      }
    }
  }

  // Collisions and interactions
  game.physics.arcade.collide(ball, violetBricks, hitBrick, null, this);
  game.physics.arcade.collide(ball, yellowBricks, hitBrick, null, this);
  game.physics.arcade.collide(ball, redBricks, hitBrick, null, this);
  game.physics.arcade.collide(ball, player, hitPlayer, null, this);
}

function getHighScore() {
  return Math.max(...Object.values(highScore), 0);
}

function updateHighScore(username, score) {
  highScore[username] = Math.max(score, highScore[username] || 0);
  localStorage.setItem('highScores', JSON.stringify(highScore));
  displayHighScores(); // Update displayed high scores
}

function isGameOver() {
  return ball.y > game.world.height;
}

function isWon() {
  return violetBricks.total === 0 && yellowBricks.total === 0 && redBricks.total === 0;
}

function hitBrick(ball, brick) {
  brick.kill();
  currentScore++;
}

function hitPlayer(ball, player) {
  ball.body.velocity.y = -ball.body.velocity.y;
  let newXVelocity = Math.abs(ball.body.velocity.x) + 5;
  if (ball.x < player.x) {
    ball.body.velocity.x = -newXVelocity;
  } else {
    ball.body.velocity.x = newXVelocity;
  }
}

function createBrick(group, key, x, y) {
  var brick = group.create(x, y, key);
  if (brick) {
    game.physics.arcade.enable(brick);
    brick.body.immovable = true;
  }
}