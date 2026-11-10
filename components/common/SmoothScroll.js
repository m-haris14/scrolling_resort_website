"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }) {
    const pathname = usePathname();
    const lenisRef = useRef(null);

    // --------------------------------------------------
    // 1. Shared Lenis instance
    // Page 1 retains its original smooth scrolling behavior.
    // --------------------------------------------------
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }

        const lenis = new Lenis({
            autoRaf: false,
            smoothWheel: true,
            lerp: 0.1,
            virtualScroll: (data) => {
                // When tour scroll limiter is active, prevent Lenis from
                // initiating its own independent scroll animation loop
                if (
                    typeof window !== "undefined" &&
                    window.__tourScrollLimiterActive
                ) {
                    if (data.event?.cancelable) {
                        data.event.preventDefault();
                    }
                    return false;
                }
                return true;
            },
        });

        lenisRef.current = lenis;
        window.__lenis = lenis;

        const handleScroll = () => {
            ScrollTrigger.update();
        };

        lenis.on("scroll", handleScroll);

        const update = (time) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        const handleBeforeUnload = () => {
            if ("scrollRestoration" in history) {
                history.scrollRestoration = "manual";
            }
            window.scrollTo(0, 0);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("pagehide", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("pagehide", handleBeforeUnload);

            lenis.off("scroll", handleScroll);
            gsap.ticker.remove(update);

            lenis.destroy();
            lenisRef.current = null;

            window.__lenis = null;
            window.__tourScrollLimiterActive = false;

            gsap.ticker.lagSmoothing(500, 33);
        };
    }, []);

    // --------------------------------------------------
    // 2. Route isolation:
    // Page 1 retains its full Lenis and ScrollTrigger functionality.
    // Page 2 (/tour) uses the original browser scrollbar with custom video control.
    // Lenis is paused on /tour to avoid interfering with wheel inputs.
    // --------------------------------------------------
    useEffect(() => {
        const isTourPage =
            pathname === "/tour" || pathname.startsWith("/tour/");

        const lenis = lenisRef.current;

        if (isTourPage) {
            window.__tourScrollLimiterActive = true;

            const prevHtmlOverflowY = document.documentElement.style.overflowY;
            const prevBodyOverflowY = document.body.style.overflowY;

            document.documentElement.style.overflowY = "auto";
            document.body.style.overflowY = "visible";

            window.scrollTo(0, 0);

            if (lenis) {
                lenis.scrollTo(0, { immediate: true, force: true });
                lenis.stop();
            }

            return () => {
                window.__tourScrollLimiterActive = false;

                document.documentElement.style.overflowY = prevHtmlOverflowY;
                document.body.style.overflowY = prevBodyOverflowY;

                if (lenis) {
                    lenis.start();
                    requestAnimationFrame(() => {
                        ScrollTrigger.refresh();
                    });
                }
            };
        } else {
            window.__tourScrollLimiterActive = false;
            if (lenis) {
                lenis.start();
            }
        }
    }, [pathname]);

    return children;
}
