import "./style.css";

const APP_NAME = "Hi there!";
const app = document.querySelector<HTMLDivElement>("#app")!;

const gameTitle = "Drawing Game!"
const header = document.createElement("h1");
header.innerHTML = gameTitle;

const canvas = document.createElement("canvas");

canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext("2d");
const clear = document.createElement("button");

document.title = APP_NAME;
app.innerHTML = APP_NAME;
clear.innerHTML = "Clear";

let isDrawing = false;

clear.addEventListener("click", clearCanvas);

console.log('ctx: ', ctx);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// I referenced code from https://quant-paint.glitch.me/paint1.html
// to create a cursor and set it every time the mouse is being used
const cursor = { x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
    // I took reference from the mouse move event documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    isDrawing = true;
    // check if drawing when user has clicked
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    // if the user is continuously dragging their mouse then draw a line
    if (isDrawing) {
        drawLine(cursor.x, cursor.y, e.offsetX, e.offsetY);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
      }
});

canvas.addEventListener("mouseup", (e: MouseEvent) => {
    // when the user lets go of the mouse finish the line and reset the cursor
    if (isDrawing) {
        drawLine(cursor.x, cursor.y, e.offsetX, e.offsetY);
        cursor.x = 0;
        cursor.y = 0;
        isDrawing = false;
      }
})

function drawLine(x1: number, y1: number, x2: number, y2: number) {
    // I referenced the mousemoveEvent drawline() function
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}


app.append(header);
app.append(canvas);
app.append(clear);