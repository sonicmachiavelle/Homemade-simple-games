document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');

    // --- Aesthetic Settings ---
    const primarySnakeColor = '#76e276'; // Neon-like green
    const secondarySnakeColor = '#4CAF50'; // Darker green for contrast/detail
    const foodColor = '#ff6347'; // Tomato red or a vibrant color
    const headColor = '#90EE90'; // Lighter green for the head
    const eyeColor = '#000000';
    const eyeOffset = 0.2; // Percentage of segment size

    let gridSize = 20; // Size of each grid cell in pixels
    let tileCountX, tileCountY;

    let snake, food, dx, dy, score, gameLoopInterval, changingDirection;

    // Touch controls
    const upButton = document.getElementById('upBtn');
    const downButton = document.getElementById('downBtn');
    const leftButton = document.getElementById('leftBtn');
    const rightButton = document.getElementById('rightBtn');

    function resizeCanvas() {
        const container = document.querySelector('.container');
        const controlsHeight = document.querySelector('.controls').offsetHeight;
        const scoreBoardHeight = document.querySelector('.score-board').offsetHeight;
        const padding = 40; // Container padding

        let maxWidth = container.clientWidth - padding;
        let maxHeight = window.innerHeight - controlsHeight - scoreBoardHeight - padding - 50; // 50 for extra margin

        // Make canvas a square or rectangle fitting the smaller dimension
        let canvasSize = Math.min(maxWidth, maxHeight);
        canvasSize = Math.floor(canvasSize / gridSize) * gridSize; // Ensure it's a multiple of gridSize

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        tileCountX = canvas.width / gridSize;
        tileCountY = canvas.height / gridSize;
    }

    function initializeGame() {
        snake = [
            { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) },
            { x: Math.floor(tileCountX / 2) - 1, y: Math.floor(tileCountY / 2) },
            { x: Math.floor(tileCountX / 2) - 2, y: Math.floor(tileCountY / 2) }
        ];
        dx = 1; // Initial direction: right
        dy = 0;
        score = 0;
        scoreDisplay.textContent = score;
        changingDirection = false;
        generateFood();
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, 120); // Adjust speed here (lower is faster)
    }

    function gameLoop() {
        if (isGameOver()) {
            clearInterval(gameLoopInterval);
            // Aesthetic game over message
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${canvas.width / 15}px 'Segoe UI'`;
            ctx.fillStyle = '#e94560'; // Accent color for game over
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = `${canvas.width / 25}px 'Segoe UI'`;
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 60);
            canvas.addEventListener('click', initializeGame, { once: true });
            return;
        }

        changingDirection = false;
        clearCanvas();
        moveSnake();
        drawFood();
        drawSnake();
    }

    function clearCanvas() {
        ctx.fillStyle = '#0f0f1a'; // Canvas background from CSS
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnakeSegment(segment, index) {
        ctx.fillStyle = index === 0 ? headColor : (index % 2 === 0 ? primarySnakeColor : secondarySnakeColor);
        ctx.strokeStyle = '#1a1a2e'; // Dark border for segments
        ctx.lineWidth = 2;

        const xPos = segment.x * gridSize;
        const yPos = segment.y * gridSize;

        // Rounded rectangle for a smoother look
        const cornerRadius = gridSize / 4;
        ctx.beginPath();
        ctx.moveTo(xPos + cornerRadius, yPos);
        ctx.lineTo(xPos + gridSize - cornerRadius, yPos);
        ctx.quadraticCurveTo(xPos + gridSize, yPos, xPos + gridSize, yPos + cornerRadius);
        ctx.lineTo(xPos + gridSize, yPos + gridSize - cornerRadius);
        ctx.quadraticCurveTo(xPos + gridSize, yPos + gridSize, xPos + gridSize - cornerRadius, yPos + gridSize);
        ctx.lineTo(xPos + cornerRadius, yPos + gridSize);
        ctx.quadraticCurveTo(xPos, yPos + gridSize, xPos, yPos + gridSize - cornerRadius);
        ctx.lineTo(xPos, yPos + cornerRadius);
        ctx.quadraticCurveTo(xPos, yPos, xPos + cornerRadius, yPos);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();


        // Eyes for the head
        if (index === 0) {
            ctx.fillStyle = eyeColor;
            const eyeRadius = gridSize / 8;
            let eye1X, eye1Y, eye2X, eye2Y;

            if (dx === 1) { // Right
                eye1X = xPos + gridSize * (1 - eyeOffset) - eyeRadius /2;
                eye1Y = yPos + gridSize * eyeOffset;
                eye2X = xPos + gridSize * (1 - eyeOffset) - eyeRadius /2;
                eye2Y = yPos + gridSize * (1 - eyeOffset);
            } else if (dx === -1) { // Left
                eye1X = xPos + gridSize * eyeOffset + eyeRadius/2;
                eye1Y = yPos + gridSize * eyeOffset;
                eye2X = xPos + gridSize * eyeOffset + eyeRadius/2;
                eye2Y = yPos + gridSize * (1 - eyeOffset);
            } else if (dy === 1) { // Down
                eye1X = xPos + gridSize * eyeOffset;
                eye1Y = yPos + gridSize * (1 - eyeOffset) - eyeRadius/2;
                eye2X = xPos + gridSize * (1 - eyeOffset);
                eye2Y = yPos + gridSize * (1 - eyeOffset) - eyeRadius/2;
            } else if (dy === -1) { // Up
                eye1X = xPos + gridSize * eyeOffset;
                eye1Y = yPos + gridSize * eyeOffset + eyeRadius/2;
                eye2X = xPos + gridSize * (1 - eyeOffset);
                eye2Y = yPos + gridSize * eyeOffset + eyeRadius/2;
            }
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeRadius, 0, 2 * Math.PI);
            ctx.arc(eye2X, eye2Y, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    function drawSnake() {
        snake.forEach(drawSnakeSegment);
    }

    function moveSnake() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head); // Add new head

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreDisplay.textContent = score;
            generateFood();
            // Add visual feedback for eating food (e.g., quick flash or particle effect)
            flashEffect(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
        } else {
            snake.pop(); // Remove tail
        }
    }

    function generateFood() {
        food = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        // Ensure food doesn't spawn on the snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                generateFood(); // Regenerate
                return;
            }
        }
    }

    function drawFood() {
        ctx.fillStyle = foodColor;
        ctx.strokeStyle = '#1a1a2e'; // Dark border
        ctx.lineWidth = 2;
        const xPos = food.x * gridSize;
        const yPos = food.y * gridSize;

        // Draw food as a circle or slightly more styled shape
        ctx.beginPath();
        ctx.arc(xPos + gridSize / 2, yPos + gridSize / 2, gridSize / 2.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Add a little shine/highlight to the food
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(xPos + gridSize / 1.8, yPos + gridSize / 2.2, gridSize / 8, 0, 2 * Math.PI);
        ctx.fill();
    }

    function flashEffect(x, y) {
        let radius = gridSize;
        let opacity = 0.7;
        function animateFlash() {
            if (opacity <= 0) return;
            clearCanvas(); // Redraw background
            drawFood();    // Redraw food if still there (or new one)
            drawSnake();   // Redraw snake

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 100, ${opacity})`; // Yellowish flash
            ctx.fill();

            radius += 5;
            opacity -= 0.05;
            requestAnimationFrame(animateFlash);
        }
        animateFlash();
    }


    function isGameOver() {
        // Wall collision
        if (snake[0].x < 0 || snake[0].x >= tileCountX || snake[0].y < 0 || snake[0].y >= tileCountY) {
            return true;
        }
        // Self collision
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
                return true;
            }
        }
        return false;
    }

    function changeDirection(event) {
        if (changingDirection) return;
        changingDirection = true;

        const keyPressed = event.key;
        const goingUp = dy === -1;
        const goingDown = dy === 1;
        const goingRight = dx === 1;
        const goingLeft = dx === -1;

        if ((keyPressed === 'ArrowUp' || keyPressed === 'w') && !goingDown) {
            dx = 0; dy = -1;
        } else if ((keyPressed === 'ArrowDown' || keyPressed === 's') && !goingUp) {
            dx = 0; dy = 1;
        } else if ((keyPressed === 'ArrowLeft' || keyPressed === 'a') && !goingRight) {
            dx = -1; dy = 0;
        } else if ((keyPressed === 'ArrowRight' || keyPressed === 'd') && !goingLeft) {
            dx = 1; dy = 0;
        }
    }

    // Touch Controls Logic
    function handleTouch(newDx, newDy) {
        if (changingDirection) return;
        const goingUp = dy === -1;
        const goingDown = dy === 1;
        const goingRight = dx === 1;
        const goingLeft = dx === -1;

        if (newDx === 0 && newDy === -1 && !goingDown) { // UP
            dx = 0; dy = -1; changingDirection = true;
        } else if (newDx === 0 && newDy === 1 && !goingUp) { // DOWN
            dx = 0; dy = 1; changingDirection = true;
        } else if (newDx === -1 && newDy === 0 && !goingRight) { // LEFT
            dx = -1; dy = 0; changingDirection = true;
        } else if (newDx === 1 && newDy === 0 && !goingLeft) { // RIGHT
            dx = 1; dy = 0; changingDirection = true;
        }
    }

    upButton.addEventListener('click', () => handleTouch(0, -1));
    downButton.addEventListener('click', () => handleTouch(0, 1));
    leftButton.addEventListener('click', () => handleTouch(-1, 0));
    rightButton.addEventListener('click', () => handleTouch(1, 0));

    // Swipe Controls (more advanced and often better for snake on mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 30; // Minimum distance for a swipe

    canvas.addEventListener('touchstart', function(event) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }, false);

    canvas.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > swipeThreshold) {
                handleTouch(deltaX > 0 ? 1 : -1, 0);
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > swipeThreshold) {
                handleTouch(0, deltaY > 0 ? 1 : -1);
            }
        }
    }


    document.addEventListener('keydown', changeDirection);
    window.addEventListener('resize', () => {
        // Debounce resize or throttle
        clearTimeout(window.resizeLag);
        window.resizeLag = setTimeout(() => {
            resizeCanvas();
            // Re-initialize or just redraw might be needed if grid changes significantly
            // For simplicity, we might just re-center. A full re-init is safer if grid changes.
            if (gameLoopInterval) { // if game was running
                 // For now, just clear and redraw. A better approach might re-calc positions.
                clearCanvas();
                if (snake && food) { // If game objects exist
                    drawFood();
                    drawSnake();
                } else {
                    initializeGame(); // If game hasn't started, or if it's better to restart on resize
                }
            } else { // If game over or not started
                 initializeGame(); // Prepare for a new game with new dimensions
            }
        }, 200);
    });


    // Initial setup
    resizeCanvas();
    initializeGame();
});

