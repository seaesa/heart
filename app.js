class HeartScene2 {
  constructor(bubblesEl, lowPerfDevice) {
    this.bubblesEl = bubblesEl;
    this.lowPerfDevice = lowPerfDevice;
    this.started = false;
    this.running = false;
    this.rafId = 0;
    this.lastFrameTime = 0;
    this.onVisibilityChange = null;
  }

  createBubbles() {
    const speeds = [
      11, 25, 12, 54, 18, 29, 18, 11, 15, 18, 29, 54, 48, 29, 25, 79, 12, 2,
      9, 16, 8, 5, 7, 24, 21, 36, 10, 27, 14, 33, 19, 28, 13, 40, 16, 26,
    ];
    const count = this.lowPerfDevice ? 32 : 46;
    this.bubblesEl.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const speed = speeds[i % speeds.length];
      const span = document.createElement("span");
      span.style.setProperty("--i", String(speed));
      span.style.setProperty("--x", (Math.random() * 100).toFixed(2));
      span.style.setProperty("--delay", `${(-Math.random() * 18).toFixed(2)}s`);
      span.style.setProperty("--size", `${(0.72 + Math.random() * 0.9).toFixed(2)}rem`);
      span.style.setProperty("--alpha", `${(0.55 + Math.random() * 0.4).toFixed(2)}`);
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-heart";
      span.appendChild(icon);
      fragment.appendChild(span);
    }
    this.bubblesEl.appendChild(fragment);
  }

  startCanvas() {
    const canvas = document.getElementById("pinkboard");
    const context = canvas.getContext("2d");
    const settings = {
      particles: {
        length: this.lowPerfDevice ? 3200 : 4600,
        duration: 3,
        velocity: this.lowPerfDevice ? 165 : 180,
        effect: -0.6,
        size: this.lowPerfDevice ? 11 : 12,
      },
    };

    class Point {
      constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
      }
      clone() { return new Point(this.x, this.y); }
      length(length) {
        if (typeof length === "undefined") return Math.hypot(this.x, this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
      }
      normalize() {
        const l = this.length();
        if (!l) return this;
        this.x /= l;
        this.y /= l;
        return this;
      }
    }

    class Particle {
      constructor() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
      }
      initialize(x, y, dx, dy) {
        this.position.x = x; this.position.y = y;
        this.velocity.x = dx; this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
      }
      update(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
      }
      draw(ctx, image) {
        const ease = (t) => --t * t * t + 1;
        const size = image.width * ease(this.age / settings.particles.duration);
        ctx.globalAlpha = 1 - this.age / settings.particles.duration;
        ctx.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
      }
    }

    class ParticlePool {
      constructor(length) {
        this.particles = Array.from({ length }, () => new Particle());
        this.firstActive = 0;
        this.firstFree = 0;
      }
      add(x, y, dx, dy) {
        this.particles[this.firstFree].initialize(x, y, dx, dy);
        this.firstFree = (this.firstFree + 1) % this.particles.length;
        if (this.firstActive === this.firstFree) {
          this.firstActive = (this.firstActive + 1) % this.particles.length;
        }
      }
      update(deltaTime) {
        const duration = settings.particles.duration;
        let i;
        if (this.firstActive < this.firstFree) {
          for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].update(deltaTime);
        } else if (this.firstFree < this.firstActive) {
          for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].update(deltaTime);
          for (i = 0; i < this.firstFree; i++) this.particles[i].update(deltaTime);
        }
        while (this.particles[this.firstActive].age >= duration && this.firstActive !== this.firstFree) {
          this.firstActive = (this.firstActive + 1) % this.particles.length;
        }
      }
      draw(ctx, image) {
        let i;
        if (this.firstActive < this.firstFree) {
          for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].draw(ctx, image);
        } else if (this.firstFree < this.firstActive) {
          for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].draw(ctx, image);
          for (i = 0; i < this.firstFree; i++) this.particles[i].draw(ctx, image);
        }
      }
    }

    const particles = new ParticlePool(settings.particles.length);
    const particleRate = settings.particles.length / settings.particles.duration;
    const pointOnHeart = (t) => new Point(
      160 * Math.pow(Math.sin(t), 3),
      130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
    );

    const image = (() => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      c.width = settings.particles.size;
      c.height = settings.particles.size;
      const to = (t) => {
        const p = pointOnHeart(t);
        p.x = settings.particles.size / 3 + (p.x * settings.particles.size) / 550;
        p.y = settings.particles.size / 3 - (p.y * settings.particles.size) / 550;
        return p;
      };
      ctx.beginPath();
      let t = -Math.PI;
      let point = to(t);
      ctx.moveTo(point.x, point.y);
      while (t < Math.PI) {
        t += 0.01;
        point = to(t);
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = "#ea80b0";
      ctx.fill();
      const img = new Image();
      img.src = c.toDataURL();
      return img;
    })();

    const onResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const render = (now) => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(render);
      const elapsed = now - this.lastFrameTime;
      this.lastFrameTime = now;
      const deltaTime = Math.min(elapsed / 1000, 0.035);
      context.clearRect(0, 0, canvas.width, canvas.height);
      const amount = particleRate * deltaTime;
      for (let i = 0; i < amount; i++) {
        const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        const dir = pos.clone().length(settings.particles.velocity);
        particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
      }
      particles.update(deltaTime);
      particles.draw(context, image);
    };
    this.onVisibilityChange = () => {
      this.running = !document.hidden;
      if (this.running) {
        this.lastFrameTime = performance.now();
        if (!this.rafId) this.rafId = requestAnimationFrame(render);
      } else if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.running = !document.hidden;
    this.lastFrameTime = performance.now();
    if (this.running) this.rafId = requestAnimationFrame(render);
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.createBubbles();
    this.startCanvas();
  }
}

class HeartPresentationApp {
  constructor() {
    this.scene1 = document.getElementById("scene1");
    this.scene2 = document.getElementById("scene2");
    this.overlay = document.getElementById("countdownOverlay");
    this.boomOverlay = document.getElementById("boomOverlay");
    this.doodle = document.getElementById("scene1Doodle");
    this.lowPerfDevice =
      window.matchMedia("(max-width: 768px)").matches ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    this.started = false;
    this.interactionReady = false;
    this.spinRaf = 0;
    this.flowDurCurrent = 12;
    this.flowDepthCurrent = 35;
    this.countdownMs = 5380;
    this.healthCheckTimer = 0;
    this.scene2Engine = new HeartScene2(document.getElementById("bubbles"), this.lowPerfDevice);
  }

  async init() {
    await this.ensureDoodleReady();
    this.bindEvents();
    this.startDoodleHealthCheck();
    // Avoid accidental early input while css-doodle settles first render.
    setTimeout(() => {
      this.interactionReady = true;
    }, 1000);
  }

  async ensureDoodleReady() {
    if (!customElements.get("css-doodle")) {
      await customElements.whenDefined("css-doodle");
    }
    if (!this.doodle) return;
    this.doodle.setAttribute("use", "var(--rule)");
    this.doodle.seed = "heart-seed";
    this.doodle.update?.();
  }

  startDoodleHealthCheck() {
    this.healthCheckTimer = window.setInterval(() => {
      if (!this.scene1.classList.contains("is-visible") || !this.doodle) return;
      const rect = this.doodle.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) {
        this.doodle.setAttribute("use", "var(--rule)");
        this.doodle.update?.();
      }
    }, 1200);
  }

  bindEvents() {
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!this.interactionReady) return;
        this.beginTransition();
        return;
      }
      if (event.code === "Enter") {
        event.preventDefault();
        window.location.reload();
      }
    });
    this.scene1.addEventListener("pointerdown", () => {
      if (!this.interactionReady) return;
      if (!this.started && this.scene1.classList.contains("is-visible")) {
        this.beginTransition();
      }
    });
  }

  countdown(from) {
    return new Promise((resolve) => {
      let current = from;
      this.overlay.textContent = String(current);
      this.overlay.classList.add("show");
      const timer = setInterval(() => {
        current -= 1;
        this.overlay.textContent = String(Math.max(current, 0));
        if (current <= 0) {
          clearInterval(timer);
          setTimeout(resolve, 380);
        }
      }, 1000);
    });
  }

  startCountdownSpin(totalMs) {
    this.stopCountdownSpin();
    const startTime = performance.now();
    let lastTime = startTime;
    const durStart = 12;
    const durEnd = 2.8;
    const depthStart = 35;
    const depthEnd = 63;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / totalMs, 1);
      const eased = progress * progress; // slow start, accelerates smoothly.
      const targetDuration = durStart + (durEnd - durStart) * eased;
      const targetDepth = depthStart + (depthEnd - depthStart) * eased;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const smoothing = 1 - Math.exp(-dt / 95);
      this.flowDurCurrent += (targetDuration - this.flowDurCurrent) * smoothing;
      this.flowDepthCurrent += (targetDepth - this.flowDepthCurrent) * smoothing;
      this.doodle?.style.setProperty("--flow-dur", `${this.flowDurCurrent.toFixed(3)}s`);
      this.doodle?.style.setProperty("--flow-depth", `${this.flowDepthCurrent.toFixed(2)}vmin`);
      if (progress < 1) {
        this.spinRaf = requestAnimationFrame(tick);
      } else {
        this.flowDurCurrent = durEnd;
        this.flowDepthCurrent = depthEnd;
        this.doodle?.style.setProperty("--flow-dur", `${durEnd.toFixed(3)}s`);
        this.doodle?.style.setProperty("--flow-depth", `${depthEnd.toFixed(2)}vmin`);
        this.spinRaf = 0;
      }
    };
    this.spinRaf = requestAnimationFrame(tick);
  }

  stopCountdownSpin() {
    if (!this.spinRaf) return;
    cancelAnimationFrame(this.spinRaf);
    this.spinRaf = 0;
  }

  async beginTransition() {
    if (!this.interactionReady || this.started) return;
    this.started = true;
      this.startCountdownSpin(this.countdownMs);
      await this.countdown(5);
      this.stopCountdownSpin();
      this.boomOverlay.classList.add("show");
      this.overlay.classList.remove("show");
      this.scene1.classList.remove("is-visible");
      this.scene1.classList.add("is-hidden");
      this.scene2.classList.remove("is-hidden");
      this.scene2.classList.add("is-visible", "boom-enter");
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = 0;
      }
      setTimeout(() => this.scene2Engine.start(), 100);
      setTimeout(() => {
        this.boomOverlay.classList.remove("show");
        this.scene2.classList.remove("boom-enter");
        this.flowDurCurrent = 12;
        this.flowDepthCurrent = 35;
        this.doodle?.style.setProperty("--flow-dur", "12s");
        this.doodle?.style.setProperty("--flow-depth", "35vmin");
      }, 760);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new HeartPresentationApp();
  app.init();
});
