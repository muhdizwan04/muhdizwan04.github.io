/**
 * IZWAN HAMDAN — PORTFOLIO SCROLL ENGINE
 * Monochrome build. All motion is scroll-driven; nothing decorative loops on its own
 * except the two marquees.
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isDesktop = function () { return window.innerWidth > 900; };

    /* ---------------------------------------------------------
       1. Smooth scroll to a section, accounting for the fixed nav
       --------------------------------------------------------- */
    window.scrollToSection = function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var offset = isDesktop() ? 70 : 60;
        var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
        closeNav();
    };

    /* ---------------------------------------------------------
       2. Reveal on scroll — [data-reveal] fades up, .split masks
          its lines upward from behind an overflow-hidden clip.
       --------------------------------------------------------- */
    var revealer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');

            // Fill any skill bars living inside this element
            entry.target.querySelectorAll('[data-bar]').forEach(function (bar) {
                bar.style.width = bar.getAttribute('data-bar') + '%';
            });

            revealer.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-reveal], [data-split]').forEach(function (el) {
        revealer.observe(el);
    });

    // Stagger the masked lines of every split heading
    document.querySelectorAll('[data-split]').forEach(function (h) {
        h.querySelectorAll('.line > i').forEach(function (line, i) {
            line.style.setProperty('--d', (i * 110) + 'ms');
        });
    });

    /* ---------------------------------------------------------
       3. Scroll progress bar + nav condense
       --------------------------------------------------------- */
    var progress = document.getElementById('progress');
    var nav = document.getElementById('nav');
    var heroImg = document.getElementById('heroImg');
    var stackItems = Array.prototype.slice.call(document.querySelectorAll('.stack-item'));
    var ticking = false;

    function onScroll() {
        var y = window.pageYOffset;
        var max = document.documentElement.scrollHeight - window.innerHeight;

        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        nav.classList.toggle('scrolled', y > 40);

        if (!reduceMotion) {
            // Hero portrait parallax — the image is 112% tall, so it has room to drift
            if (heroImg && y < window.innerHeight) {
                heroImg.style.transform = 'translateY(' + (-y * 0.07) + 'px)';
            }
            depthStack();
        }

        ticking = false;
    }

    /* Stacked work cards: as the next card slides up over the pinned one,
       push the pinned card back in Z so the deck reads as a physical stack. */
    function depthStack() {
        if (!isDesktop()) return;

        var pin = 110; // matches the sticky offset in CSS

        stackItems.forEach(function (item, i) {
            var card = item.firstElementChild;
            var next = stackItems[i + 1];
            if (!card) return;

            if (!next) {
                card.style.transform = '';
                card.style.opacity = '';
                return;
            }

            var nextTop = next.getBoundingClientRect().top;
            var span = window.innerHeight - pin;
            var t = 1 - (nextTop - pin) / span;
            t = Math.max(0, Math.min(1, t));

            card.style.transform = 'scale(' + (1 - t * 0.055).toFixed(4) + ')';
            card.style.opacity = (1 - t * 0.4).toFixed(3);
        });
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }
    }, { passive: true });

    window.addEventListener('resize', onScroll);

    /* ---------------------------------------------------------
       4. Active nav link tracking
       --------------------------------------------------------- */
    var navButtons = document.querySelectorAll('[data-nav]');
    var sections = ['home', 'story', 'work', 'aizztech', 'jersey', 'contact']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            navButtons.forEach(function (b) {
                b.classList.toggle('current', b.getAttribute('data-nav') === entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });

    /* ---------------------------------------------------------
       5. Mobile nav
       --------------------------------------------------------- */
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');

    function closeNav() {
        links.classList.remove('open');
        if (toggle) toggle.textContent = 'Menu';
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.textContent = open ? 'Close' : 'Menu';
        });
    }

    window.addEventListener('resize', function () {
        if (isDesktop()) closeNav();
    });

    /* ---------------------------------------------------------
       6. Admin PPAS screenshot modal
       --------------------------------------------------------- */
    var modal = document.getElementById('imageModal');

    window.openModal = function () {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function () {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };

    modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.classList.contains('modal-inner')) window.closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { window.closeModal(); closeNav(); }
    });

    /* ---------------------------------------------------------
       7. Kick off
       --------------------------------------------------------- */
    onScroll();
})();
