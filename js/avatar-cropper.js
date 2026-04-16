/**
 * Avatar cropper — opens a 1:1 Cropper.js modal when the file input receives
 * a file, uploads the cropped result as a JPEG blob via fetch, reloads on
 * success.
 *
 * Depends on Cropper.js (vendored at ./vendor/cropperjs/). Call once per
 * preferences page:
 *
 *   initAvatarCropper({
 *     fileInputId: 'avatarFile',
 *     modalId:     'avatarCropModal',
 *     imageId:     'avatarCropImage',
 *     confirmId:   'avatarCropConfirm',
 *     cancelId:    'avatarCropCancel',
 *     formAction:  'preferences.php',
 *     csrfToken:   'xyz',
 *   });
 */
(function () {
  'use strict';

  window.initAvatarCropper = function (cfg) {
    const fileInput = document.getElementById(cfg.fileInputId);
    const modal     = document.getElementById(cfg.modalId);
    const image     = document.getElementById(cfg.imageId);
    const confirm   = document.getElementById(cfg.confirmId);
    const cancel    = document.getElementById(cfg.cancelId);
    if (!fileInput || !modal || !image || !confirm || !cancel) return;

    let cropper   = null;
    let objectUrl = null;

    function openModal() {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (cropper) { cropper.destroy(); cropper = null; }
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      fileInput.value = '';
    }

    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
        alert('Ungültiger Dateityp.');
        fileInput.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Datei ist zu groß (max. 5 MB).');
        fileInput.value = '';
        return;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      image.src = objectUrl;
      openModal();
      if (cropper) cropper.destroy();
      cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode:    1,
        autoCropArea: 1,
        background:  false,
        movable:     true,
        zoomable:    true,
        rotatable:   false,
        scalable:    false,
      });
    });

    cancel.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    confirm.addEventListener('click', function () {
      if (!cropper) return;
      const canvas = cropper.getCroppedCanvas({
        width:  205,
        height: 205,
        imageSmoothingQuality: 'high',
      });
      if (!canvas) return;
      confirm.disabled = true;
      confirm.textContent = 'Lade hoch \u2026';
      canvas.toBlob(function (blob) {
        if (!blob) {
          alert('Fehler beim Erstellen des Bildes.');
          confirm.disabled = false;
          confirm.textContent = 'Speichern';
          return;
        }
        const fd = new FormData();
        fd.append('csrf_token', cfg.csrfToken);
        fd.append('action', 'upload_avatar');
        fd.append('avatar', blob, 'avatar.jpg');
        fetch(cfg.formAction, {
          method:      'POST',
          body:        fd,
          credentials: 'same-origin',
          headers:     { 'X-Requested-With': 'XMLHttpRequest' },
        })
          .then(function (res) {
            return res.json().catch(function () {
              throw new Error('HTTP ' + res.status);
            }).then(function (data) {
              if (!res.ok || !data.ok) {
                throw new Error(data.error || ('HTTP ' + res.status));
              }
              return data;
            });
          })
          .then(function () { window.location.reload(); })
          .catch(function (err) {
            alert('Upload fehlgeschlagen: ' + err.message);
            confirm.disabled = false;
            confirm.textContent = 'Speichern';
          });
      }, 'image/jpeg', 0.9);
    });
  };
})();
