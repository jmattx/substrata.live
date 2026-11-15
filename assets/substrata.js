/* Substrata web components: FilmHero · MediaPlayer (Loop ⇄ Video) · CodePills · MarksList · CreditBlock.
   Static, no framework, no build step. Data comes inline (<script type="application/json" id="substrata-data">),
   so a page also works opened from a folder offline. */
(function () {
  "use strict";
  var el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else if (k === "style") node.setAttribute("style", attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  };
  var icon = function (path) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.6");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", path); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p); return svg;
  };
  var size = function (bytes) { return bytes >= 1e6 ? (bytes / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1e3)) + " KB"; };

  /* FilmHero: TMDB poster in the bar, the chosen TMDB backdrop behind (or the poster blurred). Never a film frame. */
  function FilmHero(film) {
    var backdrop = el("div", { "class": "film-hero__backdrop" + (film.backdrop ? "" : " film-hero__backdrop--blurred"),
      style: "background-image:url('" + (film.backdrop || film.poster || "") + "')" });
    var meta = [film.director, film.year, film.runtime].filter(Boolean).join(" · ");
    var eyebrow = el("p", { "class": "film-hero__eyebrow" }, [
      el("span", { "class": "long", text: "Film analysis · Tag Segmentation Method" }), el("span", { "class": "short", text: "Film analysis · TSM" })]);
    var text = el("div", {}, [
      el("p", { "class": "film-hero__credit", text: "Poster & backdrop: TMDB" }), eyebrow,
      el("h1", { "class": "film-hero__title", text: film.heroTitle || film.title }), el("p", { "class": "film-hero__meta", text: meta })]);
    var inner = el("div", { "class": "film-hero__inner" }, [film.poster ? el("img", { "class": "film-hero__poster", src: film.poster, alt: film.title + " poster" }) : null, text]);
    return el("header", { "class": "film-hero" }, [backdrop, inner]);
  }

  /* MediaPlayer: the still at rest; the WebP loop on hover (desktop) or touch-and-hold (phone); click or tap plays the clip.
     The Loop / Video switch picks what stays shown. */
  function MediaPlayer(media) {
    var box = el("div", { "class": "media", style: "--loop-seconds:" + (media.loopSeconds || 6) + "s" });
    var progress = el("div", { "class": "media__progress" }, [el("span")]);
    var still = el("img", { src: media.still, alt: "" });
    box.appendChild(still); box.appendChild(progress);
    // The box takes the media's own shape (16:9 until the still loads), so the burned-in credit band is never cropped.
    still.addEventListener("load", function () {
      if (!box.dataset.ratio && still.naturalWidth && still.naturalHeight) {
        box.dataset.ratio = "1"; box.style.aspectRatio = still.naturalWidth + " / " + still.naturalHeight;
      }
    });
    var readout = el("span", { "class": "media__readout" });
    var mode = "loop", video = null, holdTimer = null, held = false;
    function showStill() { stopVideo(); still.src = media.still; box.classList.remove("is-looping"); }
    function showLoop() { stopVideo(); still.src = media.loop; box.classList.add("is-looping"); }
    function stopVideo() { if (video) { video.pause(); video.remove(); video = null; still.style.display = ""; } }
    function playClip() {
      if (!media.clip) { showLoop(); return; }
      box.classList.remove("is-looping");
      video = el("video", { src: media.clip, playsinline: "", controls: "", autoplay: "", preload: "auto" });
      video.muted = !media.clipAudio; still.style.display = "none"; box.appendChild(video); video.play().catch(function () {});
      video.addEventListener("ended", function () { setMode(mode); });
    }
    function setMode(next) {
      mode = next; loopButton.setAttribute("aria-pressed", String(next === "loop")); if (videoButton) videoButton.setAttribute("aria-pressed", String(next === "video"));
      readout.textContent = next === "loop" ? "WebP · " + size(media.loopBytes || 0) : "MP4 · " + size(media.clipBytes || 0);
      if (next === "loop") showLoop(); else playClip();
    }
    // Desktop: hover plays the loop over the still while Video is chosen; click plays the clip.
    box.addEventListener("mouseenter", function () { if (!video && mode !== "loop") showLoop(); });
    box.addEventListener("mouseleave", function () { if (!video && mode !== "loop") showStill(); });
    box.addEventListener("click", function () { if (!video && !held) playClip(); held = false; });
    // Phone: touch-and-hold plays the loop (no callout, no context menu); a tap plays the clip.
    box.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    box.addEventListener("touchstart", function () { holdTimer = setTimeout(function () { held = true; showLoop(); }, 250); }, { passive: true });
    box.addEventListener("touchend", function () { clearTimeout(holdTimer); if (held && mode !== "loop") showStill(); }, { passive: true });
    var loopButton = el("button", { type: "button", text: "Loop" }); loopButton.addEventListener("click", function () { setMode("loop"); });
    var videoButton = media.clip ? el("button", { type: "button", text: "Video" }) : null;
    if (videoButton) videoButton.addEventListener("click", function () { setMode("video"); });
    var bar = el("div", { "class": "media__bar" }, [el("div", { "class": "switch", role: "group", "aria-label": "Media" }, [loopButton, videoButton]), readout]);
    setMode("loop");
    return [box, bar];
  }

  function CodePills(codes) {
    return el("div", { "class": "pills" }, codes.map(function (c) { return el("span", { "class": "pill", style: "--dot:" + c.colour }, [el("i"), document.createTextNode(c.name)]); }));
  }
  function MarksList(marks) {
    return el("ul", { "class": "marks" }, marks.map(function (m) { return el("li", { title: m.text }, [el("time", { text: m.time }), el("span", { text: m.text })]); }));
  }
  function CreditBlock(credit) {
    return el("div", { "class": "credit" }, [el("p", { text: credit.text }), el("p", { "class": "notice", text: credit.notice })]);
  }

  function renderCard(data) {
    document.title = data.item.title + " · " + data.film.title;
    var root = document.getElementById("app");
    root.appendChild(FilmHero(data.film));
    var item = data.item;
    var tags = el("div", { "class": "item__tags" }, [el("span", { "class": "chip chip--" + item.kind, text: item.kindLabel.toUpperCase() + " · " + item.code }),
      item.critical ? el("span", { "class": "critical", text: "Critical incident" }) : null]);
    var info = el("section", { "class": "card__item" }, [tags, el("h2", { "class": "item__title", text: item.title }),
      el("p", { "class": "item__time", text: item.start + " → " + item.end + " · " + item.duration }),
      item.description ? el("p", { "class": "item__description", text: item.description }) : null,
      item.codes.length ? el("p", { "class": "label", text: "Codes" }) : null, item.codes.length ? CodePills(item.codes) : null,
      item.marks.length ? el("p", { "class": "label", text: "Marks" }) : null, item.marks.length ? MarksList(item.marks) : null]);
    var toast = el("p", { "class": "toast", hidden: "" });
    var copy = el("button", { "class": "button", type: "button" }, [icon("M6.5 9.5l3-3M7 4.5l1.2-1.2a2.5 2.5 0 013.5 3.5L10.5 8M9 11.5l-1.2 1.2a2.5 2.5 0 01-3.5-3.5L5.5 8"), document.createTextNode("Copy link")]);
    copy.addEventListener("click", function () { share(data.address, "Link copied."); });
    var cite = el("button", { "class": "button", type: "button" }, [icon("M3 10c0-3 1-5 3-6M8.5 10c0-3 1-5 3-6"), document.createTextNode("Cite")]);
    cite.addEventListener("click", function () { share(data.citation, data.citation); });
    function share(text, message) {
      var done = function () { toast.hidden = false; toast.textContent = message; };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
    }
    var actions = el("div", { "class": "actions" }, [copy, cite,
      data.film.package ? el("a", { "class": "button", href: data.film.package }, [document.createTextNode("Whole film analysis"), icon("M6 3.5L10.5 8 6 12.5")]) : null]);
    var mediaParts = MediaPlayer(data.media);
    var card = el("main", { "class": "card" }, [el("section", { "class": "card__media" }, mediaParts), info,
      el("section", { "class": "card__credit" }, [CreditBlock(data.credit), actions, toast])]);
    root.appendChild(card);
  }

  var data = JSON.parse(document.getElementById("substrata-data").textContent);
  if (data.page === "card") renderCard(data);
  window.Substrata = { FilmHero: FilmHero, MediaPlayer: MediaPlayer, CodePills: CodePills, MarksList: MarksList, CreditBlock: CreditBlock };
})();
