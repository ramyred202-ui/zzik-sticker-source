// ===== 찍스티커 (ZzikSticker) - main app logic =====

const BUILD_ID = "build-2026-08-19-07-diary";
console.log("[찍스티커]", BUILD_ID);
window.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("build-badge");
  if (badge) badge.textContent = BUILD_ID;
});

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);

const cameraVideo = $("camera-video");
const capturedCanvas = $("captured-canvas");
const cameraHint = $("camera-hint");
const shutterBtn = $("shutter-btn");
const pickFileBtn = $("pick-file-btn");
const flipCameraBtn = $("flip-camera-btn");

const previewImg = $("preview-img");
const resultImg = $("result-img");
const processingOverlay = $("processing-overlay");
const processingTitle = $("processing-title");
const processingSub = $("processing-sub");
const progressFill = $("progress-fill");
const retakeBtn = $("retake-btn");
const removeBgBtn = $("remove-bg-btn");
const saveStickerBtn = $("save-sticker-btn");
const saveStickerOnlyBtn = $("save-sticker-only-btn");
const selectHint = $("select-hint");
const selectLasso = $("select-lasso");
const lassoCtx = selectLasso.getContext("2d");
const reviewStage = $("review-stage");

const galleryView = $("gallery-view");
const fridgeDoor = $("fridge-door");
const emptyState = $("empty-state");
const trayGrid = $("tray-grid");
const trayEmpty = $("tray-empty");
const galleryModeToggle = $("gallery-mode-toggle");
const modeTabBtns = document.querySelectorAll(".mode-tab");
const stickerCount = $("sticker-count");
const profileName = $("profile-name");
const profileAvatar = $("profile-avatar");
const surfaceBtn = $("surface-btn");
const gachaShakeBtn = $("gacha-shake-btn");
const surfaceSheet = $("surface-sheet");
const surfaceSheetClose = $("surface-sheet-close");
const surfaceOptionBtns = document.querySelectorAll(".surface-option");

const editToolbar = $("edit-toolbar");
const editDecorateBtn = $("edit-decorate-btn");
const editDeselectBtn = $("edit-deselect-btn");

const decorateSheet = $("decorate-sheet");
const decorateSheetClose = $("decorate-sheet-close");
const decorateBorderColor = $("decorate-border-color");
const decorateBorderClear = $("decorate-border-clear");
const decorateConvex = $("decorate-convex");
const decorateCaption = $("decorate-caption");
const decorateBubble = $("decorate-bubble");
const decorateConfirmBtn = $("decorate-confirm-btn");

const lightbox = $("lightbox");
const lightboxImg = $("lightbox-img");
const lightboxClose = $("lightbox-close");
const lightboxDelete = $("lightbox-delete");
const lightboxShare = $("lightbox-share");
const lightboxPlace = $("lightbox-place");

const calendarTitle = $("calendar-title");
const calendarGrid = $("calendar-grid");
const calPrevBtn = $("cal-prev-btn");
const calNextBtn = $("cal-next-btn");
const calTodayBtn = $("cal-today-btn");

const daySheet = $("day-sheet");
const daySheetTitle = $("day-sheet-title");
const daySheetGrid = $("day-sheet-grid");
const daySheetClose = $("day-sheet-close");

const todayDateLabel = $("today-date-label");
const todayMoodPicker = $("today-mood-picker");
const todayWriteBtn = $("today-write-btn");
const emptyWriteBtn = $("empty-write-btn");
const todaySeeAll = $("today-see-all");
const todaySettingsBtn = $("today-settings-btn");
const recentDiaryList = $("recent-diary-list");
const recentDiaryEmpty = $("recent-diary-empty");
const createSheet = $("create-sheet");
const createSheetBackdrop = $("create-sheet-backdrop");
const navCreateBtn = $("nav-create-btn");
const createDiaryBtn = $("create-diary-btn");
const createStickerBtn = $("create-sticker-btn");
const quickPhotoBtn = $("quick-photo-btn");

const diaryEditor = $("diary-editor");
const diaryEditorClose = $("diary-editor-close");
const diaryEditorDate = $("diary-editor-date");
const diarySaveState = $("diary-save-state");
const diarySaveBtn = $("diary-save-btn");
const editorMoodRow = $("editor-mood-row");
const diaryPaper = $("diary-paper");
const diaryTitleInput = $("diary-title-input");
const diaryNoteInput = $("diary-note-input");
const diaryPhotoInput = $("diary-photo-input");
const diaryPhotoFrame = $("diary-photo-frame");
const diaryPhotoPreview = $("diary-photo-preview");
const diaryPhotoRemove = $("diary-photo-remove");
const diaryStickerLayer = $("diary-sticker-layer");
const diaryThemePanel = $("diary-theme-panel");
const diaryStickerPicker = $("diary-sticker-picker");
const diaryToolBtns = document.querySelectorAll(".diary-tools button");

const myDiaryName = $("my-diary-name");
const myNameEdit = $("my-name-edit");
const appThemeGrid = $("app-theme-grid");
const myEntryCount = $("my-entry-count");
const myStickerCount = $("my-sticker-count");
const monthEntryCount = $("month-entry-count");
const monthMoodSummary = $("month-mood-summary");

const toastEl = $("toast");
const navBtns = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

let fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// ---------- State ----------
let mediaStream = null;
let facingMode = "environment";
let capturedBlob = null;      // original captured photo (before bg removal)
let resultBlob = null;        // background-removed sticker png
let currentLightboxId = null;

// ================= Navigation =================
function showView(id) {
  views.forEach((v) => v.classList.toggle("active", v.id === id));
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
  if (id === "camera-view") startCamera();
  else stopCamera();
  if (id === "gallery-view") renderGallery();
  if (id === "calendar-view") renderCalendar();
  if (id === "today-view") renderToday();
  if (id === "my-view") renderMyPage();
}

navBtns.forEach((btn) => {
  if (btn.dataset.tab) btn.addEventListener("click", () => showView(btn.dataset.tab));
});

// ================= Toast =================
let toastTimer = null;
function toast(msg, duration = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), duration);
}

// ================= Resilient blob → <img> loading =================
// iOS Safari — especially inside an installed/home-screen PWA — can quietly
// invalidate a blob: URL out from under an <img> if the app gets
// backgrounded or the system reclaims memory between creating the URL and
// the image actually finishing its load (e.g. the user switches to Photos
// to pick a picture, or the app is suspended for a moment). The element
// then shows the broken-image icon even though the underlying Blob itself
// is completely fine and still sitting in memory/IndexedDB. Every place
// that sets an <img>'s src from a stored Blob goes through this instead of
// a bare `URL.createObjectURL()` so a stale/evicted URL gets one automatic
// retry with a freshly-minted URL before giving up.
function setImgFromBlob(imgEl, blob, retried) {
  const url = URL.createObjectURL(blob);
  imgEl.onerror = () => {
    URL.revokeObjectURL(url);
    if (retried) {
      imgEl.onerror = null;
      imgEl.alt = "이미지를 불러오지 못했어요";
      return;
    }
    setImgFromBlob(imgEl, blob, true);
  };
  imgEl.src = url;
  return url;
}

// ================= Camera =================
async function startCamera() {
  stopCamera();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1080 } },
      audio: false,
    });
    cameraVideo.srcObject = mediaStream;
    cameraHint.textContent = "좋아하는 걸 화면 가운데에 두고 찍어보세요 ✨";
  } catch (err) {
    console.warn("camera error", err);
    cameraHint.textContent = "카메라를 쓸 수 없어요. 아래 🖼️ 버튼으로 사진을 선택해주세요";
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

flipCameraBtn.addEventListener("click", () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  startCamera();
});

shutterBtn.addEventListener("click", () => {
  if (!mediaStream) {
    fileInput.click();
    return;
  }
  const vw = cameraVideo.videoWidth;
  const vh = cameraVideo.videoHeight;
  if (!vw || !vh) return;
  capturedCanvas.width = vw;
  capturedCanvas.height = vh;
  const ctx = capturedCanvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, vw, vh);
  capturedCanvas.toBlob(
    (blob) => {
      capturedBlob = blob;
      openReview(blob);
    },
    "image/jpeg",
    0.95
  );
});

pickFileBtn.addEventListener("click", () => fileInput.click());

// Detects whether a picked photo already has a transparent background — e.g.
// a sticker exported from iPhone's built-in "lift subject" feature (Photos:
// long-press the subject → Copy/Save Image, which saves a PNG with the
// background already cut out). JPEGs can never carry an alpha channel, so
// this only ever fires for PNG/WebP-style images that are actually
// transparent, not by accident.
async function detectExistingTransparency(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = 48;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, size, size);
    if (bitmap.close) bitmap.close();
    const data = ctx.getImageData(0, 0, size, size).data;
    let transparentCount = 0;
    const total = size * size;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) transparentCount++;
    }
    return transparentCount / total > 0.03;
  } catch (err) {
    console.warn("transparency detection failed", err);
    return false;
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  capturedBlob = file;
  openReview(file);
  fileInput.value = "";
  // Already-transparent picks (e.g. an iPhone-lifted-subject sticker saved
  // from Photos) skip straight to the save step — no need to run background
  // removal on something that's already cut out.
  if (await detectExistingTransparency(file)) {
    toast("이미 배경이 없는 사진이네요 — 바로 스티커로 저장할 수 있어요 ✨");
    showResult(file);
  }
});

// ================= Review / background removal =================
function openReview(blob) {
  resultBlob = null;
  setImgFromBlob(previewImg, blob);
  previewImg.classList.remove("hidden");
  resultImg.classList.add("hidden");
  removeBgBtn.classList.remove("hidden");
  saveStickerBtn.classList.add("hidden");
  saveStickerOnlyBtn.classList.add("hidden");
  selectHint.classList.remove("hidden");
  selectLasso.classList.remove("active");
  lassoCtx.clearRect(0, 0, selectLasso.width, selectLasso.height);
  showView("review-view");
}

retakeBtn.addEventListener("click", () => showView("camera-view"));

let removeBackgroundFn = null;
// NOTE: jsDelivr/unpkg serve the raw npm package, whose internal code does
// `import "onnxruntime-web"` (a bare specifier) — that only works with a
// bundler, not in a plain browser, and fails with
// "Module name, 'onnxruntime-web' does not resolve to a valid URL".
// esm.sh / esm.run / Skypack rewrite all nested imports to real CDN URLs,
// so we use those instead.
const LIB_URLS = [
  "https://esm.sh/@imgly/background-removal@1.7.0",
  "https://esm.run/@imgly/background-removal@1.7.0",
  "https://cdn.skypack.dev/@imgly/background-removal@1.7.0",
];
async function loadBgRemovalLib() {
  if (removeBackgroundFn) return removeBackgroundFn;
  let lastErr = null;
  for (const url of LIB_URLS) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      const fn = mod.removeBackground || mod.default;
      if (typeof fn !== "function") throw new Error("라이브러리에서 removeBackground 함수를 찾지 못했어요");
      removeBackgroundFn = fn;
      return removeBackgroundFn;
    } catch (err) {
      console.warn("failed to load bg-removal lib from", url, err);
      lastErr = err;
    }
  }
  throw lastErr || new Error("배경 제거 라이브러리를 불러오지 못했어요");
}

removeBgBtn.addEventListener("click", async () => {
  if (!capturedBlob) return;
  processingOverlay.classList.add("active");
  processingTitle.textContent = "AI 모델을 준비하는 중…";
  processingSub.textContent = "처음 한 번은 조금 걸려요 (다음부턴 훨씬 빨라요)";
  progressFill.style.width = "0%";
  try {
    const removeBackground = await loadBgRemovalLib();
    const blob = await removeBackground(capturedBlob, {
      model: "isnet_quint8",
      output: { format: "image/png", quality: 0.9, type: "foreground" },
      progress: (key, current, total) => {
        const pct = total ? Math.round((current / total) * 100) : 0;
        progressFill.style.width = pct + "%";
        if (key && key.includes("fetch")) {
          processingTitle.textContent = "AI 모델 다운로드 중…";
        } else {
          processingTitle.textContent = "배경을 지우는 중이에요…";
        }
      },
    });
    showResult(blob);
  } catch (err) {
    console.error(err);
    const detail = (err && (err.message || err.name)) ? String(err.message || err.name) : "알 수 없는 오류";
    toast("배경 제거 실패: " + detail, 6000);
  } finally {
    processingOverlay.classList.remove("active");
  }
});

function showResult(blob) {
  resultBlob = blob;
  setImgFromBlob(resultImg, blob);
  previewImg.classList.add("hidden");
  resultImg.classList.remove("hidden");
  removeBgBtn.classList.add("hidden");
  saveStickerBtn.classList.remove("hidden");
  saveStickerOnlyBtn.classList.remove("hidden");
  selectHint.classList.add("hidden");
}

// ================= Freehand area select (draw around a subject to cut it out) =================
// Maps a screen point to pixel coordinates on the underlying (possibly much
// larger) natural-resolution image, accounting for the letterboxing that
// object-fit:contain introduces.
function mapClientPointToNatural(imgEl, clientX, clientY) {
  const rect = imgEl.getBoundingClientRect();
  const scaleX = imgEl.naturalWidth / rect.width;
  const scaleY = imgEl.naturalHeight / rect.height;
  const x = Math.round((clientX - rect.left) * scaleX);
  const y = Math.round((clientY - rect.top) * scaleY);
  return {
    x: Math.min(Math.max(x, 0), imgEl.naturalWidth - 1),
    y: Math.min(Math.max(y, 0), imgEl.naturalHeight - 1),
  };
}

async function blobToCanvas(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  if (bitmap.close) bitmap.close();
  return canvas;
}

// Zeroes out the alpha channel of a canvas everywhere OUTSIDE the hand-drawn
// polygon (in that canvas's own local coordinate space), then crops tightly
// to whatever's left. Used as a guard rail after automatic background
// removal below, so a same-colored neighboring object caught inside the
// padded crop box can't survive just because the AI thought it was
// foreground too — only what's inside the loop the user actually drew can
// remain.
async function intersectWithLassoAndCrop(canvas, localPoints) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext("2d");
  maskCtx.fillStyle = "#fff";
  maskCtx.beginPath();
  maskCtx.moveTo(localPoints[0].x, localPoints[0].y);
  for (let i = 1; i < localPoints.length; i++) maskCtx.lineTo(localPoints[i].x, localPoints[i].y);
  maskCtx.closePath();
  maskCtx.fill();
  const maskData = maskCtx.getImageData(0, 0, w, h).data;

  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = (y * w + x) * 4;
      if (maskData[pi + 3] === 0) {
        pixels[pi + 3] = 0;
        continue;
      }
      if (pixels[pi + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  if (maxX < minX || maxY < minY) {
    // AI removal + the hand-drawn loop didn't leave anything in common —
    // fall back to the un-intersected canvas rather than returning nothing.
    return canvas;
  }
  const pad = 4;
  const outX = Math.max(0, minX - pad);
  const outY = Math.max(0, minY - pad);
  const outW = Math.min(w, maxX + pad) - outX;
  const outH = Math.min(h, maxY + pad) - outY;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  outCanvas.getContext("2d").drawImage(canvas, outX, outY, outW, outH, 0, 0, outW, outH);
  return outCanvas;
}

// The hand-drawn loop is a rough hint, not a precise cutout: crop the photo
// to (a padded box around) the area the user traced, run the same automatic
// background-removal AI used by the "배경 지우기" button on just that crop
// (so it only has to find the one subject the user pointed at, not whatever
// else is in the full photo), and finally clip the result to the hand-drawn
// shape as a guard rail. `natPoints` is an array of {x, y} already in the
// ORIGINAL full-resolution photo's pixel coordinates.
async function runFreehandBgRemoval(natPoints) {
  if (!capturedBlob || natPoints.length < 3) {
    toast("영역을 좀 더 크게 그려주세요");
    return;
  }
  processingOverlay.classList.add("active");
  processingTitle.textContent = "AI 모델을 준비하는 중…";
  processingSub.textContent = "처음 한 번은 조금 걸려요 (다음부턴 훨씬 빨라요)";
  progressFill.style.width = "0%";
  try {
    const srcCanvas = await blobToCanvas(capturedBlob);
    const imgW = srcCanvas.width;
    const imgH = srcCanvas.height;

    const xs = natPoints.map((p) => p.x);
    const ys = natPoints.map((p) => p.y);
    const rawMinX = Math.min(...xs), rawMaxX = Math.max(...xs);
    const rawMinY = Math.min(...ys), rawMaxY = Math.max(...ys);
    const pad = Math.round(Math.max(rawMaxX - rawMinX, rawMaxY - rawMinY) * 0.15) + 16;
    const cropX = Math.max(0, Math.floor(rawMinX - pad));
    const cropY = Math.max(0, Math.floor(rawMinY - pad));
    const cropW = Math.min(imgW, Math.ceil(rawMaxX + pad)) - cropX;
    const cropH = Math.min(imgH, Math.ceil(rawMaxY + pad)) - cropY;
    if (cropW < 8 || cropH < 8) throw new Error("선택한 영역이 너무 작아요");

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    cropCanvas.getContext("2d").drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const cropBlob = await new Promise((resolve, reject) =>
      cropCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 자르기 실패"))), "image/png")
    );

    const removeBackground = await loadBgRemovalLib();
    processingTitle.textContent = "선택한 영역의 배경을 지우는 중…";
    const removedBlob = await removeBackground(cropBlob, {
      model: "isnet_quint8",
      output: { format: "image/png", quality: 0.9, type: "foreground" },
      progress: (key, current, total) => {
        const pct = total ? Math.round((current / total) * 100) : 0;
        progressFill.style.width = pct + "%";
        processingTitle.textContent =
          key && key.includes("fetch") ? "AI 모델 다운로드 중…" : "선택한 영역의 배경을 지우는 중…";
      },
    });

    // Draw the AI output back onto a crop-sized canvas (in case the library
    // returns different dimensions than the input) so the hand-drawn mask,
    // which is in the crop's coordinate space, lines up correctly.
    const removedBitmap = await createImageBitmap(removedBlob);
    const removedCanvas = document.createElement("canvas");
    removedCanvas.width = cropW;
    removedCanvas.height = cropH;
    removedCanvas.getContext("2d").drawImage(removedBitmap, 0, 0, cropW, cropH);
    if (removedBitmap.close) removedBitmap.close();

    const localPoints = natPoints.map((p) => ({ x: p.x - cropX, y: p.y - cropY }));
    const finalCanvas = await intersectWithLassoAndCrop(removedCanvas, localPoints);
    const blob = await new Promise((resolve, reject) =>
      finalCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 변환 실패"))), "image/png")
    );
    showResult(blob);
  } catch (err) {
    console.error(err);
    const detail = (err && (err.message || err.name)) ? String(err.message || err.name) : "알 수 없는 오류";
    toast("영역 배경 제거 실패: " + detail, 6000);
  } finally {
    processingOverlay.classList.remove("active");
  }
}

// ---- gesture on the captured photo: drag a finger to freehand-draw the
// area whose background should be removed ----
let pressStart = null;
const MOVE_CANCEL_PX = 12;

let isDrawingLasso = false;
let lassoPoints = []; // client (viewport) coordinates, converted at the end
const MIN_LASSO_PX = 24; // ignore accidental tiny drags/taps

function resizeLassoCanvasToStage() {
  const rect = reviewStage.getBoundingClientRect();
  selectLasso.width = Math.round(rect.width);
  selectLasso.height = Math.round(rect.height);
  return rect;
}

function redrawLasso(stageRect) {
  lassoCtx.clearRect(0, 0, selectLasso.width, selectLasso.height);
  if (lassoPoints.length < 2) return;
  lassoCtx.beginPath();
  lassoPoints.forEach((p, i) => {
    const x = p.x - stageRect.left;
    const y = p.y - stageRect.top;
    if (i === 0) lassoCtx.moveTo(x, y);
    else lassoCtx.lineTo(x, y);
  });
  lassoCtx.closePath();
  lassoCtx.fillStyle = "rgba(255,122,198,0.22)";
  lassoCtx.fill();
  lassoCtx.strokeStyle = "#ff7ac6";
  lassoCtx.lineWidth = 3;
  lassoCtx.lineJoin = "round";
  lassoCtx.lineCap = "round";
  lassoCtx.stroke();
}

function onPressStart(e) {
  if (!previewImg.src || previewImg.classList.contains("hidden")) return;
  pressStart = { x: e.clientX, y: e.clientY };
  isDrawingLasso = false;
  lassoPoints = [];
}
function onPressMove(e) {
  if (!pressStart) return;
  const dx = e.clientX - pressStart.x;
  const dy = e.clientY - pressStart.y;
  if (!isDrawingLasso && Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
    isDrawingLasso = true;
    selectHint.classList.add("hidden");
    resizeLassoCanvasToStage();
    selectLasso.classList.add("active");
    lassoPoints.push(pressStart);
  }
  if (isDrawingLasso) {
    lassoPoints.push({ x: e.clientX, y: e.clientY });
    redrawLasso(reviewStage.getBoundingClientRect());
  }
}
function onPressEnd() {
  if (isDrawingLasso && lassoPoints.length >= 3) {
    const xs = lassoPoints.map((p) => p.x);
    const ys = lassoPoints.map((p) => p.y);
    const sizeOk = (Math.max(...xs) - Math.min(...xs)) > MIN_LASSO_PX && (Math.max(...ys) - Math.min(...ys)) > MIN_LASSO_PX;
    if (sizeOk) {
      const natPoints = lassoPoints.map((p) => mapClientPointToNatural(previewImg, p.x, p.y));
      runFreehandBgRemoval(natPoints);
    }
  }
  selectLasso.classList.remove("active");
  lassoCtx.clearRect(0, 0, selectLasso.width, selectLasso.height);
  isDrawingLasso = false;
  lassoPoints = [];
  pressStart = null;
}

previewImg.addEventListener("pointerdown", onPressStart);
previewImg.addEventListener("pointermove", onPressMove);
previewImg.addEventListener("pointerup", onPressEnd);
previewImg.addEventListener("pointercancel", onPressEnd);
previewImg.addEventListener("contextmenu", (e) => e.preventDefault());

saveStickerBtn.addEventListener("click", async () => {
  if (!resultBlob) return;
  try {
    const record = await saveSticker(resultBlob);
    resultBlob = null;
    toast("스티커를 만들었어요! 다이어리에 붙여볼까요? ✨");
    await openDiaryEditor(toDateKey(new Date()), record.id);
  } catch (err) {
    console.error(err);
    toast("저장에 실패했어요 😢");
  }
});

saveStickerOnlyBtn.addEventListener("click", async () => {
  if (!resultBlob) return;
  try {
    await saveSticker(resultBlob);
    resultBlob = null;
    toast("스티커북에 저장했어요! 🎀");
    showView("gallery-view");
  } catch (err) {
    console.error(err);
    toast("저장에 실패했어요 😢");
  }
});

// ================= IndexedDB storage =================
const DB_NAME = "zziksticker-db";
const STORE_NAME = "stickers";
const DIARY_STORE_NAME = "diaryEntries";
let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(DIARY_STORE_NAME)) {
        const diaryStore = db.createObjectStore(DIARY_STORE_NAME, { keyPath: "id" });
        diaryStore.createIndex("dateKey", "dateKey", { unique: true });
        diaryStore.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function saveSticker(blob) {
  const db = await getDB();
  const record = {
    id: "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    blob,
    createdAt: Date.now(),
    // Magnet placement/design — null x/y/size means "not manually arranged
    // yet, use the automatic scattered layout". Once the user drags or
    // resizes it, these get filled in and the auto-layout no longer applies.
    x: null,
    y: null,
    size: null,
    rot: null, // degrees — user-set rotation override (see layoutFridge); null means "use the id-derived default tilt"
    borderColor: "",
    convex: false,
    caption: "",
    bubble: "",
    // A freshly-made sticker starts life sitting in the plain tray, not
    // stuck to a surface yet — the user decides where it goes (see
    // isPlaced()/the lightbox's "냉장고에 붙이기" button). Records saved
    // before this field existed are missing it entirely, which isPlaced()
    // treats as already-placed so nobody's existing fridge arrangement
    // suddenly empties out.
    placed: false,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

// Merges `patch` into a saved sticker's record (position, size, or magnet
// design fields) and persists it. Used by the drag/resize gestures and the
// decorate sheet below.
async function updateStickerFields(id, patch) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) { resolve(null); return; }
      Object.assign(record, patch);
      store.put(record);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllStickers() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items = req.result || [];
      items.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// Missing `placed` field (records saved before this feature existed) counts
// as already-placed, so upgrading the app never empties an existing fridge —
// only brand-new stickers (which explicitly get `placed: false`) start in
// the tray.
function isPlaced(item) {
  return item.placed !== false;
}

// yyyy-mm-dd in the *local* timezone (not UTC), so "today" matches what the
// user actually sees on their clock.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getStickersGroupedByDate() {
  const items = await getAllStickers();
  const map = {};
  for (const item of items) {
    const key = toDateKey(new Date(item.createdAt));
    (map[key] || (map[key] = [])).push(item);
  }
  return map;
}

async function deleteSticker(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ================= Profile (local-only, no account needed) =================
const PROFILE_KEY = "zzik-profile-name";
function loadProfileName() {
  const saved = localStorage.getItem(PROFILE_KEY);
  profileName.textContent = saved || "나의 스티커북";
}
profileAvatar.addEventListener("click", () => {
  const current = localStorage.getItem(PROFILE_KEY) || "";
  const next = window.prompt("갤러리 이름을 입력해주세요", current);
  if (next === null) return;
  const trimmed = next.trim();
  if (trimmed) {
    localStorage.setItem(PROFILE_KEY, trimmed);
  } else {
    localStorage.removeItem(PROFILE_KEY);
  }
  loadProfileName();
});
loadProfileName();

// ================= Surface picker (what the magnets are stuck to) =================
const SURFACE_KEY = "zzik-surface";
const SURFACE_LABELS = { fridge: "냉장고", whiteboard: "화이트보드", door: "현관문", partition: "파티션", gacha: "가챠" };

function loadSurface() {
  const saved = localStorage.getItem(SURFACE_KEY) || "fridge";
  galleryView.dataset.surface = saved;
  surfaceOptionBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.surface === saved);
  });
  return saved;
}
surfaceBtn.addEventListener("click", () => {
  surfaceSheet.classList.add("active");
});
surfaceSheetClose.addEventListener("click", () => {
  surfaceSheet.classList.remove("active");
});
surfaceOptionBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    localStorage.setItem(SURFACE_KEY, btn.dataset.surface);
    loadSurface();
    surfaceSheet.classList.remove("active");
    toast((SURFACE_LABELS[btn.dataset.surface] || "") + "(으)로 바꿨어요");
    updateGachaShakeBtn();
    await renderGallery(); // switch between the static layout and the gacha physics board
  });
});
loadSurface();

// ================= Tray / board mode toggle =================
// "보관함" (tray): a plain white shelf of magnets not yet stuck anywhere —
// this is the app's start screen. "냉장고" (board): the fridge/whiteboard/
// door surface itself. Deliberately just a JS variable (not persisted) so a
// fresh app launch always opens back on the tray, per the natural flow of
// "make something → decide where it goes → stick it".
let galleryMode = "tray";

function setGalleryMode(mode) {
  galleryMode = mode;
  galleryView.dataset.mode = mode;
  modeTabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));
  selectMagnet(null);
  updateGachaShakeBtn();
  // The physics loop only needs to run while the gacha board is actually
  // the visible tab — no point animating a pile nobody can see.
  if (mode === "board" && isGachaSurface()) startGachaPhysics();
  else stopGachaPhysics();
}

modeTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => setGalleryMode(btn.dataset.mode));
});

// ================= Shared sticker tile helper =================
function createStickerTile(item) {
  const tile = document.createElement("div");
  tile.className = "sticker-tile";
  const img = document.createElement("img");
  setImgFromBlob(img, item.blob);
  img.alt = "저장된 스티커";
  tile.appendChild(img);
  tile.addEventListener("click", () => openLightbox(item));
  return tile;
}

// ================= Gallery rendering (fridge door of magnets) =================
// Deterministic 0..1 "random" number derived from a string, so each
// sticker's spot on the door stays put across re-renders instead of
// reshuffling every time you open the tab.
function hashUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const MAGNET_CELL = 80; // px — grid cell each auto-placed magnet is loosely jittered within
const MAGNET_JITTER = 22; // px, max offset from the cell's center
const MAGNET_ROT = 16; // degrees, max rotation either way
const MAGNET_MIN_SIZE = 56; // px
const MAGNET_MAX_SIZE = 84; // px
const MAGNET_RESIZE_MIN = 36; // px, smallest a user can drag a magnet down to
const MAGNET_RESIZE_MAX = 170; // px, largest a user can drag a magnet up to

// Custom positions/sizes (once a user drags or resizes a magnet) are stored
// in a fixed "reference" coordinate space and scaled to the actual door
// width at render time, so an arrangement made on one phone still looks
// right — same relative layout — on a different screen size.
const REFERENCE_WIDTH = 360;

// ---- Shape-following border outline ----
// Instead of a rectangular card behind the sticker, a colored border traces
// the sticker's own cut-out silhouette (like a real die-cut sticker's white
// rim). Composited once per (item, color) combo on an offscreen canvas: the
// artwork is recolored solid (preserving its alpha shape), stamped at N
// angles around a ring to grow it outward, then the original artwork is
// drawn back on top so only the ring shows through.
const OUTLINE_WORK_SIZE = 320; // px — working canvas is capped to this on its longer side
const OUTLINE_RATIO = 0.05; // outline thickness as a fraction of the working size
const OUTLINE_ANGLES = 20; // stamp count around the ring — higher = smoother curve

// Lays magnets out: anything the user has manually dragged/resized keeps its
// saved spot (scaled to the current door width). Everything else falls onto
// a loose, jittered grid — nudged off-center, rotated, and sized a little
// differently (based on its own id, so it's stable across re-renders) — so
// an untouched fridge still looks organically covered rather than gridded.
function layoutFridge(items, doorWidth) {
  const scale = doorWidth / REFERENCE_WIDTH;
  const cols = Math.max(2, Math.floor(doorWidth / MAGNET_CELL));
  let autoIndex = 0;
  return items.map((item) => {
    // Rotation defaults to an id-derived tilt so an untouched fridge still
    // looks organic, but the gacha board lets the person spin a magnet by
    // hand (see the resize-handle gesture below) — once they do, item.rot
    // holds their chosen angle and overrides the default here.
    const rot = item.rot != null ? item.rot : (hashUnit(item.id + ":r") - 0.5) * 2 * MAGNET_ROT;
    if (item.x != null && item.y != null && item.size != null) {
      return { item, cx: item.x * scale, cy: item.y * scale, size: item.size * scale, rot };
    }
    const col = autoIndex % cols;
    const row = Math.floor(autoIndex / cols);
    autoIndex++;
    const jx = (hashUnit(item.id + ":x") - 0.5) * 2 * MAGNET_JITTER;
    const jy = (hashUnit(item.id + ":y") - 0.5) * 2 * MAGNET_JITTER;
    const size = MAGNET_MIN_SIZE + hashUnit(item.id + ":s") * (MAGNET_MAX_SIZE - MAGNET_MIN_SIZE);
    return {
      item,
      size,
      cx: col * MAGNET_CELL + MAGNET_CELL / 2 + jx,
      cy: row * MAGNET_CELL + MAGNET_CELL / 2 + jy,
      rot,
    };
  });
}

let selectedMagnetId = null;

// Recolors every non-transparent pixel of `bitmap` to `colorHex`, preserving
// its alpha shape exactly — a solid silhouette in the border color.
function drawSilhouette(bitmap, w, h, colorHex) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, w, h);
  return c;
}

// Builds a die-cut-style outline around the sticker's own silhouette (not a
// rectangular box) and returns an object URL for the composited PNG.
async function composeOutlinedSticker(blob, colorHex) {
  const bitmap = await createImageBitmap(blob);
  const iw = bitmap.width;
  const ih = bitmap.height;
  const scale = Math.min(OUTLINE_WORK_SIZE / Math.max(iw, ih), 1);
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const r = Math.max(4, Math.round(Math.max(w, h) * OUTLINE_RATIO));

  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  src.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();

  const silhouette = drawSilhouette(src, w, h, colorHex);

  const out = document.createElement("canvas");
  out.width = w + r * 2;
  out.height = h + r * 2;
  const oCtx = out.getContext("2d");
  for (let i = 0; i < OUTLINE_ANGLES; i++) {
    const a = (Math.PI * 2 * i) / OUTLINE_ANGLES;
    oCtx.drawImage(silhouette, r + Math.round(Math.cos(a) * r), r + Math.round(Math.sin(a) * r));
  }
  oCtx.drawImage(src, r, r);

  const composedBlob = await new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("테두리 합성 실패"))), "image/png")
  );
  return URL.createObjectURL(composedBlob);
}

// Caches the latest composited-outline URL per sticker id (one per id, not
// per color — an older color's blob URL is revoked as soon as a new one
// replaces it) plus a generation counter per id so that if the color picker
// fires several times in quick succession, only the last request's result
// ever gets applied/cached — earlier in-flight composites are discarded.
const outlineCache = new Map(); // id -> { color, url }
const outlineGen = new Map(); // id -> number

async function updateMagnetImage(magnet, item, retried) {
  const img = magnet.querySelector(".magnet-img");
  if (!img) return;
  if (!item.borderColor) {
    const cached = outlineCache.get(item.id);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      outlineCache.delete(item.id);
    }
    setImgFromBlob(img, item.blob);
    return;
  }
  const cached = outlineCache.get(item.id);
  if (cached && cached.color === item.borderColor) {
    img.onerror = () => {
      // The cached composited URL went stale (see setImgFromBlob above for
      // why) — drop it and recompute fresh, once.
      outlineCache.delete(item.id);
      img.onerror = null;
      if (!retried) updateMagnetImage(magnet, item, true);
    };
    img.src = cached.url;
    return;
  }
  const gen = (outlineGen.get(item.id) || 0) + 1;
  outlineGen.set(item.id, gen);
  try {
    const url = await composeOutlinedSticker(item.blob, item.borderColor);
    if (outlineGen.get(item.id) !== gen) {
      URL.revokeObjectURL(url); // a newer request has already superseded this one
      return;
    }
    const prev = outlineCache.get(item.id);
    if (prev) URL.revokeObjectURL(prev.url);
    outlineCache.set(item.id, { color: item.borderColor, url });
    // A freshly-minted composite URL can go stale the exact same way a
    // plain photo's blob URL can (see setImgFromBlob above) — e.g. the app
    // gets backgrounded right as the outline finishes compositing. Without
    // this, a failed load here just sat broken forever with no recovery,
    // since (unlike the cached-URL branch above) nothing was watching for
    // it to error. Recompute once from the original blob instead.
    img.onerror = () => {
      outlineCache.delete(item.id);
      img.onerror = null;
      if (!retried) updateMagnetImage(magnet, item, true);
    };
    img.src = url;
  } catch (err) {
    // The compose itself failed (e.g. a transient createImageBitmap hiccup)
    // — the magnet is left showing its old image with no border applied,
    // which reads as "the color didn't take." Retry once before giving up.
    console.warn("outline compose failed", err);
    if (!retried) updateMagnetImage(magnet, item, true);
  }
}

// Async so callers that need the finished result (the decorate sheet's
// confirm flow, in particular) can await it. Render loops that build many
// magnets at once (renderBoard/renderGachaBoard) intentionally call this
// without awaiting — they don't need to block on every image composite to
// keep laying out the rest of the board.
async function setMagnetDesign(magnet, item) {
  await updateMagnetImage(magnet, item);

  const img = magnet.querySelector(".magnet-img");
  let shine = magnet.querySelector(".magnet-shine");
  if (item.convex) {
    if (img) {
      // The convex "lift" used to be a box-shadow on the .magnet div — but
      // that div is the sticker's full square hit-box, not its die-cut
      // shape, so the shadow rendered as a rectangle around the photo
      // instead of hugging the actual artwork (the same class of bug as
      // the shine below). filter: drop-shadow, unlike box-shadow, follows
      // the image's own alpha silhouette, so stacking a bigger/softer one
      // on top of the normal resting shadow gives the same "lifted higher"
      // feel without ever drawing a visible rectangle.
      img.style.filter =
        "drop-shadow(0 5px 8px rgba(20,18,31,0.30)) drop-shadow(0 1px 2px rgba(20,18,31,0.22)) drop-shadow(0 9px 14px rgba(20,18,31,0.26))";
    }
    if (!shine) {
      shine = document.createElement("div");
      shine.className = "magnet-shine";
      magnet.insertBefore(shine, magnet.firstChild);
    }
    // The shine used to just be a plain inset:0 rectangle, covering the
    // magnet's whole square hit-box — including the transparent margin
    // around the die-cut sticker. On anything that isn't itself square
    // (which is most background-removed photos), that meant the glossy
    // highlight visibly spilled past the actual artwork into empty space.
    // Masking it with the sticker's own current image (same src as
    // .magnet-img, kept in sync here since that can change independently —
    // border color, retries) confines the highlight to exactly the opaque
    // pixels of the photo, the same shape the die-cut border uses.
    if (img && img.src) {
      shine.style.maskImage = `url("${img.src}")`;
      shine.style.webkitMaskImage = `url("${img.src}")`;
    }
  } else {
    if (img) {
      img.style.filter = "drop-shadow(0 5px 8px rgba(20,18,31,0.30)) drop-shadow(0 1px 2px rgba(20,18,31,0.22))";
    }
    if (shine) shine.remove();
  }
}

function renderMagnetExtras(magnet, item) {
  let caption = magnet.querySelector(".magnet-caption");
  if (item.caption) {
    if (!caption) {
      caption = document.createElement("div");
      caption.className = "magnet-caption";
      magnet.appendChild(caption);
    }
    caption.textContent = item.caption;
  } else if (caption) {
    caption.remove();
  }
  let bubble = magnet.querySelector(".magnet-bubble");
  if (item.bubble) {
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "magnet-bubble";
      magnet.appendChild(bubble);
    }
    bubble.textContent = item.bubble;
  } else if (bubble) {
    bubble.remove();
  }
}

// ================= Gacha: a lightweight physics playground =================
// When "가챠" is the selected surface, the board isn't a static auto-scatter
// layout — it's a tiny physics toy. Magnets fall in, pile up against a
// floor and each other, can be picked up and set back down (gravity resumes
// the instant you let go), and a shake — or the 🎲 button, for phones/
// browsers where motion isn't available — gives the whole pile a scatter
// impulse so it all tumbles and resettles. Hand-rolled with a small
// per-frame loop rather than pulling in a physics library: the interactions
// here (gravity, floor/wall bounce, circle-circle separation) are simple
// enough that this is both lighter and more reliable than a CDN dependency
// we can't verify loads on every network.
const GACHA_GRAVITY = 1700; // px/s^2
const GACHA_FLOOR_BOUNCE = 0.3;
const GACHA_WALL_BOUNCE = 0.35;
const GACHA_FRICTION = 0.9; // velocity retained per floor-contact frame (rolling friction)
const GACHA_SLEEP_SPEED = 10; // px/s — below this on both axes, a magnet just stops instead of endlessly micro-adjusting
const GACHA_PAIR_RESTITUTION = 0.12; // bounciness between two magnets touching each other (soft, mostly inelastic — a pile should settle, not keep clacking)
const GACHA_PAIR_FRICTION = 0.8; // sideways velocity retained per contact resolve, damps rolling/sliding jitter within a pile
const GACHA_SOLVER_ITERATIONS = 4; // pairwise-contact relaxation passes per frame — one pass isn't enough for a stack of >2 magnets to settle without visibly jostling
// Every magnet falling at the exact same rate reads as robotic — a small,
// deterministic per-item gravity variance (seeded from the id, so it's
// stable across frames/rebuilds) makes the drop-in cascade feel organic
// instead of like a uniform grid of identical objects falling in lockstep.
const GACHA_GRAVITY_VARIANCE = 0.15; // ±15% per-item gravity multiplier
const GACHA_SPIN_INITIAL_MAX = 260; // deg/s — max initial tumble speed for a freshly-dropped magnet
const GACHA_SPIN_FRICTION = 3.2; // per-second decay rate applied to angular velocity
const GACHA_BOUNCE_SPIN_KICK = 140; // deg/s of extra random spin added on a hard bounce
const GACHA_IMPACT_MIN_SPEED = 260; // px/s — contacts below this are just settling jitter, not a "landing" worth a thud/squash
const GACHA_IMPACT_MAX_SPEED = 1200; // px/s — impact intensity (for sound/squash scale) clamps at this speed

function isGachaSurface() {
  return galleryView.dataset.surface === "gacha";
}

function updateGachaShakeBtn() {
  gachaShakeBtn.classList.toggle("hidden", !(isGachaSurface() && galleryMode === "board"));
}

// Resting positions/velocities persist across renderGallery() rebuilds (the
// DOM itself gets torn down and recreated on every save/delete/place), keyed
// by sticker id, so adding one new magnet doesn't reset the whole pile back
// to falling-from-above — only magnets that have never been simulated this
// session start with a drop-in entrance.
const gachaPositions = new Map(); // id -> { x, y }
const gachaVel = new Map(); // id -> { vx, vy }
const gachaSpin = new Map(); // id -> angular velocity, deg/s (tumble while falling, damps out on landing)
let gachaRafId = null;
let gachaLastT = null;

// ---- Lightweight synthesized SFX + a safe vibrate wrapper ----
// No external audio files: everything here is a tiny Web Audio oscillator/
// noise burst generated on the fly, so there's nothing to fetch or cache.
// iOS Safari has no Vibration API at all (confirmed as of iOS 26) —
// vibrateSafe() is still called everywhere a "real" haptic would go, since
// it's a harmless no-op there and gives actual feedback on Android/Chrome.
let sfxCtx = null;
let sfxDisabled = false;
function getSfxCtx() {
  if (sfxDisabled) return null;
  if (!sfxCtx) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) { sfxDisabled = true; return null; }
      sfxCtx = new Ctor();
    } catch (err) {
      sfxDisabled = true;
      return null;
    }
  }
  if (sfxCtx.state === "suspended") sfxCtx.resume().catch(() => {});
  return sfxCtx;
}
function sfxTone(ctx, { freqStart, freqEnd = freqStart, duration = 0.09, type = "sine", peak = 0.16, delay = 0 }) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(30, freqStart), t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t0 + duration * 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}
function sfxThud(ctx, { duration = 0.12, peak = 0.22, delay = 0 } = {}) {
  // A short lowpass-filtered noise burst layered under a low descending tone
  // reads as a soft "plop" of something settling rather than a pure beep.
  const t0 = ctx.currentTime + delay;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(peak * 0.5, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(t0);
  sfxTone(ctx, { freqStart: 190, freqEnd: 90, duration, type: "sine", peak: peak * 0.9, delay });
}
function playPickupSfx() {
  const ctx = getSfxCtx();
  if (!ctx) return;
  try { sfxTone(ctx, { freqStart: 520, freqEnd: 780, duration: 0.07, type: "sine", peak: 0.14 }); } catch (err) {}
}
function playLandSfx(intensity = 1) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  const clamped = Math.max(0.25, Math.min(1, intensity));
  try { sfxThud(ctx, { duration: 0.1 + clamped * 0.05, peak: 0.08 + clamped * 0.22 }); } catch (err) {}
}
function playScatterSfx() {
  const ctx = getSfxCtx();
  if (!ctx) return;
  try {
    [0, 0.05, 0.1].forEach((delay, i) => {
      sfxTone(ctx, { freqStart: 700 + i * 160, freqEnd: 1000 + i * 160, duration: 0.08, type: "triangle", peak: 0.09, delay });
    });
  } catch (err) {}
}
function vibrateSafe(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (err) {}
}

// Squash-and-stretch "thud" on a hard landing/collision — purely visual
// (see .magnet.impact / @keyframes magnet-squash in style.css), throttled
// per-magnet so a rapid retrigger restarts the animation instead of
// stacking multiple copies of it.
const gachaImpactTimers = new Map(); // id -> timeout handle
function triggerMagnetImpact(magnet, intensity) {
  magnet.classList.remove("impact");
  // Force a reflow so re-adding the class restarts the CSS animation even
  // if it's already mid-play from a previous impact this same magnet.
  void magnet.offsetWidth;
  magnet.classList.add("impact");
  const id = magnet.dataset.id;
  const prevTimer = gachaImpactTimers.get(id);
  if (prevTimer) clearTimeout(prevTimer);
  gachaImpactTimers.set(
    id,
    setTimeout(() => { magnet.classList.remove("impact"); gachaImpactTimers.delete(id); }, 340)
  );
  playLandSfx(intensity);
}

function gachaStep(dt) {
  const doorWidth = fridgeDoor.clientWidth || 340;
  const floorY = fridgeDoor.clientHeight || 400;
  // Contacts hard enough to count as a "landing" (not just settling jitter)
  // trigger a squash-bounce + thud sound — collected here and fired once
  // per body per frame, after the physics for this frame is fully resolved.
  const impacts = new Map(); // id -> peak impact speed this frame
  const registerImpact = (id, speed) => {
    if (speed < GACHA_IMPACT_MIN_SPEED) return;
    const prev = impacts.get(id) || 0;
    if (speed > prev) impacts.set(id, speed);
  };
  const bodies = Array.from(fridgeDoor.querySelectorAll(".magnet"))
    .filter((m) => m.dataset.physicsDragging !== "1")
    .map((m) => {
      const id = m.dataset.id;
      const r = m.offsetWidth / 2;
      let x = parseFloat(m.style.left);
      let y = parseFloat(m.style.top);
      let rot = parseFloat(m.style.getPropertyValue("--magnet-rot")) || 0;
      const v = gachaVel.get(id) || { vx: 0, vy: 0 };
      let spin = gachaSpin.get(id) || 0;
      // Deterministic per-item gravity variance (seeded from the id) so the
      // same magnet always falls the same way across rebuilds, but
      // different magnets in the same drop don't fall in perfect lockstep.
      const gravityMul = 1 + (hashUnit(id + ":gravity") - 0.5) * 2 * GACHA_GRAVITY_VARIANCE;
      v.vy += GACHA_GRAVITY * gravityMul * dt;
      x += v.vx * dt;
      y += v.vy * dt;
      spin -= spin * Math.min(1, GACHA_SPIN_FRICTION * dt);
      rot += spin * dt;
      if (y + r > floorY) {
        const impactSpeed = v.vy;
        y = floorY - r;
        v.vy = Math.abs(v.vy) > GACHA_SLEEP_SPEED ? -v.vy * GACHA_FLOOR_BOUNCE : 0;
        v.vx *= GACHA_FRICTION;
        if (impactSpeed > GACHA_IMPACT_MIN_SPEED) {
          spin += (hashUnit(id + ":bounce" + Math.floor(x)) - 0.5) * 2 * GACHA_BOUNCE_SPIN_KICK;
          registerImpact(id, impactSpeed);
        }
      }
      if (y - r < 0) { y = r; v.vy = Math.abs(v.vy) * GACHA_FLOOR_BOUNCE; }
      if (x - r < 0) { x = r; v.vx = Math.abs(v.vx) * GACHA_WALL_BOUNCE; }
      if (x + r > doorWidth) { x = doorWidth - r; v.vx = -Math.abs(v.vx) * GACHA_WALL_BOUNCE; }
      return { m, id, r, x, y, v, rot, spin };
    });
  // Pairwise contact resolution. Earlier this only pushed overlapping
  // circles apart positionally and never touched their velocities — so a
  // magnet resting on top of another (rather than on the literal floor)
  // never got its fall speed zeroed out. Gravity kept accelerating it every
  // frame, the position push-apart kept shoving it back out of its
  // neighbor, and the net result was every magnet above the bottom layer
  // vibrating in place forever instead of settling. Resolving the velocity
  // along the contact normal (a small soft-inelastic "impulse") on top of
  // the position correction is what actually lets a pile go still, and
  // running a few relaxation passes per frame keeps a multi-magnet stack
  // from jostling itself while it settles.
  for (let iter = 0; iter < GACHA_SOLVER_ITERATIONS; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const minDist = a.r + b.r;
        if (dist >= minDist) continue;
        const nx = dx / dist, ny = dy / dist;
        const overlap = (minDist - dist) / 2;
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;

        const rvx = b.v.vx - a.v.vx, rvy = b.v.vy - a.v.vy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          // Approaching along the normal — cancel most of that closing
          // speed (with a touch of bounce) instead of leaving it to just
          // re-penetrate next frame.
          const jn = (-(1 + GACHA_PAIR_RESTITUTION) * vn) / 2;
          a.v.vx -= jn * nx; a.v.vy -= jn * ny;
          b.v.vx += jn * nx; b.v.vy += jn * ny;
          // Damp the sideways (tangential) component too, or a stack keeps
          // slowly sliding/rotating against itself even once it's stopped
          // sinking.
          const tx = -ny, ty = nx;
          const vt = rvx * tx + rvy * ty;
          const jt = (vt * (1 - GACHA_PAIR_FRICTION)) / 2;
          a.v.vx += jt * tx; a.v.vy += jt * ty;
          b.v.vx -= jt * tx; b.v.vy -= jt * ty;
          // A hard collision (one magnet dropping onto/into another) is as
          // much a "landing" as hitting the literal floor — only the first,
          // strongest solver pass for a given pair is worth a thud (later
          // relaxation passes are just settling the overlap, not a new hit).
          const impactSpeed = -vn;
          if (iter === 0) {
            registerImpact(a.id, impactSpeed);
            registerImpact(b.id, impactSpeed);
            const kick = Math.min(1, impactSpeed / GACHA_IMPACT_MAX_SPEED) * GACHA_BOUNCE_SPIN_KICK;
            a.spin += (hashUnit(a.id + ":pk" + Math.floor(a.x)) - 0.5) * 2 * kick;
            b.spin += (hashUnit(b.id + ":pk" + Math.floor(b.x)) - 0.5) * 2 * kick;
          }
        }
      }
    }
  }
  for (const { m, id, r, x, y, v, rot, spin } of bodies) {
    // General sleep: once a magnet's own speed is negligible on both axes,
    // snap it to a dead stop rather than leaving a residual sub-pixel
    // velocity for gravity/contacts to keep nudging every single frame.
    // Rotation sleeps along with position — a magnet fully at rest holds
    // whatever tilt it landed on instead of endlessly micro-spinning.
    const resting = Math.abs(v.vx) < GACHA_SLEEP_SPEED && Math.abs(v.vy) < GACHA_SLEEP_SPEED;
    let finalV = v, finalSpin = spin;
    if (resting) {
      finalV = { vx: 0, vy: 0 };
      finalSpin = Math.abs(spin) < GACHA_SLEEP_SPEED ? 0 : spin;
    }
    const cx = Math.min(Math.max(x, r), doorWidth - r);
    const cy = Math.min(Math.max(y, r), floorY - r);
    m.style.left = cx + "px";
    m.style.top = cy + "px";
    m.style.setProperty("--magnet-rot", rot.toFixed(1) + "deg");
    gachaVel.set(id, finalV);
    gachaSpin.set(id, finalSpin);
    gachaPositions.set(id, { x: cx, y: cy });
  }
  impacts.forEach((speed, id) => {
    const magnet = fridgeDoor.querySelector(`.magnet[data-id="${CSS.escape(id)}"]`);
    if (magnet) triggerMagnetImpact(magnet, speed / GACHA_IMPACT_MAX_SPEED);
  });
}

function gachaLoop(t) {
  if (!(isGachaSurface() && galleryMode === "board")) { gachaRafId = null; gachaLastT = null; return; }
  if (gachaLastT == null) gachaLastT = t;
  const dt = Math.min(0.032, (t - gachaLastT) / 1000);
  gachaLastT = t;
  gachaStep(dt);
  gachaRafId = requestAnimationFrame(gachaLoop);
}

function startGachaPhysics() {
  if (gachaRafId != null) return;
  gachaLastT = null;
  gachaRafId = requestAnimationFrame(gachaLoop);
}

function stopGachaPhysics() {
  if (gachaRafId != null) cancelAnimationFrame(gachaRafId);
  gachaRafId = null;
  gachaLastT = null;
}

// Gives every settled magnet a random upward+sideways kick, like the pile
// getting jostled — used by both real shake detection and the manual 🎲
// button (which also doubles as the permission prompt trigger on iOS).
function gachaScatter() {
  if (!isGachaSurface()) return;
  fridgeDoor.querySelectorAll(".magnet").forEach((m) => {
    if (m.dataset.physicsDragging === "1") return;
    gachaVel.set(m.dataset.id, {
      vx: (Math.random() - 0.5) * 700,
      vy: -520 - Math.random() * 420,
    });
    gachaSpin.set(m.dataset.id, (Math.random() - 0.5) * 2 * GACHA_SPIN_INITIAL_MAX * 1.4);
  });
  startGachaPhysics();
  playScatterSfx();
  vibrateSafe([12, 30, 12, 30, 18]);
  toast("우르르 쏟아졌어요 🎲");
}

// Builds the gacha board: existing magnets resume from wherever the physics
// last left them (see gachaPositions above); a magnet simulated for the
// first time this session drops in from above the visible area, staggered
// so they cascade in one after another instead of all landing at once.
function renderGachaBoard(items) {
  fridgeDoor.innerHTML = "";
  emptyState.classList.toggle("hidden", items.length > 0);
  if (!items.length) return;
  emptyState.classList.add("hidden");
  const scrollEl = fridgeDoor.parentElement;
  const doorWidth = fridgeDoor.clientWidth || scrollEl.clientWidth || 340;
  fridgeDoor.style.minHeight = "";
  // scrollEl.clientHeight includes its own top/bottom padding (the 42px
  // breathing gap above the door, plus the safe-area gap below), but the
  // door itself sits *inside* that padded content box. Sizing the door to
  // the full clientHeight made its floor land ~60px below the box's actual
  // visible bottom edge, so with overflow:hidden the settled pile's bottom
  // row got silently clipped off. Subtract the padding so the door's floor
  // lines up with the real visible boundary.
  const scrollStyle = getComputedStyle(scrollEl);
  const scrollPadTop = parseFloat(scrollStyle.paddingTop) || 0;
  const scrollPadBottom = parseFloat(scrollStyle.paddingBottom) || 0;
  const availableHeight = (scrollEl.clientHeight || 480) - scrollPadTop - scrollPadBottom;
  fridgeDoor.style.height = Math.max(availableHeight, 240) + "px";
  const placed = layoutFridge(items, doorWidth); // reused only for each item's size/rotation hash, not position
  placed.forEach(({ item, rot, size }, i) => {
    const magnet = document.createElement("div");
    magnet.className = "magnet";
    magnet.dataset.id = item.id;
    const known = gachaPositions.get(item.id);
    const startX = known ? known.x : Math.max(size / 2, Math.min(doorWidth - size / 2, Math.random() * doorWidth));
    const startY = known ? known.y : -40 - i * 46;
    magnet.style.left = startX + "px";
    magnet.style.top = startY + "px";
    magnet.style.width = size.toFixed(0) + "px";
    magnet.style.height = size.toFixed(0) + "px";
    magnet.style.setProperty("--magnet-rot", rot.toFixed(1) + "deg");
    if (!known) {
      // Fresh drop-in this session: give it a random tumble so the cascade
      // reads as things falling and turning in the air, not a grid of
      // identical objects sliding straight down (see gachaStep's spin
      // integration). Magnets resuming from a known position already have
      // whatever spin they settled with, so leave gachaSpin alone for those.
      gachaSpin.set(item.id, (hashUnit(item.id + ":spin0") - 0.5) * 2 * GACHA_SPIN_INITIAL_MAX);
    }
    const contactShadow = document.createElement("div");
    contactShadow.className = "magnet-contact-shadow";
    magnet.appendChild(contactShadow);
    const img = document.createElement("img");
    img.className = "magnet-img";
    setImgFromBlob(img, item.blob);
    img.alt = "저장된 스티커 마그넷";
    magnet.appendChild(img);
    setMagnetDesign(magnet, item);
    renderMagnetExtras(magnet, item);
    const handle = document.createElement("div");
    handle.className = "magnet-resize-handle";
    handle.textContent = "⤡";
    magnet.appendChild(handle);
    magnet.classList.toggle("selected", item.id === selectedMagnetId);
    wireMagnetGestures(magnet, item);
    fridgeDoor.appendChild(magnet);
  });
  updateEditToolbar();
}

gachaShakeBtn.addEventListener("click", async () => {
  if (
    !gachaMotionWired &&
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const res = await DeviceMotionEvent.requestPermission();
      if (res === "granted") wireGachaShakeDetection();
    } catch (err) {
      console.warn("motion permission request failed", err);
    }
  } else if (!gachaMotionWired) {
    wireGachaShakeDetection(); // Android/desktop: no permission gate needed
  }
  gachaScatter(); // also fire immediately as a manual trigger either way
});

let gachaMotionWired = false;
let gachaLastAccel = null;
let gachaLastShakeAt = 0;
const GACHA_SHAKE_THRESHOLD = 28; // combined |Δx|+|Δy|+|Δz| in m/s² to count as a shake
const GACHA_SHAKE_COOLDOWN_MS = 1200;

function wireGachaShakeDetection() {
  if (gachaMotionWired) return;
  gachaMotionWired = true;
  window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null) return;
    if (gachaLastAccel) {
      const delta = Math.abs(a.x - gachaLastAccel.x) + Math.abs(a.y - gachaLastAccel.y) + Math.abs(a.z - gachaLastAccel.z);
      const now = performance.now();
      if (delta > GACHA_SHAKE_THRESHOLD && now - gachaLastShakeAt > GACHA_SHAKE_COOLDOWN_MS && isGachaSurface() && galleryMode === "board") {
        gachaLastShakeAt = now;
        gachaScatter();
      }
    }
    gachaLastAccel = a;
  });
}

function renderTray(items) {
  trayGrid.innerHTML = "";
  trayEmpty.classList.toggle("hidden", items.length > 0);
  for (const item of items) {
    const tile = document.createElement("div");
    tile.className = "tray-tile";
    const inner = document.createElement("div");
    inner.className = "tray-tile-inner";
    const img = document.createElement("img");
    setImgFromBlob(img, item.blob);
    img.alt = "보관함의 마그넷";
    inner.appendChild(img);
    tile.appendChild(inner);
    const pin = document.createElement("div");
    pin.className = "tray-pin";
    pin.textContent = "🧲";
    tile.appendChild(pin);
    tile.addEventListener("click", () => openLightbox(item));
    trayGrid.appendChild(tile);
  }
}

function renderBoard(items) {
  fridgeDoor.innerHTML = "";
  emptyState.classList.toggle("hidden", items.length > 0);
  if (!items.length) {
    // Collapse the door so the empty-state illustration shows right under
    // the profile bar instead of being pushed off-screen below a
    // still-full-height (but empty) fridge.
    fridgeDoor.style.height = "0";
    fridgeDoor.style.minHeight = "0";
    // The freezer-drawer ::after strip has a fixed 92px height regardless
    // of the door's own height (so it stays pinned to the bottom as photos
    // pile up) — but that also means it doesn't shrink away on its own
    // when the door collapses to 0 for the empty state, and would float
    // oddly above the empty-state illustration. This class hides it (and
    // ::before) explicitly for that case.
    fridgeDoor.classList.add("empty");
    return;
  }
  fridgeDoor.classList.remove("empty");
  fridgeDoor.style.minHeight = "";
  const doorWidth = fridgeDoor.clientWidth || 340;
  const placed = layoutFridge(items, doorWidth);
  const maxBottom = placed.reduce((m, p) => Math.max(m, p.cy + p.size / 2), 0);
  fridgeDoor.style.height = Math.max(maxBottom + 60, MAGNET_CELL * 3) + "px";
  for (const { item, cx, cy, rot, size } of placed) {
    const magnet = document.createElement("div");
    magnet.className = "magnet";
    magnet.dataset.id = item.id;
    magnet.style.left = cx + "px";
    magnet.style.top = cy + "px";
    magnet.style.width = size.toFixed(0) + "px";
    magnet.style.height = size.toFixed(0) + "px";
    magnet.style.setProperty("--magnet-rot", rot.toFixed(1) + "deg");
    const contactShadow = document.createElement("div");
    contactShadow.className = "magnet-contact-shadow";
    magnet.appendChild(contactShadow);
    const img = document.createElement("img");
    img.className = "magnet-img";
    setImgFromBlob(img, item.blob);
    img.alt = "저장된 스티커 마그넷";
    magnet.appendChild(img);
    setMagnetDesign(magnet, item);
    renderMagnetExtras(magnet, item);
    const handle = document.createElement("div");
    handle.className = "magnet-resize-handle";
    handle.textContent = "⤡";
    magnet.appendChild(handle);
    magnet.classList.toggle("selected", item.id === selectedMagnetId);
    wireMagnetGestures(magnet, item);
    fridgeDoor.appendChild(magnet);
  }
  updateEditToolbar();
}

async function renderGallery() {
  const items = await getAllStickers();
  const trayItems = items.filter((it) => !isPlaced(it));
  const boardItems = items.filter(isPlaced);
  stickerCount.textContent =
    galleryMode === "tray" ? trayItems.length + "개 보관 중" : boardItems.length + "개 붙어있어요";
  renderTray(trayItems);
  if (isGachaSurface()) {
    renderGachaBoard(boardItems);
    if (galleryMode === "board") startGachaPhysics();
  } else {
    stopGachaPhysics();
    renderBoard(boardItems);
  }
}

function openLightbox(item) {
  currentLightboxId = item.id;
  setImgFromBlob(lightboxImg, item.blob);
  lightbox.dataset.blobId = item.id;
  lightbox._blob = item.blob;
  lightboxPlace.classList.toggle("hidden", isPlaced(item));
  lightbox.classList.add("active");
}

lightboxClose.addEventListener("click", () => lightbox.classList.remove("active"));

lightboxPlace.addEventListener("click", async () => {
  if (!currentLightboxId) return;
  await updateStickerFields(currentLightboxId, { placed: true });
  lightbox.classList.remove("active");
  setGalleryMode("board");
  await renderGallery();
  const surfaceName = SURFACE_LABELS[galleryView.dataset.surface] || "보드";
  toast(surfaceName + "에 붙였어요 🧲");
});

// ================= Board gestures: long-press to pick up, drag to move, corner handle to resize =================
function updateEditToolbar() {
  editToolbar.classList.toggle("active", !!selectedMagnetId);
  // The 🎨 꾸미기 sheet (border/볼록/캡션/말풍선) is for a magnet's fixed
  // decoration — it doesn't fit the gacha board, where a magnet is a loose
  // physics toy you toss around rather than something you park and style.
  // The resize handle's combined resize+rotate (below) covers what people
  // actually want to adjust there.
  editDecorateBtn.classList.toggle("hidden", isGachaSurface());
}

function selectMagnet(id) {
  selectedMagnetId = id;
  fridgeDoor.querySelectorAll(".magnet").forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
  updateEditToolbar();
}

editDeselectBtn.addEventListener("click", () => selectMagnet(null));

// After a drag/resize/long-press gesture ends, the pointer often lands over
// empty fridge-door background (the magnet moved out from under it, or the
// press-and-hold itself just ends there) — the browser then synthesizes a
// native "click" on that background, which would otherwise be mistaken for
// an intentional tap to deselect. Suppress that one follow-up click after
// any gesture.
let suppressDoorClick = false;
function markGestureEnd() {
  suppressDoorClick = true;
  setTimeout(() => { suppressDoorClick = false; }, 0);
}

fridgeDoor.addEventListener("click", (e) => {
  if (suppressDoorClick) return;
  if (e.target === fridgeDoor) selectMagnet(null);
});

const PT_MOVE_THRESHOLD = 6; // px of movement before a press counts as a drag rather than a hold-in-place
const LONG_PRESS_MS = 380; // hold this long without moving to "pick up" a magnet for editing

// A magnet is now moved with a single natural gesture instead of first
// toggling a separate edit mode: press and hold it briefly to pick it up
// (it lifts with a little bounce and the edit toolbar appears), then either
// drag it to a new spot, or just let go to leave it selected and tweak it
// via the toolbar (resize handle / 🎨 꾸미기). Move your finger enough
// *before* the hold threshold fires and it starts dragging immediately,
// same as a real magnet slide. A quick tap that never picks up still opens
// the lightbox, same as before.
function wireMagnetGestures(magnet, item) {
  const handle = magnet.querySelector(".magnet-resize-handle");

  magnet.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    // Instant visual acknowledgment the moment a finger lands — the actual
    // "picked up" lift (.picked) only shows once LONG_PRESS_MS resolves, and
    // relying on CSS :active alone for this gap is unreliable on iOS Safari
    // with pointer-event-driven elements, so drive it explicitly from JS.
    magnet.classList.add("magnet-touch");
    const startX = e.clientX;
    const startY = e.clientY;
    const origLeft = parseFloat(magnet.style.left);
    const origTop = parseFloat(magnet.style.top);
    const dragDoorWidth = fridgeDoor.clientWidth || 340;
    let armed = false; // picked up: either the hold timer fired or movement started early
    let dragged = false;
    // For the gacha board: track recent pointer velocity so releasing mid-
    // swipe hands the magnet back to physics with a little "toss" instead of
    // just stopping dead.
    let lastMoveX = startX, lastMoveY = startY, lastMoveT = performance.now();
    let flingVX = 0, flingVY = 0;

    function pickUp() {
      if (armed) return;
      armed = true;
      selectMagnet(item.id);
      magnet.classList.remove("magnet-touch");
      magnet.classList.add("picked");
      if (isGachaSurface()) magnet.dataset.physicsDragging = "1"; // freeze it in the sim while held
      playPickupSfx();
      vibrateSafe(8);
    }
    const longPressTimer = setTimeout(pickUp, LONG_PRESS_MS);

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!armed && Math.hypot(dx, dy) > PT_MOVE_THRESHOLD) {
        clearTimeout(longPressTimer);
        pickUp();
      }
      if (!armed) return;
      dragged = true;
      const nx = Math.max(0, Math.min(dragDoorWidth, origLeft + dx));
      const ny = Math.max(0, origTop + dy);
      magnet.style.left = nx + "px";
      magnet.style.top = ny + "px";
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveT) / 1000;
      flingVX = (ev.clientX - lastMoveX) / dt;
      flingVY = (ev.clientY - lastMoveY) / dt;
      lastMoveX = ev.clientX; lastMoveY = ev.clientY; lastMoveT = now;
    }

    async function onUp() {
      clearTimeout(longPressTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      magnet.classList.remove("picked");
      magnet.classList.remove("magnet-touch");
      if (!armed) {
        openLightbox(item); // plain quick tap — never picked up, so just view it
        return;
      }
      markGestureEnd();
      if (isGachaSurface()) {
        delete magnet.dataset.physicsDragging; // hand back to the physics loop
        if (dragged) {
          const CLAMP = 1400;
          gachaVel.set(item.id, {
            vx: Math.max(-CLAMP, Math.min(CLAMP, flingVX)),
            vy: Math.max(-CLAMP, Math.min(CLAMP, flingVY)),
          });
          // A flick imparts a little spin too, like tossing a real object.
          gachaSpin.set(item.id, Math.max(-GACHA_SPIN_INITIAL_MAX, Math.min(GACHA_SPIN_INITIAL_MAX, flingVX * 0.4)));
        }
        startGachaPhysics();
        return;
      }
      if (dragged) {
        const doorWidth = fridgeDoor.clientWidth || 340;
        const scale = doorWidth / REFERENCE_WIDTH;
        const x = parseFloat(magnet.style.left) / scale;
        const y = parseFloat(magnet.style.top) / scale;
        const size = magnet.offsetWidth / scale;
        await updateStickerFields(item.id, { x, y, size });
        const bottom = parseFloat(magnet.style.top) + magnet.offsetWidth / 2 + 60;
        if (bottom > fridgeDoor.clientHeight) fridgeDoor.style.height = bottom + "px";
      }
      // Held without moving: stays selected/picked-look so the toolbar's
      // resize handle and 🎨 꾸미기 button are ready to use.
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });

  if (handle) {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectMagnet(item.id);
      // stopPropagation keeps the whole-magnet pointerdown handler above
      // from also firing on the bubbled event, which means it never gets a
      // chance to freeze this magnet out of the physics sim the way a
      // normal drag does. Without doing that ourselves here too, gravity
      // and pile collisions would keep shoving the magnet around under the
      // handle mid-resize, fighting the gesture and making it feel janky.
      if (isGachaSurface()) magnet.dataset.physicsDragging = "1";
      // Measure from the magnet's real on-screen center (getBoundingClientRect
      // is in the same viewport coordinate space as pointer events), not
      // magnet.style.left/top — those are positions *inside* the scrollable
      // fridge-door, offset from the viewport by however far the profile bar
      // and scroll position have pushed it down. Mixing the two made the
      // resize distance (and now, the rotate angle) measured from the wrong
      // origin — mostly unnoticeable for resize since it's just a ratio, but
      // an angle computed from an offset center drifts noticeably as you
      // drag, which would have made rotation feel broken from the start.
      const rect = magnet.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const origSize = magnet.offsetWidth;
      const origRot = parseFloat(magnet.style.getPropertyValue("--magnet-rot")) || 0;
      const gacha = isGachaSurface();
      function onMove(ev) {
        const dist = Math.hypot(ev.clientX - centerX, ev.clientY - centerY);
        const nextSize = Math.min(
          MAGNET_RESIZE_MAX,
          Math.max(MAGNET_RESIZE_MIN, origSize * (dist / startDist))
        );
        magnet.style.width = nextSize.toFixed(0) + "px";
        magnet.style.height = nextSize.toFixed(0) + "px";
        // Rotation is a gacha-only affordance for now — dragging the same
        // handle both resizes (distance from center) and spins (angle
        // around center), the way most sticker/photo editors combine the
        // two into one corner gesture.
        if (gacha) {
          const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
          const deltaDeg = ((angle - startAngle) * 180) / Math.PI;
          magnet.style.setProperty("--magnet-rot", (origRot + deltaDeg).toFixed(1) + "deg");
        }
      }
      async function onUp() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        markGestureEnd();
        const doorWidth = fridgeDoor.clientWidth || 340;
        const scale = doorWidth / REFERENCE_WIDTH;
        const size = magnet.offsetWidth / scale;
        if (gacha) {
          // Gacha's x/y belong to the physics sim, never to the DB (see the
          // whole-magnet drag handler above) — only size and the chosen
          // rotation are real saved properties of the sticker here.
          const rot = parseFloat(magnet.style.getPropertyValue("--magnet-rot")) || 0;
          await updateStickerFields(item.id, { size, rot });
          delete magnet.dataset.physicsDragging; // hand it back to the sim
          startGachaPhysics();
          return;
        }
        const x = parseFloat(magnet.style.left) / scale;
        const y = parseFloat(magnet.style.top) / scale;
        await updateStickerFields(item.id, { x, y, size });
        const bottom = parseFloat(magnet.style.top) + magnet.offsetWidth / 2 + 60;
        if (bottom > fridgeDoor.clientHeight) fridgeDoor.style.height = bottom + "px";
      }
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    });
  }
}

// ================= Decorate sheet (per-magnet design) =================
// Edits preview live on the magnet as you tweak each control (so you can see
// exactly what you're getting), but nothing is final until you tap 확인 —
// closing with ✕ instead reverts the magnet back to how it looked when the
// sheet was opened, the way a proper confirm/cancel pair should behave.
let decorateItemId = null;
let decorateSnapshot = null;

editDecorateBtn.addEventListener("click", async () => {
  if (!selectedMagnetId) return;
  const items = await getAllStickers();
  const item = items.find((it) => it.id === selectedMagnetId);
  if (!item) return;
  decorateItemId = item.id;
  decorateSnapshot = {
    borderColor: item.borderColor || "",
    convex: !!item.convex,
    caption: item.caption || "",
    bubble: item.bubble || "",
  };
  decorateBorderColor.value = item.borderColor || "#ff7ac6";
  decorateConvex.checked = !!item.convex;
  decorateCaption.value = item.caption || "";
  decorateBubble.value = item.bubble || "";
  decorateSheet.classList.add("active");
});

function currentMagnetEl() {
  return decorateItemId
    ? fridgeDoor.querySelector('.magnet[data-id="' + CSS.escape(decorateItemId) + '"]')
    : null;
}

async function applyDecoratePatch(patch) {
  if (!decorateItemId) return;
  await updateStickerFields(decorateItemId, patch);
  const magnet = currentMagnetEl();
  if (magnet) {
    const items = await getAllStickers();
    const item = items.find((it) => it.id === decorateItemId);
    if (item) {
      // Wait for the composite (border/outline recompute) to actually
      // finish before this resolves — otherwise 확인 could close the sheet
      // and show the toast while the old, unbordered image was still
      // sitting on the magnet, and it'd only refresh once something else
      // (like navigating away and back) forced a fresh render from disk.
      await setMagnetDesign(magnet, item);
      renderMagnetExtras(magnet, item);
    }
  }
}

// ✕: discard whatever was tweaked in this session and put the magnet back
// exactly how it was before the sheet opened.
decorateSheetClose.addEventListener("click", async () => {
  // Drop any not-yet-applied debounced color change rather than letting it
  // fire after decorateItemId is cleared (applyDecoratePatch would just
  // no-op on it anyway, but clearing it here is more honest about intent:
  // closing with ✕ means "discard", including whatever's still in flight).
  clearTimeout(borderColorDebounce);
  if (decorateSnapshot) await applyDecoratePatch(decorateSnapshot);
  decorateSheet.classList.remove("active");
  decorateItemId = null;
  decorateSnapshot = null;
});

// 확인: keep whatever is currently previewed as final.
decorateConfirmBtn.addEventListener("click", async () => {
  // Flush a pending debounced color change immediately so the very last
  // color the person dragged to (within the debounce window) actually gets
  // saved instead of silently getting dropped once decorateItemId clears.
  if (borderColorDebounce) {
    clearTimeout(borderColorDebounce);
    borderColorDebounce = null;
    await applyDecoratePatch({ borderColor: decorateBorderColor.value });
  }
  decorateSheet.classList.remove("active");
  decorateItemId = null;
  decorateSnapshot = null;
  toast("꾸미기를 저장했어요 ✨");
});

// Dragging a native color picker can fire a flood of "input" events (many
// per second on some devices). Each one used to trigger a full DB write +
// read + from-scratch outline recomposite (createImageBitmap + 20 canvas
// stamps), so a fast drag piled up dozens of overlapping composites — heavy
// enough that the visible color could lag well behind the finger and look
// like "it's not applying." Debounce to the last value once the drag pauses
// instead of chasing every intermediate tick.
let borderColorDebounce = null;
decorateBorderColor.addEventListener("input", () => {
  clearTimeout(borderColorDebounce);
  const value = decorateBorderColor.value;
  borderColorDebounce = setTimeout(() => {
    applyDecoratePatch({ borderColor: value });
  }, 80);
});
decorateBorderClear.addEventListener("click", () => {
  applyDecoratePatch({ borderColor: "" });
});
decorateConvex.addEventListener("change", () => {
  applyDecoratePatch({ convex: decorateConvex.checked });
});
decorateCaption.addEventListener("input", () => {
  applyDecoratePatch({ caption: decorateCaption.value.trim() });
});
decorateBubble.addEventListener("input", () => {
  applyDecoratePatch({ bubble: decorateBubble.value.trim() });
});

// After a save/delete, refresh whichever view(s) are currently visible so
// counts, grids, and the calendar's sticker indicators all stay in sync.
async function refreshAfterChange() {
  const activeView = document.querySelector(".view.active");
  const activeId = activeView ? activeView.id : null;
  if (activeId === "gallery-view") await renderGallery();
  if (activeId === "calendar-view") await renderCalendar();
  if (daySheet.classList.contains("active") && daySheet.dataset.dateKey) {
    await openDaySheet(daySheet.dataset.dateKey);
  }
}

lightboxDelete.addEventListener("click", async () => {
  if (!currentLightboxId) return;
  await deleteSticker(currentLightboxId);
  lightbox.classList.remove("active");
  toast("삭제했어요");
  refreshAfterChange();
});

lightboxShare.addEventListener("click", async () => {
  const blob = lightbox._blob;
  if (!blob) return;
  const file = new File([blob], "sticker.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "내 스티커" });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.warn("share failed, falling back to download", err);
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sticker-" + Date.now() + ".png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("사진 앱에 저장해주세요 (다운로드됨)");
});

// ================= Memory diary =================
const MOOD_EMOJI = {
  excited: "🤩",
  happy: "🥰",
  calm: "😌",
  tired: "😴",
  sad: "🥺",
};
const DIARY_NAME_KEY = "zzik-diary-name";
const APP_THEME_KEY = "zzik-app-theme";
const TODAY_PROMPTS = [
  "오늘 가장 웃겼던 일은 뭐였나요?",
  "오늘 꼭 기억하고 싶은 순간은?",
  "오늘 나를 기분 좋게 한 한마디는?",
  "지금 제일 고마운 사람은 누구인가요?",
  "오늘의 나에게 작은 칭찬을 해준다면?",
  "오늘 사진으로 남기고 싶은 장면은?",
  "내일의 나에게 한마디를 남겨볼까요?",
];

let currentDiaryDraft = null;
let diaryAutosaveTimer = null;
let diaryPhotoUrl = null;
let selectedDiaryStickerId = null;

function diaryIdForDate(dateKey) {
  return "d_" + dateKey;
}

function localDateFromKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDiaryDate(dateKey, includeYear = false) {
  const date = localDateFromKey(dateKey);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return (includeYear ? date.getFullYear() + "년 " : "") + (date.getMonth() + 1) + "월 " + date.getDate() + "일 " + weekday + "요일";
}

function createDiaryDraft(dateKey) {
  const now = Date.now();
  return {
    id: diaryIdForDate(dateKey),
    dateKey,
    title: "",
    note: "",
    mood: "",
    paperTheme: "lavender",
    photoBlob: null,
    stickers: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function getAllDiaryEntries() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIARY_STORE_NAME, "readonly");
    const req = tx.objectStore(DIARY_STORE_NAME).getAll();
    req.onsuccess = () => {
      const entries = req.result || [];
      entries.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      resolve(entries);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getDiaryByDate(dateKey) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIARY_STORE_NAME, "readonly");
    const req = tx.objectStore(DIARY_STORE_NAME).get(diaryIdForDate(dateKey));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function putDiaryEntry(entry) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIARY_STORE_NAME, "readwrite");
    tx.objectStore(DIARY_STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

function entryHasContent(entry) {
  return !!(entry && (entry.title || entry.note || entry.mood || entry.photoBlob || (entry.stickers && entry.stickers.length)));
}

function makeDiaryPreview(entry) {
  const button = document.createElement("button");
  button.className = "memory-preview";
  button.dataset.theme = entry.paperTheme || "lavender";
  const paper = document.createElement("div");
  paper.className = "preview-paper";
  const mood = document.createElement("span");
  mood.className = "preview-mood";
  mood.textContent = MOOD_EMOJI[entry.mood] || "✨";
  const title = document.createElement("strong");
  title.textContent = entry.title || "나의 하루";
  const note = document.createElement("p");
  note.textContent = entry.note || "사진과 스티커로 남긴 소중한 기억";
  paper.append(mood, title, note);
  const date = document.createElement("small");
  date.textContent = formatDiaryDate(entry.dateKey);
  button.append(paper, date);
  button.addEventListener("click", () => openDiaryEditor(entry.dateKey));
  return button;
}

async function renderToday() {
  const now = new Date();
  const todayKey = toDateKey(now);
  todayDateLabel.textContent = formatDiaryDate(todayKey, true);
  $("today-prompt").textContent = TODAY_PROMPTS[now.getDay() % TODAY_PROMPTS.length];
  const entries = (await getAllDiaryEntries()).filter(entryHasContent);
  recentDiaryList.innerHTML = "";
  entries.slice(0, 4).forEach((entry) => recentDiaryList.appendChild(makeDiaryPreview(entry)));
  recentDiaryEmpty.classList.toggle("hidden", entries.length > 0);
  recentDiaryList.classList.toggle("hidden", entries.length === 0);
  const todayEntry = entries.find((entry) => entry.dateKey === todayKey);
  todayMoodPicker.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", !!todayEntry && button.dataset.mood === todayEntry.mood);
  });
}

async function renderMyPage() {
  const [entries, stickers] = await Promise.all([getAllDiaryEntries(), getAllStickers()]);
  myDiaryName.textContent = localStorage.getItem(DIARY_NAME_KEY) || "나의 반짝 다이어리";
  myEntryCount.textContent = entries.filter(entryHasContent).length;
  myStickerCount.textContent = stickers.length;
}

function applyAppTheme(theme) {
  const valid = ["pastel", "highteen", "y2k", "vintage"];
  const selected = valid.includes(theme) ? theme : "pastel";
  document.body.dataset.appTheme = selected;
  localStorage.setItem(APP_THEME_KEY, selected);
  appThemeGrid.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.appTheme === selected));
}

function openCreateSheet() {
  createSheet.classList.add("active");
  createSheet.setAttribute("aria-hidden", "false");
}

function closeCreateSheet() {
  createSheet.classList.remove("active");
  createSheet.setAttribute("aria-hidden", "true");
}

navCreateBtn.addEventListener("click", openCreateSheet);
createSheetBackdrop.addEventListener("click", closeCreateSheet);
createDiaryBtn.addEventListener("click", () => {
  closeCreateSheet();
  openDiaryEditor(toDateKey(new Date()));
});
createStickerBtn.addEventListener("click", () => {
  closeCreateSheet();
  showView("camera-view");
});
quickPhotoBtn.addEventListener("click", () => {
  closeCreateSheet();
  diaryPhotoInput.click();
});
todayWriteBtn.addEventListener("click", () => openDiaryEditor(toDateKey(new Date())));
emptyWriteBtn.addEventListener("click", () => openDiaryEditor(toDateKey(new Date())));
todaySeeAll.addEventListener("click", () => showView("calendar-view"));
todaySettingsBtn.addEventListener("click", () => showView("my-view"));

todayMoodPicker.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", async () => {
    await openDiaryEditor(toDateKey(new Date()));
    setDiaryMood(button.dataset.mood);
  });
});

myNameEdit.addEventListener("click", () => {
  const current = localStorage.getItem(DIARY_NAME_KEY) || "나의 반짝 다이어리";
  const next = window.prompt("다이어리 이름을 입력해주세요", current);
  if (next === null) return;
  const name = next.trim().slice(0, 30) || "나의 반짝 다이어리";
  localStorage.setItem(DIARY_NAME_KEY, name);
  myDiaryName.textContent = name;
});

appThemeGrid.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => applyAppTheme(button.dataset.appTheme));
});
applyAppTheme(localStorage.getItem(APP_THEME_KEY) || "pastel");

function setDiaryMood(mood) {
  if (!currentDiaryDraft) return;
  currentDiaryDraft.mood = mood;
  editorMoodRow.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.mood === mood));
  scheduleDiaryAutosave();
}

function setDiaryPaperTheme(theme) {
  if (!currentDiaryDraft) return;
  currentDiaryDraft.paperTheme = theme;
  diaryPaper.dataset.paperTheme = theme;
  diaryThemePanel.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.paperTheme === theme));
  scheduleDiaryAutosave();
}

function renderDiaryPhoto() {
  if (diaryPhotoUrl) {
    URL.revokeObjectURL(diaryPhotoUrl);
    diaryPhotoUrl = null;
  }
  const blob = currentDiaryDraft && currentDiaryDraft.photoBlob;
  diaryPhotoFrame.classList.toggle("hidden", !blob);
  if (blob) diaryPhotoUrl = setImgFromBlob(diaryPhotoPreview, blob);
}

async function renderDiaryStickerPicker() {
  const stickers = await getAllStickers();
  diaryStickerPicker.innerHTML = "";
  if (!stickers.length) {
    const empty = document.createElement("p");
    empty.textContent = "스티커북이 비어 있어요. 먼저 사진 스티커를 만들어보세요!";
    diaryStickerPicker.appendChild(empty);
    return;
  }
  stickers.forEach((sticker) => {
    const button = document.createElement("button");
    button.className = "diary-picker-sticker";
    const img = document.createElement("img");
    setImgFromBlob(img, sticker.blob);
    img.alt = "다이어리에 붙일 스티커";
    button.appendChild(img);
    button.addEventListener("click", () => addStickerToDiary(sticker.id));
    diaryStickerPicker.appendChild(button);
  });
}

function addStickerToDiary(stickerId) {
  if (!currentDiaryDraft) return;
  const index = currentDiaryDraft.stickers.length;
  currentDiaryDraft.stickers.push({
    placementId: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    stickerId,
    x: 68 - (index % 3) * 14,
    y: 28 + (index % 4) * 13,
    size: 76,
    rot: -8 + (index % 3) * 8,
  });
  renderDiaryStickerLayer();
  scheduleDiaryAutosave();
  toast("페이지에 스티커를 붙였어요 ♡");
}

async function renderDiaryStickerLayer() {
  if (!currentDiaryDraft) return;
  const stickers = await getAllStickers();
  const stickerMap = new Map(stickers.map((item) => [item.id, item]));
  diaryStickerLayer.innerHTML = "";
  currentDiaryDraft.stickers = (currentDiaryDraft.stickers || []).filter((placement) => stickerMap.has(placement.stickerId));
  currentDiaryDraft.stickers.forEach((placement) => {
    const item = stickerMap.get(placement.stickerId);
    const element = document.createElement("button");
    element.className = "diary-sticker";
    element.dataset.placementId = placement.placementId;
    element.style.left = placement.x + "%";
    element.style.top = placement.y + "%";
    element.style.setProperty("--diary-sticker-size", (placement.size || 76) + "px");
    element.style.setProperty("--diary-sticker-rot", (placement.rot || 0) + "deg");
    element.setAttribute("aria-label", "다이어리 스티커. 드래그해서 이동");
    const img = document.createElement("img");
    setImgFromBlob(img, item.blob);
    img.alt = "";
    const remove = document.createElement("span");
    remove.className = "diary-sticker-remove";
    remove.textContent = "×";
    remove.addEventListener("pointerdown", (event) => event.stopPropagation());
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      currentDiaryDraft.stickers = currentDiaryDraft.stickers.filter((value) => value.placementId !== placement.placementId);
      renderDiaryStickerLayer();
      scheduleDiaryAutosave();
    });
    const transformHandle = document.createElement("span");
    transformHandle.className = "diary-sticker-transform";
    transformHandle.textContent = "↗";
    transformHandle.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      beginDiaryStickerTransform(event, element, placement, transformHandle);
    });
    element.append(img, remove, transformHandle);
    element.addEventListener("pointerdown", (event) => beginDiaryStickerDrag(event, element, placement));
    diaryStickerLayer.appendChild(element);
  });
}

function beginDiaryStickerTransform(event, element, placement, handle) {
  event.preventDefault();
  selectDiarySticker(placement.placementId);
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const startDistance = Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY));
  const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
  const startSize = placement.size || 76;
  const startRotation = placement.rot || 0;
  const pointerId = event.pointerId;
  handle.setPointerCapture(pointerId);
  const onMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    const distance = Math.max(1, Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY));
    const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180 / Math.PI;
    placement.size = Math.max(44, Math.min(150, startSize * (distance / startDistance)));
    placement.rot = startRotation + angle - startAngle;
    element.style.setProperty("--diary-sticker-size", placement.size + "px");
    element.style.setProperty("--diary-sticker-rot", placement.rot + "deg");
  };
  const onEnd = (endEvent) => {
    if (endEvent.pointerId !== pointerId) return;
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onEnd);
    handle.removeEventListener("pointercancel", onEnd);
    scheduleDiaryAutosave();
  };
  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onEnd);
  handle.addEventListener("pointercancel", onEnd);
}

function selectDiarySticker(placementId) {
  selectedDiaryStickerId = placementId;
  diaryStickerLayer.querySelectorAll(".diary-sticker").forEach((element) => element.classList.toggle("selected", element.dataset.placementId === placementId));
}

function beginDiaryStickerDrag(event, element, placement) {
  if (event.button != null && event.button !== 0) return;
  event.preventDefault();
  selectDiarySticker(placement.placementId);
  const rect = diaryPaper.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originalX = placement.x;
  const originalY = placement.y;
  const pointerId = event.pointerId;
  element.setPointerCapture(pointerId);
  const onMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    placement.x = Math.max(5, Math.min(95, originalX + ((moveEvent.clientX - startX) / rect.width) * 100));
    placement.y = Math.max(5, Math.min(95, originalY + ((moveEvent.clientY - startY) / rect.height) * 100));
    element.style.left = placement.x + "%";
    element.style.top = placement.y + "%";
  };
  const onEnd = (endEvent) => {
    if (endEvent.pointerId !== pointerId) return;
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerup", onEnd);
    element.removeEventListener("pointercancel", onEnd);
    scheduleDiaryAutosave();
  };
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerup", onEnd);
  element.addEventListener("pointercancel", onEnd);
}

function scheduleDiaryAutosave() {
  if (!currentDiaryDraft) return;
  diarySaveState.textContent = "저장 중…";
  clearTimeout(diaryAutosaveTimer);
  diaryAutosaveTimer = setTimeout(() => persistDiaryDraft(), 650);
}

async function persistDiaryDraft() {
  if (!currentDiaryDraft) return;
  clearTimeout(diaryAutosaveTimer);
  currentDiaryDraft.updatedAt = Date.now();
  try {
    await putDiaryEntry(currentDiaryDraft);
    diarySaveState.textContent = "기기에 저장됨";
  } catch (err) {
    console.error("diary save failed", err);
    diarySaveState.textContent = "저장 실패";
    toast("다이어리 저장에 실패했어요", 4000);
  }
}

async function openDiaryEditor(dateKey, stickerId) {
  stopCamera();
  const saved = await getDiaryByDate(dateKey);
  const base = saved || createDiaryDraft(dateKey);
  currentDiaryDraft = {
    ...base,
    stickers: (base.stickers || []).map((item) => ({ ...item })),
  };
  if (stickerId) addStickerToDiary(stickerId);
  diaryEditorDate.textContent = formatDiaryDate(dateKey);
  diaryTitleInput.value = currentDiaryDraft.title || "";
  diaryNoteInput.value = currentDiaryDraft.note || "";
  diaryPaper.dataset.paperTheme = currentDiaryDraft.paperTheme || "lavender";
  editorMoodRow.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.mood === currentDiaryDraft.mood));
  diaryThemePanel.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.paperTheme === currentDiaryDraft.paperTheme));
  selectedDiaryStickerId = null;
  renderDiaryPhoto();
  await Promise.all([renderDiaryStickerPicker(), renderDiaryStickerLayer()]);
  diarySaveState.textContent = saved ? "기기에 저장됨" : "새 페이지";
  diaryEditor.classList.add("active");
  diaryEditor.setAttribute("aria-hidden", "false");
  if (stickerId) scheduleDiaryAutosave();
}

async function closeDiaryEditor(destination) {
  await persistDiaryDraft();
  diaryEditor.classList.remove("active");
  diaryEditor.setAttribute("aria-hidden", "true");
  currentDiaryDraft = null;
  showView(destination || "today-view");
}

editorMoodRow.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => setDiaryMood(button.dataset.mood)));
diaryThemePanel.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => setDiaryPaperTheme(button.dataset.paperTheme)));
diaryTitleInput.addEventListener("input", () => { if (currentDiaryDraft) { currentDiaryDraft.title = diaryTitleInput.value; scheduleDiaryAutosave(); } });
diaryNoteInput.addEventListener("input", () => { if (currentDiaryDraft) { currentDiaryDraft.note = diaryNoteInput.value; scheduleDiaryAutosave(); } });
diaryPhotoInput.addEventListener("change", async () => {
  const file = diaryPhotoInput.files && diaryPhotoInput.files[0];
  diaryPhotoInput.value = "";
  if (!file) return;
  if (!diaryEditor.classList.contains("active")) await openDiaryEditor(toDateKey(new Date()));
  currentDiaryDraft.photoBlob = file;
  renderDiaryPhoto();
  scheduleDiaryAutosave();
});
diaryPhotoRemove.addEventListener("click", () => {
  if (!currentDiaryDraft) return;
  currentDiaryDraft.photoBlob = null;
  renderDiaryPhoto();
  scheduleDiaryAutosave();
});
diaryEditorClose.addEventListener("click", () => closeDiaryEditor("today-view"));
diarySaveBtn.addEventListener("click", async () => {
  await closeDiaryEditor("calendar-view");
  toast("오늘의 추억을 저장했어요 ✨");
});
diaryToolBtns.forEach((button) => {
  button.addEventListener("click", () => {
    const tool = button.dataset.diaryTool;
    diaryToolBtns.forEach((item) => item.classList.toggle("active", item === button));
    diaryThemePanel.classList.toggle("active", tool === "theme");
    diaryStickerPicker.classList.toggle("active", tool === "sticker");
    if (tool === "photo") diaryPhotoInput.click();
    if (tool === "text") diaryNoteInput.focus();
  });
});

// ================= Calendar =================
let calendarViewDate = new Date();
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

async function renderCalendar() {
  const [grouped, diaryEntries] = await Promise.all([getStickersGroupedByDate(), getAllDiaryEntries()]);
  const diaryByDate = new Map(diaryEntries.filter(entryHasContent).map((entry) => [entry.dateKey, entry]));
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth(); // 0-based
  calendarTitle.textContent = `${year}년 ${month + 1}월`;

  const monthEntries = diaryEntries.filter((entry) => {
    const date = localDateFromKey(entry.dateKey);
    return entryHasContent(entry) && date.getFullYear() === year && date.getMonth() === month;
  });
  monthEntryCount.textContent = monthEntries.length + "일";
  const moodCounts = monthEntries.reduce((counts, entry) => {
    if (entry.mood) counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    return counts;
  }, {});
  const favoriteMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  monthMoodSummary.textContent = favoriteMood
    ? `이번 달에는 ${MOOD_EMOJI[favoriteMood[0]]} 기분인 날이 가장 많았어요`
    : "첫 기록을 기다리고 있어요 ✨";

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const todayKey = toDateKey(new Date());

  calendarGrid.innerHTML = "";
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const key = toDateKey(cellDate);
    const inMonth = cellDate.getMonth() === month;
    const items = grouped[key] || [];
    const entry = diaryByDate.get(key);

    const cell = document.createElement("div");
    cell.className =
      "cal-cell" +
      (inMonth ? "" : " other-month") +
      (items.length ? " has-sticker" : "") +
      (entry ? " has-entry" : "") +
      (key === todayKey ? " today" : "");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", key);
    btn.addEventListener("click", () => openDiaryEditor(key));
    cell.appendChild(btn);

    const num = document.createElement("span");
    num.className = "cal-daynum";
    num.textContent = cellDate.getDate();
    cell.appendChild(num);

    if (entry) {
      const mood = document.createElement("span");
      mood.className = "cal-entry-mood";
      mood.textContent = MOOD_EMOJI[entry.mood] || "✦";
      cell.appendChild(mood);
      const dot = document.createElement("span");
      dot.className = "cal-entry-dot";
      cell.appendChild(dot);
    } else if (items.length) {
      const stack = document.createElement("div");
      stack.className = "cal-stack";
      // Show up to 3 stickers fanned out; oldest of the visible ones goes in
      // first (bottom of the stack) so the most recent sticker sits on top.
      const shown = items.slice(0, 3).reverse();
      shown.forEach((item) => {
        const img = document.createElement("img");
        img.className = "cal-thumb";
        setImgFromBlob(img, item.blob);
        img.alt = "";
        stack.appendChild(img);
      });
      cell.appendChild(stack);
      if (items.length > 3) {
        const badge = document.createElement("span");
        badge.className = "cal-badge";
        badge.textContent = "+" + (items.length - 3);
        cell.appendChild(badge);
      }
    }

    calendarGrid.appendChild(cell);
  }
}

calPrevBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
  renderCalendar();
});
calNextBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
  renderCalendar();
});
calTodayBtn.addEventListener("click", () => {
  calendarViewDate = new Date();
  renderCalendar();
});

// ================= Day sheet (stickers saved on one date) =================
async function openDaySheet(dateKey) {
  const grouped = await getStickersGroupedByDate();
  const items = grouped[dateKey] || [];
  if (!items.length) {
    daySheet.classList.remove("active");
    delete daySheet.dataset.dateKey;
    return;
  }
  daySheet.dataset.dateKey = dateKey;
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  daySheetTitle.textContent = `${m}월 ${d}일 (${WEEKDAY_LABELS[dateObj.getDay()]}) · 스티커 ${items.length}개`;
  daySheetGrid.innerHTML = "";
  for (const item of items) {
    daySheetGrid.appendChild(createStickerTile(item));
  }
  daySheet.classList.add("active");
}

daySheetClose.addEventListener("click", () => {
  daySheet.classList.remove("active");
  delete daySheet.dataset.dateKey;
});

// ================= Service worker =================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}

// ================= Init =================
showView("today-view");
