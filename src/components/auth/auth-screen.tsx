"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Kanban, Mail, Lock, ArrowRight } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function AuthScreen() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const { t } = useTranslation()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                toast.success("¡Registro completado! Revisa tu email para confirmar.")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success("Bienvenido de nuevo")
            }
        } catch (error: any) {
            toast.error(error.message || "Error en la autenticación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden p-4">
            {/* Decorative Blur Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-2xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-700 relative z-10 rounded-[32px]">
                <CardHeader className="space-y-4 pb-8 text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Kanban className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <CardTitle className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                            {isSignUp ? t('auth.signup') : t('auth.welcome')}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80 font-medium">
                            {isSignUp ? t('auth.signupSubtitle') : t('auth.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
                                {t('auth.email')}
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
                                {t('auth.password')}
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 group transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <>
                                    {isSignUp ? t('auth.signup') : t('auth.login')}
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-muted-foreground font-bold tracking-widest">O</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                        {isSignUp
                            ? t('auth.hasAccount')
                            : t('auth.noAccount')}
                    </button>
                </CardFooter>
            </Card>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-0 w-full text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 font-black">
                    Powered by Supabase & Antigravity
                </p>
            </div>
        </div>
    )
}
