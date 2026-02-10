
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KanbanColumn, KanbanCard, ActivityLog } from './kanban-data';
import { api } from './api';

export interface Priority {
    id: string;
    label: string;
    color: string;
}

export interface Board {
    id: string;
    name: string;
    columns: KanbanColumn[];
    priorities: Priority[];
}

interface KanbanState {
    boards: Board[];
    activeBoardId: string | null;
    searchQuery: string;
    tagFilter: string[];
    language: 'es' | 'en';

    // Actions
    createBoard: (name: string) => void;
    deleteBoard: (id: string) => void;
    setActiveBoard: (id: string) => void;
    updateBoardPriorities: (boardId: string, priorities: Priority[]) => void;

    moveCard: (activeId: string, overId: string) => void;
    addCard: (columnId: string, card: KanbanCard) => void;
    updateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
    deleteCard: (cardId: string) => void;
    addActivity: (cardId: string, text: string, type: ActivityLog['type']) => void;

    addColumn: (title: string) => void;
    updateColumnTitle: (columnId: string, title: string) => void;
    deleteColumn: (columnId: string) => void;
    setSearchQuery: (query: string) => void;
    toggleTagFilter: (tag: string) => void;
    setLanguage: (lang: 'es' | 'en') => void;
}

export const useKanbanStore = create<KanbanState>()(
    persist(
        (set, get) => ({
            boards: [],
            activeBoardId: null,
            searchQuery: '',
            tagFilter: [],
            language: 'es',

            createBoard: (name: string) => {
                const lang = get().language;
                const isEs = lang === 'es';

                const newBoard: Board = {
                    id: `board-${Date.now()}`,
                    name,
                    columns: [
                        { id: 'todo', title: isEs ? 'Pendiente' : 'To Do', icon: 'circle', cards: [] },
                        { id: 'in-progress', title: isEs ? 'En Progreso' : 'In Progress', icon: 'loader', cards: [] },
                        { id: 'done', title: isEs ? 'Completado' : 'Done', icon: 'check-circle', cards: [] },
                    ],
                    priorities: [
                        { id: 'low', label: isEs ? 'Baja' : 'Low', color: 'bg-blue-400' },
                        { id: 'medium', label: isEs ? 'Media' : 'Medium', color: 'bg-amber-400' },
                        { id: 'high', label: isEs ? 'Alta' : 'High', color: 'bg-orange-500' },
                        { id: 'urgent', label: isEs ? 'Urgente' : 'Urgent', color: 'bg-red-500' },
                    ]
                };
                set((state) => ({
                    boards: [...state.boards, newBoard],
                    activeBoardId: newBoard.id
                }));
            },

            deleteBoard: (id: string) => {
                set((state) => {
                    const newBoards = state.boards.filter(b => b.id !== id);
                    return {
                        boards: newBoards,
                        activeBoardId: state.activeBoardId === id
                            ? (newBoards.length > 0 ? newBoards[0].id : null)
                            : state.activeBoardId
                    };
                });
            },

            setActiveBoard: (id: string) => set({ activeBoardId: id }),

            updateBoardPriorities: (boardId: string, priorities: Priority[]) => {
                set((state) => ({
                    boards: state.boards.map(b => b.id === boardId ? { ...b, priorities } : b)
                }));
            },

            moveCard: (activeId: string, overId: string) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumns = [...currentBoard.columns];

                    const activeColumnIndex = newColumns.findIndex((col) =>
                        col.cards.some((card) => card.id === activeId)
                    );
                    const overColumnIndex = newColumns.findIndex((col) =>
                        col.id === overId || col.cards.some((card) => card.id === overId)
                    );

                    if (activeColumnIndex === -1 || overColumnIndex === -1) return state;

                    const activeColumn = newColumns[activeColumnIndex];
                    const overColumn = newColumns[overColumnIndex];

                    const activeCardIndex = activeColumn.cards.findIndex((c) => c.id === activeId);
                    let activeCard = activeColumn.cards[activeCardIndex];

                    if (activeColumnIndex === overColumnIndex) {
                        const overCardIndex = overColumn.cards.findIndex((c) => c.id === overId);
                        const newCards = [...activeColumn.cards];
                        newCards.splice(activeCardIndex, 1);
                        newCards.splice(overCardIndex, 0, activeCard);

                        newColumns[activeColumnIndex] = { ...activeColumn, cards: newCards };
                    } else {
                        // Log move activity
                        const activity: ActivityLog = {
                            id: `act-${Date.now()}`,
                            text: 'board.movedCard', // Key for translation
                            params: { from: activeColumn.title, to: overColumn.title },
                            type: 'move',
                            timestamp: Date.now()
                        };
                        activeCard = { ...activeCard, activity: [activity, ...(activeCard.activity || [])] };

                        const newSourceCards = [...activeColumn.cards];
                        newSourceCards.splice(activeCardIndex, 1);

                        const newDestCards = [...overColumn.cards];
                        const isOverColumn = overColumn.id === overId;

                        if (isOverColumn) {
                            newDestCards.push(activeCard);
                        } else {
                            const overCardIndex = overColumn.cards.findIndex(c => c.id === overId);
                            newDestCards.splice(overCardIndex >= 0 ? overCardIndex : newDestCards.length, 0, activeCard);
                        }

                        newColumns[activeColumnIndex] = { ...activeColumn, cards: newSourceCards };
                        newColumns[overColumnIndex] = { ...overColumn, cards: newDestCards };

                        api.updateCardPosition(activeId, overColumn.id, newDestCards.indexOf(activeCard));
                    }

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            addCard: (columnId: string, card: KanbanCard) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];

                    // Initialize card with activity
                    const cardWithActivity: KanbanCard = {
                        ...card,
                        activity: [{
                            id: `act-${Date.now()}`,
                            text: 'board.createdCard', // Key for translation
                            type: 'create',
                            timestamp: Date.now()
                        }]
                    };

                    const newColumns = currentBoard.columns.map((col) => {
                        if (col.id === columnId) {
                            return { ...col, cards: [...col.cards, cardWithActivity] };
                        }
                        return col;
                    });

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            updateCard: (cardId: string, updates: Partial<KanbanCard>) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumns = currentBoard.columns.map((col) => ({
                        ...col,
                        cards: col.cards.map((card) => {
                            if (card.id === cardId) {
                                // Potentially log edit activity here if needed
                                return { ...card, ...updates };
                            }
                            return card;
                        }),
                    }));

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            addActivity: (cardId: string, text: string, type: ActivityLog['type']) => {
                get().updateCard(cardId, {
                    activity: [{
                        id: `act-${Date.now()}`,
                        text,
                        type,
                        timestamp: Date.now()
                    }, ...(get().boards.find(b => b.id === get().activeBoardId)?.columns.flatMap(c => c.cards).find(c => c.id === cardId)?.activity || [])]
                });
            },

            deleteCard: (cardId: string) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumns = currentBoard.columns.map((col) => ({
                        ...col,
                        cards: col.cards.filter((card) => card.id !== cardId),
                    }));

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            addColumn: (title: string) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumn: KanbanColumn = {
                        id: `col-${Date.now()}`,
                        title,
                        icon: 'circle',
                        cards: [],
                    };
                    const newColumns = [...currentBoard.columns, newColumn];

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            updateColumnTitle: (columnId: string, title: string) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumns = currentBoard.columns.map((col) =>
                        col.id === columnId ? { ...col, title } : col
                    );

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            deleteColumn: (columnId: string) => {
                set((state) => {
                    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                    if (activeBoardIndex === -1) return state;

                    const currentBoard = state.boards[activeBoardIndex];
                    const newColumns = currentBoard.columns.filter((col) => col.id !== columnId);

                    const newBoards = [...state.boards];
                    newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };

                    api.saveBoardState(newColumns);
                    return { boards: newBoards };
                });
            },

            setSearchQuery: (query: string) => set({ searchQuery: query }),

            toggleTagFilter: (tag: string) =>
                set((state) => {
                    const exists = state.tagFilter.includes(tag);
                    return {
                        tagFilter: exists
                            ? state.tagFilter.filter((t) => t !== tag)
                            : [...state.tagFilter, tag],
                    };
                }),

            setLanguage: (lang: 'es' | 'en') => set({ language: lang }),
        }),
        {
            name: 'kanban-storage-vite',
            partialize: (state) => ({
                boards: state.boards,
                activeBoardId: state.activeBoardId,
                language: state.language
            }),
        }
    )
);
