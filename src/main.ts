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
const undo = document.createElement("button");
const redo = document.createElement("button");
document.title = APP_NAME;
app.innerHTML = APP_NAME;
clear.innerHTML = "Clear";
undo.innerHTML = "Undo";

let isDrawing = false;
const cursor = { x: 0, y: 0 };
// I referenced code from https://quant-paint.glitch.me/paint1.html
// to create a cursor and set it every time the mouse is being used

interface Point {
    x: number;
    y: number;
}

interface Context {
    // I used Brace and asked the question
    // "How do I create a typescript interface that captures the idea that an object has a display method that accepts a CanvasRenderingContext2D argument?"
    // https://chat.brace.tools/c/a3d15058-e589-4b5c-9859-d9529b2950b2
    display(context: CanvasRenderingContext2D): void;
}

class Line implements Context {
    lineArray: Point[];
    constructor(lineArray: Point[]) {
        this.lineArray = lineArray;
    }
    display(context: CanvasRenderingContext2D): void {
        if (this.lineArray.length > 1) {
            const {x, y} = this.lineArray[0];
            context.beginPath();
            context.moveTo(x, y);
            this.lineArray.forEach((point) => {
                context.lineTo(point.x, point.y);
            })
            context.stroke();
        }
    }
}

// class Marker {
//     position: Point;
//     constructor(position: Point) {
//         this.position = position;
//     }
//     drag(x: number, y: number): void {
//         // grows/extends the line as the user drags their mouse cursor
//     }
// }

let redoStack: Array<Line> = [];
let displayList: Array<Line> = [];
let mousePoints: Array<Point> = [];
// array of array of points [x1, y2, x2, y2]

const drawingChanged = new Event("drawing-changed");
// after each point dispatch a drawing changed event

clear.addEventListener("click", () => {
    clearCanvas()
    deleteCanvasDetails();    
});

undo.addEventListener("click", () => {
    if (displayList.length >= 1) {
        undoDraw();
        canvas.dispatchEvent(drawingChanged);
    }
});

redo.innerHTML = "Redo";
redo.addEventListener("click", () => {
    if (redoStack.length >= 1) {
        redoDraw();
        canvas.dispatchEvent(drawingChanged);
    }
});

canvas.addEventListener("mousedown", (e) => {
    // I took reference from the mouse move event documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    addPoint(cursor.x, cursor.y);
    isDrawing = true; // check if drawing when user has clicked
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    // if the user is continuously dragging their mouse then draw a line
    if (isDrawing) {
        // save user's mouse positions into an array of arrays of points
        addPoint(e.offsetX, e.offsetY);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
      }
});

canvas.addEventListener("mouseup", () => {
    // when the user lets go of the mouse finish the line and reset the cursor
    if (isDrawing) {
        addLine();
        mousePoints = [];
        isDrawing = false;
      }
})

canvas.addEventListener("drawing-changed", () => {
    // clear and redraw the user's lines
    clearCanvas();
    redrawLines();
})

function addPoint(x: number, y: number) {
    const newPoint = {x, y};
    mousePoints.push(newPoint);
    canvas.dispatchEvent(drawingChanged);
}

function drawCurrentLine() {
    // draws a line made from the current set of mousePoints
    if (mousePoints.length > 1) {
        draw(mousePoints);
    }
}

function redrawLines() {
    // I took influence from the for loop in redraw() provided by professor in quant-paint
    // https://quant-paint.glitch.me/paint1.html
    // for every point that has been saved to the array begin the path 
    // displays the previous lines
    displayList.forEach((line) => {
        // draw(line);
        line.display(ctx!);
    })
    drawCurrentLine();
}

function draw(lineArray: Point[]) {
// I referenced the mousemoveEvent drawline() function
// https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    if (lineArray.length > 1) {
        const {x, y} = lineArray[0];
        ctx?.beginPath();
        ctx?.moveTo(x, y);
        lineArray.forEach((point) => {
            ctx?.lineTo(point.x, point.y);
        })
        ctx?.stroke();
    }
}

function clearCanvas() {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

function deleteCanvasDetails() {
    displayList = [];
    clearRedoStack();
}

function addLine() {
    const lineObject = new Line(mousePoints);
    displayList.push(lineObject);
    console.log('displayList: ', displayList);
    clearRedoStack();
}

function undoDraw() {
    const lastElement: Line = displayList.pop()!;
    redoStack.push(lastElement);
}

function clearRedoStack() {
    redoStack = [];
}

function redoDraw() {
    const lastElement: Line = redoStack.pop()!;
    displayList.push(lastElement);
    canvas.dispatchEvent(drawingChanged);
}

app.append(header);
app.append(canvas);
app.append(clear);
app.append(undo);
app.append(redo);