const canvas = document.querySelector("canvas"),
  homePage = document.querySelector(".home-page"),
  colorsTool = document.getElementById("colors").children[0],
  shapesTool = document.getElementById("shapes").children[0],
  toolBtns = document.querySelectorAll(".tool"),
  clearCanvasBtn = document.querySelector(".clear-canvas"),
  saveImg = document.querySelector(".save-img"),
  addImg = document.querySelector("#add-img"),
  ctx = canvas.getContext("2d"),
  undoBtn = document.querySelector(".undo"),
  redoBtn = document.querySelector(".redo"),
  pipe = document.querySelector(".pipe"),
  toolsBoard = document.querySelector(".tools-board"),
  popupBtns = document.querySelectorAll(".popup-btn"),
  insidePanel = document.querySelector(".inside-panel");

// global variables with default value
let prevMouseX,
  fillColor,
  sizeSlider,
  prevMouseY,
  prevTool = "",
  newMouseX,
  newMouseY,
  snapshot,
  elements = [],
  undoStack = [],
  redoStack = [],
  isDrawing = false,
  selectedTool = "brush",
  brushWidth = 5,
  eraserWidth = 5,
  fillValue = false,
  isSaved = false,
  cursorSize = 5,
  selectedColor = "#000";

const reader = new FileReader();
const stage = new createjs.Stage("canvas");
const fileInput = document.getElementById("fileInput");

const setHomeFunc = () => {
  const homeBtns = document.querySelectorAll(".home");
  homeBtns.forEach((btn) => {
    btn.onclick = () => {
      const homePage = document.querySelector(".home-page");
      if (homePage) {
        homePage.remove();
      } else {
        setCanvasBackground();
        currDrawing = "";
        const div = document.createElement("div");
        div.className = "home-page";
        div.innerHTML = `<div class="overlay"></div>
      <div class="start">
        <img src="./assets/library/new.png" alt="">
        <img src="./assets/library/lib.png" alt="">
      </div>`;
        document.body.append(div);

        setHomePageBtns();
      }
    };
  });
};
const setHomePageBtns = () => {
  const homePageBtns = document.querySelectorAll(".home-page .start img");
  const homePage = document.querySelector(".home-page");
  homePageBtns.forEach((btn, indx) => {
    btn.onclick = () => {
      switch (indx) {
        case 0:
          homePage.remove();
          break;
        case 1:
          homePage.children[1].remove();
          homePage.innerHTML = `<div class="overlay"></div>
          <div class="buttons">
          <button class="home home-2" title="الرئيسية"></button>
          </div>
          <div class="lib"><div class="row">
            <img src="./assets/library/btn-1.png" id="img-1" alt="">
            <img src="./assets/library/btn-2.png" id="img-2" alt="">
          </div>
          <div class="row">
            <img src="./assets/library/btn-3.png" id="img-3" alt="">
            <img src="./assets/library/btn-4.png" id="img-4" alt="">
          </div>
          <div class="row">
            <img src="./assets/library/btn-3.png" id="img-3" alt="">
            <img src="./assets/library/btn-4.png" id="img-4" alt="">
          </div>
        </div>`;
          const libImgs = document.querySelectorAll(".lib .row img");
          const libImg = document.getElementById("lib-img");

          libImgs.forEach((img) => {
            img.addEventListener("click", () => {
              let newSrc = img.src.split("/");
              newSrc.splice(newSrc.length - 1, 1, img.id + ".png");

              newSrc = newSrc.toString().replaceAll(",", "/");
              const newImg = new Image();
              newImg.src = newSrc;
              newImg.onload = function () {
                readImage(newImg);

                homePage.remove();
              };
            });
          });
          break;

        default:
          break;
      }
      setHomeFunc();
    };
  });
};
setHomePageBtns();

const setCanvasBackground = () => {
  // setting whole canvas background to white, so the downloaded img background will be white
  ctx.fillStyle = "#FFF9F5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selectedColor; // setting fillstyle back to the selectedColor, it'll be the brush color
};

let drawings = [];

if (localStorage.getItem("drawings")) {
  drawings = JSON.parse(localStorage.getItem("drawings"));
}
let currDrawing = "";

const saveDrawings = () => {
  if (undoStack.length == 0) {
    openModel(() => {}, {
      icon: "./assets/i-icon.png",
      h1: "لا توجد رسوم للحفظ.",
      btns: { btn1: "ok-btn" },
    });
    return;
  }
  isSaved = true;
  drawings = JSON.parse(localStorage.getItem("drawings"));

  // stage.children.forEach((child) => {
  //   if (child.graphics) {
  //     child.graphics._fill.style = "#f00000";
  //     stage.update();
  //   }
  // });

  canvas.toBlob(function (blob) {
    reader.readAsDataURL(blob);
    reader.onload = () => {
      let id = "d" + blob.size + "-" + performance.now() / 1000;
      let idsArr = [];
      if (drawings && drawings.length) {
        for (let i = 0; i < drawings.length; i++) {
          idsArr.push(drawings[i][0]);
          if (currDrawing && drawings[i][0] == currDrawing) {
            drawings[i][1] = reader.result;
          }
        }

        if (idsArr.indexOf(currDrawing) === -1) {
          drawings.push([id, reader.result]);
        }

        localStorage.setItem("drawings", JSON.stringify(drawings));
        openModel(() => {}, {
          icon: "./assets/tr-icon.png",
          h1: "تم حفظ رسمتك بنجاح.",
          btns: { btn1: "ok-btn" },
        });
      } else {
        drawings = [];
        drawings.push([id, reader.result]);
        localStorage.setItem("drawings", JSON.stringify(drawings));

        openModel(() => {}, {
          icon: "./assets/tr-icon.png",
          h1: "تم حفظ رسمتك بنجاح.",
          btns: { btn1: "ok-btn" },
        });
      }
    };
  });
};

window.addEventListener("load", () => {
  // setting canvas width/height.. offsetwidth/height returns viewable width/height of an element
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  setCanvasBackground();
});

const drawRect = (e) => {
  let rect = e.target.getBoundingClientRect();

  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }

  // if fillColor isn't checked draw a rect with border else draw rect with background
  if (!fillColor.checked) {
    // creating circle according to the mouse pointer
    return ctx.strokeRect(
      newMouseX,
      newMouseY,
      prevMouseX - newMouseX,
      prevMouseY - newMouseY
    );
  }
  ctx.fillRect(
    newMouseX,
    newMouseY,
    prevMouseX - newMouseX,
    prevMouseY - newMouseY
  );
};

const drawCircle = (e) => {
  let rect = e.target.getBoundingClientRect();

  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }

  ctx.beginPath(); // creating new path to draw circle
  // getting radius for circle according to the mouse pointer
  let radius = Math.sqrt(
    Math.pow(prevMouseX - newMouseX, 2) + Math.pow(prevMouseY - newMouseY, 2)
  );
  ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI); // creating circle according to the mouse pointer
  fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill circle else draw border circle
  elements.push({
    x: prevMouseX,
    y: prevMouseY,
    radius: radius,
    start: 0,
    end: 2 * Math.PI,
  });
};

const drawTriangle = (e) => {
  let rect = e.target.getBoundingClientRect();

  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }

  ctx.beginPath(); // creating new path to draw circle
  ctx.moveTo(prevMouseX, prevMouseY); // moving triangle to the mouse pointer
  ctx.lineTo(newMouseX, newMouseY); // creating first line according to the mouse pointer
  ctx.lineTo(prevMouseX * 2 - newMouseX, newMouseY); // creating bottom line of triangle
  ctx.closePath(); // closing path of a triangle so the third line draw automatically
  fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill triangle else draw border
};

const drawStar = (e) => {
  let rect = e.target.getBoundingClientRect();
  let rot = (Math.PI / 2) * 3;
  let spikes = 5;
  let step = Math.PI / spikes;

  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }

  const dx = newMouseX - prevMouseX;
  const dy = newMouseY - prevMouseY;
  const radius = Math.sqrt(dx * dx + dy * dy);

  ctx.beginPath();
  ctx.moveTo(prevMouseX, prevMouseY - radius);
  for (i = 0; i < spikes; i++) {
    x = prevMouseX + Math.cos(rot) * radius;
    y = prevMouseY + Math.sin(rot) * radius;

    ctx.lineTo(x, y);
    rot += step;

    x = prevMouseX + (Math.cos(rot) * radius) / 2;
    y = prevMouseY + (Math.sin(rot) * radius) / 2;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(prevMouseX, prevMouseY - radius);
  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill triangle else draw border
};
const drawHexagon = (e) => {
  let rect = e.target.getBoundingClientRect();

  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }

  let centerX = (prevMouseX + newMouseX) / 2;
  let centerY = (prevMouseY + newMouseY) / 2;

  // Calculate the radius of the hexagon
  let radius =
    Math.sqrt((newMouseX - prevMouseX) ** 2 + (newMouseY - prevMouseY) ** 2) /
    2;

  let rotationAngle = Math.PI / 6;

  // Starting angle for the first vertex
  let startAngle = Math.PI / 6 + rotationAngle;

  // Draw the hexagon
  ctx.beginPath();
  ctx.moveTo(
    centerX + radius * Math.cos(startAngle),
    centerY + radius * Math.sin(startAngle)
  );

  // Calculate and connect the other vertices
  for (let i = 1; i <= 6; i++) {
    let angle = startAngle + (i * 2 * Math.PI) / 6;
    ctx.lineTo(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    );
  }

  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke(); // if fillColor is checked fill triangle else draw border
};

const startDraw = (e) => {
  isSaved = false;
  isDrawing = true;

  sizeSlider && (sizeSlider.nextElementSibling.style.opacity = "0");
  insidePanel.innerHTML = ``;
  if (toolBtns[1].classList.contains("active") && prevTool === "") {
    toolBtns[1].classList.remove("active");
    toolBtns[0].classList.add("active");
  } else if (
    toolBtns[1].classList.contains("active") &&
    prevTool === "shapes"
  ) {
    toolBtns[1].classList.remove("active");
    toolBtns[2].classList.add("active");
  }

  if (selectedTool === "brush") {
    toolBtns[0].classList.add("active");
    toolBtns[2].classList.remove("active");
  } else if (selectedTool === "eraser") {
    toolBtns[3].classList.add("active");
    toolBtns[2].classList.remove("active");
  }

  pipe.style.display = "none";
  let rect = e.target.getBoundingClientRect();
  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    prevMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as prevMouseX value
    prevMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    prevMouseX = e.offsetX; // passing current mouseX position as prevMouseX value
    prevMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }
  ctx.beginPath(); // creating new path to draw

  if (selectedTool === "eraser") {
    ctx.lineWidth = eraserWidth; // passing brushSize as line width
  } else {
    ctx.lineWidth = brushWidth; // passing brushSize as line width
  }
  ctx.strokeStyle = selectedColor; // passing selectedColor as stroke style
  ctx.fillStyle = selectedColor; // passing selectedColor as fill style
  // ctx.lineCap = "round";
  // ctx.lineJoin = "round";
  ctx.lineTo(prevMouseX - cursorSize / 2, prevMouseY - cursorSize / 2);
  ctx.stroke();
  // copying canvas data & passing as snapshot value.. this avoids dragging the image
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const drawing = (e) => {
  if (!isDrawing) return; // if isDrawing is false return from here
  ctx.putImageData(snapshot, 0, 0); // adding copied canvas data on to this canvas

  let rect = e.target.getBoundingClientRect();
  if (
    "ontouchstart" in window ||
    (window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    newMouseX = e.targetTouches[0]?.pageX - rect.left; // passing current mouseX position as newMouseX value
    newMouseY = e.targetTouches[0]?.pageY - rect.top; // passing current mouseY position as prevMouseY value
  } else {
    newMouseX = e.offsetX; // passing current mouseX position as newMouseX value
    newMouseY = e.offsetY; // passing current mouseY position as prevMouseY value
  }
  if (selectedTool === "brush" || selectedTool === "eraser") {
    // if selected tool is eraser then set strokeStyle to white
    // to paint white color on to the existing canvas content else set the stroke color to selected color

    ctx.strokeStyle = selectedTool === "eraser" ? "#FFF9F5" : selectedColor;
    ctx.lineTo(newMouseX - cursorSize / 2, newMouseY - cursorSize / 2); // creating line according to the mouse pointer
    // ctx.arc(newMouseX, newMouseY, cursorSize * 2, 0, 2 * Math.PI);
    ctx.lineCap = "square";
    ctx.lineJoin = "round";
    ctx.stroke(); // drawing/filling line with color
  } else if (selectedTool === "rectangle") {
    drawRect(e);
  } else if (selectedTool === "circle") {
    drawCircle(e);
  } else if (selectedTool === "triangle") {
    drawTriangle(e);
  } else if (selectedTool === "star") {
    drawStar(e);
  } else if (selectedTool === "hexagon") {
    drawHexagon(e);
  }
};

toolBtns.forEach((btn, indx) => {
  btn.addEventListener("click", () => {
    // adding click event to all tool option
    // removing active class from the previous option and adding on current clicked option
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");

    insidePanel.innerHTML = ``;

    if (indx === 0) {
      selectedTool = btn.id;
      prevTool = "";
      insidePanel.innerHTML = `<ul class="options"><li class="option slider">
      <input type="range" id="brush-size" min="1" max="50" value="${brushWidth}">
      <div class="slider-value">${brushWidth}</div>
    </li></ul>`;
      pipe.style.top = "2.95vw";
      pipe.style.display = "block";
      sizeSlider = document.querySelector("#brush-size");

      sizeSlider.addEventListener("input", () => {
        sizeSlider.nextElementSibling.innerText = sizeSlider.value;
        cursorSize = parseInt(sizeSlider.value);
        sizeSlider.nextElementSibling.style.bottom =
          sizeSlider.value / 0.601 + "%";
        sizeSlider.nextElementSibling.style.opacity = "1";
        brushWidth = sizeSlider.value;
      });

      sizeSlider.addEventListener("blur", () => {
        sizeSlider.nextElementSibling.style.opacity = "0";
      });
    } else if (indx === 1) {
      // btn.previousElementSibling.classList.add("active");
      insidePanel.innerHTML = `<ul class="options colors">
      <li class="option color" id='g'></li>
      <li class="option color" id='p'></li>
      <li class="option color" id='b'></li>
      <li class="option color" id='o'></li>
      <li class="option color" id='r'></li>
      <li class="option color" id='y'></li>
      <li class="option color" id='multi-colors'>
          <input type="color" id="color-picker" value="#4A98F7" style="width: inherit;height: 100%;">
        </li>
      </ul>`;
      pipe.style.top = "10.05vw";
      pipe.style.display = "block";

      const colorPicker = document.querySelector("#color-picker");
      const colorBtns = document.querySelectorAll(".colors .option");

      colorBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          let imgSrc = colorsTool.src.split("/");
          imgSrc.splice(imgSrc.length - 1, 1, btn.id + ".png");
          setTimeout(() => {
            colorsTool.src = imgSrc.toString().replaceAll(",", "/");
          }, 500);

          spinningEffect(colorsTool);

          // adding click event to all color button
          // removing selected class from the previous option and adding on current clicked option
          document
            .querySelector(".options .selected")
            ?.classList.remove("selected");
          btn.classList.add("selected");
          // passing selected btn background color as selectedColor value
          if (btn.id != "multi-colors") {
            selectedColor = window
              .getComputedStyle(btn)
              .getPropertyValue("color");
          } else {
            selectedColor = colorPicker.value;
          }
        });
      });

      colorPicker.addEventListener("change", () => {
        // passing picked color value from color picker to last color btn background
        colorPicker.parentElement.style.color = colorPicker.value;
        // colorPicker.parentElement.click();

        btn.style.color = selectedColor;
        selectedColor = colorPicker.value;
      });

      colorPicker.value = selectedColor;
    } else if (indx === 2) {
      prevTool = "shapes";
      insidePanel.innerHTML = `<ul class="options shapes">
 <li class="option tool shape" id="triangle">
          <img src="./assets/triangle.png" alt="">
        </li>
        <li class="option tool shape" id="star">
          <img src="./assets/star.png" alt="">
        </li>
        <li class="option tool shape" id="hexagon">
          <img src="./assets/hexagon.png" alt="">
        </li>
        <li class="option tool shape" id="rectangle">
          <img src="./assets/rectangle.png" alt="" style="width: 4.4vw;height: 4.4vw;">
        </li>
        <li class="option tool shape" id="circle">
          <img src="./assets/circle.png" alt="" style="">
        </li>
        <li class=" option tool">
          <input type="checkbox" id="fill-color">
          <label for="fill-color">ملء الشكل</label>
        </li></ul>`;

      fillColor = document.querySelector("#fill-color");

      fillColor.checked = fillValue;
      fillColor.addEventListener("input", () => {
        fillValue = fillColor.checked;
      });
      const shapesBtns = document.querySelectorAll(".shapes .shape");
      shapesBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          let imgSrc = shapesTool.src.split("/");
          imgSrc.splice(imgSrc.length - 1, 1, btn.id + ".png");

          setTimeout(() => {
            shapesTool.src = imgSrc.toString().replaceAll(",", "/");
          }, 500);

          spinningEffect(shapesTool);

          if (btn.id === "circle") {
            selectedTool = "circle";
          } else if (btn.id === "rectangle") {
            selectedTool = "rectangle";
          } else if (btn.id === "triangle") {
            selectedTool = "triangle";
          } else if (btn.id === "star") {
            selectedTool = "star";
          } else if (btn.id === "hexagon") {
            selectedTool = "hexagon";
          }
        });
      });

      pipe.style.top = "17.14vw";
      pipe.style.display = "block";
    } else if (indx === 3) {
      selectedTool = btn.id;
      prevTool = "";
      insidePanel.innerHTML = `<ul class="options"><li class="option slider">
      <input type="range" id="eraser-size" min="1" max="50" value="${eraserWidth}">
      <div class="slider-value">${eraserWidth}</div>
      </li></ul>`;
      pipe.style.top = "24vw";
      pipe.style.display = "block";

      sizeSlider = document.querySelector("#eraser-size");

      sizeSlider.addEventListener("input", () => {
        sizeSlider.nextElementSibling.innerText = sizeSlider.value;
        sizeSlider.nextElementSibling.style.bottom =
          sizeSlider.value / 0.601 + "%";
        sizeSlider.nextElementSibling.style.opacity = "1";
        eraserWidth = sizeSlider.value;
      });

      sizeSlider.addEventListener("blur", () => {
        sizeSlider.nextElementSibling.style.opacity = "0";
      });
    }
  });

  btn.addEventListener("touchstart", () => {
    // adding click event to all tool option
    // removing active class from the previous option and adding on current clicked option
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    btn.id !== "colors" && (selectedTool = btn.id);
  });
});

clearCanvasBtn.addEventListener("click", () => {
  openModel(clearCanvasFunc, {
    icon: "./assets/q-icon.png",
    h1: "هل ترغب في حذف جميع الرسومات الخاصة بك؟",
    btns: { btn1: "no-btn", btn2: "yes-btn" },
  });
});

const clearCanvasFunc = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clearing whole canvas
  setCanvasBackground();
  saveSnapshot();
};

saveImg.addEventListener("click", () => {
  saveDrawings();
});

const saveSnapshot = (e) => {
  redoStack = [];
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  checkDoBtnsState();
};

const undoFunc = (e) => {
  isSaved = false;
  if (undoStack.length > 1) {
    let delItem = undoStack.pop();
    redoStack.push(delItem);
    const prevImgData = undoStack[undoStack.length - 1];

    ctx.putImageData(prevImgData, 0, 0);
  } else if (undoStack.length == 1) {
    let delItem = undoStack.pop();
    redoStack.push(delItem);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  checkDoBtnsState();
};

const redoFunc = (e) => {
  isSaved = false;
  if (redoStack.length > 0) {
    let redItem = redoStack.pop();
    undoStack.push(redItem);

    const nextImgData = undoStack[undoStack.length - 1];
    ctx.putImageData(nextImgData, 0, 0);
  }
  checkDoBtnsState();
};

undoBtn.addEventListener("click", undoFunc, false);
redoBtn.addEventListener("click", redoFunc, false);

const checkDoBtnsState = () => {
  if (!redoStack.length) {
    redoBtn.style.opacity = ".5";
    redoBtn.style.cursor = "initial";
    redoBtn.setAttribute("disabled", true);
  } else {
    redoBtn.style.opacity = "1";
    redoBtn.style.cursor = "pointer";
    redoBtn.removeAttribute("disabled");
  }
  if (!undoStack.length) {
    undoBtn.style.opacity = ".5";
    undoBtn.style.cursor = "initial";
    undoBtn.setAttribute("disabled", true);
  } else {
    undoBtn.style.opacity = "1";
    undoBtn.style.cursor = "pointer";
    undoBtn.removeAttribute("disabled");
  }
};

checkDoBtnsState();
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  saveSnapshot();
});
canvas.addEventListener("mouseleave", (e) => {
  isDrawing = false;
  if (e.buttons) {
    saveSnapshot();
  }
});
canvas.addEventListener("mouseover", () => {
  if (selectedTool == "brush" || selectedTool == "eraser") {
    cursorSize = sizeSlider ? parseInt(sizeSlider.value) : 5;

    console.log(cursorSize);
    if (cursorSize <= 4) {
      canvas.style.cursor = "crosshair";
      return;
    }
    canvas.style.cursor =
      'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="' +
      cursorSize +
      '" height="' +
      cursorSize +
      '"><g id="Layer_1-2" data-name="Layer 1"><circle class="cls-1" cx="16" cy="16" r="' +
      cursorSize * 2 +
      '" fill="' +
      selectedColor.replace("#", "") +
      "\"/></g></svg>') " +
      cursorSize * 2 +
      " " +
      cursorSize * 2 +
      ", auto";
  }
});

canvas.addEventListener("touchstart", (e) => {
  startDraw(e);
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  drawing(e);
});

canvas.addEventListener("touchend", (e) => {
  isDrawing = false;
  saveSnapshot();
});

addImg.onclick = () => {
  fileInput.click();
};

fileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      readImage(img);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

const readImage = (img) => {
  let background = new createjs.Shape();
  background.graphics
    .beginFill("#FFFFFF")
    .drawRect(0, 0, stage.canvas.width, stage.canvas.height);

  img.style.transform = "rotate(90deg)";
  const bitmap = new createjs.Bitmap(img);

  const canvasWidth = stage.canvas.width;
  const canvasHeight = stage.canvas.height;
  const imageWidth = img.width;
  const imageHeight = img.height;

  const scaleWidth = canvasWidth / imageWidth;
  const scaleHeight = canvasHeight / imageHeight;
  const scale = Math.min(scaleWidth, scaleHeight);

  bitmap.scaleX = scale;
  bitmap.scaleY = scale;

  bitmap.x = (canvasWidth - imageWidth * scale) / 2;
  bitmap.y = (canvasHeight - imageHeight * scale) / 2;

  stage.children = [];

  stage.addChild(background);
  stage.addChild(bitmap);
  stage.update();
  saveSnapshot();
};

const gallery = document.querySelector(`.gallery`);
gallery.addEventListener(
  "click",
  (e) => {
    canvas.toBlob(function (blob) {
      const file = new File([blob], "converted_image.png", {
        type: "image/png",
      });
    });

    if (drawings) {
      const myDrawings = () => {
        undoStack = [];
        redoStack = [];
        const div = document.createElement("div");
        div.className = "home-page";
        const drawings = JSON.parse(localStorage.getItem("drawings"));

        setCanvasBackground();

        let content = "";
        // drawings.forEach((img, i) => {
        if (drawings.length === 1) {
          content = `<div class="overlay"></div>
          <div class="buttons">
          <button class="home home-2" title="الرئيسية"></button>
          </div><div class="lib lib2"><div class="row"><div class="outer-img"><button class="delete-my-drawing" title="حذف"></button><button class="download" title="تحميل"></button><img src="${drawings[0][1]}" /></div></div></div>`;
        } else {
          content = `<div class="overlay"></div>
        <div class="buttons">
        <button class="home home-2" title="الرئيسية"></button>
        </div><div class="lib lib2"><div class="row">`;
          if (drawings.length % 2 === 0) {
            for (let i = 0; i < drawings.length; i += 2) {
              for (let j = 0; j < 2; j++) {
                content += `<div class="outer-img"><button class="delete-my-drawing" title="حذف"></button><button class="download" title="تحميل"></button><img src="${
                  drawings[i + j][1]
                }" /></div>`;
              }
              if (i + 2 < drawings.length) {
                content += `</div><div class="row">`;
              }
            }
          } else {
            for (let i = 0; i < drawings.length; i++) {
              content += `<div class="outer-img"><button class="delete-my-drawing" title="حذف"></button><button class="download" title="تحميل"></button><img src="${drawings[i][1]}" /></div>`;

              if (i != drawings.length - 1 && i % 2 === 1) {
                content += `</div><div class="row">`;
              }
            }
          }
          content += `</div></div>`;
        }
        div.innerHTML = content;
        document.body.appendChild(div);
        setHomeFunc();

        const downloadBtn = document.querySelectorAll(".download");
        const deleteBtn = document.querySelectorAll(".delete-my-drawing");
        downloadBtn.forEach((btn) => {
          btn.addEventListener("click", () => {
            const img = new Image();
            img.src = btn.nextElementSibling.src;
            img.onload = function () {
              let background = new createjs.Shape();
              background.graphics
                .beginFill("#FFFFFF")
                .drawRect(0, 0, stage.canvas.width, stage.canvas.height);

              img.style.transform = "rotate(90deg)";
              const bitmap = new createjs.Bitmap(img);

              const canvasWidth = stage.canvas.width;
              const canvasHeight = stage.canvas.height;
              const imageWidth = img.width;
              const imageHeight = img.height;

              const scaleWidth = canvasWidth / imageWidth;
              const scaleHeight = canvasHeight / imageHeight;
              const scale = Math.min(scaleWidth, scaleHeight);

              bitmap.scaleX = scale;
              bitmap.scaleY = scale;

              bitmap.x = (canvasWidth - imageWidth * scale) / 2;
              bitmap.y = (canvasHeight - imageHeight * scale) / 2;

              stage.children = [];

              stage.addChild(background);
              stage.addChild(bitmap);
              stage.update();
              const link = document.createElement("a");
              link.download = `${Date.now()}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
              setCanvasBackground();
            };
          });
        });

        deleteBtn.forEach((btn, id) => {
          const deleteMyDrawing = () => {
            drawings.splice(id, 1);
            localStorage.setItem("drawings", JSON.stringify(drawings));
            homePage.remove();
            myDrawings();
          };
          btn.onclick = () => {
            openModel(deleteMyDrawing, {
              icon: "./assets/q-icon.png",
              h1: "هل ترغب في حذف هذه الرسمة؟",
              btns: { btn1: "no-btn", btn2: "yes-btn" },
            });
          };
        });
        // });
        const libraryBtns = document.querySelectorAll(".home-page .lib img");
        const homePage = document.querySelector(".home-page");
        libraryBtns.forEach((btn, indx) => {
          btn.onclick = () => {
            const img = new Image();
            img.src = btn.src;
            img.onload = function () {
              readImage(img);
              currDrawing = drawings[indx][0];
              isSaved = true;
            };
            homePage.remove();
          };
        });
      };
      if ((undoStack.length || redoStack.length) && !isSaved) {
        openModel(myDrawings, {
          icon: "./assets/q-icon.png",
          h1: "هل ترغب في الخروج دون حفظ التغييرات؟",
          btns: { btn1: "no-btn", btn2: "yes-btn" },
        });
      } else myDrawings();
    } else {
      openModel(() => {}, {
        icon: "./assets/i-icon.png",
        h1: "لا يوجد لديك رسومات محفوظة.",
        btns: { btn1: "ok-btn" },
      });
    }
  },
  false
);

const spinningEffect = (item) => {
  const effects = [
    { transform: "rotate(0) scale(1)" },
    { transform: "rotate(360deg) scale(0)" },
    { transform: "rotate(0) scale(1)" },
  ];

  const options = {
    duration: 1000,
    iterations: 1,
  };

  item.animate(effects, options);
};

const openModel = (func, data) => {
  const popup = document.querySelector(".popup");
  const closePopup = document.querySelector(".popup .close");
  const img = document.querySelector(".popup img");
  const h1 = document.querySelector(".popup h1");

  popup.style.transform = "translate(-50%, -50%)";
  popup.style.zIndex = "999";
  img.src = data.icon;
  h1.innerText = data.h1;
  let btns = "";
  Object.values(data.btns).forEach((btn) => {
    btns += `<button class="${btn}"></button>`;
  });

  closePopup.innerHTML = btns;

  document.body.classList.add("popup-overlay");

  closePopup.addEventListener("click", function () {
    closePopup.parentElement.style.transform = "translate(-50%, -500%)";

    setTimeout(() => {
      document.body.classList.remove("popup-overlay");
    }, 500);
  });

  closePopup.children[1]?.addEventListener("click", func);
};
