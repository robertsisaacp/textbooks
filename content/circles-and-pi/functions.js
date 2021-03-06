// =============================================================================
// Circles and Pi
// (c) Mathigon
// =============================================================================



import { clamp, list, wait, tabulate } from '@mathigon/core';
import { Point, toWord, roundTo, Polygon, Sector, round, Angle } from '@mathigon/fermat';
import { $N, slide, Colour, animate, Draggable } from '@mathigon/boost';
import { Burst } from '../shared/components/burst';
import { rotateDisk } from '../shared/components/disk';

import '../shared/components/conic-section';
import './components/pi-scroll';

// -----------------------------------------------------------------------------

export function radius($step) {
  const $play = $step.$('.play-btn');
  const $geopad = $step.$('x-geopad');

  $play.one('click', () => {
    $play.exit('pop');
    wait(500)
        .then(() => $geopad.animateConstruction('c1'))
        .then(() => {
          $step.score('compass');
          $geopad.$('.red').enter('draw-reverse', 1500, 1000);
          $geopad.$('.blue').enter('draw-reverse', 2000, 4000);
        });
  });

  $step.onScore('blank-0', () => $geopad.$('.green').enter('draw-reverse', 2000));
}

export function similar($step) {
  const $svg = $step.$('svg.similar-circles');
  const $strokes = $N('g', {}, $svg);
  const burst = new Burst($N('g', {class: 'burst'}, $svg), 20);

  $N('circle', {class: 'handle fixed', r: 10, cx: 320, cy: 180, style: 'fill: #31b304'}, $svg);
  $N('circle', {class: 'outline', r: 60, cx: 320, cy: 180, style: 'stroke: #31b304'}, $strokes);

  const circles = [[140, 120, 100, 0], [220, 300, 40, 1], [500, 240, 120, 2]];
  const isCompleted = [false, false, false];
  let hasShownResizeGesture = false;

  function complete(i, $handle, $outline, $outlineHalo) {
    if (isCompleted[i]) return;
    isCompleted[i] = true;

    $handle.exit('fade');
    $outline.exit('fade');
    $outlineHalo.exit('fade');
    $step.score('circle-' + i);
    $step.addHint('correct');
    burst.play(1000, [320, 180], [70, 50]);
  }

  for (let c of circles) {
    let rReady = false, cReady = false;

    const $handle = $N('circle', {class: 'handle', r: 10}, $svg);
    const $outlineHalo = $N('circle', {class: 'outline-halo', r: c[2]}, $strokes);
    const $outline = $N('circle', {class: 'outline', r: c[2]}, $strokes);
    const drag = new Draggable($handle, $svg, {snap: 20, useTransform: true, responsive: true});

    drag.on('move', (p) => {
      $outline.setCenter(p);
      $outlineHalo.setCenter(p);
      cReady = (p.x === 320 && p.y === 180);
      if (rReady && cReady) complete(c[3], $handle, $outline, $outlineHalo);
    });

    drag.on('end', () => {
      if (!cReady || rReady || hasShownResizeGesture) return;
      hasShownResizeGesture = true;
      $gesture.offset = new Point(-$outline.attr('r') , 0);
      $gesture.slide = new Point($outline.attr('r') - 60, 0);
      $gesture.$target = $handle;
      setTimeout(() => $gesture.start(), 1000);
    });

    slide($outlineHalo, {
      move(p) {
        let r = roundTo(p.subtract(drag.position).length, 20);
        $outline.setAttr('r', r);
        $outlineHalo.setAttr('r', r);
        rReady = (r === 60);
        if (rReady && cReady) complete(c[3], $handle, $outline, $outlineHalo);
      }
    });

    drag.setPosition(c[0], c[1]);
  }

  const $gesture = $N('x-gesture', {}, $step);
  setTimeout(() => {
    const $handles = $svg.$$('.handle');
    $gesture.startSlide($handles[1], $handles[0]);
    $svg.on('click pointerdown', () => $gesture.stop());
  }, 1000);
}

const piString = 'π=3.1415926535897932384626433832795028841971693993751058209' +
    '749445923078164062862089986280348253421170679821480865132823066470938446' +
    '095505822317253594081284811174502841027019385211055596446229489549303819' +
    '644288109756659334461284756482337867831652712019091456485669234603486104' +
    '543266482133936072602491412737245870066063155881748815209209628292540917' +
    '153643678925903600113305305488204665213841469519415116094330572703657595' +
    '919530921861173819326117931051185480744623799627495673518857527248912279' +
    '381830119491298336733624406566430860213949463952247371907021798609437027' +
    '705392171762931767523846748184676694051320005681271452635608277857713427' +
    '577896091736371787214684409012249534301465495853710507922796892589235420…';

export function piDefinition($step) {
  const context = $step.$('canvas').getContext();

  const colours = Colour.rainbow(161);
  const shift = [0, 0.06, 0.06, -0.06, -0.06];

  function drawDigit(i, r, a) {
    if (i < 5) a += shift[i];  // Fix spacing for = and . symbols
    const point = Point.fromPolar(a, r);

    context.save();
    context.translate(400 + 2 * point.x, 400 + 2 * point.y);
    context.rotate(a + Math.PI / 2);
    context.fillStyle = colours[Math.floor(r)];
    context.font = `${2 * 0.3 * r}px Source Sans Pro, sans-serif`;
    context.textAlign = 'center';
    context.fillText(piString[i], 0, 0);
    context.restore();

    if (i >= piString.length - 1) return;
    setTimeout(() => drawDigit(i + 1, r * 0.992, a + 0.175), 20);
  }

  setTimeout(() => drawDigit(0, 160, -1.8), 1000);
  setTimeout(() => $step.score('digits'), 10000);
}

export function wheel($step) {
  const $svg = $step.$('svg');
  const $wheel = $svg.$('.wheel');
  const $line =  $svg.$('.outline');
  const $pi = $svg.$('.pi');

  let p = 0.01;
  let done = false;

  function redraw() {
    const a = p * Math.PI;
    const dx = 60 + a * 100;
    const end = Point.fromPolar(2 * a + Math.PI / 2, 50).shift(dx, 55);

    $wheel.transform = `translateX(${a*100}px) rotate(${2*a}rad)`;
    $line.setAttr('d', `M ${60} ${105} L ${dx} ${105}` +
        `A 50 50 0 ${p < 0.5 ? 1 : 0} 0 ${end.x} ${end.y}`);
  }

  slide($wheel, {
    move(posn, start, last) {
      p = clamp(p + (posn.x - last.x)/314, 0.01, 1);
      redraw();
      if (p > 0.95 && !done) {
        $step.score('unroll');
        $pi.enter('pop');
        done = true;
      }
    }
  });

  $wheel.css('cursor', 'ew-resize');
  redraw();
}

export function piColours($step) {
  const colours = ['#ff941f', '#e66438', '#cc3450', '#b30469', '#822b9b',
    '#5053cd', '#1f7aff', '#258dab', '#2ba058', '#31b304'];

  const $cells = $step.$$('.pi-cell');
  for (let $c of $cells) $c.css('background', colours[+$c.text]);
  const $filter = list(10).map(i => $cells.filter($c => +$c.text !== i));

  for (let $c of $cells) {
    const i = +$c.text;
    $c.on('hover', {
      enter() {
        for (let $c of $filter[i]) $c.addClass('hide');
        $step.score('hover');
      },
      exit() { for (let $c of $filter[i]) $c.removeClass('hide'); }
    });
  }
}

export function piDigits($step) {
  const $scroller = $step.$('x-pi-scroll');
  const $input = $step.$('.pi-controls input');
  const $warning = $step.$('.pi-warning');

  fetch('/resources/circles-and-pi/images/pi-100k.txt')
      .then(response => response.text())
      .then(data => $scroller.setUp(data + '…'))
      .then(() => fetch('/resources/circles-and-pi/images/pi-1m.txt'))
      .then(response => response.text())
      .then(data => $scroller.setUp(data + '…'));

  $input.change((str) => {
    const index = $scroller.findString(str);
    $warning.css('visibility', index < 0 ? 'visible' : 'hidden');
    if (str.length >= 4) $step.score('search');
  });
}

export function maxArea($step) {
  const N = 60;
  const R = 80;

  const triangle = Polygon.regular(3, R * 1.2092).shift(160, 100);
  const square = Polygon.regular(4, R * 1.11072).shift(160, 100);
  const pentagon = Polygon.regular(5, R * 1.06896).shift(160, 100);

  const polygons = [
    new Polygon(...list(N).map(i => triangle.at(i/N))),
    new Polygon(...list(N).map(i => square.at(i/N))),
    new Polygon(...list(N).map(i => pentagon.at(i/N))),
    Polygon.regular(N, R).shift(160, 100)
  ];

  const areas = [481, 625, 688, 796];

  const $path = $N('path', {}, $step.$('svg'));
  const $select = $step.$('x-select');
  $path.closed = true;

  let i = 0;
  $path.draw(polygons[0]);
  $step.model.set('area', areas[0]);

  $select.on('change', ($el) => {
    const j = i;
    i = +$el.data.value;
    if (i === 3) $step.score('area-circle');
    animate((p) => {
      $path.draw(Polygon.interpolate(polygons[j], polygons[i], p));
      $step.model.area = Math.round(p * areas[i] + (1-p) * areas[j]);
    }, 400);
  });
}

export function area($step) {
  const $svg = $step.$('.circle-area');
  const $slider = $step.$('x-slider');
  const $rect = $N('g', {class: 'circle'}, $svg);
  const $circle = $N('g', {class: 'circle'}, $svg);

  const c = new Point(170, 65);
  const r = 60;
  let angle, dx, dy;
  $step.model.set('toWord', toWord);

  function sector(center, r, size, angle) {
    const startAngle = angle - size/2 - Math.PI/2;
    return new Sector(center, Point.fromPolar(startAngle, r).add(center), size);
  }

  function applyTransforms() {
    const wedges = $circle.children;
    const p = $slider.current / $slider.steps;

    for (let i = 0; i < $step.model.n1; ++i) {
      const center = c.add(new Point(dx * i - ($step.model.n1 - 1) * dx / 2, i % 2 ? 90 : 90 + dy).scale(p));
      const rotation = p * ((i % 2) ? Math.PI : 0) + (1 - p) * (i * angle);
      wedges[i].draw(sector(center, r, angle, rotation));
    }

    if (p > 0.95) $step.score('slider');
  }

  $step.model.watch((state) => {
    $circle.removeChildren();
    $rect.removeChildren();

    angle = 2 * Math.PI / state.n1;
    dx = r * Math.sqrt(2 - 2 * Math.cos(angle)) / 2;
    dy = r * Math.cos(angle / 2);

    for (let i = 0; i < state.n1; ++i) {
      $N('path', {path: sector(c, r, angle, i * angle)}, $rect);
      $N('path', {}, $circle);
    }

    applyTransforms();
  });

  $slider.on('move', applyTransforms);
}

function ring(cx, cy, r1, r2, fromAngle, toAngle) {
  if (fromAngle > toAngle) [fromAngle, toAngle] = [toAngle, fromAngle];
  fromAngle -= Math.PI/2;
  toAngle -= Math.PI/2;

  const A = Point.fromPolar(toAngle);
  const B = Point.fromPolar(fromAngle);
  const flag = (toAngle - fromAngle <= Math.PI) ? 0 : 1;

  return `M ${A.x * r1 + cx} ${A.y * r1 + cy}` +
      `A ${r1} ${r1} 0 ${flag} 0 ${B.x * r1 + cx} ${B.y * r1 + cy}` +
      `L ${B.x * r2 + cx} ${B.y * r2 + cy}` +
      `A ${r2} ${r2} 0 ${flag} 1 ${A.x * r2 + cx} ${A.y * r2 + cy} Z`;
}

export function area1($step) {
  const $svg = $step.$('.circle-area');
  const $slider = $step.$('x-slider');
  const $circle = $N('g', {class: 'circle'}, $svg);
  const triangle = $N('g', {class: 'circle'}, $svg);

  const r = 60;
  $step.model.set('toWord', toWord);

  function drawRings(element, p) {
    const $rings = element.children;

    const rmin = Math.pow(20 + p * 100, 1 + p) - 20;
    const dr = r / $step.model.n2;

    const cx = 170 + p * (10 - 165);
    const cy = 65 + p * (150 - 65) - rmin;

    for (let i = 0; i < $step.model.n2; ++i) {
      const angle = Math.PI - 1.999 * Math.PI * ((i + 0.5) * dr) / (rmin + (i + 0.5) * dr);
      const d = ring(cx, cy, rmin + i * dr, rmin + (i + 1) * dr, Math.PI, angle);
      $rings[i].setAttr('d', d);
    }

    triangle.css('transform', `scale(${1 - 0.1 * p})`);
    if (p > 0.95) $step.score('slider');
  }

  $step.model.watch((state) => {
    // TODO Reuse elements for better performance.
    triangle.removeChildren();
    $circle.removeChildren();

    for (let i = 0; i < state.n2; ++i) {
      $N('path', {}, triangle);
      $N('path', {}, $circle);
    }

    drawRings($circle, 0);
    drawRings(triangle, $slider.current / $slider.steps);
  });

  $slider.on('move', (x) => drawRings(triangle, x / $slider.steps));
}


// -----------------------------------------------------------------------------
// Degrees and Radians

export function degrees($step) {
  const angles = [1.999, 1, 0.5];

  const start = new Point(150, 80);
  $step.model.set('c0', start);
  $step.model.set('c1', start);
  $step.model.set('c2', start);

  for (let i of [0, 1, 2]) {
    $step.onScore('blank-' + i, () => {
      animate((t) => {
        const a = t * Math.PI * angles[i];
        const p = new Point(80 + 70 * Math.cos(a), 80 - 70 * Math.sin(a));
        $step.model.set(['c' + i], p);
      }, angles[i] * 750);
    });
  }
}

function drawTick(i, $lines) {
  const a = (i - 90) / 180 * Math.PI;
  const $l = $N('line', {}, $lines);
  $l.setLine(Point.fromPolar(a, 362), Point.fromPolar(a, i % 10 ? 370 : 376));
}

export function constellations($step) {
  const $box = $step.$('.constellations');
  const $wheel = $box.$('.wheel');
  const $lines = $N('g', {transform: 'translate(380, 380)'}, $box.$('svg'));
  $step.model.set('day', 0);
  const seen = [0,360];
  drawTick(0, $lines);

  rotateDisk($box, {
    resistance: 0.85,
    maxSpeed: 0.01,
    $disk: $wheel,
    draw(angle) {
      $wheel.transform = `rotate(${angle}rad)`;

      const d = (720 - Math.round(angle * 180 / Math.PI)) % 360;
      $step.model.day = d;

      if (d > seen[0] && d < seen[1]) {
        const isCw = (d - seen[0] < seen[1] - d);
        const range = isCw ? [seen[0] + 1, d] : [d, seen[1] - 1];
        for (let i = range[0]; i <= range[1]; ++i) drawTick(i, $lines);
        seen[isCw ? 0 : 1] = d;
      }
    },
    end() {
      $step.score('rotate');
    }
  });
}

export function constellations1($step) {
  $step.$('x-video').one('play', () => $step.score('video'));
}

export function radians($step) {
  $step.model.set('rad', (r) => {
    const a = r / Math.PI;
    return a > 1.99 ? 2 : round(a, 2);
  });

  const zero = new Point(240, 140);
  const center = new Point(140, 140);
  const ends = [new Point(240, 140.4), new Point(40, 140), new Point(140, 40)];

  function setState(i) {
    const arc1 = new Angle($step.model.a, center, zero).arc;
    const arc2 = new Angle($step.model.b, center, ends[i]).arc;

    animate((p) => {
      $step.model.a = arc1.at(p);
      $step.model.b = arc2.at(p);
    }, 600);
  }

  const $actions = $step.$$('.var-action');
  $actions[0].on('click', () => setState(0));
  $actions[1].on('click', () => setState(1));
  $actions[2].on('click', () => setState(2));

  const $equations = $step.$$('x-equation');
  $equations[0].on('solve', () => setState(1));
  $equations[1].on('solve', () => setState(2));
}


// -----------------------------------------------------------------------------
// Conic Sections

export function conics($step) {
  const $conics = $step.$('x-conic-section');
  const $labels = $step.$('.row').children;
  let $activeLabel = $labels[0];

  $conics.on('rotate', (a) => {
    const active = (a < 0.05) ? 0 : (a < 1.1) ? 1 : (a < 1.15) ? 2 : 3;
    if ($activeLabel === $labels[active]) return;
    $activeLabel.removeClass('active');
    $activeLabel = $labels[active];
    $activeLabel.removeClass('hide');
    $activeLabel.addClass('active');
    $step.score(['circle', 'ellipse', 'parabola', 'hyperbola'][active]);
  });

  $labels.forEach(($l, i) => {
    $l.on('click', () => {
      if ($l.hasClass('active')) return;
      $conics.update([0, 0.9, 1.12, 1.2][i])
    });
  });
}

export function ellipses2($step) {
  $step.$$('x-video').forEach(($v, i) => {
    $v.one('play', () => $step.score('v' + i));
  });
}

export function epicycles($step) {
  const smallCircle = $step.$('.small-circle');
  const earth = $step.$('.earth');
  const $path = $step.$('svg path');
  const $play = $step.$('.play-btn');

  const BIG_R = 120;
  const SMALL_R = 30;
  let points = [];
  let lastP = 0;

  $step.model.watch((state) => {
    points = list(401).map((i) => {
      const a = i/400 * 2 * Math.PI;
      return Point.fromPolar(a * state.n, SMALL_R)
          .add(Point.fromPolar(a, BIG_R)).shift(160, 160);
    });
    $path.points = points.slice(0, lastP * 401);
  });

  $play.on('click', () => {
    $play.exit('pop').then(() => $play.enter('pop', 400, 5500));
    $step.score('play');

    animate((p) => {
      const a = p * 2 * Math.PI;
      const c1 = Point.fromPolar(a, BIG_R).shift(160, 160);
      smallCircle.setCenter(c1);
      earth.setCenter(Point.fromPolar(a * $step.model.n, SMALL_R).add(c1));
      $path.points = points.slice(0, p * 401);
      lastP = p;
    }, 5000);
  });
}

export function kepler($step) {
  const N = 100;  // number of points
  const a = 120;  // semi-major axis (ry)
  const e = 0.5;  // eccentricity

  // BesselJ function - Table[BesselJ[i, i*0.5], {i, 0, 10}]
  const besselJ = [1, 0.242268, 0.114903, 0.060964, 0.0339957, 0.0195016,
    0.0113939, 0.006743, 0.00402867, 0.00242466, 0.0014678];

  const points = tabulate((n) => {
    const M = 2 * Math.PI * n / N;  // mean anomaly

    let E = M;  // eccentric anomaly
    for (let i = 1; i < 10; ++i) E += 2 / i * besselJ[i] * Math.sin(i*M);

    const th = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
    const r = a * (1 - e * e) / (1 + e * Math.cos(th));
    return Point.fromPolar(th, r).shift(220, 120);
  }, N + 1);

  const $orbit = $step.$('.orbit');
  const $earth = $step.$('.earth');
  const $sweep = $step.$('.sweep');
  const $play = $step.$('.play-btn');

  $orbit.points = points;

  $play.on('click', () => {
    $play.exit('pop').then(() => {
      $play.enter('pop', 400, 8500);
      $step.score('play');
    });

    animate((p) => {
      p = (2 * p) % 1;
      const q = Math.floor(p * 10) / 10;  // sweep start progress
      const start = Point.interpolateList(points, q);
      const end = Point.interpolateList(points, p);
      $earth.setCenter(end);
      $sweep.setAttr('d', `M 220 120 L ${start.x} ${start.y} A 120 105 0 0 1 ${end.x} ${end.y} Z`);
    }, 8000);
  });
}

export function newton($step) {
  const $box = $step.$('.newton');
  const $imgs = $box.children;

  $box.one('click', () => {
    $box.removeClass('interactive');

    animate((p) => {
      if (p < 0.5) {
        $imgs[2].translate(0, p * p * 4 * 166)
      } else {
        let q = 2 * p - 1;
        $imgs[2].translate(85 * q, 166 + 310 * q * (q - 0.6));
      }
    }, 1600);

    setTimeout(() => $imgs[1].remove(), 800);
    setTimeout(() => $step.score('apple'), 1600);
  });
}
