// 方向键对应事件code
const KEY_LEFT_CODE = 37;
const KEY_UP_CODE = 38;
const KEY_RIGHT_CODE = 39;
const KEY_DOWN_CODE = 40;
// 整个小蛇移动格子个数
const size = 20;
// 每个格子的大小
const vertical = 20;
// 所有移动方向
const targetEnum = {
    LEFT: 'left',
    UP: 'up',
    RIGHT: 'right',
    DOWN: 'down'
}
// 所有游戏状态
const stateEnum = {
    INIT: 0,
    DOING: 1,
    END: 2
}
// 每次吃到食物的加分
const foodScore = 100;
// 当前游戏状态
let state = stateEnum.INIT;
// 移动速度，默认为300ms移动一次
let moveSpeed = 300;
// 障碍物个数
let obstacleNum = 3;
// 当前游戏得分
let score = 0;
// 小蛇的初始位置
let initPosition = [];
// 小蛇所有部位的数组
let snakePositions = [];
// 记录上一次小蛇移动位置的数组
let oldSnakePositions = [];
// 食物位置
let foodPosition = [];
// 障碍物数组
let obstaclePositions = [];
// 小蛇移动方向
let target = null;
// 小蛇移动定时器
let snakeTimer = null;
// 食物出现的定时器
let foodTimer = null;
// 食物是否已经存在
let foodExist = false;

// 通过id获取元素
function getElemById(id) {
    return document.getElementById(id);
}

// 通过类获取第一个元素
function getElemByClass(className) {
    return document.querySelector('.' + className);
}

// 通过类索取所有元素
function getElemsByClass(className) {
    return document.querySelectorAll('.' + className);
}

// 通过名称获取所有元素
function getElemsByName(name) {
    return document.getElementsByName(name);
}

// 获取x轴的位置
function getLeftPosition(x) {
    return x * vertical + 'px';
}

// 获取y轴的位置
function getTopPosition(y) {
    return y * vertical + 'px';
}

// 初始化游戏配置
function init() {
    const $startGame = getElemById('start-game-btn');
    // 开始按钮点击事件
    $startGame.onclick = function () {
        const $initContent = getElemById('init-content');
        const $obstacleNum = getElemById('obstacle-num');
        const $speeds = getElemsByName('speed');
        // 获取障碍物个数
        obstacleNum = $obstacleNum.value || obstacleNum;
        if (obstacleNum < 0 || obstacleNum > 10) {
            alert('障碍物个数需要在1-10之间');
            return;
        }
        // 获取选择的移动速度
        for (let i = 0; i < $speeds.length; i++) {
            if ($speeds[i].checked) {
                moveSpeed = $speeds[i].value;
                break;
            }
        }
        // 隐藏设置界面
        $initContent.style.display = 'none';
        // 初始化游戏界面
        initGame();
    }
    // 拓展：更新排行榜
    updateRankList();
}

// 初始化游戏界面
function initGame() {
    // 显示计分的元素
    getElemById('score-container').style.display = 'block';
    // 显示游戏介绍的元素
    getElemById('introduce-container').style.display = 'block';

    // 初始化游戏界面
    initContainer();

    // 添加小蛇
    addSnake();

    // 添加障碍物
    for (let i = 0; i < obstacleNum; i++) {
        addObstacle();
    }

    // 添加食物
    addFood();

    // 绑定方向键事件
    document.addEventListener('keydown', onKeydownEvent, false);
}

// 方向键事件
function onKeydownEvent(e) {
    // 当游戏结束时，直接返回
    if (state === stateEnum.END) {
        return;
    }
    // 游戏初始状态开始移动方向后，将状态设置为运行状态
    if (state === stateEnum.INIT) {
        state = stateEnum.DOING;
    }
    // 根据不同移动方向进行移动
    switch (e.keyCode) {
        case KEY_LEFT_CODE:
            moveLeft();
            break;
        case KEY_UP_CODE:
            moveUp();
            break;
        case KEY_RIGHT_CODE:
            moveRight();
            break;
        case KEY_DOWN_CODE:
            moveDown();
            break;
    }
}

// 小蛇吃食物
function eatFood() {
    // 小蛇头部元素位置等于食物位置时，表示吃到食物，返回true
    if (snakePositions[0][0] === foodPosition[0] && snakePositions[0][1] === foodPosition[1]) {
        return true;
    }
    return;
}

// 吃到食物后，强化小蛇
function strongSnake() {
    // 需要强化部分的位置
    let snakeItemPosition = [];
    const length = oldSnakePositions.length;
    // 获取小蛇移动前最后一个元素的位置
    snakeItemPosition = [oldSnakePositions[length - 1][0], oldSnakePositions[length - 1][1]];
    // 将强化部分元素的位置添加到小蛇上
    snakePositions.push(snakeItemPosition);
    const $snakeItem = document.createElement('span');
    $snakeItem.setAttribute('class', 'snake-item');
    $snakeItem.style.left = getLeftPosition(snakeItemPosition[0]);
    $snakeItem.style.top = getTopPosition(snakeItemPosition[1]);
    getElemByClass('snake').appendChild($snakeItem);
}

function getResult() {
    // 是否碰撞到墙壁
    if (snakePositions[0][0] < 0 || snakePositions[0][0] > size - 1 || snakePositions[0][1] < 0 || snakePositions[0][1] > size - 1) {
        state = stateEnum.END;
        return state;
    }

    // 是否碰撞到障碍物
    const isHitObstacle = obstaclePositions.some(obstaclePosition => {
        if (obstaclePosition[0] === snakePositions[0][0] && obstaclePosition[1] === snakePositions[0][1]) {
            return true;
        }
    });

    // 如果碰撞到墙壁，游戏结束
    if (isHitObstacle) {
        state = stateEnum.END;
        return state;
    }

    // 是否碰撞到自己
    const isHitSelf = oldSnakePositions.some(snakePosition => {
        if (snakePositions[0][0] === snakePosition[0] && snakePositions[0][1] === snakePosition[1]) {
            return true;
        }
    });

    // 如果碰撞到自己，游戏结束
    if (isHitSelf) {
        state = stateEnum.END;
        return state;
    }

    if (eatFood()) {
        // 如果成功吃到食物，则调用strongSnake()函数强化小蛇
        strongSnake();
        // 食物设置为不存在
        foodExist = false;
        // 从界面上移除小蛇吃掉的食物
        const $food = getElemByClass('food');
        getElemById('container').removeChild($food);
        // 小蛇的分数加100，并更新在界面上
        score += foodScore;
        getElemById('score').innerHTML = score;
    }
    // 如果游戏未结束，将状态设置为进行中
    state = stateEnum.DOING;
    return state;
}

// 恢复游戏初始化状态
function resetInitData() {
    state = stateEnum.INIT;
    snakePositions = [];
    oldSnakePositions = [];
    obstaclePositions = [];
    foodPosition = [];
    target = null;
    foodExist = false;
    score = 0;
    getElemById('score').innerHTML = 0;
    document.removeEventListener('keydown', onKeydownEvent);
}

// 显示游戏结束界面
function showGameOver() {
    clearInterval(snakeTimer);
    clearInterval(foodTimer);
    snakeTimer = null;
    foodTimer = null;
    const $gameOverContainer = getElemById('game-over-container');
    $gameOverContainer.style.display = 'block';
    getElemById('total-score').innerHTML = score;
    // 拓展：存储和更新排行榜
    saveCurrentScore();
    updateRankList();
    getElemById('restart-btn').onclick = function() {
        getElemById('game-over-container').style.display = 'none';
        resetInitData();
        initGame();
    }
    getElemById('exit-btn').onclick = function() {
        window.location.reload();
    }
}

// 获取移动之后的小蛇位置
function getNewSnakePositions() {
    // 移动一格位置后，小蛇位置的新数组
    const newSnakePostions = [];
    switch (target) {
        case targetEnum.UP:
            // 如果往上移动，则小蛇头部y轴-1
            newSnakePostions.push([snakePositions[0][0], snakePositions[0][1] - 1]);
            break;
        case targetEnum.RIGHT:
            // 如果向右移动，则小蛇头部x轴+1
            newSnakePostions.push([snakePositions[0][0] + 1, snakePositions[0][1]]);
            break;
        case targetEnum.DOWN:
            // 如果往下移动，则小蛇头部y轴+1
            newSnakePostions.push([snakePositions[0][0], snakePositions[0][1] + 1]);
            break;
        case targetEnum.LEFT:
            // 如果往左移动，则小蛇头部x轴-1
            newSnakePostions.push([snakePositions[0][0] - 1, snakePositions[0][1]]);
            break;
    }
    // 循环当前所有小蛇的数组，将小蛇除尾部的位置全部添加到新的数组中
    for (let i = 1; i < snakePositions.length; i++) {
        const preSnakePosition = snakePositions[i - 1];
        newSnakePostions.push(preSnakePosition);
    }
    return newSnakePostions;
}

// 小蛇移动位置
function movePosition() {
    // 如果小蛇不存在移动方向或者游戏结束，不再移动
    if (!target || state === stateEnum.END) {
        return;
    }
    // 移动一格位置后，小蛇位置的新数组
    const newSnakePostions = getNewSnakePositions();
    // 将移动之前的位置记录在oldSnakePositions数组中
    oldSnakePositions = [...snakePositions];
    // 将snakePositions数组设置为新数组
    snakePositions = [...newSnakePostions];
    // 判定小蛇移动后，游戏是否结束
    const result = getResult();
    // 如果游戏结束，直接展示结束页面
    if (result === stateEnum.END) {
        showGameOver();
        return;
    }
    // 移动小蛇的位置
    const $snakeItems = getElemsByClass('snake-item');
    [...$snakeItems].map(($snakeItem, index) => {
        $snakeItem.style.transition = `all ${moveSpeed}ms linear`;        
        $snakeItem.style.left = getLeftPosition(snakePositions[index][0]);
        $snakeItem.style.top = getTopPosition(snakePositions[index][1]);
    });
}

// 调整方向，并移动小蛇
function moveSnake() {
    // 每次执行moveSnake()函数时，先清除小蛇移动的定时器
    clearInterval(snakeTimer);
    // 改变方向后，立即执行movePosition()函数移动小蛇
    movePosition();
    // 之后按照小蛇移动速度，定时执行movePosition()函数移动小蛇
    snakeTimer = setInterval(function () {
        movePosition();
    }, moveSpeed);
}

function moveLeft() {
    // 小蛇如果本身在x轴移动，则不允许调整方向
    if (target === targetEnum.LEFT || target === targetEnum.RIGHT) {
        return;
    }
    // 将方向设置为向左运动
    target = targetEnum.LEFT;
    const $firstSnakeItem = getElemByClass('snake-item');
    // 旋转小蛇头部的方向到初始位置
    $firstSnakeItem.style.transform = 'rotate(0)';
    // 调用moveSnake()调整方向，并移动小蛇
    moveSnake();
}

function moveUp() {
    // 小蛇如果本身在y轴移动，则不允许调整方向
    if (target === targetEnum.UP || target === targetEnum.DOWN) {
        return;
    }
    // 将方向设置为向上运动
    target = targetEnum.UP;
    const $firstSnakeItem = getElemByClass('snake-item');
    // 旋转小蛇头部的方向到90度
    $firstSnakeItem.style.transform = 'rotate(90deg)';
    // 调用moveSnake()调整方向，并移动小蛇
    moveSnake();
}

function moveRight() {
    if (target === targetEnum.LEFT || target === targetEnum.RIGHT) {
        return;
    }
    target = targetEnum.RIGHT;
    const $firstSnakeItem = getElemByClass('snake-item');
    $firstSnakeItem.style.transform = 'rotate(180deg)';
    moveSnake();
}

function moveDown() {
    if (target === targetEnum.UP || target === targetEnum.DOWN) {
        return;
    }
    target = targetEnum.DOWN;
    const $firstSnakeItem = getElemByClass('snake-item');
    $firstSnakeItem.style.transform = 'rotate(270deg)';
    moveSnake();
}

// 判断界面上某个位置是否存在小蛇的身体
function isSnakePosition(x, y) {
    for (let i = 0; i < snakePositions.length; i++) {
        if (snakePositions[i][0] === x && snakePositions[i][1] === y) {
            return true;
        }
    }
    return false;
}

// 判断界面上某个位置是否存在障碍物
function isObstaclePosition(x, y) {
    for (let i = 0; i < obstaclePositions.length; i++) {
        if (obstaclePositions[i][0] === x && obstaclePositions[i][1] === y) {
            return true;
        }
    }
    return false;
}

// 在界面上，随机生成一个位置
function getRandomPosition() {
    let x = Math.round(Math.random() * size);
    let y = Math.round(Math.random() * size);
    x = x >= size ? size - 1 : x;
    y = y >= size ? size - 1 : y;
    return [x, y];
}

// 初始化小蛇移动界面
function initContainer() {
    // 计算小蛇移动容器宽高
    const containerWidth = size * vertical + 'px';
    const containerHeight = containerWidth;
    const $container = getElemById('container');
    // 显示游戏容器，并设置宽高
    $container.style.display = 'block';
    $container.style.width = containerWidth;
    $container.style.height = containerHeight;

}

// 添加小蛇
function addSnake() {
    // 计算容器中间位置
    const center = Math.floor(size / 2);
    // 设置小蛇初始位置为容器中间
    initPosition = [center, center];
    // 设置小蛇的位置
    snakePositions = [[...initPosition]];
    // 小蛇的DOM元素
    const $snake = '<span class="snake-item" style="top: ' + getTopPosition(initPosition[1]) + ';left: ' + getLeftPosition(initPosition[0]) + '"></span>';
    // 添加小蛇到容器中
    getElemById('container').innerHTML = '<span class="snake">' + $snake + '</span>';
}

// 添加食物
function addFood() {
    showFood();
    // 开启定时器随机出现食物
    foodTimer = setInterval(function () {
        showFood();
    }, moveSpeed);
}

// 随机出现食物
function showFood() {
    // 如果存在食物或者游戏结束，直接返回
    if (foodExist || state === stateEnum.END) {
        return;
    }
    // 随机生成食物的位置
    const position = getRandomPosition();
    const x = position[0];
    const y = position[1];
    // 如果出现食物的位置存在小蛇或者障碍物，重新生成食物
    if (isSnakePosition(x, y) || isObstaclePosition(x, y)) {
        return showFood();
    }
    // 将食物插入到界面中，并将foodExist设置为已存在
    foodPosition = [x, y];
    const $food = document.createElement('span');
    $food.setAttribute('class', 'food');
    $food.style.left = x * vertical + 'px';
    $food.style.top = y * vertical + 'px';
    getElemById('container').appendChild($food);
    foodExist = true;
}

// 添加障碍物
function addObstacle() {
    // 随机生成障碍物的位置
    const position = getRandomPosition();
    const x = position[0];
    const y = position[1];
    // 如果出现障碍物的位置存在小蛇或者障碍物，重新生成障碍物
    if (isSnakePosition(x, y) || isObstaclePosition(x, y)) {
        return addObstacle();
    }
    // 将障碍物插入到界面中
    obstaclePositions.push([x, y]);
    const $obstacle = document.createElement('span');
    $obstacle.setAttribute('class', 'obstacle');
    $obstacle.style.left = x * vertical + 'px';
    $obstacle.style.top = y * vertical + 'px';
    getElemById('container').appendChild($obstacle);
}

// 初始化游戏
init();

// 扩展：排行榜
// 存储排行榜分数
function saveCurrentScore() {
    // 获取存储的分数列表
    const scoreList = window.localStorage.getItem('scoreList');
    // 如果不存在分数，则直接将分数添加到localStorage中
    if (!scoreList) {
        window.localStorage.setItem('scoreList', JSON.stringify([score]));
        return;
    }
    try {
        // 将分数转换为数组
        const scoreArr = JSON.parse(scoreList);
        // 添加当前分数
        scoreArr.push(score);
        // 将分数倒序排列
        scoreArr.sort((pre, next) => next - pre);
        // 如果排行榜大于10，直接删除最后一个
        if (scoreArr.length > 10) {
            scoreArr.pop();
        }
        // 设置排行榜数据
        window.localStorage.setItem('scoreList', JSON.stringify(scoreArr));
    } catch(e) {
        console.log(e);
    }
}

// 更新排行榜
function updateRankList() {
    // 获取存储的分数列表
    const scoreList = window.localStorage.getItem('scoreList');
    if (!scoreList) {
        getElemById('rank-list').innerHTML = '<li>暂无分数</li>';
        return;
    }
    try {
        // 将分数转换为数组
        const scoreArr = JSON.parse(scoreList);
        const $list = scoreArr.map((val, index) => {
            return `<li>第${index + 1}名: ${val}分</li>`;
        });
        getElemById('rank-list').innerHTML = $list.join('');
    } catch(e) {
        console.log(e);
    }
};