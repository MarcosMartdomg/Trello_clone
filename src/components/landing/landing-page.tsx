"use client"

import React from "react"
import { LayoutPanelLeft, Users, Puzzle, ArrowRight, CheckCircle2, Github, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useKanbanStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"

export function LandingPage() {
    const navigate = useNavigate()
    const { language, setLanguage } = useKanbanStore()
    const { t } = useTranslation()

    const handleGetStarted = () => {
        navigate("/dashboard")
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20 overflow-x-hidden">
            {/* Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center group-hover:rotate-6 transition-transform">
                            <LayoutPanelLeft className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">FlowBoard</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors">{t('landing.nav.howItWorks')}</a>
                        <a href="#services" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors">{t('landing.nav.services')}</a>
                        <a href="#about" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors">{t('landing.nav.aboutUs')}</a>

                        <div className="h-6 w-px bg-slate-100 mx-2"></div>

                        <div className="flex items-center gap-4">
                            <a
                                href="https://github.com/MarcosMartdomg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                                title="View on Github"
                            >
                                <Github className="w-5 h-5" />
                            </a>

                            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => setLanguage('es')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        language === 'es' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    ES
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        language === 'en' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    EN
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-slate-900 text-white hover:bg-white hover:text-slate-900 border-2 border-slate-900 rounded-none px-8 h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            {t('landing.nav.login')}
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-1000">
                            <div className="space-y-4">
                                <h1 className="text-6xl md:text-8xl font-black leading-[0.9] uppercase tracking-tighter">
                                    {t('landing.hero.title1')} <br />
                                    <span className="text-slate-300">{t('landing.hero.title2')} </span> <br />
                                    <span className="text-slate-900 italic">{t('landing.hero.title3')}</span>
                                </h1>
                                <div className="h-2 w-24 bg-slate-900 rounded-full"></div>
                            </div>

                            <p className="text-slate-500 max-w-lg text-xl leading-relaxed font-medium">
                                {t('landing.hero.subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    onClick={handleGetStarted}
                                    className="bg-slate-900 text-white hover:bg-white hover:text-slate-900 border-2 border-slate-900 rounded-none px-8 h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 group"
                                >
                                    {t('landing.hero.getStarted')}
                                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        </div>

                        <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
                            <div className="relative z-10 w-full aspect-[4/3] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white bg-slate-50">
                                <img
                                    src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200"
                                    alt="FlowBoard Experience"
                                    className="w-full h-full object-cover grayscale"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/10 to-transparent"></div>
                            </div>

                            {/* Floating Card UI */}
                            <div className="absolute -bottom-10 -right-10 z-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 hidden md:block animate-bounce-slow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-wider">Project Launch</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Completed today</p>
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="grayscale" />
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                                        +5
                                    </div>
                                </div>
                            </div>

                            {/* Decorative background shapes */}
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute top-1/2 -right-20 w-60 h-60 bg-slate-50 rounded-full blur-3xl -z-10"></div>
                        </div>
                    </div>

                    {/* Services (Features) Grid */}
                    <div id="services" className="grid md:grid-cols-3 gap-0 mt-32 border border-slate-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-100 bg-white">
                        {[
                            {
                                icon: LayoutPanelLeft,
                                title: t('landing.services.title1'),
                                desc: t('landing.services.desc1')
                            },
                            {
                                icon: Users,
                                title: t('landing.services.title2'),
                                desc: t('landing.services.desc2')
                            },
                            {
                                icon: Puzzle,
                                title: t('landing.services.title3'),
                                desc: t('landing.services.desc3')
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-16 flex flex-col items-center text-center space-y-6 hover:bg-slate-50 transition-all duration-500 group border-r border-slate-100 last:border-r-0">
                                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-xl transition-all duration-500">
                                    <feature.icon className="w-10 h-10 text-slate-800" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest">{feature.title}</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    {feature.desc}
                                </p>
                                <div className="w-10 h-1 bg-slate-200 group-hover:w-24 group-hover:bg-slate-900 transition-all duration-500 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* How it works section */}
            <section id="how-it-works" className="bg-black py-24 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-slate-800 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-slate-900 rounded-full blur-[150px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
                            Process
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                            {t('landing.howItWorks.title1')} <br />
                            <span className="text-slate-700">{t('landing.howItWorks.title2')}</span>
                        </h2>
                        <div className="h-1 w-16 bg-white mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                        {[
                            { step: "01", title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc') },
                            { step: "02", title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc') },
                            { step: "03", title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc') }
                        ].map((item, idx) => (
                            <div key={idx} className="relative group text-center md:text-left">
                                <div className="relative space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover:bg-white group-hover:text-black transition-all duration-500 mx-auto md:mx-0">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-wider">{item.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-24 max-w-4xl mx-auto bg-slate-900/40 p-10 md:p-12 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="flex flex-col md:flex-row gap-10 items-center justify-between relative z-10">
                            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0">
                                    <LayoutPanelLeft className="w-8 h-8 text-black" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                                        {t('landing.howItWorks.readyTitle')}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium max-w-md">
                                        {t('landing.howItWorks.readyDesc')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleGetStarted}
                                className="bg-white text-black hover:bg-slate-200 rounded-none px-12 h-14 font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:-translate-y-1 active:translate-y-0 shadow-xl"
                            >
                                {t('landing.howItWorks.trial')}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us section */}
            <section id="about" className="py-32 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <div className="w-full aspect-[4/3] rounded-[3rem] bg-slate-50 border border-slate-100 flex items-center justify-center p-8 overflow-hidden group">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                </div>
                                <div className="text-center space-y-6 relative z-10 transition-all duration-700 group-hover:scale-105">
                                    <div className="text-[120px] font-black text-slate-100/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none group-hover:text-slate-200/50 transition-colors uppercase leading-none">
                                        {t('landing.about.vision')}
                                    </div>
                                    <div className="relative space-y-2">
                                        <p className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-900">
                                            Building the <br />
                                            <span className="text-slate-400 italic">Future</span> of work
                                        </p>
                                        <div className="h-1 w-12 bg-slate-900 mx-auto rounded-full"></div>
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">{t('landing.about.visionDesc')}</p>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl hidden md:block border-4 border-white transition-transform hover:scale-105 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-black tracking-tighter">100%</div>
                                    <div className="w-px h-8 bg-white/20"></div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                                        {t('landing.about.transparent').split(' ').map((word, i) => (
                                            <span key={i} className="block">{word}</span>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                                    {t('landing.about.title1')} <br />
                                    <span className="text-slate-400 italic">{t('landing.about.title2')}</span>
                                </h2>
                                <div className="h-2 w-24 bg-slate-900 rounded-full"></div>
                            </div>

                            <p className="text-slate-500 text-xl leading-relaxed font-medium">
                                {t('landing.about.philosophy')}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h4 className="font-black uppercase tracking-widest text-slate-900">{t('landing.about.mission')}</h4>
                                    <p className="text-sm text-slate-500 font-medium">{t('landing.about.missionDesc')}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-black uppercase tracking-widest text-slate-900">{t('landing.about.values')}</h4>
                                    <p className="text-sm text-slate-500 font-medium">{t('landing.about.valuesDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-24 border-t border-slate-100">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col gap-4 items-center md:items-start">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <LayoutPanelLeft className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tight uppercase">FlowBoard</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium text-center md:text-left">{t('landing.footer.slogan')}</p>
                    </div>

                    <div className="flex gap-12">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('landing.footer.social')}</h5>
                            <div className="flex flex-col gap-2">
                                <a href="https://www.linkedin.com/in/marcos-martin-dominguez-118801297/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors">LinkedIn</a>
                                <a href="https://github.com/MarcosMartdomg" target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors">GitHub</a>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('landing.footer.contact')}</h5>
                            <div className="flex flex-col gap-2">
                                <a href="mailto:marcos.martdomg@gmail.com" className="text-sm font-bold hover:text-primary transition-colors">marcos.martdomg@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-6 mt-12 pt-8 border-t border-slate-200/50 text-center">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.5em]">
                        {t('landing.footer.rights', { year: new Date().getFullYear().toString() })}
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 5s ease-in-out infinite;
                }
                html {
                   scroll-behavior: smooth;
                }
            ` }} />
        </div>
    )
}
