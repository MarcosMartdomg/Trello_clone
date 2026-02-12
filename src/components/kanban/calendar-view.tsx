"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"
import { KanbanCard } from "@/lib/kanban-data"
import { CardDetailsModal } from "./card-details-modal"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns"

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
    const { boards } = useKanbanStore()
    const { t, language } = useTranslation()

    // Get all cards with due dates from all boards
    const getAllCardsWithDates = () => {
        const cardsWithDates: Array<{ card: KanbanCard; boardName: string; columnTitle: string }> = []

        boards.forEach(board => {
            board.columns.forEach(column => {
                column.cards.forEach(card => {
                    if (card.due_date) {
                        cardsWithDates.push({
                            card,
                            boardName: board.name,
                            columnTitle: column.title
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-500'
            case 'high':
                return 'bg-orange-500'
            case 'medium':
                return 'bg-amber-400'
            case 'low':
                return 'bg-blue-400'
            default:
                return 'bg-gray-400'
        }
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

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "aspect-square border rounded-lg p-2 transition-all hover:shadow-md",
                                        isCurrentDay
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className={cn(
                                            "text-sm font-semibold mb-1",
                                            isCurrentDay ? "text-primary" : "text-foreground"
                                        )}>
                                            {format(day, 'd')}
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                                            {dayCards.slice(0, 3).map(({ card, boardName }) => (
                                                <button
                                                    key={card.id}
                                                    onClick={() => setSelectedCard(card)}
                                                    className={cn(
                                                        "w-full text-left px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105",
                                                        "text-white truncate",
                                                        getPriorityColor(card.priority)
                                                    )}
                                                    title={card.title}
                                                >
                                                    {card.title}
                                                </button>
                                            ))}
                                            {dayCards.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center py-1">
                                                    +{dayCards.length - 3} más
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
            {selectedCard && (
                <CardDetailsModal
                    card={selectedCard}
                    columnTitle=""
                    isOpen={true}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    )
}
