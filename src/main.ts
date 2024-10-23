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
const thin = document.createElement("button");
const thick = document.createElement("button");


document.title = APP_NAME;
app.innerHTML = APP_NAME;
clear.innerHTML = "Clear";
undo.innerHTML = "Undo";
redo.innerHTML = "Redo";
thin.innerHTML = "Thin";
thick.innerHTML = "Thick";

let isDrawing = false;
let isPointing = false;
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
    lineWidth: number;
    constructor(lineArray: Point[], lineWidth: number) {
        this.lineArray = lineArray;
        this.lineWidth = lineWidth;
    }
    display(context: CanvasRenderingContext2D): void {
        if (this.lineArray.length > 1) {
            const {x, y} = this.lineArray[0];
            context.beginPath();
            context.lineWidth = this.lineWidth;
            context.strokeStyle = "black";
            context.moveTo(x, y);
            this.lineArray.forEach((point) => {
                context.lineTo(point.x, point.y);
            })
            context.stroke();
        }
    }
}

class Marker {
    position: Point;
    lineWidth: number;
    constructor(position: Point, lineWidth: number) {
        this.position = position;
        this.lineWidth = lineWidth;
        addPoint(this.position.x, this.position.y);
    }
    
    drag(x: number, y: number): void {
        // grows/extends the line as the user drags their mouse cursor
        addPoint(x, y);
        const lineObject = new Line(mousePoints, this.lineWidth);
        lineObject.display(ctx!);
    }
}

class Pointer implements Context{
    position: Point;
    constructor (position: Point) {
        this.position = position;
    }
    display(context: CanvasRenderingContext2D): void {
        // https://www.w3schools.com/graphics/canvas_circles.asp#:~:text=Draw%20a%20Full%20Circle,arc()%20%2D%20Define%20a%20circle
        // I use w3schools to draw a circle
        if (isPointing) {
            context.beginPath();
            context.arc(this.position.x, this.position.y, 40, 0, 2 * Math.PI);
            context.lineWidth = 1;
            context.strokeStyle = "red";
            context.stroke();
        }
    } 
}

let marker : Marker;
let pointer : Pointer;
let lineWidth = 1;

let redoStack: Array<Line> = [];
let displayList: Array<Line> = [];
let mousePoints: Array<Point> = [];

const drawingChanged = new Event("drawing-changed");
const toolMoved = new Event("tool-moved");
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

redo.addEventListener("click", () => {
    if (redoStack.length >= 1) {
        redoDraw();
        canvas.dispatchEvent(drawingChanged);
    }
});

thin.addEventListener("click", () => {
    lineWidth = 0.5;
})

thick.addEventListener("click", () => {
    lineWidth = 2;
})

canvas.addEventListener("mousedown", (e) => {
    // I took reference from the mouse move event documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    offsetCursor(e);
    const position: Point = { x: cursor.x, y: cursor.y};
    marker = new Marker(position, lineWidth);
    isPointing = false;
    isDrawing = true; // check if drawing when user has clicked
});

canvas.addEventListener("mouseenter", (e) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event
    offsetCursor(e);
    isPointing = true;
    canvas.dispatchEvent(toolMoved);

})

canvas.addEventListener("mouseleave", () => {
    isPointing = false;
})

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    // if the user is continuously dragging their mouse then draw a line
    offsetCursor(e);
    canvas.dispatchEvent(toolMoved);
    if (isDrawing) {
        // save user's mouse positions into an array of arrays of points
        marker.drag(e.offsetX, e.offsetY);
      }
});

canvas.addEventListener("mouseup", () => {
    // when the user lets go of the mouse finish the line and reset the cursor
    if (isDrawing) {
        addLine();
        mousePoints = [];
        isDrawing = false;
      }
    isPointing = true;
})

canvas.addEventListener("tool-moved", () => {
    // draw a cursor 
    const position: Point = {x: cursor.x, y: cursor.y};
    pointer = new Pointer(position);
    pointer.display(ctx!);
    canvas.dispatchEvent(drawingChanged);
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

function redrawLines() {
    // I took influence from the for loop in redraw() provided by professor in quant-paint
    // https://quant-paint.glitch.me/paint1.html
    displayList.forEach((line) => {
        line.display(ctx!);
    })
    if (pointer) {
        pointer.display(ctx!);
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
    const lineObject = new Line(mousePoints, lineWidth);
    displayList.push(lineObject);
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

function offsetCursor(e: MouseEvent) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
}

app.append(header);
app.append(canvas);
app.append(thin);
app.append(thick);
app.append(clear);
app.append(undo);
app.append(redo);
