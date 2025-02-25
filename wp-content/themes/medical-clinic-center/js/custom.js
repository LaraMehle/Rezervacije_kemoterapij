jQuery(function($){
  "use strict";
    jQuery('.gb_navigation > ul').superfish({
    delay:       500,
    animation:   {opacity:'show',height:'show'},
    speed:       'fast'
  });
});

function medical_clinic_center_gb_Menu_open() {
  jQuery(".side_gb_nav").addClass('show');
}
function medical_clinic_center_gb_Menu_close() {
  jQuery(".side_gb_nav").removeClass('show');
}

jQuery('.gb_toggle').click(function () {
  medical_clinic_center_Keyboard_loop(jQuery('.side_gb_nav'));
});

var medical_clinic_center_Keyboard_loop = function (elem) {
  var medical_clinic_center_tabbable = elem.find('select, input, textarea, button, a').filter(':visible');
  var medical_clinic_center_firstTabbable = medical_clinic_center_tabbable.first();
  var medical_clinic_center_lastTabbable = medical_clinic_center_tabbable.last();
  medical_clinic_center_firstTabbable.focus();

  medical_clinic_center_lastTabbable.on('keydown', function (e) {
    if ((e.which === 9 && !e.shiftKey)) {
      e.preventDefault();
      medical_clinic_center_firstTabbable.focus();
    }
  });

  medical_clinic_center_firstTabbable.on('keydown', function (e) {
    if ((e.which === 9 && e.shiftKey)) {
      e.preventDefault();
      medical_clinic_center_lastTabbable.focus();
    }
  });

  elem.on('keyup', function (e) {
    if (e.keyCode === 27) {
      elem.hide();
    };
  });
};

( function( $ ) {

  jQuery(document).ready(function($){
    // Implement go to top.
    var $scroll_obj = jQuery( '#btn-scrollup' );
    jQuery( window ).on( 'scroll',function(){
      if ( $( this ).scrollTop() > 100 ) {
        $scroll_obj.fadeIn();
      } else {
        $scroll_obj.fadeOut();
      }
    });

    $scroll_obj.on( 'click',function(){
      jQuery( 'html, body' ).animate( { scrollTop: 0 }, 600 );
      return false;
    });
  });

} )( jQuery );

document.addEventListener('DOMContentLoaded', function () {
        var preloader = document.getElementById('preloader');

        if (preloader) {  // Check if the element exists before trying to manipulate it
            var duration = 4000; // 10 seconds

            setTimeout(function () {
                preloader.style.display = 'none';
            }, duration);
        }
    });

 document.addEventListener('DOMContentLoaded', function () {
    // Get the header element
    var header = document.getElementById('middle-header');

    // Get the initial offset of the header
    var headerOffset = header.offsetTop;

    // Function to handle scroll events
    function handleScroll() {
        var sticky_setting = jQuery('#middle-header').attr('data-sticky');
        if (window.pageYOffset > headerOffset) {
            // Add the "sticky" class when scrolling down
            if(sticky_setting == 1) {
              header.classList.add('sticky');
            }
        } else {
            // Remove the "sticky" class when scrolling up
            if(sticky_setting == 1) {
              header.classList.remove('sticky');
            }
        }
    }

    // Attach the scroll event listener
    window.onscroll = handleScroll;
});

/* Custom Cursor
 **-----------------------------------------------------*/
const medical_clinic_center_customCursor = {
  init: function () {
    this.medical_clinic_center_customCursor();
  },
  isVariableDefined: function (el) {
    return typeof el !== "undefined" && el !== null;
  },
  select: function (selectors) {
    return document.querySelector(selectors);
  },
  selectAll: function (selectors) {
    return document.querySelectorAll(selectors);
  },
  medical_clinic_center_customCursor: function () {
    const medical_clinic_center_cursorDot = this.select(".cursor-point");
    const medical_clinic_center_cursorOutline = this.select(".cursor-point-outline");
    if (this.isVariableDefined(medical_clinic_center_cursorDot) && this.isVariableDefined(medical_clinic_center_cursorOutline)) {
      const cursor = {
        delay: 8,
        _x: 0,
        _y: 0,
        endX: window.innerWidth / 2,
        endY: window.innerHeight / 2,
        cursorVisible: true,
        cursorEnlarged: false,
        $dot: medical_clinic_center_cursorDot,
        $outline: medical_clinic_center_cursorOutline,

        init: function () {
          this.dotSize = this.$dot.offsetWidth;
          this.outlineSize = this.$outline.offsetWidth;
          this.setupEventListeners();
          this.animateDotOutline();
        },

        updateCursor: function (e) {
          this.cursorVisible = true;
          this.toggleCursorVisibility();
          this.endX = e.clientX;
          this.endY = e.clientY;
          this.$dot.style.top = `${this.endY}px`;
          this.$dot.style.left = `${this.endX}px`;
        },

        setupEventListeners: function () {
          window.addEventListener("load", () => {
            this.cursorEnlarged = false;
            this.toggleCursorSize();
          });

          medical_clinic_center_customCursor.selectAll("a, button").forEach((el) => {
            el.addEventListener("mouseover", () => {
              this.cursorEnlarged = true;
              this.toggleCursorSize();
            });
            el.addEventListener("mouseout", () => {
              this.cursorEnlarged = false;
              this.toggleCursorSize();
            });
          });

          document.addEventListener("mousedown", () => {
            this.cursorEnlarged = true;
            this.toggleCursorSize();
          });
          document.addEventListener("mouseup", () => {
            this.cursorEnlarged = false;
            this.toggleCursorSize();
          });

          document.addEventListener("mousemove", (e) => {
            this.updateCursor(e);
          });

          document.addEventListener("mouseenter", () => {
            this.cursorVisible = true;
            this.toggleCursorVisibility();
            this.$dot.style.opacity = 1;
            this.$outline.style.opacity = 1;
          });

          document.addEventListener("mouseleave", () => {
            this.cursorVisible = false;
            this.toggleCursorVisibility();
            this.$dot.style.opacity = 0;
            this.$outline.style.opacity = 0;
          });
        },

        animateDotOutline: function () {
          this._x += (this.endX - this._x) / this.delay;
          this._y += (this.endY - this._y) / this.delay;
          this.$outline.style.top = `${this._y}px`;
          this.$outline.style.left = `${this._x}px`;

          requestAnimationFrame(this.animateDotOutline.bind(this));
        },

        toggleCursorSize: function () {
          if (this.cursorEnlarged) {
            this.$dot.style.transform = "translate(-50%, -50%) scale(0.75)";
            this.$outline.style.transform = "translate(-50%, -50%) scale(1.6)";
          } else {
            this.$dot.style.transform = "translate(-50%, -50%) scale(1)";
            this.$outline.style.transform = "translate(-50%, -50%) scale(1)";
          }
        },

        toggleCursorVisibility: function () {
          if (this.cursorVisible) {
            this.$dot.style.opacity = 1;
            this.$outline.style.opacity = 1;
          } else {
            this.$dot.style.opacity = 0;
            this.$outline.style.opacity = 0;
          }
        },
      };
      cursor.init();
    }
  },
};
medical_clinic_center_customCursor.init();