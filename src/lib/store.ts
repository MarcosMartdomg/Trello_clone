
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import { KanbanColumn, KanbanCard, ActivityLog, Member, Board, Priority } from './kanban-data';
import { api } from './api';


interface KanbanState {
    boards: Board[];
    activeBoardId: string | null;
    searchQuery: string;
    tagFilter: string[];
    language: 'es' | 'en';
    currentView: 'board' | 'my-tasks' | 'boards-list';

    // Actions
    setCurrentView: (view: 'board' | 'my-tasks' | 'boards-list') => void;

    fetchBoards: (userId: string) => Promise<void>;
    createBoard: (name: string, userId: string, type?: 'personal' | 'shared') => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;
    setActiveBoard: (id: string) => void;
    updateBoardPriorities: (boardId: string, priorities: Priority[]) => void;
    addBoardMember: (boardId: string, userId: string) => Promise<void>;
    removeBoardMember: (boardId: string, userId: string) => Promise<void>;
    toggleBoardFavorite: (boardId: string, isFavorite: boolean) => Promise<void>;

    moveCard: (activeId: string, overId: string) => Promise<void>;
    addCard: (columnId: string, card: Partial<KanbanCard>) => Promise<void>;
    updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    addActivity: (cardId: string, text: string, type: ActivityLog['type']) => void;

    // Card Members
    addCardMember: (cardId: string, userId: string) => Promise<void>;
    removeCardMember: (cardId: string, userId: string) => Promise<void>;

    addColumn: (title: string) => Promise<void>;
    updateColumn: (columnId: string, updates: Partial<KanbanColumn>) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
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
            currentView: 'board',

            setCurrentView: (view: 'board' | 'my-tasks' | 'boards-list') => set({ currentView: view }),

            fetchBoards: async (userId: string) => {
                try {
                    const data = await api.fetchBoards(userId);
                    // Map Supabase data to our Board interface
                    const boards: Board[] = data.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        ownerId: b.owner_id,
                        type: b.type,
                        isFavorite: b.is_favorite || false,
                        priorities: [
                            { id: 'low', label: 'Low', color: 'bg-blue-400' },
                            { id: 'medium', label: 'Medium', color: 'bg-amber-400' },
                            { id: 'high', label: 'High', color: 'bg-orange-500' },
                            { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
                        ],
                        columns: b.columns.sort((a: any, b: any) => a.position - b.position).map((col: any) => ({
                            id: col.id,
                            title: col.title,
                            icon: col.icon,
                            cards: col.cards.sort((a: any, b: any) => a.position - b.position).map((card: any) => ({
                                ...card,
                                checklist: Array.isArray(card.checklist) ? card.checklist : [],
                                labels: Array.isArray(card.labels) ? card.labels : [],
                                activity: Array.isArray(card.activities) ? card.activities.map((a: any) => ({
                                    id: a.id,
                                    text: a.text,
                                    type: a.type,
                                    params: a.params,
                                    timestamp: a.timestamp,
                                    user: a.profiles ? {
                                        id: a.profiles.id,
                                        name: a.profiles.full_name,
                                        avatar: a.profiles.avatar_url
                                    } : undefined
                                })) : [],
                                members: card.card_members ? card.card_members.map((cm: any) => ({
                                    id: cm.user_id,
                                    name: cm.profiles?.full_name || 'User',
                                    avatar: cm.profiles?.full_name?.[0]?.toUpperCase() || 'U',
                                    color: 'bg-primary'
                                })) : []
                            }))
                        })),
                        members: b.board_members.map((bm: any) => ({
                            id: bm.user_id,
                            name: bm.profiles?.full_name || 'Member',
                            avatar: bm.profiles?.full_name?.[0]?.toUpperCase() || 'U',
                            color: 'bg-primary'
                        }))
                    }));

                    set({ boards });
                    if (boards.length > 0 && !get().activeBoardId) {
                        set({ activeBoardId: boards[0].id });
                    }
                } catch (error) {
                    console.error("Store: Error fetching boards", JSON.stringify(error, null, 2));
                    set({ boards: [] }); // Clear boards on error to avoid stale data
                }
            },

            createBoard: async (name: string, userId: string, type: 'personal' | 'shared' = 'personal') => {
                try {
                    await api.createBoard(name, userId, type);
                    await get().fetchBoards(userId);
                } catch (error) {
                    console.error("Store: Error creating board", error);
                }
            },

            deleteBoard: async (id: string) => {
                try {
                    await api.deleteBoard(id);
                    set((state) => {
                        const newBoards = state.boards.filter(b => b.id !== id);
                        return {
                            boards: newBoards,
                            activeBoardId: state.activeBoardId === id
                                ? (newBoards.length > 0 ? newBoards[0].id : null)
                                : state.activeBoardId
                        };
                    });
                } catch (error) {
                    console.error("Store: Error deleting board", error);
                }
            },

            setActiveBoard: (id: string) => set({ activeBoardId: id }),

            updateBoardPriorities: (boardId: string, priorities: Priority[]) => {
                set((state) => ({
                    boards: state.boards.map(b => b.id === boardId ? { ...b, priorities } : b)
                }));
            },

            addBoardMember: async (boardId: string, userId: string) => {
                try {
                    await api.addBoardMember(boardId, userId);
                    // In a real app we'd fetch the user's name/avatar. For now, just re-fetch boards.
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error adding member", error);
                }
            },

            removeBoardMember: async (boardId: string, userId: string) => {
                try {
                    await api.removeBoardMember(boardId, userId);
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error removing member", error);
                }
            },

            toggleBoardFavorite: async (boardId: string, isFavorite: boolean) => {
                try {
                    await api.toggleBoardFavorite(boardId, isFavorite);
                    set((state) => ({
                        boards: state.boards.map(b =>
                            b.id === boardId ? { ...b, isFavorite } : b
                        )
                    }));
                } catch (error) {
                    console.error("Store: Error toggling favorite", error);
                }
            },

            moveCard: async (activeId: string, overId: string) => {
                const state = get();
                const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                if (activeBoardIndex === -1) return;

                const currentBoard = state.boards[activeBoardIndex];
                const newColumns = [...currentBoard.columns];

                const activeColumnIndex = newColumns.findIndex((col) =>
                    col.cards.some((card) => card.id === activeId)
                );
                const overColumnIndex = newColumns.findIndex((col) =>
                    col.id === overId || col.cards.some((card) => card.id === overId)
                );

                if (activeColumnIndex === -1 || overColumnIndex === -1) return;

                const activeColumn = newColumns[activeColumnIndex];
                const overColumn = newColumns[overColumnIndex];

                const activeCardIndex = activeColumn.cards.findIndex((c) => c.id === activeId);
                let activeCard = activeColumn.cards[activeCardIndex];

                // Optimistic UI updates
                if (activeColumnIndex === overColumnIndex) {
                    const overCardIndex = overColumn.cards.findIndex((c) => c.id === overId);
                    const newCards = [...activeColumn.cards];
                    newCards.splice(activeCardIndex, 1);
                    newCards.splice(overCardIndex, 0, activeCard);
                    newColumns[activeColumnIndex] = { ...activeColumn, cards: newCards };

                    set((state) => {
                        const newBoards = [...state.boards];
                        newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };
                        return { boards: newBoards };
                    });

                    // Update Subapase
                    await api.updateCard(activeId, { position: overCardIndex });
                } else {
                    const newSourceCards = [...activeColumn.cards];
                    newSourceCards.splice(activeCardIndex, 1);

                    const newDestCards = [...overColumn.cards];
                    const isOverColumn = overColumn.id === overId;
                    let overCardIndex = 0;

                    if (isOverColumn) {
                        newDestCards.push(activeCard);
                        overCardIndex = newDestCards.length - 1;
                    } else {
                        overCardIndex = overColumn.cards.findIndex(c => c.id === overId);
                        newDestCards.splice(overCardIndex >= 0 ? overCardIndex : newDestCards.length, 0, activeCard);
                    }

                    newColumns[activeColumnIndex] = { ...activeColumn, cards: newSourceCards };
                    newColumns[overColumnIndex] = { ...overColumn, cards: newDestCards };

                    set((state) => {
                        const newBoards = [...state.boards];
                        newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };
                        return { boards: newBoards };
                    });

                    // Update Supabase
                    await api.updateCard(activeId, { column_id: overColumn.id, position: overCardIndex });
                }
            },

            addCard: async (columnId: string, card: Partial<KanbanCard>) => {
                const state = get();
                const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                if (activeBoardIndex === -1) return;

                const currentBoard = state.boards[activeBoardIndex];
                const column = currentBoard.columns.find(col => col.id === columnId);
                if (!column) return;

                try {
                    const newCard = await api.createCard(columnId, card, column.cards.length);
                    // Re-fetch to get real UUIDs and data
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error adding card", error);
                }
            },

            updateCard: async (cardId: string, updates: Partial<KanbanCard>) => {
                try {
                    await api.updateCard(cardId, updates);
                    // Optimistic local update
                    set((state) => {
                        const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                        if (activeBoardIndex === -1) return state;
                        const currentBoard = state.boards[activeBoardIndex];
                        const newColumns = currentBoard.columns.map((col) => ({
                            ...col,
                            cards: col.cards.map((card) =>
                                card.id === cardId ? { ...card, ...updates } : card
                            ),
                        }));
                        const newBoards = [...state.boards];
                        newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };
                        return { boards: newBoards };
                    });
                } catch (error) {
                    console.error("Store: Error updating card", error);
                }
            },

            addActivity: (cardId: string, text: string, type: ActivityLog['type']) => {
                // In a full implementation, this would also write to activities table
                get().updateCard(cardId, {
                    activity: [{
                        id: `act-${Date.now()}`,
                        text,
                        type,
                        timestamp: Date.now()
                    }, ...(get().boards.find(b => b.id === get().activeBoardId)?.columns.flatMap(c => c.cards).find(c => c.id === cardId)?.activity || [])]
                });
            },

            deleteCard: async (cardId: string) => {
                try {
                    await api.deleteCard(cardId);
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
                        return { boards: newBoards };
                    });
                } catch (error) {
                    console.error("Store: Error deleting card", error);
                }
            },

            addColumn: async (title: string) => {
                const state = get();
                const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                if (activeBoardIndex === -1) return;

                const currentBoard = state.boards[activeBoardIndex];
                try {
                    await api.createColumn(currentBoard.id, title, currentBoard.columns.length);
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error adding column", error);
                }
            },

            addCardMember: async (cardId: string, userId: string) => {
                try {
                    await api.addCardMember(cardId, userId);
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error adding card member", error);
                }
            },

            removeCardMember: async (cardId: string, userId: string) => {
                try {
                    await api.removeCardMember(cardId, userId);
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error("Store: Error removing card member", error);
                }
            },

            updateColumn: async (columnId: string, updates: Partial<KanbanColumn>) => {
                try {
                    await api.updateColumn(columnId, updates);
                    set((state) => {
                        const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                        if (activeBoardIndex === -1) return state;
                        const currentBoard = state.boards[activeBoardIndex];
                        const newColumns = currentBoard.columns.map((col) =>
                            col.id === columnId ? { ...col, ...updates } : col
                        );
                        const newBoards = [...state.boards];
                        newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };
                        return { boards: newBoards };
                    });
                } catch (error) {
                    console.error("Store: Error updating column", error);
                }
            },

            deleteColumn: async (columnId: string) => {
                try {
                    await api.deleteColumn(columnId);
                    set((state) => {
                        const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
                        if (activeBoardIndex === -1) return state;
                        const currentBoard = state.boards[activeBoardIndex];
                        const newColumns = currentBoard.columns.filter((col) => col.id !== columnId);
                        const newBoards = [...state.boards];
                        newBoards[activeBoardIndex] = { ...currentBoard, columns: newColumns };
                        return { boards: newBoards };
                    });
                } catch (error) {
                    console.error("Store: Error deleting column", error);
                }
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
                activeBoardId: state.activeBoardId,
                language: state.language,
                currentView: state.currentView,
            }),
        }
    )
);
