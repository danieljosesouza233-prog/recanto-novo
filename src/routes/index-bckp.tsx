import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  Menu,
  ShieldCheck,
  Heart,
  Users,
  Clock,
  Building2,
  Mail,
  MapPin,
  BadgeCheck,
  ChevronDown,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ArrowRight,
  X,
  Copy,
  Check,
  User,
  KeyRound,
} from "lucide-react";

import { trackMeta } from "@/lib/meta-track";
import { markDonationCopied, recordDonation } from "@/lib/donations.functions";


import heroFamily from "@/assets/hero-family.jpg";
import organizer from "@/assets/organizer.jpeg";

export const Route = createFileRoute("/index-bckp")({
  head: () => ({
    meta: [
      { title: "Instituto do Amor — Ajude Joaquim a voltar a andar" },
      {
        name: "description",
        content:
          "Joaquim sofreu maus-tratos e teve a coluna fraturada. Precisamos de R$ 1.400 para sua cirurgia. Doe agora via PIX.",
      },
      { property: "og:title", content: "Ajude Joaquim a voltar a andar — Instituto do Amor" },
      {
        property: "og:description",
        content:
          "Espancado e abandonado, Joaquim precisa de cirurgia para voltar a andar. Sua doação faz a diferença.",
      },
      { property: "og:image", content: heroFamily },
      { name: "twitter:image", content: heroFamily },
    ],
  }),
  component: Landing,
});

/* ---------------- helpers ---------------- */

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("animate-fade-in-up");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

/* ---------------- page ---------------- */

type TabId = "sobre" | "atualizacoes" | "ajudou";

export function Landing() {
  useReveal();

  const [scrolled, setScrolled] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("sobre");
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPix = () => {
    trackMeta("AddToCart");
    setPixOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 lg:pb-0">
      <Header scrolled={scrolled} onDonate={openPix} onSelectTab={setActiveTab} />
      <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <Hero />
        <ProgressCard onDonate={openPix} />
        <OrganizerCard />
        <Tabs onDonate={openPix} active={activeTab} setActive={setActiveTab} />
        <NeedsSection />
        <Transparency />
        <Impact onDonate={openPix} />
        <FinalMessage onDonate={openPix} />
        <FAQ />
      </main>
      <Footer />
      <StickyCTA onDonate={openPix} />
      <PixModal open={pixOpen} onClose={() => setPixOpen(false)} />
    </div>
  );
}

/* ---------------- header ---------------- */

function Header({
  scrolled,
  onDonate,
  onSelectTab,
}: {
  scrolled: boolean;
  onDonate: () => void;
  onSelectTab: (id: TabId) => void;
}) {
  const [open, setOpen] = useState(false);

  const go = (id: TabId) => {
    setOpen(false);
    onSelectTab(id);
    requestAnimationFrame(() => {
      document.getElementById("campanha-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-background/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-soft" : ""
      }`}
    >
      <div className="mx-auto grid h-[70px] w-full max-w-[1180px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Heart size={18} fill="currentColor" />
          </span>
          <span className="truncate text-[17px] font-extrabold tracking-tight">
            Campanha <span className="font-normal">para</span> Joaquim
          </span>
        </a>
        <div className="relative flex items-center gap-1">
          <button
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-surface"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="animate-fade-in absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl bg-card p-2 shadow-card">
                {[
                  { id: "sobre", label: "Sobre" },
                  { id: "atualizacoes", label: "Atualizações" },
                  { id: "ajudou", label: "Quem ajudou" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => go(m.id as TabId)}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    onDonate();
                  }}
                  className="btn-cta mt-1 flex h-11 w-full items-center justify-center px-4 text-sm"
                >
                  DOAR AGORA
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section id="top" className="pt-6 sm:pt-10">
      <div
        data-reveal
        className="relative overflow-hidden rounded-[28px] shadow-card"
      >
        <img
          src={heroFamily}
          alt="Joaquim, cãozinho resgatado pelo Instituto do Amor"
          width={1600}
          height={1100}
          className="h-[280px] w-full object-cover sm:h-[420px] lg:h-[520px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft sm:left-6 sm:top-6">
          <ShieldCheck size={14} /> Campanha Verificada
        </span>
      </div>

      <h1
        data-reveal
        className="mt-6 text-[36px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:mt-8 sm:text-[44px] lg:text-[56px]"
      >
        Ele foi espancado, abandonado e ficou sem conseguir andar. Agora{" "}
        <span className="text-primary">Joaquim precisa da nossa ajuda</span> para sobreviver.
      </h1>
      <p
        data-reveal
        className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
      >
        Joaquim sofreu maus-tratos, teve a coluna fraturada e hoje luta contra a dor todos os dias.
        Precisamos arrecadar R$ 1.400 para custear sua cirurgia e dar a ele a chance de voltar a andar.
      </p>
    </section>
  );
}

/* ---------------- progress ---------------- */

function ProgressCard({ onDonate }: { onDonate: () => void }) {
  const raised = 450;
  const goal = 1400;
  const pct = Math.round((raised / goal) * 100);

  return (
    <section data-reveal className="mt-8">
      <div className="rounded-[24px] bg-card p-5 shadow-card sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Arrecadado
            </div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {BRL(raised)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Meta
            </div>
            <div className="mt-1 text-base font-semibold text-foreground/80 sm:text-lg">
              {BRL(goal)}
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-primary-soft">
          <div
            className="animate-progress h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Arrecadado" value={`${pct}%`} />
          <Stat label="Apoiadores" value="15" icon={<Users size={14} />} />
          <Stat label="Dias restantes" value="7" icon={<Clock size={14} />} />
        </div>

        <button
          onClick={onDonate}
          className="btn-cta mt-6 hidden h-[60px] w-full px-6 text-base lg:inline-flex lg:items-center lg:justify-center"
        >
          Quero Ajudar <span className="ml-2">❤️</span>
        </button>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3">
      <div className="flex items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tracking-tight">{value}</div>
    </div>
  );
}

/* ---------------- organizer ---------------- */

function OrganizerCard() {
  return (
    <section data-reveal className="mt-6">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-[20px] bg-card p-4 shadow-soft sm:p-5">
        <img
          src={organizer}
          alt="Organizador"
          width={512}
          height={512}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-primary-soft sm:h-16 sm:w-16"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-bold sm:text-base">
              Recanto Anjos Peludos
            </p>
            <BadgeCheck size={16} className="shrink-0 text-primary" />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            Organização responsável pela campanha
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Publicado em 3 de agosto de 2026
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- tabs ---------------- */

function Tabs({
  onDonate,
  active,
  setActive,
}: {
  onDonate: () => void;
  active: TabId;
  setActive: (id: TabId) => void;
}) {
  return (
    <section id="campanha-tabs" data-reveal className="mt-10 scroll-mt-[70px]">
      <div className="sticky top-[70px] z-30 -mx-1 bg-background/90 px-1 py-2 backdrop-blur">
        <div className="flex gap-1 rounded-full bg-surface p-1">
          {[
            { id: "sobre", label: "Sobre" },
            { id: "atualizacoes", label: "Atualizações" },
            { id: "ajudou", label: "Quem ajudou" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id as TabId)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                active === t.id
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={active} className="animate-fade-in mt-6">
        {active === "sobre" && <AboutBlock onDonate={onDonate} />}
        {active === "atualizacoes" && <Updates />}
        {active === "ajudou" && <DonationsFeed />}
      </div>
    </section>
  );
}


function AboutBlock({ onDonate }: { onDonate: () => void }) {
  return (
    <div className="space-y-6 leading-relaxed text-foreground/90">
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        A história do Joaquim
      </h2>
      <p>
        Quando encontramos Joaquim, a cena era devastadora. Ele havia sido abandonado após sofrer
        agressões brutais. Segundo relatos, recebeu diversas pauladas que causaram uma{" "}
        <span className="font-semibold text-primary-dark">grave fratura em sua coluna</span>.
      </p>
      <p>
        A dor era tão intensa que suas patas traseiras já não conseguiam tocar o chão. Sem forças,
        Joaquim se arrastava usando apenas as patas dianteiras. Seu corpo mostrava sinais claros de
        sofrimento: extremamente magro, com as costelas aparentes por causa da fome, feridas nas
        patas e sinais de abandono que partiram o coração de todos que o viram.
      </p>
      <p>
        Mesmo diante de tanta dor, Joaquim ainda demonstrava vontade de viver. Não podíamos
        deixá-lo naquela situação. Realizamos o resgate imediatamente e o levamos para atendimento
        veterinário.
      </p>

      <h3 className="pt-2 text-xl font-extrabold tracking-tight">O diagnóstico</h3>
      <p>
        Após a avaliação veterinária, recebemos a confirmação que mais temíamos:{" "}
        <span className="font-semibold text-primary-dark">
          Joaquim sofreu uma fratura na coluna
        </span>
        . Essa lesão impede que ele utilize normalmente as patas traseiras e faz com que sinta
        dores constantes. Sem tratamento adequado, suas chances de recuperação diminuem a cada dia.
      </p>
      <p>
        A boa notícia é que existe esperança. Segundo o veterinário, Joaquim pode voltar a andar,
        mas precisa realizar a cirurgia o quanto antes.
      </p>

      <h3 className="pt-2 text-xl font-extrabold tracking-tight">Um gesto de amor</h3>
      <p>
        Ao conhecer a história de Joaquim, o veterinário se sensibilizou profundamente e decidiu
        não cobrar as consultas e os acompanhamentos iniciais. Isso já representa uma enorme ajuda
        para a campanha. Mas ainda precisamos arrecadar recursos para a cirurgia, medicamentos,
        exames, materiais de recuperação, pós-operatório e fisioterapia inicial.
      </p>

      <h3 className="pt-2 text-xl font-extrabold tracking-tight">Como está Joaquim hoje</h3>
      <p>
        Enquanto aguardamos a cirurgia, fazemos tudo o que está ao nosso alcance para aliviar seu
        sofrimento. Colocamos meias protetoras em suas patas para evitar novos ferimentos causados
        pelo atrito no chão. Também garantimos alimentação adequada, hidratação e acompanhamento
        diário. Mesmo assim, ele continua sentindo dores e depende da ajuda de pessoas solidárias
        para ter uma nova chance.{" "}
        <span className="font-semibold text-primary-dark">
          Cada dia de espera significa mais sofrimento.
        </span>
      </p>

      <button
        onClick={onDonate}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:text-primary"
      >
        Quero ajudar Joaquim agora <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ---------------- needs ---------------- */

function NeedsSection() {
  const needs = [
    { icon: "🏥", title: "Cirurgia corretiva", desc: "Procedimento para corrigir a fratura na coluna de Joaquim." },
    { icon: "💊", title: "Medicamentos", desc: "Analgésicos, anti-inflamatórios e antibióticos." },
    { icon: "🧪", title: "Exames", desc: "Raio-X, tomografia e avaliações pré-operatórias." },
    { icon: "🩹", title: "Pós-operatório", desc: "Materiais de recuperação e fisioterapia inicial." },
  ];
  return (
    <section data-reveal className="mt-14">
      <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        Para onde sua doação vai
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Todos os recursos arrecadados serão destinados exclusivamente ao tratamento de Joaquim.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {needs.map((n) => (
          <div
            key={n.title}
            className="rounded-2xl bg-card p-5 shadow-soft transition-transform hover:-translate-y-1"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-2xl">
              {n.icon}
            </div>
            <h4 className="mt-4 text-base font-bold tracking-tight">{n.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- transparency ---------------- */

function Transparency() {
  const items = [
    { icon: <Building2 size={18} />, label: "Organização", value: "Recanto Anjos Peludos" },
    { icon: <Heart size={18} />, label: "Campanha", value: "Ajude Joaquim a Voltar a Andar" },
    { icon: <BadgeCheck size={18} />, label: "Objetivo", value: "Cirurgia, medicamentos e recuperação" },
    { icon: <Mail size={18} />, label: "Meta total", value: "R$ 1.400,00" },
    { icon: <MapPin size={18} />, label: "Arrecadado", value: "R$ 450,00" },
    { icon: <ShieldCheck size={18} />, label: "Status", value: "Campanha Verificada" },
  ];
  return (
    <section data-reveal className="mt-14">
      <div className="rounded-[24px] bg-primary-soft p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-2 text-primary-dark">
          <ShieldCheck size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">
            Transparência
          </span>
        </div>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Transparência total
        </h3>
        <p className="mt-2 text-sm text-foreground/80">
          Todos os recursos arrecadados serão destinados exclusivamente ao tratamento de Joaquim.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <div
              key={i.label}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-dark">
                {i.icon}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {i.label}
                </div>
                <div className="truncate text-sm font-semibold text-foreground">
                  {i.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- impact ---------------- */

function Impact({ onDonate }: { onDonate: () => void }) {
  const tiers = [
    { value: 25, text: "🐾 Ajuda na compra de medicamentos e materiais básicos." },
    { value: 50, text: "🐾 Contribui para exames e avaliações veterinárias." },
    { value: 100, text: "🐾 Ajuda diretamente nos custos da cirurgia." },
    { value: 200, text: "🐾 Financia uma parte importante do tratamento e recuperação." },
  ];
  return (
    <section id="doar" data-reveal className="mt-14">
      <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        O impacto da sua doação
      </h3>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiers.map((t) => (
          <button
            key={t.value}
            onClick={onDonate}
            className="group rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:shadow-card"
          >
            <div className="text-2xl font-extrabold tracking-tight text-primary-dark sm:text-3xl">
              {BRL(t.value)}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Doar este valor <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-dashed border-primary/50 bg-primary-soft p-5 text-center">
        <p className="text-sm text-foreground/80">
          🐾 <span className="font-semibold">Qualquer valor</span> faz diferença na vida de Joaquim.
        </p>
      </div>
    </section>
  );
}

/* ---------------- donations feed ---------------- */

function DonationsFeed() {
  const initial = [
    { name: "Maria Silva", value: 50, time: "há 3 minutos" },
    { name: "João Pedro", value: 50, time: "há 8 minutos" },
    { name: "Ana Costa", value: 25, time: "há 15 minutos" },
    { name: "Carlos Mendes", value: 50, time: "há 22 minutos" },
    { name: "Beatriz Lima", value: 25, time: "há 38 minutos" },
  ];
  return (
    <section id="doacoes-recentes" data-reveal>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Doações recentes
        </h3>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-primary" />
          Em tempo real
        </span>
      </div>
      <ul className="mt-5 divide-y divide-border rounded-2xl bg-card shadow-soft">
        {initial.map((d, i) => (
          <li
            key={i}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 sm:px-5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark">
              <Heart size={15} fill="currentColor" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.time}</div>
            </div>
            <div className="text-sm font-bold text-primary-dark">{BRL(d.value)}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- updates timeline ---------------- */

function Updates() {
  const items = [
    {
      date: "Hoje",
      title: "Aguardando recursos para a cirurgia",
      text: "Joaquim segue em acompanhamento diário com meias protetoras, alimentação adequada e hidratação enquanto reunimos o valor necessário para a cirurgia.",
    },
    {
      date: "Esta semana",
      title: "Diagnóstico confirmado",
      text: "O veterinário confirmou a fratura na coluna. Existe esperança: Joaquim pode voltar a andar, mas a cirurgia precisa ser feita o quanto antes.",
    },
    {
      date: "Resgate",
      title: "Joaquim foi resgatado",
      text: "Encontramos Joaquim abandonado após agressões brutais. Realizamos o resgate imediato e o levamos para atendimento veterinário.",
    },
  ];
  return (
    <section id="atualizacoes-section" data-reveal>

      <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        Atualizações da campanha
      </h3>
      <ol className="mt-6 space-y-6 border-l-2 border-primary-soft pl-6">
        {items.map((u, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-primary ring-4 ring-primary-soft" />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {u.date}
            </div>
            <div className="mt-1 text-base font-bold">{u.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{u.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- final message ---------------- */

function FinalMessage({ onDonate }: { onDonate: () => void }) {
  return (
    <section data-reveal className="mt-14">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-primary to-primary-dark p-8 text-primary-foreground shadow-card sm:p-12">
        <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Agora ele precisa conhecer algo diferente: a compaixão.
        </h3>
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-primary-foreground/90 sm:text-base">
          <p>Joaquim já sofreu mais do que qualquer animal deveria sofrer. Ele conheceu a fome, a violência e o abandono.</p>
          <p>Sua contribuição pode ser a diferença entre uma vida de dor e uma nova oportunidade de caminhar novamente.</p>
          <p className="font-semibold text-primary-foreground">
            Cada doação importa. Cada compartilhamento ajuda. Cada gesto de amor aproxima Joaquim da recuperação.
          </p>
        </div>
        <button
          onClick={onDonate}
          className="mt-7 inline-flex h-[58px] items-center justify-center rounded-full bg-card px-8 text-base font-bold text-primary-dark shadow-soft transition-transform hover:-translate-y-0.5"
        >
          ❤️ Doe e ajude Joaquim a voltar a andar
        </button>
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */


function FAQ() {
  const faqs = [
    {
      q: "Como funciona a doação?",
      a: "Você escolhe o valor, faz o pagamento e o recurso vai direto para o responsável pela campanha.",
    },
    { q: "Posso doar via PIX?", a: "Sim. Aceitamos PIX como forma de doação." },
    {
      q: "Recebo comprovante?",
      a: "Sim. O comprovante é emitido logo após a confirmação.",
    },
    {
      q: "A campanha é verificada?",
      a: "Sim. Validamos documentos e a história do Joaquim antes de publicar.",
    },
  ];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section data-reveal className="mt-14">
      <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        Perguntas frequentes
      </h3>
      <div className="mt-5 overflow-hidden rounded-2xl bg-card shadow-soft">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              <div
                className={`grid overflow-hidden px-5 transition-[grid-template-rows,padding] duration-300 ${
                  isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden text-sm text-muted-foreground">
                  {f.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */

function Footer() {
  const cols = [
    {
      title: "Institucional",
      links: ["Sobre nós", "Equipe", "Transparência", "Imprensa"],
    },
    { title: "Projetos", links: ["Campanhas ativas", "Concluídas", "Como propor"] },
    { title: "Contato", links: ["Fale conosco", "Suporte", "Parcerias"] },
  ];
  return (
    <footer className="mt-20 bg-footer text-footer-foreground">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Heart size={18} fill="currentColor" />
            </span>
            <span className="text-base font-extrabold">
              Instituto <span className="font-normal">do</span> Amor
            </span>
          </div>
          <p className="mt-4 text-sm text-footer-foreground/70">
            Conectamos pessoas que precisam de ajuda a quem quer transformar
            vidas com transparência.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Rede social"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 transition-colors hover:bg-primary"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-bold">{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-footer-foreground/70">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-primary">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-4 py-5 text-xs text-footer-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Instituto do Amor. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- sticky cta (mobile) ---------------- */

function StickyCTA({ onDonate }: { onDonate: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
      <button
        onClick={onDonate}
        className="btn-cta flex h-[60px] w-full items-center justify-center text-base"
      >
        Quero Ajudar <span className="ml-2">❤️</span>
      </button>
    </div>
  );
}

/* ---------------- pix modal ---------------- */

const PIX_KEY = "recantoanjospeludos@institutodoamor.org";
const PIX_RECEIVER = "JANAINA SILVA RODRIGUES";

const PIX_AMOUNTS = [25, 50, 75, 100, 125, 150, 175, 200];
const PIX_MIN = 5;
const PIX_POPULAR = 50;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

function PixModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [donationId, setDonationId] = useState<string | null>(null);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setStep(1);
      setAmount(null);
      setCustomAmount("");
      setName("");
      setPhone("");
      setError("");
      setDonationId(null);
    }
  }, [open]);


  if (!open) return null;

  const chosenValue =
    amount ?? (customAmount ? Number(customAmount.replace(/[^\d,]/g, "").replace(",", ".")) : 0);

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const goStep2 = () => {
    if (!chosenValue || chosenValue <= 0) {
      setError("Escolha um valor ou digite outro valor.");
      return;
    }
    if (chosenValue < PIX_MIN) {
      setError(`O valor mínimo para doação é ${brl(PIX_MIN)}.`);
      return;
    }
    setError("");
    trackMeta("InitiateCheckout", { value: chosenValue, currency: "BRL" });
    setStep(2);
  };

  const goStep3 = () => {
    if (name.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Informe um celular válido.");
      return;
    }
    setError("");
    trackMeta("AddPaymentInfo", {
      value: chosenValue,
      currency: "BRL",
      userData: { name, phone },
    });
    void recordDonation({
      data: { nome: name.trim(), celular: phone, valor: chosenValue || 0 },
    })
      .then((res) => setDonationId(res.id))
      .catch(() => {});
    setStep(3);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = PIX_KEY;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    trackMeta("Purchase", {
      value: chosenValue || 0,
      currency: "BRL",
      userData: { name, phone },
    });
    if (donationId) void markDonationCopied({ data: { id: donationId } }).catch(() => {});
  };


  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pix-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up relative w-full max-w-[460px] rounded-t-[28px] bg-card p-6 shadow-card sm:my-8 sm:rounded-[28px] sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X size={18} />
        </button>

        {/* stepper */}
        <div className="mt-2 flex w-full items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Fragment key={s}>
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground"
                }`}
              >
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-10 rounded-full transition-colors sm:w-14 ${
                    step > s ? "bg-primary" : "bg-surface"
                  }`}
                />
              )}
            </Fragment>
          ))}
        </div>


        {step === 1 && (
          <div className="animate-fade-in">
            <h2 id="pix-title" className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Escolha o <span className="text-primary">valor</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Qualquer valor é bem-vindo.</span> 100%
              das doações vão direto para o tratamento do Joaquim.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {PIX_AMOUNTS.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setAmount(v);
                    setCustomAmount("");
                    setError("");
                  }}
                  className={`relative rounded-2xl border-2 py-3.5 text-sm font-bold transition-all ${
                    amount === v
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border bg-surface text-foreground hover:border-primary/50"
                  }`}
                >
                  {v === PIX_POPULAR && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                      Mais escolhido
                    </span>
                  )}
                  {brl(v)}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Outro valor
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3.5 focus-within:border-primary">
                <span className="text-sm font-bold text-muted-foreground">R$</span>
                <input
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d,.]/g, "");
                    setCustomAmount(raw);
                    setAmount(null);
                    const n = raw ? Number(raw.replace(/\./g, "").replace(",", ".")) : 0;
                    if (raw && n > 0 && n < PIX_MIN) {
                      setError(`O valor mínimo para doação é ${brl(PIX_MIN)}.`);
                    } else {
                      setError("");
                    }
                  }}
                  placeholder="0,00"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}

            <button
              onClick={goStep2}
              className="btn-cta mt-5 flex h-[58px] w-full items-center justify-center gap-2 px-6 text-base"
            >
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 id="pix-title" className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Quem está <span className="text-primary">ajudando</span> o Joaquim?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Deixe seu nome e celular para registrarmos sua contribuição e te avisarmos sobre cada
              passo da recuperação.
            </p>


            <div className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nome completo
                </label>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="Seu nome"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Celular
                </label>
                <input
                  value={phone}
                  inputMode="tel"
                  onChange={(e) => {
                    setPhone(maskPhone(e.target.value));
                    setError("");
                  }}
                  placeholder="(11) 90000-0000"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}

            <button
              onClick={goStep3}
              className="btn-cta mt-5 flex h-[58px] w-full items-center justify-center gap-2 px-6 text-base"
            >
              Continuar <ArrowRight size={18} />
            </button>
            <button
              onClick={() => {
                setError("");
                setStep(1);
              }}
              className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Voltar
            </button>
          </div>
        )}

        {step === 3 && (
        <div className="animate-fade-in">
        <h2 id="pix-title" className="mt-5 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          {name
            ? `Obrigado, ${(() => {
                const f = name.trim().split(" ")[0] ?? "";
                return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase();
              })()}!`
            : "Obrigado!"}{" "}
          🐾
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Seu gesto já significa muito para o Joaquim. Falta só{" "}
          <span className="font-semibold text-foreground">um último passo</span>: realizar o
          pagamento via PIX para confirmar a sua doação.
        </p>

        <div className="mt-5 rounded-2xl bg-primary-soft px-4 py-3.5 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary-dark">
            Valor da sua doação
          </div>
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight text-primary-dark">
            {brl(chosenValue || 0)}
          </div>
        </div>



        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <User size={13} /> Recebedor
            </div>
            <div className="mt-1.5 text-base font-bold tracking-tight">{PIX_RECEIVER}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Fundadora e responsável pela campanha
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <KeyRound size={13} /> Chave PIX (e-mail)
            </div>
            <div className="mt-1.5 break-all text-sm font-semibold text-foreground sm:text-base">
              {PIX_KEY}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="btn-cta mt-6 flex h-[58px] w-full items-center justify-center gap-2 px-6 text-base"
        >
          {copied ? (
            <>
              <Check size={20} /> Chave copiada!
            </>
          ) : (
            <>
              <Copy size={18} /> Copiar chave PIX
            </>
          )}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck size={13} className="text-primary" />
          Pagamento seguro processado pelo seu banco.
        </p>
        </div>
        )}
      </div>

    </div>
  );
}


