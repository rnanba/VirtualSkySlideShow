// ==UserScript==
// @name      [VSSS] wikipedia
// @namespace http://rna.hatenablog.com
// @include   https://ja.wikipedia.org/*
// @include   https://en.wikipedia.org/*
// @version  1.0
// @grant    none
// ==/UserScript==
addEventListener("DOMContentLoaded", function(){
  console.log("page = " + window.location.href);
  const onSearchMessage = function (ev) {
    const search = ev.data;
    console.log("search = " + search);
    document.forms.search.search.value = search;
  };
  if (window.location.href === "https://ja.wikipedia.org/w/index.php?search") {
    if (window.opener) {
      window.addEventListener("message", onSearchMessage);
      window.opener.postMessage({ cmd:"getSearch" }, "https://www.flickr.com");
    }
    return;
  }
  const infobox = document.querySelector(".infobox");
  let raText = null;
  let decText = null;
  if (window.location.href.startsWith("https://ja.wikipedia.org/")) {
    raText = infobox.querySelector("th a[title='赤経']").parentNode.parentNode.querySelector("td").textContent;
    decText = infobox.querySelector("th a[title='赤緯']").parentNode.parentNode.querySelector("td").textContent;
  } else if (window.location.href.startsWith("https://en.wikipedia.org/")) {
    raText = infobox.querySelector("th a[title='Right ascension']").parentNode.parentNode.querySelector("td").textContent;
    decText = infobox.querySelector("th a[title='Declination']").parentNode.parentNode.querySelector("td").textContent;
  }
  if (!raText || !decText) {
    return;
  }
  const onClick = function () {
    const RA_REGEXP = /(\d+)h\s*(\d+)m\s(\d+(\.\d+)?)s/;
    const DEC_REGEXP = /\s*([+-]?\d+)[°º]\s*(\d+)['′]\s*(\d+(\.\d+)?)["″]/;
    let m = RA_REGEXP.exec(raText);
    const obj = {};
    obj.ra = m[1] + "h " + m[2] + "m " + m[3] + "s",
    m = DEC_REGEXP.exec(decText);
    obj.dec = m[1] + "° " + m[2] + "' " + m[3] + "\"";
    console.log(JSON.stringify(obj, null, "  "));
    if (window.opener) {
      window.opener.postMessage({
        cmd: "setRADec",
        ra: obj.ra,
        dec: obj.dec,
        src: window.location.href
      }, "https://www.flickr.com");
    }
  };
  
  const button = document.createElement('div');
  button.innerText = '[VSSS]';
  button.style.color = '#77e';
  button.style.float = 'right';
  button.style.cursor = 'copy';
  button.addEventListener('click', onClick);
  const h1 = document.querySelector("h1");
  h1.parentNode.insertBefore(button, h1);
})
