const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileElem");
const previewContainer = document.getElementById("preview");
const formatSelect = document.getElementById("formatSelect");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const toast = document.getElementById("toast");
const langSelect = document.getElementById("langSelect");

let imageBlobs = [];

dropArea.addEventListener("click", () => fileInput.click());
dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("active");
});
dropArea.addEventListener("dragleave", () => dropArea.classList.remove("active"));
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("active");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", () => handleFiles(fileInput.files));

downloadAllBtn.addEventListener("click", () => {
  const zip = new JSZip();
  imageBlobs.forEach((item, index) => {
    zip.file(item.filename, item.blob);
  });
  zip.generateAsync({ type: "blob" }).then(content => {
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_images.zip";
    a.click();
  });
});

// HEIC, AVIF, WEBP qo'llab-quvvatlash
function handleFiles(files) {
  showLoading();
  let pending = files.length;

  [...files].forEach(file => {
    const fileType = file.type;
    const isHeic = file.name.match(/\.heic$/i);
    const finishOne = () => {
      pending--;
      if (pending === 0) hideLoading();
    };

    if (!fileType.startsWith("image/") && !isHeic && !file.name.match(/\.(avif|webp)$/i)) {
      alert("Unsupported file: " + file.name);
      finishOne();
      return;
    }

    if (isHeic) {
      heic2any({ blob: file, toType: "image/jpeg" })
        .then(convertedBlob => {
          processConvertedBlob(convertedBlob, file, "jpeg");
          finishOne();
        })
        .catch(() => {
          alert("❌ Cannot convert HEIC file: " + file.name);
          finishOne();
        });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const selectedFormat = formatSelect.value;
          canvas.toBlob(blob => {
            processConvertedBlob(blob, file, selectedFormat);
            finishOne();
          }, "image/" + selectedFormat);
        };

        img.onerror = () => {
          alert("❌ Unsupported image format: " + file.name);
          finishOne();
        };
      };
      reader.readAsDataURL(file);
    }
  });
}

function processConvertedBlob(blob, originalFile, selectedFormat) {
  const filename = originalFile.name.replace(/\.[^/.]+$/, "") + "." + (selectedFormat === "jpeg" ? "jpg" : selectedFormat);
  imageBlobs.push({ blob, filename });

  const previewItem = document.createElement("div");
  previewItem.className = "preview-item";

  const imgPreview = document.createElement("img");
  imgPreview.src = URL.createObjectURL(blob);

  const downloadBtn = document.createElement("a");
  downloadBtn.href = URL.createObjectURL(blob);
  downloadBtn.download = filename;
  downloadBtn.textContent = "⬇️ Download";
  downloadBtn.className = "download-btn";

  previewItem.appendChild(imgPreview);
  previewItem.appendChild(downloadBtn);
  previewContainer.appendChild(previewItem);

  if (imageBlobs.length > 1) {
    downloadAllBtn.style.display = "inline-block";
  }

  showToast(`✅ ${originalFile.name} converted`);
}

function showLoading() {
  document.getElementById("loading-spinner").classList.add("show");
}
function hideLoading() {
  document.getElementById("loading-spinner").classList.remove("show");
}
function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Tilni aniqlash yoki qo‘lda tanlash
const translations = {
  en: {
    title: "Photo Converter Online",
    dropText: "Drag & drop images here or click to select",
    chooseFormat: "Choose format:"
  },
  uz: {
    title: "Rasm Konvertori Onlayn",
    dropText: "Rasmlarni shu yerga torting yoki tanlang",
    chooseFormat: "Formatni tanlang:"
  }
};

function updateLanguage(lang) {
  const t = translations[lang] || translations.en;
  document.getElementById("title").textContent = t.title;
  document.getElementById("dropText").textContent = t.dropText;
}
langSelect.addEventListener("change", () => {
  updateLanguage(langSelect.value);
});
window.addEventListener("DOMContentLoaded", () => {
  const userLang = navigator.language.startsWith("uz") ? "uz" : "en";
  langSelect.value = userLang;
  updateLanguage(userLang);
});
