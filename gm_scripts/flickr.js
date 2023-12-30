// ==UserScript==
// @name     [VSSS] flickr
// @namespace https://rna.hatenablog.com/
// @version  1.2
// @include  https://www.flickr.com/photos/*
// @grant    none
// ==/UserScript==

window.vsssData = {
  astrometryProgress: null,
  wikipediaProgress: null,
  photos: {}
};

addEventListener("DOMContentLoaded", function(){
  
  const TARGET_SIZE = 2048;
  const DEFAULT_TZ = "+09:00";

  const getPhotoId = function () {
    return /^https?:\/\/www\.flickr\.com\/photos\/[^\/]+\/(\d+)\//.exec(window.location.href)[1];
  };
  const getImageAndLabel = function (context, photoId, obj) {
    let model = null;
    try {
      model = context.modelRegistries["photo-models"]._data[photoId];
    } catch (e) {
      return null;
    }
    console.log("photo:model = " + model);
    if (!model) {
      return null;
    }
    const sizes = model.sizes;
    let dMin = TARGET_SIZE;
    let url;
    let sizeMax;
    for (const name in sizes) {
      // console.log("photo:size: " + name);
      const sz = sizes[name];
      let size = Math.max(sz.width, sz.height);
      let d = TARGET_SIZE - size;
      if (d >= 0 && d < dMin) {
        dMin = d;
        url = sz.displayUrl;
        sizeMax = size;
      }
    }
    if (model.mediaType === 'video') {
      const owner = context.modelRegistries['person-models']._data[model.owner.id].pathAlias;
      getVideo(owner, photoId, model.secret, obj);
      obj.poster = 'https:' + url;
    } else {
      obj.image = 'https:' + url;
    }
    obj.label = model.title;
    return obj;
  };
  const getDate = function (context, photoId, obj) {
    let model = null;
    try {
      model = context.modelRegistries["photo-exif-models"]._data[photoId];
    } catch (e) {
      return null;
    }
    console.log("exif:model = " + model);
    if (!model) {
      return null;
    }
    let date = null;
    let tz = DEFAULT_TZ;
    for (let tag of model.data) {
      // console.log("exif:tag: " + tag.label);
      switch (tag.label) {
        case "Date and Time (Original)":
          let m = /^(\d+):(\d+):(\d+)\s+(\d+:\d+:\d+)$/.exec(tag.value);
          date = m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4];
          break;
        case "Offset Time":
          tz = tag.value;
          break;
      }
      if (date && tz) {
        break;
      }
    }
    if (date) {
      obj.date = date + tz;
    } else {
      obj.date = null;
    }
    return obj;
  };
  const getPhotoModel = function (photoId) {
    const context = window.wrappedJSObject.appContext;
    try {
      return context.modelRegistries["photo-models"]._data[photoId];
    } catch (e) {
      return null;
    }
  };
  const getMImageUrl = function (photoId) {
    const model = getPhotoModel(photoId);
    return model ? "https:" + model.sizes['m'].displayUrl : null;
  };
  const getTitle = function (photoId) {
    const model = getPhotoModel(photoId);
    return model ? model.title : null;
  };
  const getVideo = function (owner, photoId, secret, obj) {
    const src = document.querySelector('video').src;
    const re = /\/([^./?]+)\.[^.]+(\?.*)$/
    const size = re.exec(src)[1]
    obj.video = 'https://www.flickr.com/photos/' + owner + '/' + photoId +
      '/play/' + size + '/' + secret;
    return obj;
  };
  const button = document.createElement('div');
  button.innerText = '[VSSS]';
  button.style.position = 'absolute';
  button.style.padding = '0.2rem';
  button.style.right = '0';
  button.style.top = '0';
  button.style.color = '#77e';
  button.style.zIndex = '3000';
  button.style.cursor = 'copy';
  button.style.fontWeight = 'bold';
  const onClick = function () {
    const wait = function () {
      button.innerText = '[wait...]';
      console.log("wait...");
      setTimeout(onClick, 100);
    };
    const photoId = getPhotoId();
    console.log("photo_id = " + photoId);
    const context = window.wrappedJSObject.appContext;
    console.log("context:" + context);
    if (!context) {
      wait();
      return;
    }
    let obj = getDate(context, photoId, {});
    if (!obj) {
      wait();
      return;
    }
    console.log(obj.date);
    obj = getImageAndLabel(context, photoId, obj);
    if (!obj) {
      wait();
      return;
    }
    const data = window.vsssData.photos[photoId];
    if (data && data.ra && data.dec) {
      obj.ra = data.ra;
      obj.dec = data.dec;
    }
    console.log(obj.image);
    const json = JSON.stringify(obj, null, "  ");
    console.log(json);
    navigator.clipboard.writeText(json);
    button.innerText = '[VSSS]';
  };
  button.addEventListener('click', onClick);
  document.body.insertBefore(button, document.body.firstChild);

  const abutton = document.createElement('div');
  abutton.innerText = '[astrometry]';
  abutton.style.position = 'absolute';
  abutton.style.right = '0';
  abutton.style.top = '1.2rem';
  abutton.style.color = '#77e';
  abutton.style.zIndex = '3000';
  abutton.style.cursor = 'pointer';
  abutton.addEventListener('click', function () {
    if (!window.vsssData.astrometryProgress) {
      window.vsssData.astrometryProgress = true;
      window.open('http://nova.astrometry.net/upload', 'gs_vsss_astrometry');
      abutton.innerText = '[astrometry: wait...]';
      abutton.style.cursor = 'wait';
    }
  });
  document.body.insertBefore(abutton, document.body.firstChild);

  const wbutton = document.createElement('div');
  wbutton.innerText = '[wikipadia]';
  wbutton.style.position = 'absolute';
  wbutton.style.right = '0';
  wbutton.style.top = '2.4rem';
  wbutton.style.color = '#77e';
  wbutton.style.zIndex = '3000';
  wbutton.style.cursor = 'pointer';
  wbutton.addEventListener('click', function () {
    window.open('https://ja.wikipedia.org/w/index.php?search', 'gs_vsss_ja_wikipedia');
    wbutton.innerText = '[wikipedia: wait...]';
    wbutton.style.cursor = 'wait';
  });
  document.body.insertBefore(wbutton, document.body.firstChild);

  const urlCheck = function () {
    if (/\/lightbox\/?$/.test(window.location.href)) {
      button.style.display = 'none';
      abutton.style.display = 'none';
      wbutton.style.display = 'none';
    } else {
      button.style.display = 'block';
      abutton.style.display = 'block';
      wbutton.style.display = 'block';
    }
  }
  setInterval(urlCheck, 200);
  
  window.addEventListener("message", function(ev){
    const photoId = getPhotoId();
    console.log(ev.data.cmd);
    switch (ev.data.cmd) {
    case 'getUrl':
      window.vsssData.astrometryProgress = photoId;
      window.vsssData.photos[photoId] = {};
      const url = getMImageUrl(photoId);
      console.log(url);
      ev.source.postMessage(url, "http://nova.astrometry.net");
      break;
    case 'getSearch':
      window.vsssData.wikipediaProgress = photoId;
      window.vsssData.photos[photoId] = {};
      const title = getTitle(photoId);
      console.log(title);
      ev.source.postMessage(title, "https://ja.wikipedia.org");
      break;
    case 'setRADec':
      console.log(ev.data.ra + " / " + ev.data.dec);
      let id = null;
      if (ev.data.src.startsWith("http://nova.astrometry.net/")) {
        id = window.vsssData.astrometryProgress;
        window.vsssData.astrometryProgress = null;
        abutton.innerText = '[astrometry]';
        abutton.style.cursor = 'pointer';
      } else if (ev.data.src.startsWith("https://ja.wikipedia.org/") ||
                 ev.data.src.startsWith("https://en.wikipedia.org/")) {
        id = window.vsssData.wikipediaProgress;
        window.vsssData.wikipediaProgress = null;
        wbutton.innerText = '[wikipedia]';
        wbutton.style.cursor = 'pointer';
      }
      if (id) {
        window.vsssData.photos[id] = {
          ra: ev.data.ra,
          dec: ev.data.dec
        };
      }
      break;
    case 'astrometryFailed':
      window.vsssData.astrometryProgress = false;
      if (ev.data.src.startsWith("http://nova.astrometry.net/")) {
        abutton.innerText = '[astrometry: failed]';
        abutton.style.cursor = 'pointer';
      }
      break;
    }
  });
})
