export interface Member {
  id: string
  name: string
  avatar: string
  color: string
  status?: 'pending' | 'accepted'
}

export interface Label {
  id: string
  text: string
  color: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface ActivityLog {
  id: string
  text: string
  params?: Record<string, string>
  type: 'move' | 'create' | 'edit' | 'addon'
  timestamp: string | number
  user?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface KanbanCard {
  id: string
  title: string
  description: string
  labels: Label[]
  checklist: ChecklistItem[]
  members: Member[]
  priority: string
  color?: string
  due_date?: string
  activity: ActivityLog[]
}

export interface KanbanColumn {
  id: string
  title: string
  icon: string
  cards: KanbanCard[]
}

export interface Priority {
  id: string
  label: string
  color: string
}

export interface Board {
  id: string
  name: string
  ownerId: string
  type: 'personal' | 'shared'
  isFavorite?: boolean
  columns: KanbanColumn[]
  priorities: Priority[]
  members: Member[]
}

export const mockMembers: Member[] = [
  { id: "m1", name: "Alex Rivera", avatar: "AR", color: "bg-slate-900" },
  { id: "m2", name: "Sofia Chen", avatar: "SC", color: "bg-slate-800" },
  { id: "m3", name: "Jordan Smith", avatar: "JS", color: "bg-slate-700" },
]

const defaultPriorities: Priority[] = [
  { id: 'low', label: 'Low', color: 'bg-slate-200' },
  { id: 'medium', label: 'Medium', color: 'bg-slate-400' },
  { id: 'high', label: 'High', color: 'bg-slate-600' },
  { id: 'urgent', label: 'Urgent', color: 'bg-slate-900' },
]

export const mockBoards: Board[] = [
  {
    id: "b1",
    name: "Product Roadmap",
    ownerId: "mock-user",
    type: "personal",
    priorities: defaultPriorities,
    members: [],
    columns: [
      {
        id: "todo",
        title: "To Do",
        icon: "circle",
        cards: [
          {
            id: "c1",
            title: "Research competitors",
            description: "Analyze top 3 competitors in the space.",
            labels: [{ id: "l1", text: "Research", color: "bg-blue-500/10 text-blue-500" }],
            checklist: [
              { id: "ci1", text: "Identify key players", completed: true },
              { id: "ci2", text: "Feature comparison matrix", completed: false }
            ],
            members: [mockMembers[0]],
            priority: "medium",
            activity: [
              { id: "a1", text: "board.createdCard", type: "create", timestamp: Date.now() - 86400000 }
            ]
          },
        ],
      },
      {
        id: "in-progress",
        title: "In Progress",
        icon: "loader",
        cards: [
          {
            id: "c3",
            title: "Design System",
            description: "Build out core components for the app.",
            labels: [{ id: "l3", text: "Design", color: "bg-violet-500/10 text-violet-400" }],
            checklist: [],
            members: [mockMembers[2]],
            priority: "urgent",
            activity: []
          },
        ],
      },
      {
        id: "done",
        title: "Done",
        icon: "check-circle",
        cards: [
          {
            id: "c4",
            title: "Initial Setup",
            description: "Repo created and basic CI/CD configured.",
            labels: [{ id: "l4", text: "DevOps", color: "bg-slate-900/10 text-slate-800" }],
            checklist: [],
            members: [mockMembers[0]],
            priority: "low",
            activity: []
          },
        ],
      },
    ],
  },
]
