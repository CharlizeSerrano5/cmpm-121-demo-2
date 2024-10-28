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
const create = document.createElement("button");
const download = document.createElement("button");
const thin = document.createElement("button");
const thick = document.createElement("button");
const anguished = document.createElement("button");
const flushed = document.createElement("button");
const skull = document.createElement("button");
const slider = document.createElement("range");
// const slider = document.querySelector("#pi_input");


document.title = APP_NAME;
app.innerHTML = APP_NAME;
download.innerHTML = "Download";
clear.innerHTML = "Clear";
undo.innerHTML = "Undo";
redo.innerHTML = "Redo";
thin.innerHTML = "Thin";
thick.innerHTML = "Thick";
create.innerHTML = "Create Sticker";


anguished.innerHTML = "😧";
flushed.innerHTML = "😳";
skull.innerHTML = "💀"

let isDrawing = false;
let isPointing = false;
let isSticker = false;
let isPlacing = false;
// https://www.javatpoint.com/typescript-union#:~:text=In%20other%20words%2C%20TypeScript%20can,')%20symbol%20between%20the%20types.
let sticker: Sticker;
let tempSticker: Sticker;

const cursor = { x: 0, y: 0 };
// I referenced code from https://quant-paint.glitch.me/paint1.html to create a cursor and set it every time the mouse is being used

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
class StickerButton {
    name: string;
    emoji: string;
    button: HTMLButtonElement;
    constructor(name: string, emoji: string) {
        this.name = name;
        this.emoji = emoji;
        this.button = document.createElement("button");
        this.button.innerHTML = this.emoji;
    }
}


class Line implements Context {
    lineArray: Point[];
    lineWidth: number;;
    color: string;
    constructor(lineArray: Point[], lineWidth: number, color: string) {
        this.lineArray = lineArray;
        this.lineWidth = lineWidth;
        this.color = color;
    }
    display(context: CanvasRenderingContext2D): void {
        if (this.lineArray.length > 1) {
            const {x, y} = this.lineArray[0];
            context.beginPath();
            context.lineWidth = this.lineWidth;
            if (!this.color) {
                this.color = "black";
            }
            context.strokeStyle = this.color;
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
    color: string;
    constructor(position: Point, lineWidth: number, color: string) {
        this.position = position;
        this.lineWidth = lineWidth;
        this.color = color;
        addPoint(this.position.x, this.position.y);
    }
    
    drag(x: number, y: number): void {
        // grows/extends the line as the user drags their mouse cursor
        addPoint(x, y);
        const lineObject = new Line(mousePoints, this.lineWidth, this.color);
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
            if (sticker && isSticker && !isDrawing) {
                const stickerImage = new Image(this.position, sticker.image);
                stickerImage.point(ctx!);
                sticker.position = {x: this.position.x, y: this.position.y};
            } else {
                context.beginPath();
                context.arc(this.position.x, this.position.y, lineWidth * 20, 0, 2 * Math.PI);
                context.lineWidth = 1;
                context.strokeStyle = "red";
                context.stroke();
            }
            
        }
    } 
}

class Image implements Context {
    position: Point;
    emoji: string;
    constructor(position: Point, emoji: string) {
        this.position = position;
        this.emoji = emoji;
    }
    display(context: CanvasRenderingContext2D): void {
        // display the sticker type
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
        context.font = "50px serif";
        context.fillText(this.emoji, this.position.x, this.position.y);

    }
    point(context: CanvasRenderingContext2D) {
        if (isSticker) {
            this.display(context);
        }
    }
}

class Sticker {
    position: Point;
    image: string;
    constructor(position: Point, image: string) {
        this.position = position;
        this.image = image;
        const stickerImage = new Image(this.position, this.image);
        stickerImage.display(ctx!);

    }
    drag(x: number, y: number) {
        ctx!.save();
        const offsetX = x - this.position.x;
        const offsetY = y - this.position.y;
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate
        ctx!.translate(offsetX, offsetY);
        this.position.x = x;
        this.position.y = y;
        const stickerImage = new Image(this.position, this.image);
        stickerImage.display(ctx!);
        // redrawLines();
        ctx!.resetTransform();
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/resetTransform
        ctx!.restore();
    }
}

// https://unicode.org/emoji/charts/full-emoji-list.html
const stickerImageList: StickerButton[] = 
    [ new StickerButton("anguished", "😧"), new StickerButton("flushed", "😳"), new StickerButton("skull", "💀")];


let marker : Marker;
let pointer : Pointer;

let lineWidth = 1;
let lineColor = "black";

let redoStack: Array<Line|Image> = [];
let displayList: Array<Line|Image> = [];

let mousePoints: Array<Point> = [];

const drawingChanged = new Event("drawing-changed");
const toolMoved = new Event("tool-moved");

stickerImageList.map((item) => {
    item.button.addEventListener("click", () => {
        activateSticker(item.emoji);
    })
})

create.addEventListener("click", () => {
    promptSticker();
});

download.addEventListener("click", () => {
    downloadCanvas();
});

clear.addEventListener("click", () => {
    clearCanvas()
    deleteCanvasDetails();
    removeSticker();
});

undo.addEventListener("click", () => {
    if (displayList.length >= 1) {
        undoDraw();
        canvas.dispatchEvent(drawingChanged);
    }
    // removeSticker();
});

redo.addEventListener("click", () => {
    if (redoStack.length >= 1) {
        redoDraw();
        canvas.dispatchEvent(drawingChanged);
    }
    // removeSticker();
});

thin.addEventListener("click", () => {
    lineWidth = 1;
    lineColor = "red";
    removeSticker();
})

thick.addEventListener("click", () => {
    lineWidth = 3;
    lineColor = "blue"
    removeSticker();
})

canvas.addEventListener("mousedown", (e) => {
    // I took reference from the mouse move event documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
    offsetCursor(e);
    const position: Point = { x: cursor.x, y: cursor.y};
    marker = new Marker(position, lineWidth, lineColor);
    isPointing = false;

    if (isSticker) {
        isPlacing = true;
        isDrawing = false;
    }
    if (isPlacing) {
        tempSticker = new Sticker(position, sticker.image);
    } else {
        isDrawing = true; // check if drawing when user has clicked

    }
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
    if (isPlacing && tempSticker) {
        tempSticker.drag(e.offsetX, e.offsetY);
    } else if (isDrawing) {
        // save user's mouse positions into an array of arrays of points
        marker.drag(e.offsetX, e.offsetY);
      }

});

canvas.addEventListener("mouseup", () => {
    // when the user lets go of the mouse finish the line and reset the cursor
    isPlacing = false;
    ctx!.restore();
    if (isSticker) {
        // add a sticker
        addSticker();
        isPlacing = false;
        // removeSticker();
    } 
    else if (isDrawing) {
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
    displayList.forEach((object) => {
        object.display(ctx!);
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
    const lineObject = new Line(mousePoints, lineWidth, lineColor);
    displayList.push(lineObject);
    clearRedoStack();
}

function addSticker() {
    const stickerImage = new Image(tempSticker.position, sticker.image);
    displayList.push(stickerImage);
    canvas.dispatchEvent(drawingChanged);

}


function undoDraw() {
    const lastElement = displayList.pop()!;
    redoStack.push(lastElement);
}

function clearRedoStack() {
    redoStack = [];
}

function redoDraw() {
    const lastElement = redoStack.pop()!;
    displayList.push(lastElement);
    canvas.dispatchEvent(drawingChanged);
}

function offsetCursor(e: MouseEvent) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
}

function removeSticker() {
    isSticker = false;
}

function activateSticker(emoji: string) {
    canvas.dispatchEvent(toolMoved);
        isPointing = false;
        isDrawing = false;
        const previewPosition = { x: 123, y: 123 }
        isSticker = true;
        sticker = new Sticker(previewPosition, emoji);
}

let newStickerValue = "NULL";
function promptSticker() {
    const newSticker: string = prompt("Create a new sticker", newStickerValue)!;
    newStickerValue = newSticker;
    activateSticker(newStickerValue);
}

function downloadCanvas() {
    const biggerCanvas = document.createElement("canvas");
    biggerCanvas.width = 1024;
    biggerCanvas.height = 1024;
    const newCtx = biggerCanvas.getContext("2d");
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    // used to rescale the original canvas and draw it onto the new canvas
    newCtx!.drawImage(canvas, 0, 0, 1024, 1024);
    const anchor = document.createElement("a");
    ctx?.scale(1024, 1024);
    redrawLines();
    anchor.href = biggerCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
}

app.append(header);
app.append(canvas);
app.append(thin);
app.append(thick);
app.append(clear);
app.append(undo);
app.append(redo);
app.append(create);
app.append(slider);

app.append(download);

for (const sticker of stickerImageList) {
    app.append(sticker.button);
}

