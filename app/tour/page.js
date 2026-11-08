'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import CategoryCard from '@/components/cards/CategoryCard';
import { useVideoTimeline, PLAYBACK_MODES } from '@/components/video/PersistentVideo';
import TextSplit from '@/components/animations/TextSplit';
import styles from './page.module.css';

// Alternating diagonal corner masks for category cards:
const CORNER_MASKS = [
  // Card 1: Top-Left corner expanding down-right
  {
    from: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
    to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  },
  // Card 2: Top-Right corner expanding down-left
  {
    from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
    to: 'polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)',
  },
  // Card 3: Bottom-Left corner expanding up-right
  {
    from: 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)',
    to: 'polygon(0% 100%, 0% 0%, 100% 0%, 100% 100%)',
  },
  // Card 4: Bottom-Right corner expanding up-left
  {
    from: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
    to: 'polygon(100% 100%, 0% 100%, 0% 0%, 100% 0%)',
  },
  // Card 5: Top-Left corner (repeat)
  {
    from: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
    to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  },
  // Card 6: Top-Right corner (repeat)
  {
    from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
    to: 'polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)',
  },
];

export default function TourPage() {
  const containerRef = useRef(null);
  const pinWrapperRef = useRef(null);

  const {
    setSegment,
    scheduleTourSeek,
    setOnTourProgress,
    seekTourLocalTime,
    getTourLocalTime,
    setPlaybackMode,
    setHasSeenIntro,
  } = useVideoTimeline();

  const tlRef = useRef(null);
  const tourTargetLocalRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const scrollbarSettleTimerRef = useRef(null);

  // -------------------------------------------------------------------
  // GSAP Visual Overlay Timeline Setup
  // -------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setHasSeenIntro(true);

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      try {
        sessionStorage.setItem('hasVisitedTour', 'true');
        sessionStorage.setItem('hasSeenResortIntro', 'true');
      } catch { }
    }

    const container = containerRef.current;
    if (!container) return;

    // Set Page 2 segment: raw 30s to 162s — starts right after Page 1 ends, last 8s cut (132s total)
    setSegment({
      start: 30,
      end: 162,
    });
    setPlaybackMode(PLAYBACK_MODES.PHASE2_SCROLL);

    // Initial seek to local time 0 (raw 30s — continuation of Page 1)
    tourTargetLocalRef.current = 0;
    seekTourLocalTime(0, true);

    let ctx = gsap.context(() => {
      // Independent paused timeline driven authoritatively by virtual progress
      const tl = gsap.timeline({ paused: true });

      // Initial setup for overlay containers and characters
      gsap.set(
        ['.overlay-dining', '.overlay-children', '.overlay-rooms', '.overlay-rooftop', '.overlay-sea', '.overlay-cards'],
        { autoAlpha: 0 }
      );
      gsap.set(
        [
          '.dining-heading-char', '.dining-support-char',
          '.children-heading-char', '.children-support-char',
          '.rooms-heading-char', '.rooms-support-char',
          '.rooftop-heading-char', '.rooftop-support-char',
          '.sea-heading-char', '.sea-support-char',
        ],
        { opacity: 0, y: 6 }
      );

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const cardEls = container.querySelectorAll('.floating-category-card');
      if (prefersReducedMotion) {
        gsap.set(cardEls, { opacity: 0, clipPath: 'none', pointerEvents: 'none' });
      } else {
        cardEls.forEach((el, i) => {
          gsap.set(el, {
            clipPath: CORNER_MASKS[i % CORNER_MASKS.length].from,
            opacity: 0,
            pointerEvents: 'none',
          });
        });
      }

      // Tour Scroll Cue fades out at beginning
      tl.to('.tour-scroll-cue', {
        opacity: 0,
        y: -15,
        duration: 0.5,
        ease: 'power2.out',
      }, 0);

      // OVERLAY 3: Dining (0.3 to 1.7)
      tl.to('.overlay-dining', { autoAlpha: 1, duration: 0.01 }, 0.3);
      tl.to('.dining-heading-char', {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.016,
        ease: 'power2.out',
      }, 0.32);
      tl.to('.dining-support-char', {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.007,
        ease: 'power2.out',
      }, 0.5);
      tl.to('.dining-heading-char', {
        opacity: 0,
        y: -8,
        duration: 0.25,
        stagger: 0.01,
        ease: 'power2.in',
      }, 1.4);
      tl.to('.dining-support-char', {
        opacity: 0,
        y: -6,
        duration: 0.2,
        stagger: 0.006,
        ease: 'power2.in',
      }, 1.45);
      tl.to('.overlay-dining', { autoAlpha: 0, duration: 0.01 }, 1.7);

      // OVERLAY 4: Children's Area (2.4 to 3.7)
      tl.to('.overlay-children', { autoAlpha: 1, duration: 0.01 }, 2.4);
      tl.to('.children-heading-char', {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.016,
        ease: 'power2.out',
      }, 2.42);
      tl.to('.children-support-char', {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.007,
        ease: 'power2.out',
      }, 2.6);
      tl.to('.children-heading-char', {
        opacity: 0,
        y: -8,
        duration: 0.25,
        stagger: 0.01,
        ease: 'power2.in',
      }, 3.4);
      tl.to('.children-support-char', {
        opacity: 0,
        y: -6,
        duration: 0.2,
        stagger: 0.006,
        ease: 'power2.in',
      }, 3.45);
      tl.to('.overlay-children', { autoAlpha: 0, duration: 0.01 }, 3.7);

      // OVERLAY 5: Rooms (4.9 to 6.1)
      tl.to('.overlay-rooms', { autoAlpha: 1, duration: 0.01 }, 4.9);
      tl.to('.rooms-heading-char', {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.016,
        ease: 'power2.out',
      }, 4.92);
      tl.to('.rooms-support-char', {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.007,
        ease: 'power2.out',
      }, 5.1);
      tl.to('.rooms-heading-char', {
        opacity: 0,
        y: -8,
        duration: 0.25,
        stagger: 0.01,
        ease: 'power2.in',
      }, 5.8);
      tl.to('.rooms-support-char', {
        opacity: 0,
        y: -6,
        duration: 0.2,
        stagger: 0.006,
        ease: 'power2.in',
      }, 5.85);
      tl.to('.overlay-rooms', { autoAlpha: 0, duration: 0.01 }, 6.1);

      // OVERLAY 6: Rooftop (6.2 to 7.3)
      tl.to('.overlay-rooftop', { autoAlpha: 1, duration: 0.01 }, 6.2);
      tl.to('.rooftop-heading-char', {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.016,
        ease: 'power2.out',
      }, 6.22);
      tl.to('.rooftop-support-char', {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.007,
        ease: 'power2.out',
      }, 6.4);
      tl.to('.rooftop-heading-char', {
        opacity: 0,
        y: -8,
        duration: 0.25,
        stagger: 0.01,
        ease: 'power2.in',
      }, 7.0);
      tl.to('.rooftop-support-char', {
        opacity: 0,
        y: -6,
        duration: 0.2,
        stagger: 0.006,
        ease: 'power2.in',
      }, 7.05);
      tl.to('.overlay-rooftop', { autoAlpha: 0, duration: 0.01 }, 7.3);

      // OVERLAY 7: Sea Finale (8.0 to 8.95)
      tl.to('.overlay-sea', { autoAlpha: 1, duration: 0.01 }, 8.0);
      tl.to('.sea-heading-char', {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.016,
        ease: 'power2.out',
      }, 8.02);
      tl.to('.sea-support-char', {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.007,
        ease: 'power2.out',
      }, 8.2);
      tl.to('.sea-heading-char', {
        opacity: 0,
        y: -8,
        duration: 0.25,
        stagger: 0.01,
        ease: 'power2.in',
      }, 8.75);
      tl.to('.sea-support-char', {
        opacity: 0,
        y: -6,
        duration: 0.2,
        stagger: 0.006,
        ease: 'power2.in',
      }, 8.8);
      tl.to('.overlay-sea', { autoAlpha: 0, duration: 0.01 }, 8.95);

      // Category Cards (9.50 to 10.35)
      // Visual placeholders only: pointerEvents strictly 'none'
      tl.to('.overlay-cards', { autoAlpha: 1, duration: 0.01 }, 9.50);
      if (prefersReducedMotion) {
        tl.to(cardEls, {
          opacity: 1,
          duration: 0.35,
          stagger: 0.08,
          pointerEvents: 'none',
          ease: 'power1.out',
        }, 9.55);
      } else {
        cardEls.forEach((el, i) => {
          const mask = CORNER_MASKS[i % CORNER_MASKS.length];
          tl.to(el, {
            clipPath: mask.to,
            opacity: 1,
            pointerEvents: 'none',
            duration: 0.30,
            ease: 'power2.out',
          }, 9.55 + i * 0.10);
        });
      }

      // Final hold over sea (10.35 to 10.60)
      tl.to({}, { duration: 0.25 }, 10.35);

      tl.progress(0);
      tlRef.current = tl;
    }, container);

    return () => {
      isMounted = false;
      if (ctx) ctx.revert();
      tlRef.current = null;
    };
  }, [setSegment, seekTourLocalTime, setPlaybackMode, setHasSeenIntro]);

  // -------------------------------------------------------------------
  // Real-time SmoothDamp Frame Callback: Lockstep Sync with Zero Jerk
  // -------------------------------------------------------------------
  useEffect(() => {
    setOnTourProgress((progress, localTime) => {
      // 1. Update visual overlays timeline in real-time
      if (tlRef.current) {
        tlRef.current.progress(progress);
      }

      // 2. Synchronize the original browser scrollbar smoothly
      isProgrammaticScrollRef.current = true;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      window.scrollTo(0, progress * maxScroll);
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    });

    return () => {
      setOnTourProgress(null);
    };
  }, [setOnTourProgress]);

  // -------------------------------------------------------------------
  // Authoritative SmoothDamp Scroll: Scaled to 2/3 (1.0s max, 0.67s small nudge)
  // -------------------------------------------------------------------
  const triggerScrollStep = useCallback((direction, magnitude = 100) => {
    if (!direction) return;

    // Reduced to 2/3 for slower, more controlled movement: small nudge = 0.67s, normal scroll = 1.0s max
    const deltaSeconds = magnitude < 30 ? 0.67 : 1.0;

    const liveLocal = getTourLocalTime();
    const currentTarget = tourTargetLocalRef.current;

    // Target never more than 1.0s ahead of live position to prevent runaway jumps
    let newTarget = currentTarget + direction * deltaSeconds;
    newTarget = Math.max(liveLocal - 1.0, Math.min(liveLocal + 1.0, newTarget));
    newTarget = Math.max(0, Math.min(132, newTarget));

    // Endpoint boundaries
    if (liveLocal <= 0 && direction < 0) return;
    if (liveLocal >= 132 && direction > 0) return;

    tourTargetLocalRef.current = newTarget;

    // Dispatch smoothDamp seek with identical physics to Page 1 for silky slowmo stop!
    scheduleTourSeek(newTarget);
  }, [getTourLocalTime, scheduleTourSeek]);

  // -------------------------------------------------------------------
  // Native Browser Scrollbar Interaction (Direct thumb dragging)
  // -------------------------------------------------------------------
  const handleNativeScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    const targetLocal = scrollProgress * 132;
    tourTargetLocalRef.current = targetLocal;

    // Immediately update visual overlays
    if (tlRef.current) {
      tlRef.current.progress(scrollProgress);
    }

    // In fast scrollbar drag: "no need to show video", settle cleanly at target
    if (scrollbarSettleTimerRef.current) {
      clearTimeout(scrollbarSettleTimerRef.current);
    }

    // Coalesced seek while dragging
    seekTourLocalTime(targetLocal, false);

    scrollbarSettleTimerRef.current = setTimeout(() => {
      scheduleTourSeek(targetLocal);
    }, 120);
  }, [scheduleTourSeek, seekTourLocalTime]);

  // -------------------------------------------------------------------
  // Input Interception: Wheel, Touch, Keyboard
  // -------------------------------------------------------------------
  useEffect(() => {
    let lastTouchY = 0;

    const handleWheel = (e) => {
      if (e.ctrlKey) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      let delta = e.deltaY;
      if (e.deltaMode === 1) {
        delta *= 16;
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight;
      }

      const direction = Math.sign(delta);
      const magnitude = Math.abs(delta);
      triggerScrollStep(direction, magnitude);
    };

    const handleTouchStart = (e) => {
      if (!e.touches.length) return;
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!e.touches.length) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      const currentY = e.touches[0].clientY;
      const rawDelta = lastTouchY - currentY;
      lastTouchY = currentY;

      const direction = Math.sign(rawDelta);
      const magnitude = Math.abs(rawDelta);
      triggerScrollStep(direction, magnitude);
    };

    const handleKeyDown = (e) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, button, a, [contenteditable="true"]')
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          e.stopPropagation();
          triggerScrollStep(1, 100);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          e.stopPropagation();
          triggerScrollStep(-1, 100);
          break;
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          triggerScrollStep(e.shiftKey ? -1 : 1, 100);
          break;
        case 'Home':
          e.preventDefault();
          e.stopPropagation();
          tourTargetLocalRef.current = 0;
          scheduleTourSeek(0);
          break;
        case 'End':
          e.preventDefault();
          e.stopPropagation();
          tourTargetLocalRef.current = 132;
          scheduleTourSeek(132);
          break;
        default:
          break;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
    window.addEventListener('scroll', handleNativeScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleNativeScroll, true);

      if (scrollbarSettleTimerRef.current) {
        clearTimeout(scrollbarSettleTimerRef.current);
        scrollbarSettleTimerRef.current = null;
      }
    };
  }, [triggerScrollStep, handleNativeScroll, scheduleTourSeek]);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Discreet Navigation Bar */}
      <header className={styles.topBar}>
        <span className={styles.brandLogo}>Magical Resort</span>
        <Link
          href="/"
          className={styles.backLink}
          scroll={false}
          onClick={() => {
            setHasSeenIntro(true);
            try {
              sessionStorage.setItem('returnToStory', 'true');
            } catch { }
          }}
        >
          <span>&larr;</span>
          <span>Back to Story</span>
        </Link>
      </header>

      {/* Fixed Viewport Content */}
      <div ref={pinWrapperRef} className={styles.pinWrapper}>
        <div className={styles.tourContent}>
          {/* Scroll Cue at bottom */}
          <div className={`tour-scroll-cue ${styles.scrollCue}`}>
            <span>Scroll to Tour Grounds</span>
            <div className={styles.scrollLine} />
          </div>

          {/* Overlay 3 — Dining (Middle-Right) */}
          <div className={`overlay-dining ${styles.moment} ${styles.posMiddleRight}`}>
            <h2 className={styles.momentHeading}>
              <TextSplit text="Exceptional Dining" letterClassName="dining-heading-char" />
            </h2>
            <p className={styles.momentSupport}>
              <TextSplit
                text="Discover flavours made for memorable moments."
                letterClassName="dining-support-char"
              />
            </p>
          </div>

          {/* Overlay 4 — Children's Area (Middle-Right) */}
          <div className={`overlay-children ${styles.moment} ${styles.posMiddleRight}`}>
            <h2 className={styles.momentHeading}>
              <TextSplit text="Fun for Every Generation" letterClassName="children-heading-char" />
            </h2>
            <p className={styles.momentSupport}>
              <TextSplit
                text="Make room for moments everyone will remember."
                letterClassName="children-support-char"
              />
            </p>
          </div>

          {/* Overlay 5 — Room or Suite (Middle-Right) */}
          <div className={`overlay-rooms ${styles.moment} ${styles.posMiddleRight}`}>
            <h2 className={styles.momentHeading}>
              <TextSplit text="Your Private Sanctuary" letterClassName="rooms-heading-char" />
            </h2>
            <p className={styles.momentSupport}>
              <TextSplit
                text="Unwind in a space designed for effortless comfort."
                letterClassName="rooms-support-char"
              />
            </p>
          </div>

          {/* Overlay 6 — Rooftop (Middle-Left) */}
          <div className={`overlay-rooftop ${styles.moment} ${styles.posMiddleLeft}`}>
            <h2 className={styles.momentHeading}>
              <TextSplit text="Elevate Your Experience" letterClassName="rooftop-heading-char" />
            </h2>
            <p className={styles.momentSupport}>
              <TextSplit
                text="A different perspective on resort living."
                letterClassName="rooftop-support-char"
              />
            </p>
          </div>

          {/* Overlay 7 — Sea and Beach Finale (Middle-Right) */}
          <div className={`overlay-sea ${styles.moment} ${styles.posMiddleRight}`}>
            <h2 className={styles.momentHeading}>
              <TextSplit text="Where Serenity Meets the Sea" letterClassName="sea-heading-char" />
            </h2>
            <p className={styles.momentSupport}>
              <TextSplit
                text="Let the horizon become your escape."
                letterClassName="sea-support-char"
              />
            </p>
          </div>

          {/* Six Compact Category Cards Floating Directly Over Moving Sea Video (Non-clickable placeholders) */}
          <div className={`overlay-cards ${styles.floatingCardsOverlay}`}>
            <div className={styles.floatingCardsGrid}>
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="🛏️"
                title="Rooms & Suites"
                description="Discover your private retreat, designed for comfort and tranquility."
              />
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="🍽️"
                title="Dining"
                description="Savour memorable flavours in an inviting coastal setting."
              />
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="🏊"
                title="Swimming Pool"
                description="Unwind beside the water and enjoy the tropical surroundings."
              />
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="🌿"
                title="Spa & Wellness"
                description="Make space for relaxation, balance, and personal well-being."
              />
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="🥂"
                title="Events & Celebrations"
                description="Bring meaningful gatherings and special occasions to life."
              />
              <CategoryCard
                className="floating-category-card"
                badge="COMING SOON"
                icon="⛵"
                title="Activities & Experiences"
                description="Explore memorable moments for every kind of getaway."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
