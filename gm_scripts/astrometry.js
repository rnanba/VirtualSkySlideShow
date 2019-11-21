// ==UserScript==
// @name     [VSSS] astrometry.net
// @namespace https://rna.hatenablog.com/
// @version  1.0
// @include  http://nova.astrometry.net/*
// @grant    none
// ==/UserScript==
addEventListener("DOMContentLoaded", function(){
  console.log("page = " + location.href);
  const onUrlMessage = function (ev) {
    const url = ev.data;
    console.log("url = " + url);
    document.forms.upload_form.upload_type.value = 'url';
    document.forms.upload_form.url.value = url;
    document.forms.upload_form.submit();
  };
  if (location.href.startsWith('http://nova.astrometry.net/upload')) {
    if (window.opener) {
      window.addEventListener("message", onUrlMessage);
      window.opener.postMessage({ cmd:"getUrl" }, "https://www.flickr.com");
    }
    return;
  } else if (location.href.startsWith('http://nova.astrometry.net/status/')) {
    if (document.querySelector("#submission_images div.good")) {
      console.log("ok");
      location.href = document.querySelector("#submission_images td a[href]").href;
    } else if (document.querySelector("#submission_images div.bad")) {
      console.log("fail");
      window.opener.postMessage({ cmd:"astrometryFailed" }, "https://www.flickr.com");
    }
  } else if (location.href.startsWith('http://nova.astrometry.net/user_images/')) {
    if (window.opener) {
      const ra = document.querySelector("#calibration_table tr + tr td + td").innerText
      const dec = document.querySelector("#calibration_table tr + tr + tr td + td").innerText
      window.opener.postMessage({
        cmd: "setRADec",
        ra: ra.replace(/\u00a0+/g, " "),
        dec: dec.replace(/\u00a0+/g, " "),
        src: window.location.href
      }, "https://www.flickr.com");
    }
  }
})
