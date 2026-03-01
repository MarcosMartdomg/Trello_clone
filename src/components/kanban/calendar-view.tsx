"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Users, Plus } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"
import { KanbanCard } from "@/lib/kanban-data"
import { CardDetailsModal } from "./card-details-modal"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isBefore, startOfToday } from "date-fns"

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
    const [selectedDayDetail, setSelectedDayDetail] = useState<Date | null>(null)
    const { boards } = useKanbanStore()
    const { t, language } = useTranslation()

    const today = startOfToday()

    // Get all cards with due dates from all boards
    const getAllCardsWithDates = () => {
        const cardsWithDates: Array<{ card: KanbanCard; boardName: string; columnTitle: string; boardType: 'personal' | 'shared' }> = []

        boards.forEach(board => {
            board.columns.forEach(column => {
                column.cards.forEach(card => {
                    if (card.due_date) {
                        cardsWithDates.push({
                            card,
                            boardName: board.name,
                            columnTitle: column.title,
                            boardType: board.type as 'personal' | 'shared'
                        })
                    }
                })
            })
        })

        return cardsWithDates
    }

    const cardsWithDates = getAllCardsWithDates()

    // Get cards for a specific date
    const getCardsForDate = (date: Date) => {
        return cardsWithDates.filter(({ card }) => {
            if (!card.due_date) return false
            const dueDate = new Date(card.due_date)
            return isSameDay(dueDate, date)
        })
    }

    // Generate calendar days
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = monthStart.getDay()

    // Add empty cells for days before the month starts
    const emptyDays = Array(firstDayOfMonth).fill(null)

    const monthNames = [
        t('calendar.months.january'),
        t('calendar.months.february'),
        t('calendar.months.march'),
        t('calendar.months.april'),
        t('calendar.months.may'),
        t('calendar.months.june'),
        t('calendar.months.july'),
        t('calendar.months.august'),
        t('calendar.months.september'),
        t('calendar.months.october'),
        t('calendar.months.november'),
        t('calendar.months.december'),
    ]

    const dayNames = [
        t('calendar.days.sunday'),
        t('calendar.days.monday'),
        t('calendar.days.tuesday'),
        t('calendar.days.wednesday'),
        t('calendar.days.thursday'),
        t('calendar.days.friday'),
        t('calendar.days.saturday'),
    ]

    const currentMonthName = monthNames[currentDate.getMonth()]
    const currentYear = currentDate.getFullYear()

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const getBoardTypeStyles = (boardType: 'personal' | 'shared') => {
        if (boardType === 'personal') {
            return {
                bg: 'bg-violet-500 hover:bg-violet-600',
                indicator: 'bg-violet-300/40',
            }
        }
        return {
            bg: 'bg-amber-500 hover:bg-amber-600',
            indicator: 'bg-amber-300/40',
        }
    }

    if (selectedDayDetail) {
        return (
            <DayView
                date={selectedDayDetail}
                cards={getCardsForDate(selectedDayDetail)}
                onBack={() => setSelectedDayDetail(null)}
                onSelectCard={setSelectedCard}
                t={t}
                getBoardTypeStyles={getBoardTypeStyles}
            />
        )
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {currentMonthName} {currentYear}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {cardsWithDates.length} {t('calendar.tasksOnDate', { count: cardsWithDates.length.toString() })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t('calendar.today')}
                    </button>
                    <button
                        onClick={handlePreviousMonth}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title={t('calendar.previousMonth')}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title={t('calendar.nextMonth')}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Day names header */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {dayNames.map((day, index) => (
                            <div
                                key={index}
                                className="text-center text-sm font-semibold text-muted-foreground py-2"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for days before month starts */}
                        {emptyDays.map((_, index) => (
                            <div key={`empty-${index}`} className="aspect-square" />
                        ))}

                        {/* Actual calendar days */}
                        {calendarDays.map((day, index) => {
                            const dayCards = getCardsForDate(day)
                            const isCurrentDay = isToday(day)
                            const isPast = isBefore(day, today)

                            return (
                                <div
                                    key={index}
                                    onClick={() => setSelectedDayDetail(day)}
                                    className={cn(
                                        "aspect-square border rounded-lg p-2 transition-all hover:shadow-md cursor-pointer",
                                        isCurrentDay
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : isPast
                                                ? "border-border/50 bg-secondary/30 opacity-60 text-muted-foreground hover:opacity-100"
                                                : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    <div className="flex flex-col h-full pointer-events-none">
                                        <div className={cn(
                                            "text-sm font-semibold mb-1",
                                            isCurrentDay ? "text-primary" : "text-foreground"
                                        )}>
                                            {format(day, 'd')}
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                                            {dayCards.slice(0, 3).map(({ card, boardName, boardType }) => {
                                                const styles = getBoardTypeStyles(boardType)
                                                return (
                                                    <button
                                                        key={card.id}
                                                        onClick={() => setSelectedCard(card)}
                                                        className={cn(
                                                            "w-full text-left px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105",
                                                            "text-white truncate flex items-center gap-1.5",
                                                            styles.bg
                                                        )}
                                                        title={`${card.title} · ${boardName} (${boardType === 'personal' ? t('members.personal') : t('members.shared')})`}
                                                    >
                                                        <span className={cn("shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center", styles.indicator)}>
                                                            {boardType === 'personal'
                                                                ? <User className="w-2 h-2" />
                                                                : <Users className="w-2 h-2" />}
                                                        </span>
                                                        <span className="truncate">{card.title}</span>
                                                    </button>
                                                )
                                            })}
                                            {dayCards.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center py-1">
                                                    +{dayCards.length - 3} {t('calendar.more')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Card Details Modal */}
            {
                selectedCard && (
                    <CardDetailsModal
                        card={selectedCard}
                        columnTitle=""
                        isOpen={true}
                        isReadOnly={true}
                        onClose={() => setSelectedCard(null)}
                    />
                )
            }
        </div>
    )
}

function DayView({ date, cards, onBack, onSelectCard, t, getBoardTypeStyles }: any) {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const isTodayDate = isToday(date)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const getTasksForHour = (hour: number) => {
        return cards.filter(({ card }: any) => {
            if (!card.due_date) return false
            const d = new Date(card.due_date)
            return d.getHours() === hour
        })
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header - Integrated & Sleek */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-card/10 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-black/5 border border-border/50"
                        title={t('calendar.backToMonth')}
                    >
                        <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground uppercase">
                            {format(date, 'EEEE, d MMMM')}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                {t('calendar.dayView')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {cards.length} {t('calendar.tasksOnDate', { count: cards.length.toString() })}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl bg-secondary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm border border-border/50 hover:border-primary/50 group"
                >
                    <CalendarIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    {t('calendar.backToMonth')}
                </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto relative p-8 scrollbar-hide bg-gradient-to-b from-secondary/5 to-transparent">
                <div className="max-w-5xl mx-auto bg-card/40 backdrop-blur-2xl rounded-[32px] border border-border/50 shadow-2xl shadow-primary/5 overflow-hidden">
                    {/* Current Time Indicator - Sleeker */}
                    {isTodayDate && (
                        <div
                            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center gap-0"
                            style={{
                                top: `${(currentTime.getHours() * 80) + (currentTime.getMinutes() * 80 / 60) + 1}px`,
                                transition: 'top 60s linear'
                            }}
                        >
                            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-background shadow-[0_0_15px_rgba(239,68,68,0.8)] -ml-1.5 shrink-0" />
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-red-500 via-red-500/50 to-transparent" />
                        </div>
                    )}

                    <div className="relative">
                        {hours.map((hour) => {
                            const hourTasks = getTasksForHour(hour)
                            const isAM = hour < 12
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                            const amPm = isAM ? 'AM' : 'PM'

                            return (
                                <div key={hour} className="group flex h-20 border-b border-border/20 last:border-0 relative hover:bg-primary/[0.02] transition-colors">
                                    {/* Hour Label */}
                                    <div className="w-24 shrink-0 flex items-center justify-center border-r border-border/20 bg-secondary/10">
                                        <span className="text-[10px] font-black tracking-widest text-muted-foreground/40 group-hover:text-primary transition-all duration-300">
                                            {displayHour} {amPm}
                                        </span>
                                    </div>

                                    {/* Tasks Area */}
                                    <div className="flex-1 p-2 flex gap-2 overflow-x-auto scrollbar-hide py-3">
                                        {hourTasks.map(({ card, boardName, boardType }: any) => {
                                            const styles = getBoardTypeStyles(boardType)
                                            return (
                                                <button
                                                    key={card.id}
                                                    onClick={() => onSelectCard(card)}
                                                    className={cn(
                                                        "h-full min-w-[200px] max-w-[280px] text-left px-5 py-3 rounded-2xl text-xs font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-2xl",
                                                        "text-white flex flex-col justify-between border border-white/20 group/task relative overflow-hidden",
                                                        styles.bg
                                                    )}
                                                >
                                                    {/* Glassy Overlay decoration */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-50" />
                                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover/task:opacity-100 transition-opacity" />

                                                    <div className="flex items-center gap-2 mb-2 relative z-10">
                                                        <span className={cn("shrink-0 w-6 h-6 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/20 shadow-sm")}>
                                                            {boardType === 'personal'
                                                                ? <User className="w-3 h-3" />
                                                                : <Users className="w-3 h-3" />}
                                                        </span>
                                                        <span className="font-black uppercase tracking-widest text-[9px] opacity-80 truncate">{boardName}</span>
                                                    </div>
                                                    <span className="truncate leading-none text-sm tracking-tight relative z-10 block pr-2">
                                                        {card.title}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                        {hourTasks.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="w-4 h-4 text-primary/20" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
