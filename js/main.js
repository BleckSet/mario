$(document).ready(() => {
  $(".burger_inner").on("swipe", event => {
    if (event.swipestart.coords[0] < event.swipestop.coords[0]) {
      $(".burger").removeClass("active");
    }
  });
  $(".burger").click(() => {
    $(".burger_inner").toggleClass("open");
    $(".burger").toggleClass("active");
    $("html").toggleClass("hold");
  });


  $(".redmore").click(() => {
    $(".step_body").toggleClass("slide");
    $(".redmore").toggleClass("slide");
  });

  $('a').click(function(event) {
    event.preventDefault(); 
    $(".burger_inner").removeClass("open");
    $(".burger").removeClass("active");
    $("html").removeClass("hold");
    let target = $(this.hash);
    if (target.length) {
      $('html, body').animate({
        scrollTop: target.offset().top - 150
      }, 800);
    }
    return false;
  });
  
  $('.slick-slider').slick({
    arrows: true,
    infinite: true,
    speed: 1000,
    fade:true ,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    prevArrow: $('.l-arr'),
    nextArrow: $('.r-arr')

  });



});


$(document).ready(function() {
  $(".accordion-button").on("click", function() {
    var clickedButton = $(this);
    var content = clickedButton.siblings(".accordion-content");
    
    if (!clickedButton.hasClass('active')) {
      $(".accordion-button").removeClass('active');
      $(".accordion-content").slideUp();
      $(".accordion_inner").css('min-height', '0'); 
    }

    clickedButton.toggleClass('active');
    content.slideToggle(function() {
      if (content.is(':visible')) {
        var accordionInner = clickedButton.closest('.accordion_inner');
        accordionInner.css('height', accordionInner.prop('scrollHeight') + 'px');
      }
    });
  });
});









// Инициализация Paper.js
paper.setup('divider-canvas');

const sliderContainer = document.querySelector('.slider-container');
const beforeImage = document.querySelector('.before');
const afterImage = document.querySelector('.after');
const handle = new paper.Path.Circle({
    center: [paper.view.size.width / 2, paper.view.size.height / 2],
    radius: 10,
    fillColor: 'red',
    strokeColor: 'black',
    strokeWidth: 2
});

let isDragging = false;

const values = {
  friction: 0.8,
	timeStep: 0.01,
	amount: 15,
	mass: 2,
	count: 0
};
values.invMass = 0.1 / values.mass;

let path, springs;
let size = paper.view.size;

class Spring {
    constructor(a, b, strength, restLength) {
        this.a = a;
        this.b = b;
        this.restLength = restLength || 100;
        this.strength = strength ? strength : 1;
        this.mamb = values.invMass * values.invMass;
    }

    update() {
        const delta = this.b.subtract(this.a);
        const dist = delta.length;
        const normDistStrength = (dist - this.restLength) / (dist * this.mamb) * this.strength;
        delta.x *= normDistStrength * values.invMass * 0.2;
        if (!this.a.fixed) {
            this.a.x += delta.x;
        }
        if (!this.b.fixed) {
            this.b.x -= delta.x;
        }
    }
}

function createPath(strength) {
    path = new paper.Path({
        fillColor: 'transparent'
    });
    springs = [];
    for (let i = 0; i <= values.amount; i++) {
        const segment = path.add(new paper.Point(0.5, i / values.amount).multiply(size));
        const point = segment.point;
        if (i === 0 || i === values.amount) {
            point.x += size.width;
        }
        point.px = point.x;
        point.py = point.y;
        point.fixed = i < 2 || i > values.amount - 2;
        if (i > 0) {
            const spring = new Spring(segment.previous.point, point, strength);
            springs.push(spring);
        }
    }
    path.position.y -= size.height / 4;
    return path;
}

handle.onMouseDrag = (event) => {
    isDragging = true;
    handle.position = event.point;

    const location = path.getNearestLocation(event.point);
    if (!location || !location.segment) return;

    const segment = location.segment;
    const point = segment.point;

    if (!point.fixed) {
        const x = event.point.x;
        point.x = x;
        if (segment.previous && !segment.previous.point.fixed) {
            const previous = segment.previous.point;
            previous.x = x;
        }
        if (segment.next && !segment.next.point.fixed) {
            const next = segment.next.point;
            next.x = x;
        }
    }

    // Обновление положения разделительной линии
    const pathBounds = path.bounds;
    const clipPathBefore = createClipPath(path.segments, 'before');
    const clipPathAfter = createClipPath(path.segments, 'after');

    beforeImage.style.clipPath = clipPathBefore;
    afterImage.style.clipPath = clipPathAfter;

    // Применяем сглаживание к пути
    path.smooth();
};

handle.onMouseUp = () => {
    isDragging = false;
};

function createClipPath(segments, type) {
    let clipPath = '';
    if (type === 'before') {
        clipPath = `polygon(0 0, ${segments[0].point.x}px 0, ${segments.map(seg => `${seg.point.x}px ${seg.point.y}px`).join(', ')}, 0 ${size.height}px)`;
    } else {
        clipPath = `polygon(${segments.map(seg => `${seg.point.x}px ${seg.point.y}px`).join(', ')}, ${size.width}px 0, ${size.width}px ${size.height}px)`;
    }
    return clipPath;
}

function updateWave(path) {
    const force = 1 - values.friction * values.timeStep * values.timeStep;
    for (let i = 0, l = path.segments.length; i < l; i++) {
        const point = path.segments[i].point;
        const dx = (point.x - point.px) * force;
        point.px = point.x;
        point.x = Math.max(point.x + dx, 0);
    }

    for (let j = 0, l = springs.length; j < l; j++) {
        springs[j].update();
    }
}

function onResize() {
    if (path) path.remove();
    size = paper.view.bounds.size.multiply([1, 2]);
    path = createPath(0.1);
}

paper.view.onResize = onResize;

onResize();

window.addEventListener('resize', () => {
    paper.view.viewSize = new paper.Size(sliderContainer.offsetWidth, sliderContainer.offsetHeight);
});
