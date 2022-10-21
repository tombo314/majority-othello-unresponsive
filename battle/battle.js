// バトル画面のリロード時にスタート画面に戻る
if (sessionStorage.getItem("battleAlreadyLoaded")=="true"){
    // window.location.href = "/";
} else {
    sessionStorage.setItem("battleAlreadyLoaded", "true");
}

// 変数の宣言・初期化
let paintedI;
let paintedJ;
let wDown;
let aDown;
let sDown;
let dDown;
let own;
let ownName;
let xDiff;
let color;
let x = 0;
let y = 0;
let cntStone = 4;
let isRed = true;
let finished = false;
let keysValid = true;

// 定数の宣言
const RED = 1;
const BLUE = 2;
const EMPTY = 0;
const RADIUS = 20;
const DISPLACEMENT = 10;
const LOWER_BOUND_X = RADIUS+10;
const LOWER_BOUND_Y = RADIUS+10;
const UPPER_BOUND_X = 360+1;
const UPPER_BOUND_Y = 450+1;
const INIT_Y_DIFF = 20;
const XDIFF_COEFF = -5.5;
const GRID_X = 56;
const GRID_Y = 54;
const GRID_INIT_LEFT = -40;
const GRID_INIT_TOP = -65;
const GRID_DIFF_X = 5.75;
const GRID_DIFF_Y = 4;
const STONE_LIMIT = 64;
const SCREEN_WIDTH = 1360;
const COLOR_PLAYER_RED = "rgb(255, 100, 100)";
const COLOR_PLAYER_BLUE = "rgb(100, 100, 255)";
const COLOR_FIELD_RED = "rgb(255, 50, 50)";
const COLOR_FIELD_BLUE = "rgb(50, 50, 255)";

// 関数の宣言
let show=(ary)=>{
    for (let i=0; i<8; i++){
        console.log(ary[i]);
    }
}
let getRandomInt=(min, max)=> {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
let makeSquare=(i, j)=>{
    let sheet = document.createElement("div");
    sheet.setAttribute("id", `square${i}${j}`);
    sheet.setAttribute("style", `
        width: ${GRID_X}px;
        height: ${GRID_Y}px;
        position: absolute;
        left: ${GRID_INIT_LEFT+j*(GRID_X+GRID_DIFF_X)}px;
        top: ${GRID_INIT_TOP+i*(GRID_Y+GRID_DIFF_Y)}px;
    `);
    othelloWrapper.appendChild(sheet);
}
let paintSquare=(i, j)=>{
    if (i<0 || j<0 || 8<=i || 8<=j){
        return false
    }
    let elem = document.getElementById(`square${i}${j}`);
    elem.style.backgroundColor = "#cfca";
}
let unPaintSquare=(i, j)=>{
    if (i<0 || j<0 || 8<=i || 8<=j){
        return false
    }
    let elem = document.getElementById(`square${i}${j}`);
    elem.style.backgroundColor = "#70ad47";
}
let makeStone=(i, j)=>{
    // 赤
    let stone = document.createElement("canvas");
    stone.setAttribute("width", 550);
    stone.setAttribute("height", 670);
    stone.setAttribute("style", "position: absolute; transform: translate(-80px, -80px); visibility: hidden;");
    stone.setAttribute("id", `stone${i}${j}${COLOR_FIELD_RED}`);
    othelloWrapper.appendChild(stone);
    let context = stone.getContext("2d");
    context.beginPath();
    context.fillStyle = COLOR_FIELD_RED;
    context.arc(61.7*j+68, 58*i+43, RADIUS, 0*Math.PI/180, 360*Math.PI/180, false);
    context.fill();
    context.stroke();
    
    // 青
    stone = document.createElement("canvas");
    stone.setAttribute("width", 550);
    stone.setAttribute("height", 670);
    stone.setAttribute("style", "position: absolute; transform: translate(-80px, -80px); visibility: hidden;");
    stone.setAttribute("id", `stone${i}${j}${COLOR_FIELD_BLUE}`);
    othelloWrapper.appendChild(stone);
    context = stone.getContext("2d");
    context.beginPath();
    context.fillStyle = COLOR_FIELD_BLUE;
    context.arc(61.7*j+68, 58*i+43, RADIUS, 0*Math.PI/180, 360*Math.PI/180, false);
    context.fill();
    context.stroke();
}
let playerCircleUsed = new Set();
let makePlayerCircle=(playerName, initX, initY, color)=>{
    if (!playerCircleUsed.has(playerName)){
        let canvas = document.createElement("canvas");
        // canvas.setAttribute("width", 430);
        canvas.setAttribute("width", 1400);
        canvas.setAttribute("height", 670);
        canvas.setAttribute("style", "position: absolute; z-index: 999;");
        let context = canvas.getContext("2d");
        canvas.setAttribute("id", `id-${playerName}`);
        context.fillStyle = color;
        nodesAlly.appendChild(canvas);
        playerCircleUsed.add(playerName);
        let elem = document.getElementById(`id-${playerName}`);
        elem.style.zIndex = 1000;
        context.beginPath();
        context.arc(initX, initY, RADIUS, 0*Math.PI/180, 360*Math.PI/180, false);
        context.fill();
        context.stroke();
    }
}
let playerNameUsed = new Set();
let makePlayerName=(playerName, initX, initY)=>{
    if (!playerNameUsed.has(playerName)){
        let createName = document.createElement("div");
        createName.textContent = playerName;
        createName.setAttribute("style", "position: absolute; z-index: 9; font-weight: bold;");
        createName.setAttribute("id", `id-${playerName}-name`);
        nodesAlly.appendChild(createName);
        playerNameUsed.add(playerName);
        elem = document.getElementById(`id-${playerName}-name`);
        xDiff = XDIFF_COEFF*elem.textContent.length;
        elem.style.transform = `translate(${initX+xDiff}px, ${initY+INIT_Y_DIFF}px)`;
        elem.style.zIndex = 10;
    }
}
let visualizeStone=(i, j, color)=>{
    let otherColor;
    if (color==COLOR_FIELD_RED){
        otherColor = COLOR_FIELD_BLUE;
    } else {
        otherColor = COLOR_FIELD_RED;
    }
    let elem = document.getElementById(`stone${i}${j}${otherColor}`);
    elem.style.visibility = "hidden";
    elem = document.getElementById(`stone${i}${j}${color}`);
    elem.style.visibility = "visible";
}
let othello=(p, q, oneOrTwo)=>{
    let n = oneOrTwo;
    let m;
    let color;
    if (n==1){
        m = 2;
        color = COLOR_FIELD_RED;
    } else {
        m = 1
        color = COLOR_FIELD_BLUE;
    }
    let valid = false;
    // そのマスにすでに置いてあったら置けない
    if (field[p][q]!=0){
        return false;
    }
    // 上
    let ok = false;
    if (p-1>=0 && field[p-1][q]==m){
        for (let i=p-1; i>=0; i--){
            if (field[i][q]==n){
                ok = true;
                break
            } else if (field[i][q]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        valid = true;
        for (let i=p-1; i>=0; i--){
            if (field[i][q]==n){
                break
            } else if (field[i][q]==0){
                ok = false;
                break;
            }
            field[i][q] = n;
            visualizeStone(i, q, color);
        }
    }
    // 下
    ok = false;
    if (p+1<8 && field[p+1][q]==m){
        for (let i=p+1; i<8; i++){
            if (field[i][q]==n){
                ok = true;
                break
            } else if (field[i][q]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        valid = true;
        for (let i=p+1; i<8; i++){
            if (field[i][q]==n){
                break
            }
            field[i][q] = n;
            visualizeStone(i, q, color);
        }
    }
    // 左
    ok = false;
    if (q-1>=0 && field[p][q-1]==m){
        for (let j=q-1; j>=0; j--){
            if (field[p][j]==n){
                ok = true;
                break
            } else if (field[p][j]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        valid = true;
        for (let j=q-1; j>=0; j--){
            if (field[p][j]==n){
                break
            }
            field[p][j] = n;
            visualizeStone(p, j, color);
        }
    }
    // 右
    ok = false;
    if (q+1<8 && field[p][q+1]==m){
        for (let j=q+1; j<8; j++){
            if (field[p][j]==n){
                ok = true;
                break
            } else if (field[p][j]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        valid = true;
        for (let j=q+1; j<8; j++){
            if (field[p][j]==n){
                break
            }
            field[p][j] = n;
            visualizeStone(p, j, color);
        }
    }
    // 左上
    ok = false;
    if (p-1>=0 && q-1>=0 && field[p-1][q-1]==m){
        j = q-1;
        for (let i=p-1; i>=0; i--){
            if (j<0){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j--;
        }
    }
    if (ok){
        valid = true;
        j = q-1;
        for (let i=p-1; i>=0; i--){
            if (field[i][j]==n){
                break;
            }
            field[i][j] = n;
            visualizeStone(i, j, color);
            j--;
        }
    }
    // 右上
    ok = false;
    if (p-1>=0 && q+1<8 && field[p-1][q+1]==m){
        j = q+1;
        for (let i=p-1; i>=0; i--){
            if (j>=8){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j++;
        }
    }
    if (ok){
        valid = true;
        j = q+1;
        for (let i=p-1; i>=0; i--){
            if (field[i][j]==n){
                break
            }
            field[i][j] = n;
            visualizeStone(i, j, color);
            j++;
        }
    }
    // 左下
    ok = false;
    if (p+1<8 && q-1>=0 && field[p+1][q-1]==m){
        j = q-1;
        for (let i=p+1; i<8; i++){
            if (j<0){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j--;
        }
    }
    if (ok){
        valid = true;
        j = q-1;
        for (let i=p+1; i<8; i++){
            if (field[i][j]==n){
                break
            }
            field[i][j] = n;
            visualizeStone(i, j, color);
            j--;
        }
    }
    // 右下
    ok = false;
    if (p+1<8 && q+1<8 && field[p+1][q+1]==m){
        j = q+1;
        for (let i=p+1; i<8; i++){
            if (j>=8){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j++;
        }
    }
    if (ok){
        valid = true;
        j = q+1;
        for (let i=p+1; i<8; i++){
            if (field[i][j]==n){
                break
            }
            field[i][j] = n;
            visualizeStone(i, j, color);
            j++;
        }
    }

    if (valid){
        field[p][q] = n;
        visualizeStone(p, q, color);
        return true;
    }
    return false;
}
let vote=()=>{
}
let search=(p, q, n)=>{
    let m;
    if (n==1){
        m = 2;
    } else {
        m = 1;
    }
    
    // 上
    let ok = false;
    if (p-1>=0 && field[p-1][q]==m){
        for (let i=p-1; i>=0; i--){
            if (field[i][q]==n){
                ok = true;
                break
            } else if (field[i][q]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        return true;
    }
    // 下
    ok = false;
    if (p+1<8 && field[p+1][q]==m){
        for (let i=p+1; i<8; i++){
            if (field[i][q]==n){
                ok = true;
                break
            } else if (field[i][q]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        return true;
    }
    // 左
    ok = false;
    if (q-1>=0 && field[p][q-1]==m){
        for (let j=q-1; j>=0; j--){
            if (field[p][j]==n){
                ok = true;
                break
            } else if (field[p][j]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        return true;
    }
    // 右
    ok = false;
    if (q+1<8 && field[p][q+1]==m){
        for (let j=q+1; j<8; j++){
            if (field[p][j]==n){
                ok = true;
                break
            } else if (field[p][j]==0){
                ok = false;
                break;
            }
        }
    }
    if (ok){
        return true;
    }
    // 左上
    ok = false;
    if (p-1>=0 && q-1>=0 && field[p-1][q-1]==m){
        j = q-1;
        for (let i=p-1; i>=0; i--){
            if (j<0){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j--;
        }
    }
    if (ok){
        return true;
    }
    // 右上
    ok = false;
    if (p-1>=0 && q+1<8 && field[p-1][q+1]==m){
        j = q+1;
        for (let i=p-1; i>=0; i--){
            if (j>=8){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j++;
        }
    }
    if (ok){
        return true;
    }
    // 左下
    ok = false;
    if (p+1<8 && q-1>=0 && field[p+1][q-1]==m){
        j = q-1;
        for (let i=p+1; i<8; i++){
            if (j<0){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j--;
        }
    }
    if (ok){
        return true;
    }
    // 右下
    ok = false;
    if (p+1<8 && q+1<8 && field[p+1][q+1]==m){
        j = q+1;
        for (let i=p+1; i<8; i++){
            if (j>=8){
                break;
            }
            if (field[i][j]==n){
                ok = true;
                break;
            } else if (field[i][j]==0){
                ok = false;
                break;
            }
            j++;
        }
    }
    if (ok){
        return true;
    }

    return false;
}
let canPutStone=(n)=>{
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (field[i][j]!=0){
                continue;
            }
            if (search(i, j, n)){
                return true;
            }
        }
    }
    return false;
}
let finish=()=>{
    let cnt = 0;
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (field[i][j]==1){
                cnt += 1;
            }
        }
    }
    let tmp = STONE_LIMIT-cnt;
    let ownColor;
    let opponentColor;
    if (COLOR_FIELD_RED=="rgb(255, 50, 50)"){
        ownColor = "赤";
        opponentColor = "青";
    } else {
        ownColor = "青";
        opponentColor = "赤";
    }
    if (cnt>tmp){
        alert(`${ownColor}の勝利です。`);
    } else if (cnt<tmp){
        alert(`${opponentColor}の勝利です。`);
    } else {
        alert("引き分けです。");
    }
}

// 関数を用いた変数の初期化
let socket = io();
let username = sessionStorage.getItem("username");
let ownX = getRandomInt(LOWER_BOUND_X, UPPER_BOUND_X);
let ownY = getRandomInt(LOWER_BOUND_Y, UPPER_BOUND_Y);
let nodesAlly = document.getElementById("nodes-ally");
let nodesOpponent = document.getElementById("nodes-opponent");
let othelloWrapper = document.getElementById("othello-wrapper");

// ユーザー情報送信
if (username!=null){
    socket.emit("user-info-init", {value: {"username":username, "userX":ownX, "userY":ownY}});
} else {
    socket.emit("user-info-init", {value: null});
}

// 全プレイヤーの情報を取得
socket.on("user-info-init", (data)=>{
    let users = data.value;

    for (let v in users){
        let playerName = v;
        let initX = users[playerName]["userX"];
        let initY = users[playerName]["userY"];
        let side = users[playerName]["color"];
        if (username==playerName){
            if (side=="blue"){
                ownX = Math.min(ownX, 350);
                initX = Math.min(initX, 350);
                ownX = SCREEN_WIDTH - ownX;
                initX = SCREEN_WIDTH - initX;
            }
        }
        if (side=="red"){
            color = COLOR_PLAYER_RED;
        } else if (side=="blue") {
            color = COLOR_PLAYER_BLUE;
        }

        // 全プレイヤーの円を描画
        makePlayerCircle(playerName, initX, initY, color);
        
        // プレイヤーの名前を表示
        makePlayerName(playerName, initX, initY);
    }

    // 自分の情報を取得
    own = document.getElementById(`id-${username}`);
    ownName = document.getElementById(`id-${username}-name`);
});

// マス選択時に盤面の上に被せるシートを生成
for (let i=0; i<8; i++){
    for (let j=0; j<8; j++){
        makeSquare(i, j);
    }
}

// 全体に石を配置
for (let i=0; i<8; i++){
    for (let j=0; j<8; j++){
        makeStone(i, j);
    }
}

// 盤面を初期化
let field = [];
for (let i=0; i<8; i++){
    let tmp = []
    for (let j=0; j<8; j++){
        tmp.push(0);
    }
    field.push(tmp)
}
field[3][3] = RED;
field[4][4] = RED;
field[3][4] = BLUE;
field[4][3] = BLUE;
visualizeStone(3, 3, COLOR_FIELD_RED);
visualizeStone(4, 4, COLOR_FIELD_RED);
visualizeStone(3, 4, COLOR_FIELD_BLUE);
visualizeStone(4, 3, COLOR_FIELD_BLUE);

// 盤面の変化を共有する
socket.on("field-changed", (data)=>{
    let tmp = data.value;
    let usernameOther = tmp[0];
    let paintedI = tmp[1];
    let paintedJ = tmp[2];
    let color = tmp[3];
    let isR = tmp[4];
    if (usernameOther!=username){
        othello(paintedI, paintedJ, color);
    }
    isRed = isR;
});

// 赤・青の文字の変化を共有する
socket.on("text-color-changed", (data)=>{
    let tmp = data.value;
    let usernameOther = tmp[0];
    let text = tmp[1];
    let color = tmp[2];
    if (usernameOther!=username){
        turn.innerHTML = text;
        turnColor = document.getElementById("turn-color");
        turnColor.style.color = color;
    }
});

// ゲームの終了を認識する
socket.on("game-finished", (data)=>{
    let usernameOther = data.value;
    if (usernameOther!=username){
        finished = true;
        keysValid = false;
        finish();
    }
});

onkeydown=(e)=>{
    // 上下左右に移動させる
    if (e.key=="w"){
        wDown = true;
    } else if (e.key=="a"){
        aDown = true;
    } else if (e.key=="s"){
        sDown = true;
    } else if (e.key=="d"){
        dDown = true;
    }
    if (wDown && ownY+y>=35){
        y -= DISPLACEMENT;
    }
    if (aDown && ownX+x>=40){
        x -= DISPLACEMENT;
    }
    if (sDown && ownY+y<=innerHeight-148){
        y += DISPLACEMENT;
    }
    if (dDown && ownX+x<=innerWidth-430){
        x += DISPLACEMENT;
    }

    if (keysValid){
        own.style.transform = `translate(${x}px, ${y}px)`;
        ownName.style.transform = `translate(${ownX+x+xDiff}px, ${ownY+y+INIT_Y_DIFF}px)`;
    }

    // 全員の座標を反映させる
    socket.emit("coordinate-changed", {value: {"username":username, "userCoord":[x, y], "nameCoord":[ownX+x+xDiff, ownY+y+INIT_Y_DIFF]}});
    socket.on("coordinate-changed", (data)=>{
        let user = data.value;
        let usernameOther = user["username"];
        let userCoord = user["userCoord"];
        let userX = userCoord[0];
        let userY = userCoord[1];
        let nameCoord = user["nameCoord"];
        let nameX = nameCoord[0];
        let nameY = nameCoord[1];
        let userElem = document.getElementById(`id-${usernameOther}`);
        let nameElem = document.getElementById(`id-${usernameOther}-name`);
        if (usernameOther!=username){
            userElem.style.transform = `translate(${userX}px, ${userY}px)`;
            nameElem.style.transform = `translate(${nameX}px, ${nameY}px)`;
        }
    });
    
    // シートをマスにかぶせる・マスから取り除く
    let coordX = ownX+x;
    let coordY = ownY+y;
    const INIT_X = 440;
    const INIT_Y = 40;
    const DIFF_X = 62;
    const DIFF_Y = 58;
    if (paintedI!=null){
        unPaintSquare(paintedI, paintedJ);
    }
    paintedI = parseInt((coordY-INIT_Y)/DIFF_Y);
    paintedJ = parseInt((coordX-INIT_X)/DIFF_X);
    if (430<=coordX && keysValid){
        paintSquare(paintedI, paintedJ);
    }

    // そのマスに石を置く
    if (e.key=="Enter"){
        let valid;
        if (isRed){
            valid = othello(paintedI, paintedJ, RED);
            if (valid){
                cntStone += 1;
                if (cntStone>=STONE_LIMIT){
                    finished = true;
                }
                if (canPutStone(BLUE)){
                    isRed = false;
                } else if (!canPutStone(RED)){
                    finished = true;
                }
                socket.emit("field-changed", {value: [username, paintedI, paintedJ, RED]});
            }
        } else {
            valid = othello(paintedI, paintedJ, BLUE);
            if (valid){
                cntStone += 1;
                if (cntStone>=STONE_LIMIT){
                    finished = true;
                }
                if (canPutStone(RED)){
                    isRed = true;
                } else if (!canPutStone(BLUE)){
                    finished = true;
                }
                socket.emit("field-changed", {value: [username, paintedI, paintedJ, BLUE, isRed]});
           }
        }
    }
    let turn = document.getElementById("turn");
    let turnColor;
    if (isRed){
        turn.innerHTML = "<span id='turn-color'>赤</span>のターン";
        turnColor = document.getElementById("turn-color");
        turnColor.style.color = COLOR_FIELD_RED;
        socket.emit("text-color-changed", {value: [username, "<span id='turn-color'>赤</span>のターン", COLOR_FIELD_RED]});
    } else {
        turn.innerHTML = "<span id='turn-color'>青</span>のターン";
        turnColor = document.getElementById("turn-color");
        turnColor.style.color = COLOR_FIELD_BLUE;
        socket.emit("text-color-changed", {value: [username, "<span id='turn-color'>青</span>のターン", COLOR_FIELD_BLUE]});
    }
}

onkeyup=(e)=>{
    if (keysValid){
        if (finished){
            finish();
            keysValid = false;
            socket.emit("game-finished", {value: username});
        }
        if (e.key=="w"){
            wDown = false;
        } else if (e.key=="a"){
            aDown = false;
        } else if (e.key=="s"){
            sDown = false;
        } else if (e.key=="d"){
            dDown = false;
        }
    }
}


/*
・投票システムを作る
・(デザイン)/main/index.htmlの背景を、赤と青の丸が動いていて壁にぶつかると跳ね返るデザインにする。
・部屋のシステムを導入する。
・自分の丸の色をチームの色に対応させる。
・片方のチームが操作しているとき、もう片方のチームは自陣まで下げられて、操作できないようにする。

*/
