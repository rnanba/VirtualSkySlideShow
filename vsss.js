function VirtualSkySlideShow(opt) {
  this.version = "0.5.0";
  this.pause = true;
  this.show = false;
  this.moving = false;
  this.startId = 0;
  this.clockMove = {};
  this.azMove = {};
  this.posMove = {};
  this.RA_REGEXP = /^\s*(\d+)h\s*(\d+)m\s*(\d+(\.\d+)?)s\s*$/;
  this.DEC_REGEXP = /^\s*([+-]?\d+)[°º]\s*(\d+)['′]\s*(\d+(\.\d+)?)["″]?\s*$/;
  this.PLANET_INDEX = {
    "Mercury": 0,
    "Venus": 1,
    "Mars": 2,
    "Jupiter": 3,
    "Saturn": 4,
    "Uranus": 5,
    "Neptune": 6
  };
  this.config = {};
  this.slides = null;
  this.slideIndex = 0;

  this.quick_with_key = opt.quick_with_key;
  this.id = opt.id;
  this.url = opt.url;
  this.data = opt.data;
  this.video = null;
  this.zoomview = null;
  this.zoomviewImage = null;
  this.zoomMode = false;
  this.wzoom = null; // https://github.com/worka/vanilla-js-wheel-zoom
  this.currentZoom = 0;
  this.captureKey = true;
  delete opt.url;
  delete opt.data;
  delete opt.quick_with_key;
  
  var ss = this;
  popt = {
    projection: 'stereo',
    constellations: true,
    showplanets: true,
    showplanetlabels: false,
    showdate: true,
    scalestars: 1.5,
    mouse: true,
    keyboard: false,
    callback: {
      'click': function (e) {
        document.getElementById(ss.id).focus();
        ss.pause = !ss.pause;
        //console.log(ss.pause ? "pause" : "start");
        if (!ss.pause) {
          if (ss.slideIndex < 0 || ss.slides.length <= ss.slideIndex ) {
            ss.startSlideShow();
          } else if (ss.show) {
            ss.start();
          }
        }
      }
    }
  };
  for (var key in opt) {
    popt[key] = opt[key];
  }
  // hide help button.
  S('head').append('<style type="text/css">' +
                   '.' + popt.id + '_btn_help { display: none !important; } '  +
                   '#' + popt.id + '.fullscreen {' +
                   '  width: 100vw !important;' +
                   '  height: 100vh !important;' +
                   '}' +
                   '</style>');
  var elm = document.getElementById(ss.id);
  // make target element forcusable
  elm.setAttribute("tabindex", "-1");
  ss.resize();
  var src = (this.url) ? this.url : this.data;
  this.loadSlides(src, function () {
    if (ss.config.latitude) { popt.latitude = ss.config.latitude; }
    if (ss.config.longitude) { popt.longitude = ss.config.longitude; }
    if (ss.config.date) { popt.clock = new Date(ss.config.date); }
    if (ss.config.az) { popt.az = ss.config.az; }
    ss.planetarium = S.virtualsky(popt);
    ss.planetarium.showhelp = false;
    ss.planetarium.credit = false;
    ss.planetarium.draw();
    if (!ss.captureKey) {
      elm.addEventListener('keydown', ss.handleKey);
    }
    elm.addEventListener('wheel', ss.handleWheel);
  });
  document.addEventListener('fullscreenchange', function () {
    var vs = ss.planetarium;
    if (fullScreenApi.isFullScreen()) {
      if (!vs.fullscreen) {
	vs.fullscreen = true;
	vs.container.addClass('fullscreen');
        // console.log("fix fullscreen status: " + vs.fullscreen);
      }
    } else {
      if (vs.fullscreen) {
	vs.fullscreen = false;
	vs.container.removeClass('fullscreen');
        // console.log("fix fullscreen status: " + vs.fullscreen);
      }
    }
  });
  if (ss.captureKey) {
    window.addEventListener('keydown', ss.handleKey);
  }
  window.addEventListener('resize', function() { ss.resize(); });
  return this;
}

VirtualSkySlideShow.prototype.createWZoom = function () {
  var ss = this;
  ss.wzoom = WZoom.create("#zoomview_image", {
    maxScale: 2,
    smoothTime: 0,
    rescale: function(wz) {
      var newScale = wz.content.currentScale;
      if (ss.zoomMode && newScale == wz.content.minScale &&
          ss.currentZoom == wz.content.minScale) {
        ss.currentZoom = 0;
        ss.endZoom();
      } else {
        ss.currentZoom = newScale
        wz.options.smoothTime = 0.1;
      }
    },
    prepare: function(wz) {
      wz.options.smoothTime = 0;
    }
  });
}

VirtualSkySlideShow.prototype.createZoomView = function () {
  var ss = this;
  var img = document.createElement('img');
  img.setAttribute('id', 'zoomview_image');
  img.draggable = false;
  var zoomview = document.createElement('div');
  zoomview.setAttribute('id', 'zoomview');
  zoomview.style.setProperty("position", "absolute");
  zoomview.style.setProperty("top", "0");
  zoomview.style.setProperty("left", "0");
  zoomview.style.setProperty("width", "100vw");
  zoomview.style.setProperty("height", "100vh");
  zoomview.style.setProperty("background-color", "black");
  zoomview.style.setProperty("display", "flex");
  zoomview.style.setProperty("align-items", "center");
  zoomview.style.setProperty("justify-content", "center");
  zoomview.style.setProperty("visibility", "hidden");
  zoomview.append(img);
  ss.zoomview = zoomview;
  ss.zoomviewImage = img;
  ss.zoomview = zoomview;
  ss.zoomview.setAttribute("tabindex", "-1");
  if (!ss.captureKey) {
    ss.zoomview.addEventListener('keydown', ss.handleKey);
  }
  window.addEventListener('resize', () => {
    if (ss.wzoom != null) {
      ss.wzoom.prepare();
    }
  });
};

VirtualSkySlideShow.prototype.moveToClock = function (date, duration, onEnd) {
  //console.log("move to " + date);
  this.planetarium.spin = false;
  this.clockMove = {
    duration: duration,
    start: new Date(),
    from: this.planetarium.clock,
    to: date,
    onEnd: onEnd
  };
  this.moveClockStep();
};

VirtualSkySlideShow.prototype.moveClockStep = function () {
  //console.log("this = " + this);
  var now = new Date();
  var t = (now - this.clockMove.start) / this.clockMove.duration;
  var time = this.clockMove.from.getTime() +
      (this.clockMove.to.getTime() - this.clockMove.from.getTime()) * t;
  this.planetarium.updateClock(new Date(time));
  if (t < 1) {
    this.planetarium.drawImmediate();
    var _obj = this;
    requestAnimFrame(function () { _obj.moveClockStep() });
  } else {
    this.planetarium.updateClock(this.clockMove.to);
    this.planetarium.trigger('loadedPlanets');
    var p = this.planetarium.moonPos(this.planetarium.times.JD);
    this.planetarium.moon = p.moon;
    this.planetarium.sun = p.sun;
    this.planetarium.drawImmediate();
    if (this.clockMove.onEnd) {
      this.clockMove.onEnd();
    }
  }
};

VirtualSkySlideShow.prototype.moveToAz = function (az, duration, onEnd) {
  //console.log("move to " + az);
  var from = this.planetarium.az_off;
  var to = (az % 360) - 180;
  var d = to - from;
  if (d > 180.0) {
    to -= 360.0;
  } else if (d < -180.0) {
    to += 360.0;
  }
  this.azMove = {
    duration: duration,
    start: new Date(),
    from: this.planetarium.az_off,
    to: to,
    onEnd: onEnd
  };
  this.moveAzStep();
}

VirtualSkySlideShow.prototype.moveAzStep = function () {
  var now = new Date();
  var t = (now - this.azMove.start) / this.azMove.duration;
  this.planetarium.az_off = this.azMove.from +
    (this.azMove.to - this.azMove.from) * t;
  if (t < 1) {
    this.planetarium.drawImmediate();
    var _obj = this;
    requestAnimFrame(function () { _obj.moveAzStep() });
  } else {
    this.planetarium.az_off = this.azMove.to;
    this.planetarium.drawImmediate();
    if (this.azMove.onEnd) {
      this.azMove.onEnd();
    }
  }
}

VirtualSkySlideShow.prototype.moveToRADec = function (ra, dec, label,
                                                      duration, onEnd) {
  if (typeof ra == "string") {
    var f = this.RA_REGEXP.exec(ra);
    if (f) {
      ra = 15.0 * parseInt(f[1], 10) + parseInt(f[2], 10) * 15.0 / 60.0 +
        parseFloat(f[3]) * 15.0 / 60.0 / 60.0;
    } else {
      console.log("ERROR: ra = " + ra);
    }
  }
  if (typeof dec == "string") {
    var f = this.DEC_REGEXP.exec(dec);
    if (f) {
      dec = parseInt(f[1], 10) + parseInt(f[2], 10) * 1.0 / 60.0 +
        parseFloat(f[3]) * 1.0 / 60.0 / 60.0;
    } else {
      console.log("ERROR: dec = " + dec);
    }
  }
  var horizon = this.planetarium.coord2horizon(ra * this.planetarium.d2r,
                                               dec * this.planetarium.d2r);
  this.planetarium.pointers = [];
  this.planetarium.addPointer({
    ra: ra,
    dec: dec,
    label: label
  });
  this.moveToAz(horizon[1] * this.planetarium.r2d, duration, onEnd);
}

VirtualSkySlideShow.prototype.moveToPlanet = function (name, label,
                                                       duration, onEnd) {
  var ra;
  var dec;
  if (name === "Sun") {
    ra = this.planetarium.lookup.sun[0].ra * this.planetarium.r2d;
    dec = this.planetarium.lookup.sun[0].dec * this.planetarium.r2d;
  } else if (name === "Moon") {
    ra = this.planetarium.lookup.moon[0].ra * this.planetarium.r2d;
    dec = this.planetarium.lookup.moon[0].dec * this.planetarium.r2d;
  } else {
    var i = this.PLANET_INDEX[name];
    //console.log("jd = " + this.planetarium.jd);
    ra = this.planetarium.lookup.planet[i].ra * this.planetarium.r2d;
    dec = this.planetarium.lookup.planet[i].dec * this.planetarium.r2d;
    //console.log("planet[" + i + "]: " + name + " " + ra + "," + dec);
  }
  this.moveToRADec(ra, dec, label, duration, onEnd)
}

VirtualSkySlideShow.prototype.moveToPos = function (latitude, longitude,
                                                    duration, onEnd) {
  // console.log("move to " + latitude + ", " + longitude);
  this.posMove = {
    duration: duration,
    start: new Date(),
    from: {
      latitude: this.planetarium.latitude.deg,
      longitude: this.planetarium.longitude.deg
    },
    to: {
      latitude: latitude,
      longitude: longitude
    },
    onEnd: onEnd
  };
  this.movePosStep();
}

VirtualSkySlideShow.prototype.movePosStep = function () {
  var now = new Date();
  var t = (now - this.posMove.start) / this.posMove.duration;
  if (t < 1) {
    var lat = this.posMove.from.latitude +
        (this.posMove.to.latitude - this.posMove.from.latitude) * t;
    var lon = this.posMove.from.longitude +
        (this.posMove.to.longitude - this.posMove.from.longitude) * t;
    this.planetarium.setLatitude(lat);
    this.planetarium.setLongitude(lon);
    this.planetarium.updateClock(this.planetarium.clock);
    this.planetarium.drawImmediate();
    var ss = this;
    requestAnimFrame(function () { ss.movePosStep() });
  } else {
    this.planetarium.setLatitude(this.posMove.to.latitude);
    this.planetarium.setLongitude(this.posMove.to.longitude);
    this.planetarium.updateClock(this.planetarium.clock);
    this.planetarium.drawImmediate();
    if (this.posMove.onEnd) {
      this.posMove.onEnd();
    }
  }
}

VirtualSkySlideShow.prototype.loadImage = function (url) {
  this.planetarium.container.css({
    'background-image': 'url("'+url+'")'
  });
  ss.loaded = 'image'
}

VirtualSkySlideShow.prototype.loadVideo = function (url, posterUrl) {
  var ss = this;
  var container = ss.planetarium.container.e[0];
  var canvas = ss.planetarium.canvas.e[0];
  if (!ss.videoWrapper) {
    ss.videoWrapper = document.createElement('div');
    ss.videoWrapper.style.setProperty("text-align", "center");
    ss.videoWrapper.style.setProperty("position", "absolute");
    var resizeVideoWrapper = function () {
      var cw = canvas.style.getPropertyValue("width");
      var ch = canvas.style.getPropertyValue("height");
      ss.videoWrapper.style.setProperty("width", cw);
      ss.videoWrapper.style.setProperty("height", ch)
      // console.log(ss.videoWrapper.style.getPropertyValue("width") +
      //             "x" + ss.videoWrapper.style.getPropertyValue("height"));
    };
    window.addEventListener('resize', resizeVideoWrapper);
    document.addEventListener('fullscreenchange', resizeVideoWrapper);
    container.prepend(ss.videoWrapper);
    resizeVideoWrapper();
  }
  if (!ss.video) {
    ss.video = document.createElement('video');
    ss.video.style.setProperty("background-color", "black");
    ss.video.style.setProperty("width", "100%");
    ss.video.style.setProperty("height", "100%");
    ss.video.style.setProperty("opacity", "0");
    ss.video.setAttribute('controls', 'controls');
    ss.videoWrapper.prepend(ss.video);
  }
  ss.videoWrapper.style.setProperty("visibility", "visible");
  if (posterUrl) {
    ss.video.setAttribute('poster', posterUrl);
  }
  ss.video.setAttribute('src', url);
  ss.video.load();
  ss.loaded = 'video'
}

VirtualSkySlideShow.prototype.showImage = function (url) {
  var css = {
    'background-color': 'black',
    'background-image': 'url("'+url+'")',
    'background-position': 'center',
    'background-repeat' : 'no-repeat',
    'background-size' : 'contain'
  };
  this.planetarium.container.css(css);
  this.planetarium.canvas.css({ transition: 'opacity 0.5s ease-in-out' });
  this.planetarium.canvas.css({ opacity: '0' });
  this.show = true;
}

VirtualSkySlideShow.prototype.showVideo = function (url, posterUrl) {
  var ss = this;
  if (!ss.video) {
    ss.loadVideo(url, posterUrl);
  }
  var transitionEnd = function () {
    ss.video.removeEventListener('transitionend', transitionEnd);
    ss.video.play();
  };
  ss.video.addEventListener('transitionend', transitionEnd);
  ss.video.style.setProperty("transition", "opacity 0.5s ease-in-out");
  ss.video.style.setProperty("opacity", "1");
  if (!ss.pause) {
    var videoEnded = function (e) {
      ss.video.removeEventListener('ended', videoEnded)
      ss.hideVideo();
      setTimeout(function () {
        ss.showing = false;
        if (!ss.pause) {
          ss.nextSlide(ss.startId, false);
        }
      }, 500);
    }
    ss.video.addEventListener('ended', videoEnded);
  }
  this.show = true;
}

VirtualSkySlideShow.prototype.hideMedia = function (url) {
  if (this.loaded === 'image') {
    this.hideImage();
  } else if (this.loaded === 'video') {
    this.hideVideo();
  }
}

VirtualSkySlideShow.prototype.hideImage = function () {
  var ss = this;
  ss.planetarium.canvas.css({opacity: '1' });
  ss.show = false;
  this.loaded = null;
}

VirtualSkySlideShow.prototype.hideVideo = function () {
  var ss = this;
  if (ss.video) {
    var transitionEnd = function () {
      ss.video.removeEventListener('transitionend', transitionEnd);
      ss.videoWrapper.style.setProperty("visibility", "hidden");
      ss.video.pause();
      ss.video.setAttribute('src', null);
    };
    ss.video.addEventListener('transitionend', transitionEnd);
    ss.video.style.setProperty("opacity", "0");
  }
  ss.show = false;
  this.loaded = null;
}

VirtualSkySlideShow.prototype.nextSlide = function (startId, quick) {
  if (this.slideIndex >= this.slides.length) {
    return;
  }
  this.quick = quick;
  this.slideIndex++;
  //console.log("slideIndex = " + this.slideIndex);
  if (this.slides.length <= this.slideIndex) {
    this.pause = true;
  }    
  if (!this.moving) {
    this.showSlide(startId, this.slideIndex, quick);
  }
}

VirtualSkySlideShow.prototype.prevSlide = function (startId, quick) {
  if (this.slideIndex < 0) {
    return;
  }
  this.quick = quick;
  this.slideIndex--;
  //console.log("slideIndex = " + this.slideIndex);
  if (this.slideIndex < 0) {
    this.pause = true;
  }
  if (!this.moving) {
    this.showSlide(startId, this.slideIndex, quick);
  }
}

VirtualSkySlideShow.prototype.showSlide = function (startId, index, quick) {
  this.endZoom();
  var ss = this;
  var slide = ss.slides[index];
  if (!slide) {
    if (ss.show) {
      ss.hideMedia();
    }
    return;
  }
  var pan_duration = quick ? 50 : ss.config.pan_duration;
  var spin_duration = quick ? 50 : ss.config.spin_duration;
  var move_duration = quick ? 50 : ss.config.move_duration;
  var stop_duration = quick ? 10 : ss.config.stop_duration;
  var next = function () {
    //console.log("next");
    ss.showing = false;
    if (!ss.pause && ss.startId == startId) {
      ss.nextSlide(startId, false);
    }
  };
  var show = function () {
    //console.log("show");
    ss.moving = false;      
    //console.log("moving = " + ss.moving);
    setTimeout(function () {
      if (index != ss.slideIndex) {
        var lastIndex = ss.slides.length - 1;
        if (index > 0 && ss.slideIndex < 0) {
          ss.showSlide(ss.startId, 0, ss.quick);
        } else if (index < lastIndex && ss.slideIndex > lastIndex) {
          ss.showSlide(ss.startId, lastIndex, ss.quick);
        } else {
          ss.showSlide(ss.startId, ss.slideIndex, ss.quick);
        }
      } else {
        if (slide.video) {
          ss.showVideo(slide.video, slide.poster);
        } else if (slide.image) {
          ss.showImage(slide.image);
          if (!ss.pause) {
            setTimeout(next, ss.config.image_duration);
          }
        }
      }
    }, stop_duration);
  };
  var pan = function () {
    //console.log("pan");
    if (slide.planet) {
      ss.moveToPlanet(slide.planet, slide.label, pan_duration, show);
    } else {
      ss.moveToRADec(slide.ra, slide.dec, slide.label, pan_duration, show);
    }
  };
  var move = function () {
    //console.log("move");
    ss.moveToPos(slide.latitude, slide.longitude, move_duration, pan);
  };
  var spin = function () {
    //console.log("spin");
    if (slide.video) {
      ss.loadVideo(slide.video, slide.poster);
    } else if (slide.image) {
      ss.loadImage(slide.image);
    }
    ss.planetarium.pointers = [];
    var f = (slide.latitude === ss.planetarium.latitude.deg &&
             slide.longitude === ss.planetarium.longitude.deg) ? pan : move;
    ss.moveToClock(new Date(slide.date), spin_duration, f);
  };
  var waitandgo = function() {
    //console.log("waitandgo");
    //document.removeEventListener('transitionend', waitandgo);
    setTimeout(spin, stop_duration);
  };
  ss.moving = true;
  //console.log("moving = " + ss.moving);
  if (ss.show) {
    //console.log("hideImage");
    //document.addEventListener('transitionend', waitandgo);
    setTimeout(waitandgo, 500);
    ss.hideMedia();
  } else {
    waitandgo();
  }
}

VirtualSkySlideShow.prototype.loadSlides = function (src, onLoad) {
  var ss = this;
  if (typeof src == "string") { // url
    S(document).ajax(src, {
      dataType: "json",
      success: function (data) {
        ss.init(data);
        if (onLoad) {
          onLoad();
        }
      },
      complete: function () {},
      error: function(e) {
        console.log("load error: " + e);
      }
    });
  } else { // data
    ss.init(data);
    if (onLoad) {
      onLoad();
    }
  }
}

VirtualSkySlideShow.prototype.init = function (data) {
  this.config = {
    date: "1970-01-01T00:00:00+00:00",
    latitude: 35,
    longitude: 139,
    az: 180,
    spin_duration : 1500,
    pan_duration : 500,
    move_duration : 500,
    stop_duration : 1000,
    image_duration : 5000
  };
  for (var p in data.config) {
    this.config[p] = data.config[p];
  }
  this.slides = data.slides;
  var latitude = this.config.latitude;
  var longitude = this.config.longitude;
  for (var i=0; i<this.slides.length; i++) {
    var s = this.slides[i];
    if (!s.latitude) {
      s.latitude = this.config.latitude;
    }
    if (!s.longitude) {
      s.longitude = this.config.longitude;
    }
  }
  this.slideIndex = -1;
}

VirtualSkySlideShow.prototype.resetSlideShow = function () {
  this.planetarium.setLatitude(this.config.latitude);
  this.planetarium.setLongitude(this.config.longitude);
  this.planetarium.updateClock(new Date(this.config.date));
  this.planetarium.az_off = (this.config.az % 360) - 180;
  this.planetarium.drawImmediate();
  this.slideIndex = -1;
}

VirtualSkySlideShow.prototype.startSlideShow = function () {
  var ss = this;
  ss.resetSlideShow();
  ss.start();
}

VirtualSkySlideShow.prototype.renewStartId = function () {
  var oldId = this.startId;
  this.startId++;
  if (this.startId == oldId) {
    this.startId = 0;
  }
}

VirtualSkySlideShow.prototype.start = function () {
  this.renewStartId();
  this.nextSlide(this.startId, false);
}

VirtualSkySlideShow.prototype.forward = function () {
  this.renewStartId();
  this.nextSlide(this.startId, this.quick_with_key);
}

VirtualSkySlideShow.prototype.backward = function () {
  this.renewStartId();
  this.prevSlide(this.startId, this.quick_with_key);
}

VirtualSkySlideShow.prototype.beginning = function() {
  this.renewStartId();
  this.slideIndex = -1;
  this.showSlide(this.startId, 0, this.quick);
}

VirtualSkySlideShow.prototype.end = function() {
  this.renewStartId();
  this.slideIndex = this.slides.length;
  this.showSlide(this.startId, this.slides.length - 1, this.quick);
}

VirtualSkySlideShow.prototype.toggleZoomMode = function() {
  if (this.zoomMode) {
    this.endZoom();
  } else {
    this.zoom();
  }
}

VirtualSkySlideShow.prototype.zoom = function() {
  var slide = this.slides[this.slideIndex];
  if (slide.video) {
    return;
  }
  if (this.zoomview == null) {
    this.createZoomView()
  }
  this.zoomMode = true;
  if (document.fullscreenElement) {
    document.fullscreenElement.append(this.zoomview);
  } else {
    document.body.style.setProperty("overflow", "hidden");
    document.body.append(this.zoomview);
  }
  this.createWZoom();
  this.zoomviewImage.setAttribute("src", this.slides[this.slideIndex].image);
  this.wzoom.prepare();
  this.zoomview.style.setProperty("z-index", "100");
  this.zoomview.style.setProperty("visibility", "visible");
  this.zoomview.focus();
}

VirtualSkySlideShow.prototype.endZoom = function() {
  if (!this.zoomview || !this.zoomview.parentElement) {
    return;
  }
  this.zoomview.remove();
  this.wzoom.destroy();
  this.wzoom = null;
  this.zoomviewImage.setAttribute("src", "");
  this.zoomview.style.setProperty("visibility", "hidden");
  this.zoomMode = false;
  document.getElementById(ss.id).focus();
}

VirtualSkySlideShow.prototype.handleWheel = function(e) {
  if (ss.zoomMode) {
    return;
  }
  if (e.deltaY < 0) {
    ss.pause = true;
    ss.zoom();
  }
}

VirtualSkySlideShow.prototype.handleKey = function(e) {
  switch (e.key) {
  case "ArrowRight":
  case "n":
    ss.pause = true;
    ss.forward();
    break;
  case "ArrowLeft":
  case "p":
    ss.pause = true;
    ss.backward();
    break;
  case "Home":
  case ",":
  case "<":
    ss.pause = true;
    ss.beginning();
    break;
  case "End":
  case ".":
  case ">":
    ss.pause = true;
    ss.end();
    break;
  case "z":
    ss.pause = true;
    ss.toggleZoomMode();
  }
}

VirtualSkySlideShow.prototype.resize = function() {
  var elm = document.getElementById(this.id);
  // resize target element
  var maxWidth =
      document.documentElement.clientWidth - elm.getBoundingClientRect().left;
  var width = elm.clientWidth;
  var height = elm.clientHeight;
  if (maxWidth < width) {
    var scale = maxWidth / width;
    width = maxWidth;
    height = height * scale;
    elm.style.backgroundSize = width + 'px';
  }
  if (this.planetarium) {
    this.planetarium.resize();
  }
  if (this.show) {
    this.loadImage(this.slides[this.slideIndex].image);
  }
}
