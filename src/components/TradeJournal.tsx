// ============================================================================
// WARRIKS AI — Trading Journal Panel
// Reflective journaling with mood tracking, tags, and lessons learned
// ============================================================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Smile,
  Frown,
  Meh,
  Zap,
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  MessageSquare,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

interface TradeJournalProps {
  activeSymbol: string;
}

const MOODS = [
  { value: "BULLISH" as const, label: "Bullish", icon: TrendingUp, color: "#10b981" },
  { value: "CONFIDENT" as const, label: "Confident", icon: Smile, color: "#06b6d4" },
  { value: "NEUTRAL" as const, label: "Neutral", icon: Meh, color: "#64748b" },
  { value: "BEARISH" as const, label: "Bearish", icon: TrendingDown, color: "#ef4444" },
  { value: "FRUSTRATED" as const, label: "Frustrated", icon: Frown, color: "#f59e0b" },
];

const DEFAULT_TAGS = ["ICT", "SMC", "FVG", "MOMENTUM", "BREAKOUT", "REVERSION", "LONDON", "NEW_YORK", "ASIA"];

export default function TradeJournal({ activeSymbol }: TradeJournalProps) {
  const journalEntries = useQuery(api.journal.getMyJournalEntries, { symbol: activeSymbol, limit: 20 });
  const createEntry = useMutation(api.journal.createJournalEntry);
  const deleteEntry = useMutation(api.journal.deleteJournalEntry);

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lessons, setLessons] = useState("");
  const [mood, setMood] = useState<"BULLISH" | "BEARISH" | "NEUTRAL" | "FRUSTRATED" | "CONFIDENT" | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addCustomTag = () => {
    const trimmed = tagInput.trim().toUpperCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await createEntry({
        symbol: activeSymbol,
        title: title.trim(),
        content: content.trim(),
        tags,
        mood,
        lessons: lessons.trim() || undefined,
        tradeId: undefined,
      });
      setTitle("");
      setContent("");
      setLessons("");
      setMood(undefined);
      setTags([]);
      setShowNewEntry(false);
    } catch (err) {
      console.error("Failed to create journal entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"journal">) => {
    try {
      await deleteEntry({ journalId: id });
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Journal</span>
        </div>
        <button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20 hover:bg-[#06b6d4]/20 transition-all"
        >
          <Plus className="w-3 h-3" />
          New Entry
        </button>
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#1e2d3d]"
          >
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title..."
                className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#e2e8f0] px-2 py-1.5 font-medium focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your analysis, thoughts, and observations..."
                rows={3}
                className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#e2e8f0] px-2 py-1.5 resize-none focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              />
              <textarea
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="Lessons learned..."
                rows={2}
                className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[10px] text-[#f59e0b] px-2 py-1.5 resize-none focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              />

              {/* Mood Selector */}
              <div>
                <span className="text-[8px] text-[#475569] uppercase tracking-wider font-semibold mb-1 block">Mood</span>
                <div className="flex gap-1">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = mood === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setMood(isSelected ? undefined : m.value)}
                        className={`flex items-center gap-1 px-2 py-1 text-[8px] font-medium transition-all border ${
                          isSelected
                            ? "bg-[#111d2e] border-[#06b6d4]/30 text-[#e2e8f0]"
                            : "bg-transparent border-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0]"
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" style={{ color: isSelected ? m.color : undefined }} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-[8px] text-[#475569] uppercase tracking-wider font-semibold mb-1 block">Tags</span>
                <div className="flex flex-wrap gap-1 mb-1">
                  {DEFAULT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-1.5 py-0.5 text-[8px] font-mono transition-all border ${
                        tags.includes(tag)
                          ? "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]"
                          : "bg-[#111d2e]/50 border-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                    placeholder="Custom tag..."
                    className="flex-1 bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-2 py-1 focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-2 py-1 text-[9px] text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20 hover:bg-[#06b6d4]/20 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full py-1.5 text-[10px] font-bold text-black bg-[#06b6d4] hover:bg-[#0891b2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Journal Entry"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Entries List */}
      <div className="flex-1 overflow-y-auto">
        {!journalEntries ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-4 h-4 border border-[#06b6d4]/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <BookOpen className="w-6 h-6 text-[#475569] mb-2" />
            <span className="text-[10px] text-[#64748b]">No journal entries yet</span>
            <span className="text-[8px] text-[#475569] mt-1">Document your trades and reflect on your strategy</span>
          </div>
        ) : (
          journalEntries.map((entry) => {
            const isExpanded = expandedId === entry._id;
            const moodInfo = MOODS.find((m) => m.value === entry.mood);
            const MoodIcon = moodInfo?.icon || Meh;

            return (
              <div key={entry._id} className="border-b border-[#1e2d3d]/50">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                  className="w-full px-3 py-2 flex items-start justify-between hover:bg-[#111d2e]/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {entry.mood && (
                        <MoodIcon className="w-3 h-3 shrink-0" style={{ color: moodInfo?.color }} />
                      )}
                      <span className="text-[10px] font-medium text-[#e2e8f0] truncate">{entry.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-[#475569]">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDate(entry.createdAt)}</span>
                      <span className="w-px h-2 bg-[#1e2d3d]" />
                      <span className="text-[#06b6d4]">{entry.symbol}</span>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {entry.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-[#111d2e] border border-[#1e2d3d] text-[#64748b]">
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 4 && (
                          <span className="text-[7px] text-[#475569]">+{entry.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                      className="p-1 text-[#475569] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-[#475569]" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-[#475569]" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {/* Content */}
                        <div className="text-[9px] text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </div>

                        {/* Lessons */}
                        {entry.lessons && (
                          <div className="border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-2">
                            <div className="flex items-center gap-1 text-[8px] text-[#f59e0b] uppercase tracking-wider font-semibold mb-1">
                              <Brain className="w-2.5 h-2.5" />
                              Lessons Learned
                            </div>
                            <div className="text-[9px] text-[#94a3b8] whitespace-pre-wrap">{entry.lessons}</div>
                          </div>
                        )}

                        {/* Tags expanded */}
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="text-[7px] px-1 py-0.5 bg-[#111d2e] border border-[#1e2d3d] text-[#64748b]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-[7px] text-[#475569]">
                          Updated: {formatDate(entry.updatedAt)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
