function VirtualSkySlideShow(opt) {
  var ss = this;
  popt = {
    projection: 'stereo',
    constellations: true,
    showplanets: true,
    showplanetlabels: false,
    showdate: true,
    scalestars: 1.5,
    mouse: true,
    keyboad: true,
    callback: {
      'click': function (e) {
        ss.pause = !ss.pause;
        //console.log(ss.pause ? "pause" : "start");
        if (!ss.pause) {
          if (!ss.slides || ss.slides.length == ss.slideIndex) {
            var src = (ss.url) ? ss.url : ss.data;
            ss.slideShow(src);
          } else if (ss.show) {
            ss.start();
          }
        }
      }
    }
  };
  this.startId = 0;
  this.url = opt.url;
  this.data = opt.data;
  delete opt.url;
  delete opt.data;
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
  // resize target element
  var elm = document.getElementById(popt.id);
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
  elm.style.width = width + 'px';
  elm.style.height = height + 'px';
  
  this.planetarium = S.virtualsky(popt);
  this.planetarium.showhelp = false;
  this.planetarium.credit = false;
  this.planetarium.draw();
  this.pause = true;
  this.show = false;
  this.clockMove = {};
  this.azMove = {};
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
  this.slides = [];
  this.slideIndex = 0;
  
  return this;
}

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
    ra = 15.0 * parseInt(f[1], 10) + parseInt(f[2], 10) * 15.0 / 60.0 +
      parseFloat(f[3]) * 15.0 / 60.0 / 60.0;
    //console.log(f[0] + " -> " + ra);
  }
  if (typeof dec == "string") {
    var f = this.DEC_REGEXP.exec(dec);
    dec = parseInt(f[1], 10) + parseInt(f[2], 10) * 1.0 / 60.0 +
      parseFloat(f[3]) * 1.0 / 60.0 / 60.0;
    //console.log(f[0] + " -> " + dec);
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

VirtualSkySlideShow.prototype.loadImage = function (url) {
  this.planetarium.container.css({
    'background-image': 'url("'+url+'")'
  });
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

VirtualSkySlideShow.prototype.hideImage = function () {
  var ss = this;
  ss.planetarium.canvas.css({opacity: '1' });
  ss.show = false;
}

VirtualSkySlideShow.prototype.nextSlide = function (auto, startId) {
  //console.log("nextSlide("+auto+", "+startId+")");
  var ss = this;
  var slide = ss.slides[ss.slideIndex++];
  var next = (ss.slides.length > ss.slideIndex) ?
      function () {
        if (!ss.pause && ss.startId == startId) {
          ss.nextSlide(auto, startId);
        }
      } : function () {
        ss.pause = true;
      };
  var show = function () {
    setTimeout(function () {
      ss.showImage(slide.image);
      if (!ss.pause && auto) {
        setTimeout(next, ss.config.image_duration);
      }
    }, ss.config.stop_duration);
  };
  var pan = function () {
    if (slide.planet) {
      ss.moveToPlanet(slide.planet, slide.label, ss.config.pan_duration, show);
    } else {
      ss.moveToRADec(slide.ra, slide.dec, slide.label, ss.config.pan_duration,
                     show);
    }
  };
  var spin = function () {
    ss.loadImage(slide.image);
    ss.planetarium.pointers = [];
    ss.moveToClock(new Date(slide.date), ss.config.spin_duration, pan);
  };
  var waitandgo = function() {
    document.removeEventListener('transitionend', waitandgo);
    setTimeout(spin, ss.config.stop_durationn);
  };
  if (ss.show) {
    document.addEventListener('transitionend', waitandgo);
    ss.hideImage();
  } else {
    waitandgo();
  }
}

VirtualSkySlideShow.prototype.slideShow = function (src) {
  if (typeof src == "string") { // url
    this.planetarium.loadJSON(src, function (data) {
      ss.startSlideShow(data);
    });
  } else { // data
    this.startSlideShow(src);
  }
}

VirtualSkySlideShow.prototype.startSlideShow = function (data) {
  var ss = this;
  ss.config = data.config;
  ss.planetarium.setLatitude(ss.config.latitude);
  ss.planetarium.setLongitude(ss.config.longitude);
  ss.planetarium.updateClock(new Date(ss.config.date));
  ss.planetarium.az_off = (ss.config.az % 360) - 180;
  ss.planetarium.drawImmediate();
  ss.slides = data.slides;
  ss.slideIndex = 0;
  setTimeout(function () {
    ss.start();
  }, ss.config.stop_duration);
}

VirtualSkySlideShow.prototype.start = function () {
  var oldId = ss.startId;
  ss.startId++;
  if (ss.startId == oldId) {
    ss.startId = 0;
  }
  ss.nextSlide(true, ss.startId);
}
