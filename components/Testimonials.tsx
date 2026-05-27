"use client";

import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Digital Artist",
    avatar: "SC",
    rating: 5,
    text: "The fastest AI image generator I've ever used. The multi-model support lets me experiment with different styles effortlessly. Game changer for my workflow!",
  },
  {
    name: "Marcus Rivera",
    role: "UI/UX Designer",
    avatar: "MR",
    rating: 5,
    text: "I use AI Painting daily for concept art and mood boards. The privacy-first approach with auto-delete gives me peace of mind when working on client projects.",
  },
  {
    name: "Yuki Tanaka",
    role: "Content Creator",
    avatar: "YT",
    rating: 5,
    text: "No signup, instant generation, and the quality is incredible. I switched from Midjourney and haven't looked back. The free tier is surprisingly generous!",
  },
  {
    name: "Alex Johnson",
    role: "Game Developer",
    avatar: "AJ",
    rating: 4,
    text: "Seedream 4.5 integration is top-notch. I generate texture concepts and character designs in seconds. The aspect ratio controls are exactly what I needed.",
  },
  {
    name: "Priya Sharma",
    role: "Marketing Lead",
    avatar: "PS",
    rating: 5,
    text: "Our team creates social media visuals 10x faster now. The fast mode is perfect for quick iterations, and the quality rivals tools costing 10x more.",
  },
  {
    name: "David Kim",
    role: "Photographer",
    avatar: "DK",
    rating: 5,
    text: "The style options and negative prompts give me precise control over output. It's like having a creative assistant that never sleeps. Highly recommend!",
  },
  {
    name: "Emma Wilson",
    role: "Startup Founder",
    avatar: "EW",
    rating: 5,
    text: "We built our entire brand identity using AI Painting. From logos to social posts, the versatility across models saved us thousands in design costs.",
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="min-w-[320px] flex-1 rounded-xl border border-border/30 bg-bg-card p-6 hover:border-accent/20 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent-hover">
          {t.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{t.name}</p>
          <p className="text-xs text-text-muted">{t.role}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.rating }).map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{t.text}</p>
    </div>
  );
}

export function Testimonials({ messages }: { messages?: { title?: string; subtitle?: string } }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold sm:text-4xl text-white">
          {messages?.title || "Loved by Creators Worldwide"}
        </h2>
        <p className="mt-3 text-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
          {messages?.subtitle || "Join 25,000+ creators who trust AI Painting for their daily creative work"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Row 1 — scroll left */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="flex gap-6 animate-scroll">
            {[...testimonials, ...testimonials].map((t, i) => (
              <TestimonialCard key={`a-${i}`} t={t} />
            ))}
          </div>
        </div>

        {/* Row 2 — scroll right */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="flex gap-6 animate-scroll-reverse">
            {[...testimonials].reverse().concat([...testimonials].reverse()).map((t, i) => (
              <TestimonialCard key={`b-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll {
          animation: scroll 45s linear infinite;
        }
        .animate-scroll-reverse {
          animation: scroll-reverse 45s linear infinite;
        }
        .animate-scroll:hover,
        .animate-scroll-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
