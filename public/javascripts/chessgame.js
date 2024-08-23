

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null; //game jb assign ho rha hoga to koi peice hoga hi nhi tb to null isiliye sb null hai
let sourceSquare = null;
let playerRole = null; //server assign karega role jb player join hoga to isiliye null




//is function me hume board ko banana hai 
const renderBoard = () =>{

 const board = chess.board(); //issse hume board ki current state milegi this returns the array of arrays where each sub-array represents the rows on the chess board.
 console.log(board);
 boardElement.innerHTML = ""; //chess board me agr kch bhi hai to use khali krdo next time jb board render hoga  to khali krke hoga

board.forEach((row,rowindex) =>{ //pehla parameter array ka element hai or dusra paramete us element ka index hai
    row.forEach((square,sqaureindex) =>{
        const squareElement = document.createElement("div"); //ek div banaega chessboard wale div ke andr to represent the square
        squareElement.classList.add(
            "square",
            (rowindex + sqaureindex) % 2 === 0 ? "light" : "dark"
        );
        squareElement.dataset.row = rowindex;
        squareElement.dataset.col = sqaureindex;

        if(square){
            const peiceElement = document.createElement("div");
            peiceElement.classList.add(
                "piece",
                square.color === 'w' ? "white" : "black"
            );
             peiceElement.innerText = getPieceUnicode(square);

            peiceElement.draggable = playerRole === square.color;

            peiceElement.addEventListener("dragstart",function(e){
                if(peiceElement.draggable ){
                    draggedPiece = peiceElement;
                    sourceSquare = {row : rowindex, col : sqaureindex};
                    e.dataTransfer.setData("text/plain","");
                }
            });

            peiceElement.addEventListener("dragend",function(e){
                draggedPiece = null;
                sourceSquare = null;
            })

            squareElement.appendChild(peiceElement);
        }

        //agr koi chess ke square ko drag kre to vo mt krne do 
        squareElement.addEventListener("dragover",function(e){
            e.preventDefault();
        })

        squareElement.addEventListener("drop",function(e){
            e.preventDefault();//drop event ki jo khdki basic functionality hai vo rok do, kyuki jo krna hai drop pr vo hum khd karenge.
            if(draggedPiece){
                const targetSource = {
                    row : parseInt(squareElement.dataset.row),
                    col : parseInt(squareElement.dataset.col)
                };

                handleMove(sourceSquare,targetSource);
            }
        });
        boardElement.appendChild(squareElement);
    });
});
if(playerRole === 'b'){
    boardElement.classList.add("flipped");
}
else{
    boardElement.classList.remove("flipped");
}
};

const handleMove = (source,target) =>{
  const move = {
    from : `${String.fromCharCode(97+source.col)}${8-source.row}`,
    to : `${String.fromCharCode(97+target.col)}${8 - target.row}`,
    promotion : 'q',
  }

  socket.emit("move",move);
};

const getPieceUnicode = (piece) =>{
   const unicodePieces = {
    p : "♙",
    r : "♜",
    n : "♞",
    b : "♝",
    q : "♛",
    k : "♚",
    P : "♟",
    R : "♖",
    N : "♘",
    B : "♗",
    Q : "♕",
    K : "♔",
   }
   return unicodePieces[piece.type] || "";
};

socket.on("playerRole",function(role){
 playerRole = role;
 renderBoard();
});

socket.on("spectatorRole",function(){
    playerRole = null;
    renderBoard();
});

socket.on("boardState",function(fen){
  chess.load(fen);
  renderBoard();
});

socket.on("boardState",function(move){
    chess.move(move);
    renderBoard();
});

renderBoard();

