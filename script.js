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
    /* Every group of sticky cards that should recede as the next one covers it.
       Work cards wrap their card in .stack-item; timeline entries are the card. */
    var stacks = [];

    document.querySelectorAll('.stack').forEach(function (group) {
        stacks.push({
            items: Array.prototype.slice.call(group.querySelectorAll('.stack-item')),
            inner: true,
            pin: 110
        });
    });

    document.querySelectorAll('.tl-stack').forEach(function (group) {
        stacks.push({
            items: Array.prototype.slice.call(group.children),
            inner: false,
            pin: 108
        });
    });
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

    /* As the next card slides up over the pinned one, push the pinned card
       back in Z so the deck reads as a physical stack. */
    function depthStack() {
        if (!isDesktop()) return;

        stacks.forEach(function (stack) {
            stack.items.forEach(function (item, i) {
                var card = stack.inner ? item.firstElementChild : item;
                var next = stack.items[i + 1];
                if (!card) return;

                if (!next) {
                    card.style.transform = '';
                    card.style.opacity = '';
                    card.style.removeProperty('--covered');
                    return;
                }

                var nextTop = next.getBoundingClientRect().top;
                var span = window.innerHeight - stack.pin;
                var t = 1 - (nextTop - stack.pin) / span;
                t = Math.max(0, Math.min(1, t));

                card.style.transform = 'scale(' + (1 - t * 0.05).toFixed(4) + ')';
                card.style.opacity = (1 - t * 0.38).toFixed(3);
                // photos fade out faster than the card, so a covered card's
                // photo never shows through the semi-transparent one on top
                card.style.setProperty('--covered', t.toFixed(3));
            });
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
    var sections = ['home', 'story', 'aizztech', 'work', 'jersey', 'contact']
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
       7. Timeline photo lightbox
       --------------------------------------------------------- */
    var lb = document.getElementById('tlLightbox');
    var lbImg = lb.querySelector('.lb-fig img');
    var lbTitle = lb.querySelector('.lb-title');
    var lbCount = lb.querySelector('.lb-count');
    var lbPrev = lb.querySelector('.lb-prev');
    var lbNext = lb.querySelector('.lb-next');
    var lbPhotos = [];
    var lbIndex = 0;
    var lbOpener = null;

    function lbShow(i) {
        lbIndex = (i + lbPhotos.length) % lbPhotos.length;
        lbImg.src = lbPhotos[lbIndex].src;
        lbImg.alt = lbPhotos[lbIndex].alt;
        lbCount.textContent = lbPhotos.length > 1 ? (lbIndex + 1) + ' / ' + lbPhotos.length : '';
    }

    function lbOpen(btn) {
        lbOpener = btn;
        lbPhotos = Array.prototype.map.call(btn.querySelectorAll('img'), function (img, i) {
            return { src: img.getAttribute('src'), alt: img.alt || btn.querySelectorAll('img')[0].alt + ' (' + (i + 1) + ')' };
        });
        lbTitle.textContent = btn.closest('li').querySelector('h5').textContent;
        lbPrev.hidden = lbNext.hidden = lbPhotos.length < 2;
        lbShow(0);
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () { lb.classList.add('open'); });
        lb.querySelector('.lb-close').focus();
    }

    function lbClose() {
        if (lb.hidden) return;
        lb.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { lb.hidden = true; }, 350);
        if (lbOpener) lbOpener.focus();
    }

    document.querySelectorAll('.tl-pic').forEach(function (btn) {
        btn.addEventListener('click', function () { lbOpen(btn); });
    });

    lb.querySelector('.lb-close').addEventListener('click', lbClose);
    lbPrev.addEventListener('click', function () { lbShow(lbIndex - 1); });
    lbNext.addEventListener('click', function () { lbShow(lbIndex + 1); });
    lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('lb-fig')) lbClose();
    });

    document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') lbClose();
        else if (e.key === 'ArrowRight' && lbPhotos.length > 1) lbShow(lbIndex + 1);
        else if (e.key === 'ArrowLeft' && lbPhotos.length > 1) lbShow(lbIndex - 1);
    });

    /* ---------------------------------------------------------
       8. Kick off
       --------------------------------------------------------- */
    onScroll();
})();
