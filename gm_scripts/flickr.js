// ==UserScript==
// @name     [VSSS] flickr
// @namespace https://rna.hatenablog.com/
// @version  1.2
// @include  https://www.flickr.com/photos/*
// @include  https://nova.astrometry.net/*
// @include   https://ja.wikipedia.org/*
// @include   https://en.wikipedia.org/*
// @grant    GM.setValue
// @grant    GM.getValue
// ==/UserScript==

window.vsssData = {
  astrometryProgress: null,
  wikipediaProgress: null,
  photos: {}
};

function flickerScript() {
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
      const photoId = getPhotoId();      
      window.vsssData.astrometryProgress = photoId;
      window.vsssData.photos[photoId] = {};
      const url = getMImageUrl(photoId);
      (async () => {
        await GM.setValue('astrometry_result', null);
        await GM.setValue('upload_image_url', url);
      })();
      window.open('https://nova.astrometry.net/upload', 'gs_vsss_astrometry');
      abutton.innerText = '[astrometry: wait...]';
      abutton.style.cursor = 'wait';
      const getter = async () => {
        let result = await GM.getValue('astrometry_result');
        console.log(result);
        if (result) {
          if (result == "fail") {
            abutton.innerText = '[astrometry: failed]';
            abutton.style.cursor = 'pointer';
          } else if (result == "cancel") {
            abutton.innerText = '[astrometry]';
            abutton.style.cursor = 'pointer';
          } else {
            id = window.vsssData.astrometryProgress;
            abutton.innerText = '[astrometry]';
            abutton.style.cursor = 'pointer';
            window.vsssData.photos[id] = result;
          }
          window.vsssData.astrometryProgress = null;
        } else {
          setTimeout(getter, 1000);
        } 
      };
      setTimeout(getter, 5000);
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
    const photoId = getPhotoId();      
    window.vsssData.wikipediaProgress = photoId;
    window.vsssData.photos[photoId] = {};
    const title = getTitle(photoId);
    console.log(title);
    (async () => {
      await GM.setValue('wikipedia_result', null);
      await GM.setValue('wikipedia_search', title);
    })();
    window.open('https://ja.wikipedia.org/w/index.php?search',
                'gs_vsss_ja_wikipedia');
    wbutton.innerText = '[wikipedia: wait...]';
    wbutton.style.cursor = 'wait';
    const getter = async () => {
      let id = null;
      let result = await GM.getValue('wikipedia_result');
      console.log(result);
      if (result) {
        id = window.vsssData.wikipediaProgress;
        window.vsssData.wikipediaProgress = null;
        wbutton.innerText = '[wikipedia]';
        wbutton.style.cursor = 'pointer';
        window.vsssData.photos[id] = result;
      } else {
        setTimeout(getter, 1000);
      } 
    };
    setTimeout(getter, 5000);
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
}

function astrometryScript() {
  console.log("page = " + location.href);
  if (location.href.startsWith('https://nova.astrometry.net/upload')) {
    (async () => {
      const url = await GM.getValue('upload_image_url');
      await GM.setValue('upload_image_url', null);
      console.log("url = " + url);
      if (url != null) {
        if (window.confirm("[VSSS] Upload image?")) {
          document.forms.upload_form.upload_type.value = 'url';
          document.forms.upload_form.url.value = url;
          document.forms.upload_form.submit();
        } else {
          GM.setValue('astrometry_result', "cancel");
        }
      }
    })();
  } else if (location.href.startsWith('https://nova.astrometry.net/status/')) {
    if (document.querySelector("#submission_images div.good")) {
      console.log("astrometry: ok");
      location.href =
        document.querySelector("#submission_images td a[href]").href;
    } else if (document.querySelector("#submission_images div.bad")) {
      console.log("astrometry: fail");
      GM.setValue('astrometry_result', "fail");
    }
  } else if (location.href.startsWith('https://nova.astrometry.net/user_images/')) {
    const ra = document.querySelector("#calibration_table tr + tr td + td").innerText
    const dec = document.querySelector("#calibration_table tr + tr + tr td + td").innerText
    GM.setValue('astrometry_result', {
      ra: ra.replace(/\u00a0+/g, " "),
      dec: dec.replace(/\u00a0+/g, " ")
    });
  }
}

function wikipediaScript() {
  console.log("page = " + window.location.href);
  let raText = null;
  let decText = null;
  if (window.location.href.endsWith(".wikipedia.org/w/index.php?search")) {
    (async () => {
      const search = await GM.getValue('wikipedia_search');
      await GM.setValue('wikipedia_search', null);
      console.log("search = " + search);
      if (search != null) {
        document.forms.search.search.value = search;
      }
    })();
    return;
  } else {
    const infobox = document.querySelector(".infobox");
    if (window.location.href.startsWith("https://ja.wikipedia.org/")) {
      let a = infobox.querySelector("th a[title='赤経']");
      raText = a.parentNode.parentNode.querySelector("td").textContent;
      a = infobox.querySelector("th a[title='赤緯']")
      decText = a.parentNode.parentNode.querySelector("td").textContent;
    } else if (window.location.href.startsWith("https://en.wikipedia.org/")) {
      let a = infobox.querySelector("th a[title='Right ascension']");
      raText = a.parentNode.parentNode.querySelector("td").textContent;
      a = infobox.querySelector("th a[title='Declination']");
      decText = a.parentNode.parentNode.querySelector("td").textContent;
    }
    if (!raText || !decText) {
      return;
    }
  }
  const onClick = function () {
    const RA_REGEXP = /(\d+)h\s*(\d+)m\s(\d+(\.\d+)?)s/;
    const DEC_REGEXP = /\s*([+-＋−]?\d+)[°º]\s*(\d+)['′]\s*(\d+(\.\d+)?)["″]/;
    let m = RA_REGEXP.exec(raText);
    const obj = {};
    obj.ra = m[1] + "h " + m[2] + "m " + m[3] + "s",
    m = DEC_REGEXP.exec(decText);
    let md = m[1].replace('＋', '+').replace('−', '-');
    obj.dec = md + "° " + m[2] + "' " + m[3] + "\"";
    console.log(JSON.stringify(obj, null, "  "));
    GM.setValue('wikipedia_result', obj);
  };
  const button = document.createElement('div');
  button.innerText = '[VSSS]';
  button.style.color = '#77e';
  button.style.float = 'right';
  button.style.cursor = 'copy';
  button.addEventListener('click', onClick);
  const h1 = document.querySelector("h1");
  h1.parentNode.insertBefore(button, h1);
}

addEventListener("DOMContentLoaded", function() {
  if (location.href.startsWith('https://www.flickr.com/photos/')) {
    flickerScript();
  } else if (location.href.startsWith('https://nova.astrometry.net/')) {
    astrometryScript();
  } else if (location.href.startsWith("https://ja.wikipedia.org/") ||
             location.href.startsWith("https://en.wikipedia.org/")) {
    wikipediaScript();
  }
})
