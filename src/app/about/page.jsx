"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const offerings = [
    {
        icon: "📚",
        title: "Structured curriculum",
        description:
            "BAMS-aligned courses taught by verified Ayurveda physicians and researchers. From Dravya Guna to advanced Panchakarma, Nadi Vigyan, and Agada Tantra — built for serious learners.",
    },
    {
        icon: "🩺",
        title: "Expert consultations",
        description:
            "Private one-on-one sessions with certified Ayurveda practitioners — for students seeking mentorship or patients seeking holistic care.",
    },
    {
        icon: "📄",
        title: "Digital marketplace",
        description:
            "Clinical notes, research papers, herbal compendiums, and study guides — curated by domain experts and available for instant download.",
    },
    {
        icon: "📝",
        title: "Test series & assessments",
        description:
            "Timed MCQ test series, automated scoring, and detailed performance analytics for competitive exams and clinical certifications.",
    },
];

const reasons = [
    "Students get structured, progressive learning paths",
    "Experts get a platform to share knowledge and earn from consultations",
    "The Ayurvedic community grows together — connected, credentialed, and confident",
];

const audience = [
    { label: "For students", value: "Structured, progressive learning" },
    {
        label: "For practitioners",
        value: "Mentorship, visibility, and clinical opportunity",
    },
    {
        label: "For the community",
        value: "A connected and credentialed ecosystem",
    },
];

export default function AboutPage() {
    const rootRef = useRef(null);
    const cursorRef = useRef(null);
    const cursorDotRef = useRef(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const ctx = gsap.context(() => {
            const q = gsap.utils.selector(root);

            if (!reduceMotion) {
                // Cursor
                const moveCursor = (e) => {
                    gsap.to(cursorRef.current, {
                        x: e.clientX - 18,
                        y: e.clientY - 18,
                        duration: 0.35,
                        ease: "power3.out",
                    });
                    gsap.to(cursorDotRef.current, {
                        x: e.clientX - 4,
                        y: e.clientY - 4,
                        duration: 0.12,
                        ease: "power2.out",
                    });
                };

                window.addEventListener("mousemove", moveCursor);

                const interactive = q("[data-magnetic]");
                interactive.forEach((el) => {
                    const handleMove = (e) => {
                        const rect = el.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;

                        gsap.to(el, {
                            x: x * 0.14,
                            y: y * 0.14,
                            duration: 0.45,
                            ease: "power3.out",
                        });
                    };

                    const handleLeave = () => {
                        gsap.to(el, {
                            x: 0,
                            y: 0,
                            duration: 0.5,
                            ease: "elastic.out(1, 0.45)",
                        });
                    };

                    const enter = () => {
                        gsap.to(cursorRef.current, {
                            scale: 1.7,
                            opacity: 0.9,
                            duration: 0.25,
                            ease: "power2.out",
                        });
                    };

                    const leave = () => {
                        gsap.to(cursorRef.current, {
                            scale: 1,
                            opacity: 0.7,
                            duration: 0.25,
                            ease: "power2.out",
                        });
                    };

                    el.addEventListener("mousemove", handleMove);
                    el.addEventListener("mouseleave", handleLeave);
                    el.addEventListener("mouseenter", enter);
                    el.addEventListener("mouseleave", leave);
                });

                // Ambient motion
                gsap.to(".orb-1", {
                    x: 60,
                    y: 30,
                    scale: 1.08,
                    duration: 8,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });

                gsap.to(".orb-2", {
                    x: -50,
                    y: 40,
                    scale: 0.95,
                    duration: 10,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });

                gsap.to(".orb-3", {
                    y: -35,
                    x: 20,
                    scale: 1.04,
                    duration: 9,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });

                gsap.to(".hero-grid", {
                    yPercent: 10,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".hero-section",
                        start: "top top",
                        end: "bottom top",
                        scrub: 1,
                    },
                });

                gsap.to(".hero-card", {
                    yPercent: -8,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".hero-section",
                        start: "top top",
                        end: "bottom top",
                        scrub: 1,
                    },
                });

                // Hero intro
                const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

                heroTl
                    .fromTo(
                        ".eyebrow",
                        { y: 18, opacity: 0, scale: 0.94 },
                        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }
                    )
                    .fromTo(
                        ".hero-title .line",
                        { y: 120, opacity: 0, rotateX: -18 },
                        {
                            y: 0,
                            opacity: 1,
                            rotateX: 0,
                            duration: 1,
                            stagger: 0.08,
                        },
                        "-=0.25"
                    )
                    .fromTo(
                        ".hero-copy",
                        { y: 24, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.8 },
                        "-=0.45"
                    )
                    .fromTo(
                        ".hero-actions > *",
                        { y: 20, opacity: 0, scale: 0.96 },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.6,
                            stagger: 0.08,
                            ease: "back.out(1.3)",
                        },
                        "-=0.45"
                    )
                    .fromTo(
                        ".hero-card",
                        { x: 40, opacity: 0, scale: 0.96, rotateY: -10 },
                        { x: 0, opacity: 1, scale: 1, rotateY: 0, duration: 1 },
                        "-=0.7"
                    );

                // Section headings
                q("[data-reveal-heading]").forEach((el) => {
                    gsap.fromTo(
                        el,
                        { y: 28, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: "power3.out",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 85%",
                                toggleActions: "play none none none",
                            },
                        }
                    );
                });

                q("[data-reveal-copy]").forEach((el, i) => {
                    gsap.fromTo(
                        el,
                        { y: 22, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.7,
                            delay: i * 0.05,
                            ease: "power3.out",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 88%",
                                toggleActions: "play none none none",
                            },
                        }
                    );
                });

                q("[data-card]").forEach((el, i) => {
                    gsap.fromTo(
                        el,
                        { y: 34, opacity: 0, scale: 0.97 },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.8,
                            delay: i * 0.06,
                            ease: "back.out(1.25)",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 88%",
                                toggleActions: "play none none none",
                            },
                        }
                    );

                    el.addEventListener("mouseenter", () => {
                        gsap.to(el, {
                            y: -8,
                            scale: 1.01,
                            duration: 0.35,
                            ease: "power2.out",
                        });
                    });

                    el.addEventListener("mouseleave", () => {
                        gsap.to(el, {
                            y: 0,
                            scale: 1,
                            duration: 0.4,
                            ease: "power2.out",
                        });
                    });
                });

                return () => {
                    window.removeEventListener("mousemove", moveCursor);
                };
            }
        }, root);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={rootRef}
            className="relative min-h-screen overflow-x-hidden bg-[#f6f3ee] text-[#111111] selection:bg-[#b8d7b0] selection:text-[#102014]"
        >
            {/* Custom cursor */}
            <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
                <div
                    ref={cursorRef}
                    className="absolute h-9 w-9 rounded-full border border-white/70 bg-white/10 backdrop-blur-md mix-blend-difference opacity-70"
                />
                <div
                    ref={cursorDotRef}
                    className="absolute h-2 w-2 rounded-full bg-white mix-blend-difference"
                />
            </div>

            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="orb-1 absolute left-[-8rem] top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[#d8e7d1] blur-3xl opacity-70" />
                <div className="orb-2 absolute right-[-7rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[#efe4cf] blur-3xl opacity-70" />
                <div className="orb-3 absolute bottom-[-8rem] left-[30%] h-[24rem] w-[24rem] rounded-full bg-[#d7d2f3] blur-3xl opacity-35" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_40%)]" />
            </div>

            {/* Hero */}
            <section className="hero-section relative border-b border-black/8 px-6 pb-16 pt-24 md:px-12 lg:px-16 lg:pb-24">
                <div className="hero-grid relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="relative z-10">
                        <div className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#23452a] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                            <span className="h-2 w-2 rounded-full bg-[#5d8f50]" />
                            About AyuRxHub
                        </div>

                        <h1 className="hero-title mb-6 max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.04em] text-[#141414] md:text-6xl lg:text-[5.25rem]">
                            <span className="line block overflow-hidden">Where Ancient</span>
                            <span className="line block overflow-hidden">Wisdom Meets</span>
                            <span className="line block overflow-hidden italic text-[#547d49]">
                                Modern Precision.
                            </span>
                        </h1>

                        <p className="hero-copy mb-8 max-w-2xl text-base leading-8 text-[#4f4b42] md:text-lg">
                            AyuRxHub is India&apos;s premier digital platform dedicated to Ayurveda
                            education, clinical consultation, and practitioner development. We
                            bridge the gap between the timeless knowledge of traditional
                            Ayurvedic medicine and the tools, rigor, and accessibility of modern
                            healthcare technology.
                        </p>

                        <div className="hero-actions flex flex-wrap gap-4">
                            <button
                                data-magnetic
                                className="group rounded-full border border-[#5d8f50]/20 bg-[#162017] px-7 py-3 text-sm font-medium text-white shadow-[0_14px_40px_rgba(22,32,23,0.22)] transition-all duration-300 hover:scale-[1.02]"
                            >
                                <span className="inline-flex items-center gap-2">
                                    Partner with us
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                </span>
                            </button>

                            <button
                                data-magnetic
                                className="rounded-full border border-black/10 bg-white/65 px-7 py-3 text-sm font-medium text-[#161616] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-white"
                            >
                                Explore courses
                            </button>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#615a4f]">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#5d8f50]" />
                                Trusted platform
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#c2a86a]" />
                                Structured learning
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#7f8cc9]" />
                                Modern clinical ecosystem
                            </div>
                        </div>
                    </div>

                    <div className="hero-card relative z-10">
                        <div className="absolute inset-0 rounded-[2rem] bg-white/30 blur-2xl" />
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/50 p-4 backdrop-blur-2xl shadow-[0_25px_80px_rgba(12,18,14,0.12)]">
                            <div className="rounded-[1.6rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(247,241,231,0.78))] p-5 md:p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <span className="text-xs tracking-[0.18em] text-[#857a68] uppercase">
                                        Clinical sanctuary
                                    </span>
                                    <span className="rounded-full border border-[#7faa73]/40 bg-[#dce9d8] px-3 py-1 text-[11px] text-[#23452a]">
                                        Trusted platform
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-black/6 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                                        <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#8d826f]">
                                            Focus
                                        </p>
                                        <p className="text-sm font-medium text-[#1a1a1a] md:text-base">
                                            Education + Consultation + Practitioner growth
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-black/6 bg-white/70 p-4">
                                            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#8d826f]">
                                                Built for
                                            </p>
                                            <p className="text-sm font-medium text-[#1a1a1a]">India</p>
                                        </div>
                                        <div className="rounded-2xl border border-black/6 bg-white/70 p-4">
                                            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#8d826f]">
                                                Approach
                                            </p>
                                            <p className="text-sm font-medium text-[#1a1a1a]">
                                                Structured &amp; modern
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-[#8fb182]/30 bg-[linear-gradient(135deg,#dfeadb,#edf5ea)] p-4">
                                        <p className="text-sm leading-7 text-[#27402a]">
                                            A professional home for modern Ayurveda.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    {["Learning", "Consultation", "Growth"].map((item) => (
                                        <div
                                            key={item}
                                            className="rounded-2xl border border-black/6 bg-white/60 px-3 py-4 text-center text-xs font-medium text-[#4e473f]"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="relative border-b border-black/8 bg-[#ece4d3]/70 px-6 py-16 md:px-12 lg:px-16">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.88fr_1.12fr]">
                    <div>
                        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[#547d49]">
                            Our mission
                        </p>
                        <h2
                            data-reveal-heading
                            className="max-w-xl text-3xl font-medium leading-tight tracking-[-0.03em] text-[#161616] md:text-5xl"
                        >
                            Making expert Ayurveda education accessible anywhere in India.
                        </h2>
                    </div>

                    <div className="space-y-5">
                        <p
                            data-reveal-copy
                            className="rounded-[1.75rem] border border-white/50 bg-white/50 p-6 text-base leading-8 text-[#524d44] backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.05)]"
                        >
                            To make high-quality Ayurveda education and expert consultation
                            accessible to every student, practitioner, and wellness seeker —
                            anywhere in India, at any time.
                        </p>
                        <p
                            data-reveal-copy
                            className="rounded-[1.75rem] border border-white/50 bg-white/50 p-6 text-base leading-8 text-[#524d44] backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.05)]"
                        >
                            We believe Ayurveda is not just a system of medicine. It is a
                            science of life. And like any science, it deserves structured
                            learning, evidence-based practice, and a professional community to
                            grow within.
                        </p>
                    </div>
                </div>
            </section>

            {/* Offerings */}
            <section className="relative border-b border-black/8 px-6 py-16 md:px-12 lg:px-16">
                <div className="mx-auto max-w-7xl">
                    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[#547d49]">
                        What we offer
                    </p>
                    <h2
                        data-reveal-heading
                        className="mb-10 max-w-2xl text-3xl font-medium leading-tight tracking-[-0.03em] text-[#151515] md:text-5xl"
                    >
                        A complete digital ecosystem for serious Ayurveda learners and
                        practitioners.
                    </h2>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {offerings.map((item) => (
                            <div
                                key={item.title}
                                data-card
                                className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-6 backdrop-blur-2xl shadow-[0_18px_45px_rgba(0,0,0,0.05)] transition-all duration-500"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(219,234,215,0.8),transparent_35%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                <div className="relative z-10">
                                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/6 bg-[#f7f4ee] text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                        {item.icon}
                                    </div>
                                    <h3 className="mb-3 text-xl font-medium tracking-[-0.02em] text-[#181818]">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm leading-7 text-[#5d564c] md:text-[15px]">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why */}
            <section className="relative bg-[#ece4d3]/70 px-6 py-16 md:px-12 lg:px-16">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <div
                        data-card
                        className="rounded-[2rem] border border-white/60 bg-white/55 p-7 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.07)] md:p-8"
                    >
                        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[#547d49]">
                            Why AyuRxHub
                        </p>

                        <h2
                            data-reveal-heading
                            className="mb-4 text-3xl font-medium leading-tight tracking-[-0.03em] text-[#171717] md:text-4xl"
                        >
                            We built the platform Ayurveda deserved.
                        </h2>

                        <p
                            data-reveal-copy
                            className="mb-6 max-w-2xl text-base leading-8 text-[#534d44]"
                        >
                            Most Ayurveda education today is fragmented — scattered across
                            outdated PDFs, unverified YouTube channels, and expensive offline
                            institutes. AyuRxHub was built to fix that.
                        </p>

                        <div className="space-y-3">
                            {reasons.map((reason) => (
                                <div
                                    key={reason}
                                    data-card
                                    className="flex items-start gap-4 rounded-[1.35rem] border border-black/6 bg-[#f7f3ea] p-4"
                                >
                                    <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#547d49]" />
                                    <p className="text-sm leading-7 text-[#373229] md:text-[15px]">
                                        {reason}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {audience.map((item) => (
                            <div
                                key={item.label}
                                data-card
                                className="rounded-[1.6rem] border border-white/60 bg-white/60 p-5 backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.06)]"
                            >
                                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#918673]">
                                    {item.label}
                                </p>
                                <p className="text-lg font-medium tracking-[-0.02em] text-[#171717]">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}