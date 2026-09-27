import { BadgeCheck, Briefcase, GraduationCap, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SiteImage } from "@/components/ui/site-image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { COPY } from "@/content/ui-copy";
import type { SiteContent } from "@/lib/content/types";

const EXPERTISE_ICONS: LucideIcon[] = [Trophy, Briefcase, BadgeCheck];

export function About({ content }: { content: SiteContent }) {
  const { about, images } = content;
  const longBioParagraphs = about.longBio.split(/\n{2,}/).filter(Boolean);

  return (
    <Section id="a-propos" labelledBy="about-title">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-center rounded-3xl bg-sage-700 p-8 text-white md:p-12 lg:order-2 lg:col-span-7">
          <Eyebrow className="text-sage-100">{COPY.about.eyebrow}</Eyebrow>
          <h2 id="about-title" className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {about.title}
          </h2>
          <p className="mt-4 text-lg text-sage-50">{about.shortBio}</p>
          <div className="mt-4 space-y-3 text-sage-100">
            {longBioParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {about.education && (
            <p className="mt-4 flex items-center gap-2 text-sage-100">
              <GraduationCap aria-hidden="true" className="size-5 shrink-0" />
              {about.education}
            </p>
          )}
        </div>
        <div className="lg:order-1 lg:col-span-5">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-sage-100">
            <SiteImage
              image={images.portrait}
              sizes="(min-width: 1024px) 40vw, 100vw"
              placeholder={<ImagePlaceholder />}
            />
          </div>
        </div>
      </div>

      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {about.expertises.map((expertise, i) => {
          const Icon = EXPERTISE_ICONS[i % EXPERTISE_ICONS.length];
          return (
            <li key={expertise.title}>
              <Reveal delay={i * 0.08}>
                <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-md motion-reduce:transform-none md:p-8">
                  <span className="grid size-12 place-items-center rounded-xl bg-sage-100 text-sage-700">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{expertise.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{expertise.text}</p>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
