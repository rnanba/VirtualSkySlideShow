function VirtualSkySlideShow(opt) {
  this.version = "0.2.0";
  this.pause = true;
  this.show = false;
  this.moving = false;
  this.startId = 0;
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
  this.slides = null;
  this.slideIndex = 0;

  this.quick_with_key = opt.quick_with_key;
  this.id = opt.id;
  this.url = opt.url;
  this.data = opt.data;
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
  elm.style.width = width + 'px';
  elm.style.height = height + 'px';
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
    elm.addEventListener('keydown', function (e) {
      //console.log("keydown("+e.keyCode+")");
      switch (e.keyCode) {
      case 39: // right arrow
      case 78: // 'n'
        //console.log("forward");
        ss.pause = true;
        ss.forward();
        break;
      case 37: // left arrow
      case 80: // 'p'
        //console.log("backward");
        ss.pause = true;
        ss.backward();
        break;
      case 36: // home
      case 188: // ',' '<'
        ss.pause = true;
        ss.beginning();
        break;
      case 35: // end
      case 190: // '.' '>'
        ss.pause = true;
        ss.end();
      }
    });
  });
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
  var ss = this;
  var slide = ss.slides[index];
  if (!slide) {
    if (ss.show) {
      ss.hideImage();
    }
    return;
  }
  var pan_duration = quick ? 50 : ss.config.pan_duration;
  var spin_duration = quick ? 50 : ss.config.spin_duration;
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
        ss.showImage(slide.image);
        if (!ss.pause) {
          setTimeout(next, ss.config.image_duration);
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
  var spin = function () {
    //console.log("spin");
    ss.loadImage(slide.image);
    ss.planetarium.pointers = [];
    ss.moveToClock(new Date(slide.date), spin_duration, pan);
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
    ss.hideImage();
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
  this.config = data.config;
  this.slides = data.slides;
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
