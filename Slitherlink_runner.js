const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// game全般のこと
const game = {
    status: 0, // 0:タイトル画面, 1:ゲーム画面, 2:ゲーム開始待ち, 3:ゲームオーバー
    mode :1, //0: random mode , 1: normal mode
    difficulty: 0, // Easy :0, Normal :1, Hard :2
    mass : 50, // マスのサイズ
    leftmargin : 150, // 左の余白
    upmargin : 150, // 上の余白
    radius : 10, // 半径
    gameendtimecount: null
}

// 一つのgameに登場する記号たち
const one_game = {
    // 盤面のサイズ
    masume_tate: 11,
    masume_yoko: 1006,
    Board: [], // 盤面の数字
    Board2: [], // 盤面の周囲の辺のうち使われた数
    Used: [], // 使われた頂点
    Used_t: [],// 使われた辺、縦。
    Used_y: [],// 使われた辺、横。
    my_x: 2,
    my_y: 5,
    passedtime: 0,
    life: 3,
    score: 0
}
// ハートマーク
function bezier_heart(x,y,size,color=0){
    ctx.beginPath();
    let height = 15 * (1 - size);
    ctx.moveTo(x,y+height);
    ctx.bezierCurveTo(x-20*size, y-15*size+height, x-23*size,y+9*size+height,x, y+26*size+height);
    ctx.bezierCurveTo(x+24*size,y+10*size+height,x+20*size, y-15*size+height,x,y+height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000"//ee6c8a";

    if (size === 1){
        ctx.fillStyle = "#ff6c8a";
    }
    else{
        ctx.fillStyle = "#6c8aff";
    }

    if (color===1){
        ctx.fillStyle = "grey";
    }


    ctx.fill();
    ctx.stroke();
}

function initialize_board(){
    const Board = Array(one_game.masume_tate-1).fill().map(() => Array(one_game.masume_yoko).fill(-1));
    const Board2 = Array(one_game.masume_tate-1).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_t = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_y = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const my_x = 2;
    const my_y = 5;
    const passedtime = 0;
    const life = 3;

    Used[my_y][my_x] = 1;

    for (let y = 0; y < one_game.masume_tate-1; y++) {
        for (let x = 5; x < one_game.masume_yoko; x++) {
            if (Math.random()>0.85 - x/20000){
                Board[y][x] = Math.floor(Math.random()*4);
            }
        }
    }

    for (let y = 0; y < one_game.masume_tate-1; y++) {
        for (let x = 0; x < 4; x++) {
            if (y-x===0){
                Board[y][x] = 0;
            }
            if (y-x===-1){
                Board[y][x] = 0;
            }
            if (one_game.masume_tate -2 - y===x){
                Board[y][x] = 0;
            }
            if (one_game.masume_tate -1 - y===x){
                Board[y][x] = 0;
            }
        }
    }

    



    return [Board, Board2, Used, Used_t, Used_y, my_x, my_y,passedtime, life]
}

// 数字の配列Aだけを全て使う
function include_board(Board,B,A,l,r){
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate-1; y++) {
            if (A.includes(B[y][x])){
                Board[y][x]=B[y][x];
            }
        }
    }

    return Board
}

// rand は盤面に数字を配置する確率
// rand = 0.15 + x/20000 が基準
function random_board(Board,B,rand,l,r){
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate-1; y++) {
            if (Math.random()<rand){
                Board[y][x]=B[y][x];
            }
        }
    }

    return Board
}

function naname_board(Board,B,rand,l,r){
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate-1; y++) {
            if ((x+y)%2===0 && Math.random()<rand){
                Board[y][x]=B[y][x];
            }
        }
    }

    return Board
}

// ylen*xlenの長方形に配置
function rect_board(Board,B,rand,l,r,xlen,ylen){
    for (let x = l; x < r; x++) {
        for (let y = 0; y < one_game.masume_tate-1; y++) {
            if (Math.random()<rand){
                for (let xx = x; xx < x + xlen; xx++ ){
                    for (let yy = y; yy < y + ylen; yy++){
                        if (l<=xx && xx<r && yy < one_game.masume_tate-1){
                            console.log(yy)
                            console.log(xx)
                            Board[yy][xx]=B[yy][xx];
                        }
                    }
                }
            }

        }
    }

    return Board
}

// random → 0 → 2*2 → 1 → random → 2 → 3*3 → 0,3 → 斜め祭り →randomだが量が多い
function initializeBoard_normal() {
    const T = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko).fill(0));
    const Y = Array.from({ length: one_game.masume_tate }, () => Array(one_game.masume_yoko).fill(0));

    for (let j = 0; j < one_game.masume_yoko; j++) {
        Y[5][j] = 1;
    }

    let Sumline=one_game.masume_yoko;

    function four_direction(x, y) {
        const RET = [T[x][y], Y[x][y]];

        if (x - 1 >= 0) {
            RET.push(T[x - 1][y]);
        }
        if (y - 1 >= 0) {
            RET.push(Y[x][y - 1]);
        }

        return RET.reduce((a, b) => a + b, 0);
    }

    for (let i = 0; i < 50000; i++) {
        const x = Math.floor(Math.random() * (T.length - 2));
        const y = Math.floor(Math.random() * (T[0].length - 9)+7);

        const A = [T[x][y], Y[x][y], T[x][y + 1], Y[x + 1][y]];

        let SUM = A.reduce((a, b) => a + b, 0);

        if (SUM === 1) {
            if (Sumline>one_game.masume_yoko*6){
                continue
            }
            if (T[x][y] === 1) {
                if (four_direction(x, y + 1) === 0 && four_direction(x + 1, y + 1) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                    Sumline+=2;
                }
            }

            if (Y[x][y] === 1) {
                if (four_direction(x + 1, y) === 0 && four_direction(x + 1, y + 1) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                    Sumline+=2;
                }
            }

            if (T[x][y + 1] === 1) {
                if (four_direction(x, y) === 0 && four_direction(x + 1, y) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                    Sumline+=2;
                }
            }

            if (Y[x + 1][y] === 1) {
                if (four_direction(x, y) === 0 && four_direction(x, y + 1) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                    Sumline+=2;
                }
            }
        } else if (SUM == 2) {
            if (T[x][y] === 1 && Y[x][y] === 1) {
                if (four_direction(x + 1, y + 1) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                }
            }

            if (Y[x][y] === 1 && T[x][y + 1] === 1) {
                if (four_direction(x + 1, y) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                }
            }

            if (T[x][y + 1] === 1 && Y[x + 1][y] === 1) {
                if (four_direction(x, y) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                }
            }

            if (Y[x + 1][y] === 1 && T[x][y] === 1) {
                if (four_direction(x, y + 1) === 0) {
                    T[x][y] ^= 1;
                    Y[x][y] ^= 1;
                    T[x][y + 1] ^= 1;
                    Y[x + 1][y] ^= 1;
                }
            }
        } else if (SUM == 3) {
            T[x][y] ^= 1;
            Y[x][y] ^= 1;
            T[x][y + 1] ^= 1;
            Y[x + 1][y] ^= 1;
            Sumline-=2;

        }
    }

    const B = Array(one_game.masume_tate-1).fill().map(() => Array(one_game.masume_yoko).fill(0));

    let Board = Array(one_game.masume_tate-1).fill().map(() => Array(one_game.masume_yoko).fill(-1));
    const Board2 = Array(one_game.masume_tate-1).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_t = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const Used_y = Array(one_game.masume_tate).fill().map(() => Array(one_game.masume_yoko).fill(0));
    const my_x = 2;
    const my_y = 5;
    const passedtime = 0;
    const life = 3;

    Used[my_y][my_x] = 1;

    for (let y = 0; y < one_game.masume_tate-1; y++) {
        for (let x = 0; x < one_game.masume_yoko; x++) {
            if (T[y][x] === 1) {
                B[y][x] += 1;
                if (x - 1 >= 0) {
                    B[y][x - 1] += 1;
                }
            }

            if (Y[y][x] === 1) {
                B[y][x] += 1;
                if (y - 1 >= 0) {
                    B[y - 1][x] += 1;
                }
            }
        }
    }

    // random → 0 → 2*2 → 1 → random → 2 → 3*3 → 0,3 → 斜め祭り →randomだが量が多い

    Board = random_board(Board,B,0.15 + 25/20000,7,50)

    Board = random_board(Board,B,(0.15 + 75/20000)/5,50,100)
    Board = include_board(Board,B,[0],50,100)

    Board = rect_board(Board,B,(0.15+125/20000)/3,100,150,2,2)

    Board = random_board(Board,B,(0.15 + 175/20000)/5,150,200)
    Board = include_board(Board,B,[1],150,200)

    Board = random_board(Board,B,0.15 + 225/20000,200,250)

    Board = random_board(Board,B,(0.15 + 275/20000)/5,250,300)
    Board = include_board(Board,B,[2],250,300)

    Board = rect_board(Board,B,(0.15+325/20000)/8,300,350,3,3)

    Board = include_board(Board,B,[0,3],350,400)

    Board = naname_board(Board,B,(0.15 + 425/20000)*2,400,450)

    Board = random_board(Board,B,(0.15 + 475/20000)*4,450,500)


    // repeat
    Board = random_board(Board,B,0.15 + 525/20000,500,550)

    Board = random_board(Board,B,(0.15 + 575/20000)/5,550,600)
    Board = include_board(Board,B,[0],550,600)

    Board = rect_board(Board,B,(0.15+625/20000)/3,600,650,2,2)

    Board = random_board(Board,B,(0.15 + 675/20000)/5,650,700)
    Board = include_board(Board,B,[1],650,700)

    Board = random_board(Board,B,0.15 + 725/20000,700,750)

    Board = random_board(Board,B,(0.15 + 775/20000)/5,750,800)
    Board = include_board(Board,B,[2],750,800)

    Board = rect_board(Board,B,(0.15+825/20000)/8,800,850,3,3)

    Board = include_board(Board,B,[0,3],850,900)

    Board = naname_board(Board,B,(0.15 + 925/20000)*2,900,950)

    Board = random_board(Board,B,(0.15 + 975/20000)*4,950,1000)

    for (let y = 0; y < one_game.masume_tate-1; y++) {
        for (let x = 0; x < 6; x++) {
            if (y-x===0){
                Board[y][x] = B[y][x];
            }
            if (y-x===-1){
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate -2 - y===x){
                Board[y][x] = B[y][x];
            }
            if (one_game.masume_tate -1 - y===x){
                Board[y][x] = B[y][x];
            }
        }
    }


    return [Board, Board2, Used, Used_t, Used_y, my_x, my_y,passedtime, life];
}



function title_screen(masume_tate,masume_yoko,
    passedtime,
    score,
    Board, // 数字が書かれたボード
    Board2, // 各数字について、周囲の線が引かれている個数が何個超過しているか。
    my_x,
    my_y
){
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height)// upmargin-radius-radius, mass*masume_yoko, mass*masume_tate);

    // Lifeの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Life:", 100, 100);

    bezier_heart(220,75,1,1)
    bezier_heart(260,75,1,1)
    bezier_heart(300,75,1,1)

    // Scoreの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Score:"+String(score), 500, 100);

    let passed_mass_x = (one_game.passedtime / game.mass) | 0

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            // 頂点の丸
            ctx.beginPath();
            ctx.arc( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin, game.radius, 0, Math.PI*2);//, false );
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ccccee";
            ctx.stroke();
        }
    }

    // 辺について
    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            ctx.beginPath();
            ctx.moveTo( x*game.mass+game.leftmargin+game.radius-passedtime, y*game.mass+game.upmargin );
            ctx.lineTo( (x+1)*game.mass+game.leftmargin-game.radius-passedtime, y*game.mass+game.upmargin );
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#ccccee";
            ctx.stroke();

            if (y+1<masume_tate){
                ctx.beginPath();
                ctx.moveTo( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin+game.radius );
                ctx.lineTo( x*game.mass+game.leftmargin-passedtime, (y+1)*game.mass+game.upmargin-game.radius );
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#ccccee";
                ctx.stroke();
            }
        }
    }

    // 文字について

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            if (y+1<masume_tate){
                if (Board[y][x]!=-1){
                    
                    if (Board2[y][x]<Board[y][x]){
                        ctx.fillStyle = "#fefecc";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);    
                        ctx.fillStyle = "#6666aa";
                    }
                    else if (Board2[y][x]>Board[y][x]){
                        ctx.fillStyle = "#ffdddd";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);    
                        ctx.fillStyle = "#aa6666";
                    }
                    else{
                        ctx.fillStyle = "#eeeeee";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);        
                        ctx.fillStyle = "#888888";
                    }
                    ctx.font = "bold 35px serif";
                    ctx.fillText(Board[y][x],x*game.mass+game.leftmargin-passedtime+12, (y+1)*game.mass+game.upmargin-10);
                }
            }
        }
    }
    // 自分の位置

    ctx.beginPath();
    ctx.arc( my_x*game.mass+game.leftmargin-passedtime, my_y*game.mass+game.upmargin, game.radius*1.5, 0, Math.PI*2);//, false );

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.fillStyle = "#999922";
    ctx.fillRect(game.leftmargin-20-game.radius, game.upmargin-game.radius-game.radius, 20, game.mass*masume_tate-game.radius);

    ctx.strokeStyle = "#AAAA22";
    ctx.strokeRect(game.leftmargin-20-game.radius, game.upmargin-game.radius-game.radius, game.mass*masume_yoko, game.mass*masume_tate-game.radius);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(game.leftmargin-50-game.radius, game.upmargin-game.radius-game.radius, 30, game.mass*masume_tate);

    ctx.fillStyle = "darkgreen";
    ctx.font = "bold 80px serif";
    ctx.fillText("Press arrow key to start",game.upmargin+one_game.my_x*game.mass + game.radius*2,game.leftmargin+one_game.my_y*game.mass + game.mass/2);

    
    ctx.fillStyle = "darkgreen";
    ctx.font = "bold 50px serif";
    if (game.mode===0){
        ctx.fillText("random mode",game.upmargin+(one_game.my_x+1)*game.mass + game.radius*2,game.leftmargin+(one_game.my_y+1.5)*game.mass + game.mass/2);
    }
    else if (game.mode===1){
        ctx.fillText("normal mode",game.upmargin+(one_game.my_x+1)*game.mass + game.radius*2,game.leftmargin+(one_game.my_y+1.5)*game.mass + game.mass/2);
    }

    ctx.font = "bold 35px serif";
    ctx.fillText("(press m key to change mode)",game.upmargin+(one_game.my_x+1)*game.mass + game.radius*2,game.leftmargin+(one_game.my_y+2.5)*game.mass + game.mass/2);
}



function visualize_board(masume_tate,masume_yoko,
    passedtime, // （時間経過などにより）どれだけ横に動いたか
    Board, // 数字が書かれたボード
    Board2, // 各数字について、周囲の線が引かれている個数が何個超過しているか。
    my_x,my_y,// 自分の座標
    Used, // どこを通って来たか
    Used_t, // 縦の線について
    Used_y // 横の線について
){
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height)// upmargin-radius-radius, mass*masume_yoko, mass*masume_tate);

    // Lifeの表示
    ctx.fillStyle = "#ee6c8a";
    ctx.font = "bold 40px serif";
    ctx.fillText("Life:", 100, 100);
    
    let life1=Math.max(Math.min(one_game.life,1),0);
    let life2=Math.max(Math.min(one_game.life-1,1),0);
    let life3=Math.max(Math.min(one_game.life-2,1),0);

    bezier_heart(220,75,life1)
    bezier_heart(260,75,life2)
    bezier_heart(300,75,life3)

    // Scoreの表示
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40px serif";
    ctx.fillText("Score:"+String((passedtime/10)|0), 500, 100);

    let passed_mass_x = (passedtime / game.mass) | 0

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {

            // 頂点の丸、使っているもの
            if (Used[y][x]===1){
                ctx.beginPath();
                ctx.arc( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin, game.radius*1.5, 0, Math.PI*2);//, false );
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#ffffff";
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin, game.radius, 0, Math.PI*2);//, false );
        
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#dd0000";
                ctx.fillStyle = "#ee8989";
                ctx.fill();
                ctx.stroke();
            }

            // 頂点の丸
            ctx.beginPath();
            ctx.arc( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin, game.radius, 0, Math.PI*2);//, false );
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#79aacc";
            ctx.stroke();

        }
    }

    // 辺について
    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            ctx.beginPath();
            ctx.moveTo( x*game.mass+game.leftmargin+game.radius-passedtime, y*game.mass+game.upmargin );
            ctx.lineTo( (x+1)*game.mass+game.leftmargin-game.radius-passedtime, y*game.mass+game.upmargin );
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#77aacc";
            ctx.stroke();

            // 使っているもの

            if (Used_y[y][x]===1){
                ctx.beginPath();
                ctx.moveTo( x*game.mass+game.leftmargin+game.radius-passedtime, y*game.mass+game.upmargin );
                ctx.lineTo( (x+1)*game.mass+game.leftmargin-game.radius-passedtime, y*game.mass+game.upmargin );
                ctx.closePath();
                ctx.lineWidth = 7;
                ctx.strokeStyle = "#ee6767";
                ctx.stroke();
            }

            if (y+1<masume_tate){
                ctx.beginPath();
                ctx.moveTo( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin+game.radius );
                ctx.lineTo( x*game.mass+game.leftmargin-passedtime, (y+1)*game.mass+game.upmargin-game.radius );
                ctx.closePath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#77aacc";
                ctx.stroke();

                if (Used_t[y][x]===1){
                    ctx.beginPath();
                    ctx.moveTo( x*game.mass+game.leftmargin-passedtime, y*game.mass+game.upmargin+game.radius );
                    ctx.lineTo( x*game.mass+game.leftmargin-passedtime, (y+1)*game.mass+game.upmargin-game.radius );
                    ctx.closePath();
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = "#ee6767";
                    ctx.stroke();
                }
            }
        }
    }

    // 文字について

    for (let y = 0; y < masume_tate; y++) {
        for (let x = passed_mass_x; x < passed_mass_x + 35; x++) {
            if (y+1<masume_tate){
                if (Board[y][x]!=-1){
                    
                    if (Board2[y][x]<Board[y][x]){
                        ctx.fillStyle = "#fefecc";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);    
                        ctx.fillStyle = "#4444aa";
                    }
                    else if (Board2[y][x]>Board[y][x]){
                        ctx.fillStyle = "#ffdddd";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);    
                        ctx.fillStyle = "#aa4444";
                    }
                    else{
                        ctx.fillStyle = "#eeeeee";
                        ctx.fillRect(x*game.mass+game.leftmargin-passedtime+game.radius/3*2, y*game.mass+game.upmargin+game.radius/3*2, game.mass-game.radius/3*4, game.mass-game.radius/3*4);        
                        ctx.fillStyle = "#666666";
                    }
                    ctx.font = "bold 35px serif";
                    ctx.fillText(Board[y][x],x*game.mass+game.leftmargin-passedtime+12, (y+1)*game.mass+game.upmargin-10);
                }
            }
        }
    }

    // 自分の位置

    ctx.beginPath();
    ctx.arc( my_x*game.mass+game.leftmargin-passedtime, my_y*game.mass+game.upmargin, game.radius*1.5, 0, Math.PI*2);//, false );

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cccc33";
    ctx.fillStyle = "#dd2222";
    ctx.fill();
    ctx.stroke();


    ctx.fillStyle = "#999922";
    ctx.fillRect(game.leftmargin-20-game.radius, game.upmargin-game.radius-game.radius, 20, game.mass*masume_tate-game.radius);

    ctx.strokeStyle = "#AAAA22";
    ctx.strokeRect(game.leftmargin-20-game.radius, game.upmargin-game.radius-game.radius, game.mass*masume_yoko, game.mass*masume_tate-game.radius);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(game.leftmargin-50-game.radius, game.upmargin-game.radius-game.radius, 30, game.mass*masume_tate);

}

// keyを押したときの操作。
addEventListener("keydown", keydownfunc);
function keydownfunc(event) {
    let key_code = event.keyCode;

    if (game.status===0 && key_code === 77){
        game.mode=(game.mode+1)%2
        title_screen(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.score,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y);

    }


    // 何かキーを押したらゲーム開始
    if (game.status===0 && ((key_code === 39)||(key_code === 37)||(key_code === 40)||(key_code === 38))){
        one_game.passedtime=0;
        if (game.mode === 0){
            [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initialize_board();
        }
        else{
            [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initializeBoard_normal();

        }
        game.status=1
        whilegame = setInterval(visual, 30);
    }

    if (game.status===1){

        // 上下左右について
        if (key_code === 39) {//　右
            if (one_game.my_x+1<one_game.masume_yoko && one_game.Used[one_game.my_y][one_game.my_x+1]===0){
                one_game.my_x+=1
                one_game.Used_y[one_game.my_y][one_game.my_x-1]=1
                if (one_game.my_y-1>=0){
                    one_game.Board2[one_game.my_y-1][one_game.my_x-1] +=1;
                }
                if (one_game.my_y<one_game.masume_tate-1){
                    one_game.Board2[one_game.my_y][one_game.my_x-1] +=1;
                }
            }
            else if (game.status===1) {
                one_game.passedtime+=1.5
            }
        }
        else if (key_code === 37) {// 左
            if (one_game.my_x-1>=0 && one_game.Used[one_game.my_y][one_game.my_x-1]===0){
                one_game.my_x-=1
                one_game.Used_y[one_game.my_y][one_game.my_x]=1
                if (one_game.my_y-1>=0){
                    one_game.Board2[one_game.my_y-1][one_game.my_x] +=1;
                }
                if (one_game.my_y<one_game.masume_tate-1){
                    one_game.Board2[one_game.my_y][one_game.my_x] +=1;
                }
            }
            else if (game.status===1) {
                one_game.passedtime+=1.5
            }
        }
        else if (key_code === 40) {// 下
            if (one_game.my_y+1<one_game.masume_tate && one_game.Used[one_game.my_y+1][one_game.my_x]===0){
                one_game.my_y+=1
                one_game.Used_t[one_game.my_y-1][one_game.my_x]=1
                if (one_game.my_x<one_game.masume_yoko){
                    one_game.Board2[one_game.my_y-1][one_game.my_x] +=1;
                }
                if (one_game.my_x-1>=0){
                    one_game.Board2[one_game.my_y-1][one_game.my_x-1] +=1;
                }
            }
            else if (game.status===1) {
                one_game.passedtime+=1.5
            }  
        }
        else if (key_code === 38) {// 上
            if (one_game.my_y-1>=0 && one_game.Used[one_game.my_y-1][one_game.my_x]===0){
                one_game.my_y-=1
                one_game.Used_t[one_game.my_y][one_game.my_x]=1
                if (one_game.my_x<one_game.masume_yoko){
                    one_game.Board2[one_game.my_y][one_game.my_x] +=1;
                }
                if (one_game.my_x-1>=0){
                    one_game.Board2[one_game.my_y][one_game.my_x-1] +=1;
                }
            }
            else if (game.status===1) {
                one_game.passedtime+=1.5
            }  
        }
        one_game.Used[one_game.my_y][one_game.my_x]=1
        visualize_board(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y,one_game.Used,one_game.Used_t,one_game.Used_y);
    }
}

function visual(){
    visualize_board(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y,one_game.Used,one_game.Used_t,one_game.Used_y)
    if (one_game.life<=0){
        clearInterval(whilegame)
        game.status=2
        ctx.fillStyle = "black";
        ctx.font = "bold 80px serif";
        ctx.fillText("Game Over",game.upmargin+2*game.mass + game.radius*2,game.leftmargin+5*game.mass + game.mass/2);
    
        game.gameendtimecount = setInterval(gameendtime_wait, 2000);
    }
    one_game.passedtime+=0.2+one_game.passedtime/25000
    one_game.life+=0.003
    one_game.life=Math.min(one_game.life,3)

    if (one_game.my_x*game.mass-one_game.passedtime<-game.radius*2){
        clearInterval(whilegame)
        game.status=2
        ctx.fillStyle = "black";
        ctx.font = "bold 80px serif";
        ctx.fillText("Game Over",game.upmargin+2*game.mass + game.radius*2,game.leftmargin+5*game.mass + game.mass/2);
    
        game.gameendtimecount = setInterval(gameendtime_wait, 2000);
    }

    let disappear_x=((one_game.passedtime-game.radius) / game.mass) | 0

    if (disappear_x-1>=0){
        for (let y = 0; y < one_game.masume_tate-1; y++) {
            if (one_game.Board[y][disappear_x-1]!=-1 && one_game.Board2[y][disappear_x-1]!=one_game.Board[y][disappear_x-1]){
                one_game.life-=1
                one_game.Board[y][disappear_x-1]=-1
                one_game.Board2[y][disappear_x-1]=0
            }
        }
    }
}

function gameendtime_wait(){
    if (localStorage.getItem("localhighscore") < one_game.passedtime){
            localStorage.setItem("localhighscore", one_game.passedtime);
    }

    game.status = 0;
    clearInterval(game.gameendtimecount);
    game.gameendtimecount = null;
    let beforescore=(one_game.passedtime/10)|0;

    if (game.mode === 0){
        [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initialize_board();
    }
    else{
        [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initializeBoard_normal();

    }
    title_screen(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,beforescore,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y);

}

if (game.mode === 0){
    [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initialize_board();
}
else{
    [one_game.Board, one_game.Board2, one_game.Used, one_game.Used_t, one_game.Used_y, one_game.my_x,one_game.my_y,one_game.passedtime, one_game.life] = initializeBoard_normal();

}
//visualize_board(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y,one_game.Used,one_game.Used_t,one_game.Used_y)
title_screen(one_game.masume_tate,one_game.masume_yoko,one_game.passedtime,one_game.score,one_game.Board,one_game.Board2,one_game.my_x,one_game.my_y);
