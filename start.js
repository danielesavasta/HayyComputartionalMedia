includeHTML();


/*-----------------------------------*/

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) { elmnt.innerHTML = this.responseText; }
          if (this.status == 404) { elmnt.innerHTML = "Page not found."; }
          /* Remove the attribute, and call this function once more: */
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      /* Exit the function: */
      return;
    }
  }
  //------------------------------------------*/

  start();
}

async function getData() {
  const url = "assets/p1.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

async function getGalleryImages() {
  try {
    const response = await fetch("assets/gallery.json");
    if (!response.ok) throw new Error(`Gallery manifest: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not load gallery.json:", error.message);
    return [];
  }
}

/* ---------- Slide-order persistence (localStorage) ---------- */
const STORAGE_KEY = "slideOrder";

function saveSlideOrder() {
  const ids = Array.from(document.querySelectorAll(".swiper-wrapper .swiper-slide"))
    .map(s => s.dataset.slideId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function applySavedOrder(wrapper) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const savedIds = JSON.parse(raw);
    const slides = Array.from(wrapper.children);
    const slideMap = new Map(slides.map(s => [s.dataset.slideId, s]));

    // Append in saved order; unknown ids are skipped, new slides stay at end
    const ordered = [];
    const used = new Set();
    savedIds.forEach(id => {
      if (slideMap.has(id)) { ordered.push(slideMap.get(id)); used.add(id); }
    });
    slides.forEach(s => { if (!used.has(s.dataset.slideId)) ordered.push(s); });

    ordered.forEach(s => wrapper.appendChild(s));
  } catch (_) { /* corrupt data — ignore */ }
}

/* ---------- Drawer ---------- */
var swiperInstance; // accessible for drawer click-to-navigate

function populateDrawer() {
  const list = document.getElementById("slide-drawer-list");
  if (!list) return;
  list.innerHTML = "";

  document.querySelectorAll(".swiper-wrapper .swiper-slide").forEach((slide, idx) => {
    const id = slide.dataset.slideId || "slide-" + idx;
    const item = document.createElement("div");
    item.className = "drawer-item";
    item.dataset.slideId = id;

    // Build thumbnail
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const img = slide.querySelector("img");
    if (img) {
      const thumbImg = document.createElement("img");
      thumbImg.src = img.src;
      thumbImg.alt = "";
      thumbImg.loading = "lazy";
      thumb.appendChild(thumbImg);
    } else {
      const txt = document.createElement("span");
      txt.className = "thumb-text";
      txt.textContent = (idx + 1);
      thumb.appendChild(txt);
    }

    // Label
    const label = document.createElement("div");
    label.className = "label";
    const heading = slide.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      label.textContent = heading.textContent.trim();
    } else if (id.startsWith("gallery-")) {
      label.textContent = id.replace("gallery-", "");
    } else {
      label.textContent = "Slide " + (idx + 1);
    }

    // Drag handle
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⠿";

    item.appendChild(thumb);
    item.appendChild(label);
    item.appendChild(handle);
    list.appendChild(item);

    // Click to navigate
    item.addEventListener("click", () => {
      const allSlides = Array.from(document.querySelectorAll(".swiper-wrapper .swiper-slide"));
      const target = allSlides.findIndex(s => s.dataset.slideId === id);
      if (target !== -1 && swiperInstance) swiperInstance.slideTo(target);
    });
  });
}

function highlightActiveDrawerItem(index) {
  const items = document.querySelectorAll("#slide-drawer-list .drawer-item");
  items.forEach((it, i) => it.classList.toggle("active", i === index));
  const active = items[index];
  if (active) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function initDrawer() {
  const drawer = document.getElementById("slide-drawer");
  const toggle = document.getElementById("drawer-toggle");
  const resetBtn = document.getElementById("drawer-reset");
  const list = document.getElementById("slide-drawer-list");

  if (toggle) {
    toggle.addEventListener("click", () => drawer.classList.toggle("open"));
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
  }

  // SortableJS on the drawer list
  if (list && window.Sortable) {
    Sortable.create(list, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      handle: ".drawer-item",
      onEnd: function () {
        // Read new order from drawer DOM
        const newOrder = Array.from(list.children).map(it => it.dataset.slideId);
        const wrapper = document.querySelector(".swiper-wrapper");
        const slideMap = new Map();
        Array.from(wrapper.children).forEach(s => slideMap.set(s.dataset.slideId, s));

        newOrder.forEach(id => {
          if (slideMap.has(id)) wrapper.appendChild(slideMap.get(id));
        });

        if (swiperInstance) swiperInstance.update();
        saveSlideOrder();
      }
    });
  }
}

/* ---------- Main start ---------- */
async function start() {
  // 1. Fetch data sources in parallel
  const [json, galleryImages] = await Promise.all([getData(), getGalleryImages()]);

  // 2. Render markdown content slides
  var jsText = "";
  if (json && json["slides"]) {
    for (var slide in json["slides"]) {
      jsText += `\n ::: swiper-slide` + "\n" + json["slides"][slide] + `![](assets/` + slide + `) \n ::: \n `;
    }
  }

  var mdText = document.getElementById("markdown").innerHTML;
  var md = window.markdownit();
  md.set({ html: true, breaks: true, typographer: true });
  var container = window.markdownitContainer;
  md.use(container, 'swiper-slide', {
    render: function (tokens, idx) {
      var token = tokens[idx];
      var info = token.info.trim().split(/\s+/);
      var customClass = info.slice(1).join(' ');
      if (token.nesting === 1) {
        return '<div class="swiper-slide' + (customClass ? ' ' + customClass : '') + '">\n';
      } else {
        return '</div>\n';
      }
    }
  });

  document.getElementById("markdown").innerHTML = md.render(mdText + jsText);

  // 3. Tag content slides with data-slide-id
  var contentSlides = document.querySelectorAll(".swiper-wrapper .swiper-slide");
  contentSlides.forEach(function (s, i) { s.dataset.slideId = "content-" + i; });

  // 4. Create gallery image slides
  var wrapper = document.querySelector(".swiper-wrapper");
  galleryImages.forEach(function (filename) {
    var div = document.createElement("div");
    div.className = "swiper-slide full";
    div.dataset.slideId = "gallery-" + filename;
    div.innerHTML = '<img src="assets/' + filename + '" alt="' + filename.replace(/"/g, '') + '">';
    wrapper.appendChild(div);
  });

  // 5. Apply saved order from localStorage (before Swiper init)
  applySavedOrder(wrapper);

  // 6. Init Swiper
  swiperInstance = new Swiper('.swiper-container', {
    direction: 'vertical',
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    mousewheel: true,
    keyboard: {
      enabled: true,
    },
    on: {
      slideChange: function () {
        highlightActiveDrawerItem(this.activeIndex);
      }
    }
  });

  // 7. Wrap slide contents, process text, wrap images
  slideFix();

  // 8. Populate drawer, init SortableJS
  populateDrawer();
  initDrawer();
  highlightActiveDrawerItem(0);

  // 9. Zooming
  new Zooming().listen('img');
}

function slideFix() {
  let slides = document.getElementsByClassName("swiper-slide");

  for (let i = 0; i < slides.length; i++) {
    let content = slides[i].innerHTML;
    slides[i].innerHTML = "<div class='slideContent'>" + content + "</div>";
  }
  removeparagraphs();
  splittext();
  splith1();
  wrapImagesInFigure();
}

// wrap all images in figure tags
function wrapImagesInFigure() {
  let imgs = document.querySelectorAll(".slideContent img");
  imgs.forEach(img => {
    let figure = document.createElement('figure');
    img.parentNode.insertBefore(figure, img);
    figure.appendChild(img);
  });
}

// remove paragraphs if the contain only an image
function removeparagraphs() {
  let ps = document.querySelectorAll("p");
  let psL = ps.length, i = 0;
  while (i < psL) {
    if (ps[i].children.length == 1 && ps[i].children[0].tagName == "IMG") {
      ps[i].outerHTML = ps[i].innerHTML;
    }
    i++;
  }
}

function splittext() {
  let ps = document.querySelectorAll("p");
  let psL = ps.length, i = 0;
  while (i < psL) {
    let html = ps[i].innerHTML;
    ps[i].innerHTML = split(html);
    i++;
  }
}

function split(html) {
  // Create a temporary container to work with the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursive function to process nodes
  function processNode(node) {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent;
      const words = text.split(' ').filter(word => word.length > 0);
      const fragment = document.createDocumentFragment();

      words.forEach((word, index) => {
        const span = document.createElement('span');
        span.textContent = word;
        fragment.appendChild(span);

        if (index < words.length - 1) {
          fragment.appendChild(document.createTextNode(' '));
        }
      });

      node.parentNode.replaceChild(fragment, node);
    } else if (node.nodeType === 1) { // Element node
      // Create a copy of the childNodes array since we'll be modifying it
      const children = Array.from(node.childNodes);
      children.forEach(child => processNode(child));
    }
  }

  processNode(temp);
  return temp.innerHTML;
}

// replace the mouse with a large dot that leaves a trail of fading circles behind it
const cursor = document.querySelector('.cursor');
const trail = document.querySelector('.trail');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';

  const circle = document.createElement('div');
  circle.classList.add('trail-circle');
  circle.style.left = e.clientX + 'px';
  circle.style.top = e.clientY + 'px';
  trail.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 1000);
});

// split h1 in letters to animate them separately
function splith1() {
  let h1s = document.querySelectorAll("h1");
  let h1sL = h1s.length, j = 0;
  while (j < h1sL) {
    h1s[j].innerHTML = splitLetters(h1s[j].innerHTML);
    j++;
  }
}

function splitLetters(html) {
  // Create a temporary container to work with the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursive function to process nodes
  function processNode(node) {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent;
      const fragment = document.createDocumentFragment();

      // Split by individual characters/letters
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          // Keep spaces as text nodes
          fragment.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.textContent = char;
          fragment.appendChild(span);
        }
      }

      node.parentNode.replaceChild(fragment, node);
    } else if (node.nodeType === 1) { // Element node
      // Create a copy of the childNodes array since we'll be modifying it
      const children = Array.from(node.childNodes);
      children.forEach(child => processNode(child));
    }
  }

  processNode(temp);
  return temp.innerHTML;
}