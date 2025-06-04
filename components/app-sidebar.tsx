"use client"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import {
  ChevronsUpDown,
  Code,
  FileText,
  History,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Music,
  Plus,
  Settings,
  UserCircle,
  Video,
  Search,
  Trash2,
  Edit3,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useChatPersistence } from "@/hooks/use-chat-persistence"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { Input } from "@/components/ui/input"
import { formatChatTitleWithTime } from "@/lib/chat-naming"

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
}

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
}

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
}

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
}

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

interface SidebarProps {
  currentChatId?: string | null
  onChatSelect?: (chatId: string) => void
  onNewChat?: () => void
}

export function AppSidebar({ currentChatId, onChatSelect, onNewChat }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const pathname = usePathname()
  
  const {
    chats,
    deleteChat,
    updateChatTitle,
    searchChats,
    refreshChats,
  } = useChatPersistence(currentChatId || undefined)

  // Group chats by time period
  const groupChatsByPeriod = () => {
    const groups: Record<string, typeof chats> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'This Month': [],
      Older: [],
    }

    chats.forEach(chat => {
      const date = new Date(chat.updated_at || chat.created_at)
      
      if (isToday(date)) {
        groups.Today.push(chat)
      } else if (isYesterday(date)) {
        groups.Yesterday.push(chat)
      } else if (isThisWeek(date)) {
        groups['This Week'].push(chat)
      } else if (isThisMonth(date)) {
        groups['This Month'].push(chat)
      } else {
        groups.Older.push(chat)
      }
    })

    return Object.entries(groups).filter(([_, chats]) => chats.length > 0)
  }

  const handleEditChat = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = async () => {
    if (editingChatId && editingTitle.trim()) {
      await updateChatTitle(editingChatId, editingTitle.trim())
      setEditingChatId(null)
      setEditingTitle("")
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(chatId)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      await searchChats(query)
    } else {
      await refreshChats()
    }
  }

  return (
    <motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button variant="ghost" size="sm" className="flex w-fit items-center gap-2 px-2">
                      <Avatar className="rounded size-4">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <motion.li variants={variants} className="flex w-fit items-center gap-2">
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium">Gemini AI</p>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <Link href="/settings">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <Link href="/new-project">
                        <Plus className="h-4 w-4" /> New Project
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {/* New Chat Button */}
                    {!isCollapsed && (
                      <div className="mb-4 px-2">
                        <Button
                          onClick={onNewChat}
                          className="w-full justify-start gap-2"
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                          New Chat
                        </Button>
                      </div>
                    )}

                    {/* Search */}
                    {!isCollapsed && (
                      <div className="mb-4 px-2">
                        <Input
                          type="search"
                          placeholder="Search chats..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}

                    {/* Clear Chat History Button */}
                    {!isCollapsed && chats.length > 0 && (
                      <div className="mb-4 px-2">
                        <Button
                          onClick={async () => {
                            if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                              for (const chat of chats) {
                                await deleteChat(chat.id)
                              }
                              onNewChat?.()
                            }
                          }}
                          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear Chat History
                        </Button>
                      </div>
                    )}

                    {/* Chat History Section */}
                    {groupChatsByPeriod().map(([period, periodChats]) => (
                      <div key={period} className="mb-4">
                        <div className="mb-1 px-2">
                          <motion.div variants={variants} className="flex items-center">
                            {!isCollapsed && (
                              <p className="text-xs font-semibold text-muted-foreground">{period.toUpperCase()}</p>
                            )}
                          </motion.div>
                        </div>

                        {periodChats.map((chat) => (
                          <div
                            key={chat.id}
                            className={cn(
                              "group flex h-auto w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary cursor-pointer",
                              currentChatId === chat.id && "bg-muted text-blue-600",
                            )}
                            onClick={() => onChatSelect?.(chat.id)}
                          >
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <motion.div variants={variants} className="flex-1 min-w-0">
                              {!isCollapsed && (
                                <>
                                  {editingChatId === chat.id ? (
                                    <div className="ml-2 flex items-center gap-1">
                                      <Input
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveEdit()
                                          if (e.key === 'Escape') {
                                            setEditingChatId(null)
                                            setEditingTitle("")
                                          }
                                        }}
                                        className="h-6 text-sm"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  ) : (
                                    <div className="ml-2 flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {chat.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {chat.message_count} messages • {format(new Date(chat.created_at), isToday(new Date(chat.created_at)) ? 'HH:mm' : isYesterday(new Date(chat.created_at)) ? "'Yesterday'" : isThisWeek(new Date(chat.created_at)) ? 'EEEE' : 'MMM d')}
                                        </p>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditChat(chat.id, chat.title)
                                          }}
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 hover:text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteChat(chat.id)
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    ))}

                    {chats.length === 0 && !isCollapsed && (
                      <div className="px-2 py-4 text-center">
                        <p className="text-sm text-muted-foreground">No chats yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Start a new conversation!</p>
                      </div>
                    )}

                    <Separator className="my-2" />

                    {/* Canvas Tabs */}
                    <div className="mt-2 mb-1 px-2">
                      <motion.div variants={variants} className="flex items-center">
                        {!isCollapsed && <p className="text-xs font-semibold text-muted-foreground">CANVAS</p>}
                      </motion.div>
                    </div>

                    <Link
                      href="/canvas/preview"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/preview") && "bg-muted text-blue-600",
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Preview</p>}
                      </motion.li>
                    </Link>

                    <Link
                      href="/canvas/code"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/code") && "bg-muted text-blue-600",
                      )}
                    >
                      <Code className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Code</p>}
                      </motion.li>
                    </Link>

                    <Link
                      href="/canvas/images"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/images") && "bg-muted text-blue-600",
                      )}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Images</p>}
                      </motion.li>
                    </Link>

                    <Link
                      href="/canvas/video"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/video") && "bg-muted text-blue-600",
                      )}
                    >
                      <Video className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Video</p>}
                      </motion.li>
                    </Link>

                    <Link
                      href="/canvas/audio"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/audio") && "bg-muted text-blue-600",
                      )}
                    >
                      <Music className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Audio</p>}
                      </motion.li>
                    </Link>

                    <Link
                      href="/canvas/docs"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                        pathname?.includes("/canvas/docs") && "bg-muted text-blue-600",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Docs</p>}
                      </motion.li>
                    </Link>
                  </div>
                </ScrollArea>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col p-2">
                <Link
                  href="/settings"
                  className="mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && <p className="ml-2 text-sm font-medium">Settings</p>}
                  </motion.li>
                </Link>

                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <motion.li variants={variants} className="flex w-full items-center gap-2">
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium">User</p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">User</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">user@example.com</span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="flex items-center gap-2">
                        <Link href="/profile">
                          <UserCircle className="h-4 w-4" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  )
}
