"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Kanban, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/hooks/use-translation"

export function AuthScreen() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const { t } = useTranslation()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isSignUp && password !== confirmPassword) {
            toast.error(t('auth.passwordsDontMatch'))
            return
        }

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
                navigate("/dashboard")
            }
        } catch (error: any) {
            toast.error(error.message || "Error en la autenticación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-4">
            {/* Decorative Blur Orbs - Monochromatic Light */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[120px] animate-pulse delay-700" />

            <Card className="w-full max-w-[420px] bg-white border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-700 relative z-10 rounded-[2.5rem]">
                <CardHeader className="space-y-4 pb-8 text-center">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Kanban className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                            {isSignUp ? t('auth.signup') : t('auth.welcome')}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                            {isSignUp ? t('auth.signupSubtitle') : t('auth.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                                {t('auth.email')}
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-slate-900" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-14 bg-slate-50 border-slate-100 focus:border-slate-300 focus:ring-0 rounded-xl transition-all text-slate-900 placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                                {t('auth.password')}
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-slate-900" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 pr-12 h-14 bg-slate-50 border-slate-100 focus:border-slate-300 focus:ring-0 rounded-xl transition-all text-slate-900 placeholder:text-slate-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {isSignUp && (
                            <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                                    {t('auth.confirmPassword')}
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-slate-900" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-12 pr-12 h-14 bg-slate-50 border-slate-100 focus:border-slate-300 focus:ring-0 rounded-xl transition-all text-slate-900 placeholder:text-slate-300"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-slate-900 text-white hover:bg-black shadow-lg group transition-all hover:-translate-y-1 active:translate-y-0"
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
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-4 text-slate-300 font-bold tracking-[0.3em]">O</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setConfirmPassword("")
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        {isSignUp
                            ? t('auth.hasAccount')
                            : t('auth.noAccount')}
                    </button>
                </CardFooter>
            </Card>
        </div>
    )
}
