let canvas, ctx, dpi;

const { createApp } = Vue;
const app = createApp({
  data() {
    return {
      items: [],
      item: null,
      sprite: null,
      loaded: 0,
      cx: null,
      cy: null,
      offsetY: 0,
      ww: 0,
      wh: 0,
    };
  },
  computed: {
    ready() {
      return this.loaded == 100;
    },
    winDim() {
      let vw = this.ww / 100;
      let vh = this.wh / 100;
      let vmin = Math.min(vw, vh);
      return vw + vh + vmin;
    },
    zIndex() {
      return this.item ? this.item.zIndex : 0;
    },
  },
  methods: {
    enterMouse(e) {
      this.item = this.items[e.target.dataset.id];
      this.sprite = this.drawSprite();
    },
    updateMouse(e) {
      let rect = e.target.getBoundingClientRect();
      this.cx = Math.floor(e.clientX - rect.left);
      this.cy = Math.floor(e.clientY - rect.top);
      this.paintRect();
    },
    exitMouse() {
      this.cx = null;
      this.cy = null;
      this.item = null;
      ctx.clearRect(0, 0, this.ww, this.wh);
    },
    drawSprite() {
      let h = Math.floor(13 * this.winDim * this.item.scale);
      let w = Math.floor(this.item.file.ratio * h);
      let offscreen = document.createElement("canvas");
      offscreen.width = w * dpi;
      offscreen.height = h * dpi;
      let context = offscreen.getContext("2d");
      context.scale(dpi, dpi);
      context.drawImage(this.item.file.img, 0, 0, w, h);
      return {
        width: w,
        height: h,
        img: offscreen
      };
    },
    paintRect() {
      let img = this.sprite;
      let x = this.item.pos.x + this.cx - this.sprite.width / 2;
      let y = this.item.pos.y + this.cy - this.sprite.height / 2;
      ctx.drawImage(this.sprite.img, x, y - this.offsetY, this.sprite.width, this.sprite.height);
      //ctx.globalCompositeOperation = "difference";
    },
    debounce(func, wait, immediate) {
      var timeout;
      return function () {
        var context = this,
          args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },
    onScroll() {
      this.offsetY =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
    },
    onResize() {
      this.ww =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;
      this.wh =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
      dpi = window.devicePixelRatio;
      canvas.width = this.ww * dpi;
      canvas.height = this.wh * dpi;
      ctx.scale(dpi, dpi);
      document.querySelectorAll("ul.links > li").forEach((elem, i) => {
        var rect = elem.getBoundingClientRect();
        this.items[i].pos = {
          x: rect.left,
          y: rect.top,
        };
      });
    },
    loadImage(id, total) {
      let img = new Image();
      img.src = "img/" + this.items[id].src;
      img.onload = function () {
        this.items[id].file = {
          img: img,
          ratio: img.width / img.height,
        };
        this.loaded = Math.round(((id + 1) / (total + 1)) * 100);
        if (id < total) this.loadImage(id + 1, total);
      }.bind(this);
    },
    loadImages() {
      this.loadImage(0, this.items.length - 1);
    },
    async init() {
      const res = await fetch("./js/links.json");
      const body = await res.json();
      this.items = body;

      this.loadImages();
      this.$nextTick(() => this.onResize());
      window.addEventListener("resize", this.debounce(() => this.onResize(), 250));
      window.addEventListener("scroll", this.onScroll);
    },
  },
  mounted() {
    canvas = document.getElementById("c");
    ctx = canvas.getContext("2d");
    this.init();
  },
});

app.mount('#app');
