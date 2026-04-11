"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Info, AlertCircle, Lightbulb, MessageSquare, Quote as QuoteIcon, List, ListOrdered, CheckSquare, ExternalLink, HelpCircle, ChevronDown, ChevronRight, User, Calendar, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    getGeneralOnboardingModules, 
    getGeneralOnboardingTasks, 
    getContentBlocks, 
    GeneralTask, 
    ContentBlock, 
    getUserResponses, 
    upsertUserResponse, 
    getUserTaskProgress, 
    upsertUserTaskProgress, 
    TaskProgress 
} from "@/app/actions/general-onboarding-actions";
import { slugify } from "@/lib/utils";
import LoadingView from "@/components/loading-view";

// Very basic custom Markdown parser designed specifically to cleanly format block contents
function SimpleMarkdown({ text }: { text: string }) {
    if (!text) return null;
    
    // Split into paragraphs by double newlines
    const paragraphs = text.split('\n\n');

    return (
        <div className="space-y-4 text-[15.5px] leading-[1.75]">
            {paragraphs.map((paragraph, pi) => {
                const lines = paragraph.split('\n');
                
                return (
                    <div key={pi} className="space-y-2">
                        {lines.map((line, i) => {
                            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                            
                            if (line.startsWith('### ')) {
                                return <h4 key={i} className="text-[19px] font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100">{formatInline(line.replace('### ', ''))}</h4>
                            }
                            if (line.startsWith('## ')) {
                                return <h3 key={i} className="text-2xl font-bold mt-8 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2 text-slate-900 dark:text-slate-100">{formatInline(line.replace('## ', ''))}</h3>
                            }
                            if (line.startsWith('# ')) {
                                return <h2 key={i} className="text-3xl font-extrabold mt-8 mb-4 text-slate-900 dark:text-slate-100">{formatInline(line.replace('# ', ''))}</h2>
                            }
                            if (isBullet) {
                                const content = line.trim().substring(2);
                                return <ul key={i} className="list-disc pl-5 mt-1 text-slate-700 dark:text-slate-300"><li className="py-0.5">{formatInline(content)}</li></ul>
                            }
                            // Handle horizontal rules ---
                            if (line.trim() === '---') {
                                return <hr key={i} className="border-slate-200 dark:border-zinc-800 my-8" />
                            }
                            
                            if (line.trim() === '') return null;

                            return <p key={i} className="text-slate-700 dark:text-slate-300">{formatInline(line)}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    )
}

function formatInline(text: string) {
    if (!text) return null;
    
    let parts: (string | React.ReactNode)[] = [text];

    // Bold
    parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const boldRegex = /\*\*(.*?)\*\*/g;
        const split = p.split(boldRegex);
        return split.map((s, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{s}</strong> : s);
    });

    // Italic
    parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const italicRegex = /\*(.*?)\*/g;
        const split = p.split(italicRegex);
        return split.map((s, i) => i % 2 === 1 ? <em key={i} className="italic">{s}</em> : s);
    });

    // Code
    parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const codeRegex = /`(.*?)`/g;
        const split = p.split(codeRegex);
        return split.map((s, i) => i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-sm text-indigo-600 dark:text-indigo-400">{s}</code> : s);
    });

    return <>{parts}</>;
}

interface TaskRunnerProps {
    taskSlug: string;
    projectId?: string;
    backHref: string;
    onCompleteHref?: string; // If not provided, will compute based on module slug
}

export default function TaskRunner({ taskSlug, projectId, backHref, onCompleteHref }: TaskRunnerProps) {
    const router = useRouter();

    const [task, setTask] = useState<GeneralTask | null>(null);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [completedPages, setCompletedPages] = useState<number[]>([]);
    const [hasInitializedPage, setHasInitializedPage] = useState(false);

    const markPageRead = async () => {
        const newCompleted = Array.from(new Set([...completedPages, currentPageIndex]));
        setCompletedPages(newCompleted);
        try {
            await upsertUserTaskProgress({
                task_id: task?.id || taskSlug,
                completed_pages: newCompleted,
                is_completed: false
            });
        } catch(e) { console.error("Failed saving page progress", e); }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [tsks, allModules] = await Promise.all([
                    getGeneralOnboardingTasks(projectId),
                    getGeneralOnboardingModules(projectId)
                ]);
                
                const currentTask = tsks.find(t => slugify(t.title) === taskSlug || t.id === taskSlug);
                setTask(currentTask || null);

                if (currentTask) {
                    const actualTaskId = currentTask.id;
                    const [fetchedBlocks, fetchedResponses, allProgresses] = await Promise.all([
                        getContentBlocks(actualTaskId),
                        getUserResponses(actualTaskId),
                        getUserTaskProgress()
                    ]);
                    
                    const myProgress = allProgresses.find(p => p.task_id === actualTaskId);
                    if (myProgress && myProgress.completed_pages) {
                        setCompletedPages(myProgress.completed_pages);
                    }

                    setBlocks(fetchedBlocks.sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
                    
                    const resMap: Record<string, any> = {};
                    fetchedResponses.forEach(r => {
                        resMap[r.block_id] = r.response_value;
                    });
                    setResponses(resMap);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [taskSlug, projectId]);

    // Group blocks by pages based on "page_behavior" = "new_page"
    const pages = useMemo(() => {
        if (!blocks.length) return [];
        const result: ContentBlock[][] = [];
        let currentGroup: ContentBlock[] = [];

        blocks.forEach((block, index) => {
            if (index > 0 && block.page_behavior === 'new_page') {
                result.push(currentGroup);
                currentGroup = [block];
            } else {
                currentGroup.push(block);
            }
        });

        if (currentGroup.length > 0) result.push(currentGroup);
        return result;
    }, [blocks]);

    // Handle initial load and page restoration
    useEffect(() => {
        if (pages.length > 0 && !hasInitializedPage) {
            let completed = completedPages;
            
            // Auto navigate to next unread page
            let nextUnread = 0;
            for (let i = 0; i < pages.length; i++) {
                if (!completed.includes(i)) {
                    nextUnread = i;
                    break;
                }
            }
            // if all are complete, start from first page
            if (completed.length === pages.length) {
                nextUnread = 0;
            }
            setCurrentPageIndex(nextUnread);
            setHasInitializedPage(true);
        }
    }, [pages.length, taskSlug, hasInitializedPage]);

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 5 ? Math.max(0, Math.min(window.scrollY / totalHeight, 1)) : 1;
            setScrollProgress(progress);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        
        const observer = new ResizeObserver(() => handleScroll());
        observer.observe(document.body);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [currentPageIndex]);

    const interactiveBlocks = useMemo(() => blocks.filter(b => ['reflection_question', 'quiz_mcq', 'consent_form', 'feedback_form'].includes(b.type)), [blocks]);
    const allSubmittedGlobally = interactiveBlocks.every(b => responses[b.id]?.status === 'submitted');

    const currentPageInteractiveBlocks = useMemo(() => {
        if (pages.length === 0) return [];
        return pages[currentPageIndex].filter(b => ['reflection_question', 'quiz_mcq', 'consent_form', 'feedback_form'].includes(b.type));
    }, [pages, currentPageIndex]);

    const allSubmittedOnCurrentPage = currentPageInteractiveBlocks.every(b => responses[b.id]?.status === 'submitted');

    const saveResponse = async (blockId: string, value: any, status: 'draft' | 'submitted' = 'draft') => {
        if (!task) return;
        const payload = { ...value, status };
        setResponses(prev => ({ ...prev, [blockId]: payload }));
        try {
            await upsertUserResponse({
                task_id: task.id,
                block_id: blockId,
                response_value: payload
            });
        } catch (e) {
            console.error("Failed to save response", e);
        }
    };

    const handleComplete = async () => {
        if (!task) return;
        const newCompleted = Array.from(new Set([...completedPages, currentPageIndex]));
        setCompletedPages(newCompleted);
        
        try {
            await upsertUserTaskProgress({
                task_id: task.id,
                completed_pages: newCompleted,
                is_completed: true,
                completed_at: new Date().toISOString()
            });
            
            if (onCompleteHref) {
                router.push(onCompleteHref);
            } else {
                const allModules = await getGeneralOnboardingModules(projectId);
                const parentModule = allModules.find(m => m.id === task.module_id);
                const baseUrl = projectId ? `/projects/${projectId}/onboarding` : "/onboarding";
                const modulePath = parentModule ? `${baseUrl}/tasks/${slugify(parentModule.title)}` : baseUrl;
                router.push(modulePath);
            }
        } catch(e) { 
            console.error("Failed saving final completion status", e); 
            router.push(backHref);
        }
    };

    const handleNextPage = () => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: "instant" });
        }
    };

    const handlePrevPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: "instant" });
        }
    };

    if (isLoading) return <LoadingView fullScreen={true} />;
    if (!task) return <div className="p-8 text-center text-slate-500">Task content not found</div>;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push(backHref)}
                    className="h-8 px-2 text-slate-500"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h1>
                    <p className="text-slate-500 mt-2">{task.description}</p>
                </div>
            </div>

            <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-zinc-800 -mx-4 px-4 md:-mx-6 md:px-6 mb-8 mt-4 transition-all">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Progress</span>
                    <span>{Math.round(pages.length > 0 ? ((currentPageIndex + (completedPages.includes(currentPageIndex) ? 1 : scrollProgress)) / pages.length) * 100 : 0)}%</span>
                </div>
                <Progress value={pages.length > 0 ? ((currentPageIndex + (completedPages.includes(currentPageIndex) ? 1 : scrollProgress)) / pages.length) * 100 : 0} className="h-2 indicator-emerald-500" />
            </div>

            <div className="flex flex-col gap-8">
                {pages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-dashed">
                        No content blocks have been added yet
                    </div>
                ) : (
                    pages[currentPageIndex].map((block, i) => (
                        <div key={block.id} className="w-full flex flex-col gap-2">
                            {block.page_behavior === 'section_break' && i !== 0 && (
                                <div className="py-6 flex items-center gap-4">
                                    <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
                                    <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1"></div>
                                </div>
                            )}

                            {block.type === 'heading' && (
                                <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-slate-200 block-formatting">
                                    <SimpleMarkdown text={block.title || block.content || ""} />
                                </h2>
                            )}
                            {block.type === 'text' && (
                                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                    <SimpleMarkdown text={block.content || ""} />
                                </div>
                            )}
                            {block.type === 'plain_text' && (
                                <div className="text-slate-700 dark:text-slate-300 text-[15.5px] leading-[1.75] whitespace-pre-wrap">
                                    {block.content}
                                </div>
                            )}
                            {block.type === 'embed' && block.metadata?.url && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/5">
                                    <iframe 
                                        src={block.metadata.url.replace("watch?v=", "embed/")} 
                                        className="w-full h-full border-0"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                            {block.type === 'pdf_viewer' && block.metadata?.url && (
                                <div className="w-full h-[70vh] min-h-[500px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                    <iframe 
                                        src={block.metadata.url} 
                                        className="w-full h-full border-0"
                                    />
                                </div>
                            )}
                            {block.type === 'notion' && block.metadata?.url && (
                                <div className="w-full flex flex-col gap-4 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm relative group">
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-inherit flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                                                <img src="https://www.notion.so/images/logo-ios.png" className="w-5 h-5 rounded-[4px]" alt="Notion" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{block.title || "Notion Document"}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Sync External Content</div>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-8 gap-2 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 font-bold" asChild>
                                            <a href={block.metadata.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-3 h-3" /> View Full Page
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="relative aspect-[16/10] sm:aspect-video w-full bg-slate-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                                        <iframe 
                                            src={block.metadata.url} 
                                            className="relative z-10 w-full h-full border-0 bg-white dark:bg-zinc-950"
                                            title={block.title || "Notion Content"}
                                        />
                                    </div>
                                </div>
                            )}

                            {block.type === 'callout' && (
                                <div className={`flex gap-3 p-4 rounded-lg border transition-all ${
                                    block.metadata?.color === 'amber' ? 'bg-amber-50/30 border-amber-200/50 text-amber-900 dark:bg-amber-900/10 dark:border-amber-900/40 dark:text-amber-100' :
                                    block.metadata?.color === 'rose' ? 'bg-rose-50/30 border-rose-200/50 text-rose-900 dark:bg-rose-900/10 dark:border-rose-900/40 dark:text-rose-100' :
                                    block.metadata?.color === 'emerald' ? 'bg-emerald-50/30 border-emerald-200/50 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-900/40 dark:text-emerald-100' :
                                    block.metadata?.color === 'indigo' ? 'bg-indigo-50/30 border-indigo-200/50 text-indigo-900 dark:bg-indigo-900/10 dark:border-indigo-900/40 dark:text-indigo-100' :
                                    'bg-slate-50 border-slate-200 text-slate-900 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-slate-100'
                                }`}>
                                    <div className="text-xl shrink-0 pt-0.5 select-none opacity-80">
                                        {block.metadata?.icon || '💡'}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {block.title && <div className="font-bold text-sm tracking-tight">{block.title}</div>}
                                        <div className="text-[14px] leading-relaxed opacity-90">
                                            <SimpleMarkdown text={block.content || ""} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {block.type === 'quote' && (
                                <div className="relative pl-6 py-1 border-l-4 border-slate-300 dark:border-zinc-700 italic text-xl text-slate-700 dark:text-slate-300 font-medium">
                                    <QuoteIcon className="absolute -left-2 -top-2 w-8 h-8 text-slate-100 dark:text-zinc-800 -z-10 rotate-180" />
                                    <SimpleMarkdown text={block.content || ""} />
                                    {block.title && <div className="mt-3 text-sm font-bold not-italic text-slate-500">— {block.title}</div>}
                                </div>
                            )}

                            {block.type === 'bulleted_list' && (
                                <ul className="list-disc pl-6 space-y-2.5">
                                    {(block.content || "").split('\n').filter(l => l.trim()).map((line, idx) => (
                                        <li key={idx} className="text-slate-700 dark:text-slate-300 text-[15.5px]">
                                            {formatInline(line.startsWith('- ') || line.startsWith('* ') ? line.substring(2) : line)}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {block.type === 'numbered_list' && (
                                <ol className="list-decimal pl-6 space-y-2.5">
                                    {(block.content || "").split('\n').filter(l => l.trim()).map((line, idx) => (
                                        <li key={idx} className="text-slate-700 dark:text-slate-300 text-[15.5px]">
                                            {formatInline(line.replace(/^\d+\.\s+/, ''))}
                                        </li>
                                    ))}
                                </ol>
                            )}

                            {block.type === 'to_do' && (
                                <div className="flex flex-col gap-3">
                                    {(block.content || "").split('\n').filter(l => l.trim()).map((line, idx) => (
                                        <div key={idx} className="flex items-start gap-3 group">
                                            <div className="mt-1 transition-transform group-hover:scale-110 cursor-pointer">
                                                <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 dark:border-zinc-700 flex items-center justify-center"></div>
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300 text-[15.5px]">
                                                {formatInline(line)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {block.type === 'reflection_question' && (
                                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-4 gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                    <HelpCircle className="w-4 h-4" />
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] whitespace-pre-wrap">
                                                    {block.content || block.title}
                                                </h3>
                                            </div>
                                            {responses[block.id]?.status === 'submitted' && (
                                                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[10px]">
                                                    <CheckCircle2 className="w-3 h-3 mr-1"/> Submitted
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <Textarea 
                                                placeholder="Type your reflection here..." 
                                                value={responses[block.id]?.text ?? ''} 
                                                onChange={(e) => setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], text: e.target.value } }))}
                                                onBlur={(e) => { 
                                                    if (e.target.value && responses[block.id]?.status !== 'submitted') {
                                                        saveResponse(block.id, { text: e.target.value }, 'draft'); 
                                                    }
                                                }}
                                                className="min-h-[100px] bg-transparent border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500 resize-none text-[14px]"
                                                disabled={responses[block.id]?.status === 'submitted'}
                                            />
                                            {responses[block.id]?.status !== 'submitted' && (
                                                <div className="flex items-center gap-3">
                                                    <Button variant="outline" size="sm" onClick={() => saveResponse(block.id, { text: responses[block.id]?.text || '' }, 'draft')} className="h-8 text-xs font-semibold">Save Draft</Button>
                                                    <Button size="sm" className="h-8 text-xs font-semibold" onClick={() => saveResponse(block.id, { text: responses[block.id]?.text || '' }, 'submitted')} disabled={!responses[block.id]?.text}>Submit Answer</Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {block.type === 'quiz_mcq' && (
                                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                                     <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-6 gap-4">
                                            <h3 className="font-bold whitespace-pre-wrap text-base text-slate-900 dark:text-slate-100 flex-1">{block.content || block.title}</h3>
                                            {responses[block.id]?.status === 'submitted' && (
                                                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[10px]">
                                                    <CheckCircle2 className="w-3 h-3 mr-1"/> Submitted
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4].map(num => {
                                                const optionText = block.metadata?.[`option${num}`];
                                                if (!optionText) return null;
                                                const selectedOption = responses[block.id]?.selected;
                                                const isSelected = selectedOption === num;
                                                return (
                                                    <label key={num} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50 border-slate-100 dark:border-zinc-800'}`}>
                                                        <input 
                                                            type="radio" 
                                                            className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" 
                                                            name={`quiz_${block.id}`}
                                                            checked={isSelected} 
                                                            onChange={() => saveResponse(block.id, { selected: num }, 'submitted')} 
                                                        />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{optionText}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {responses[block.id]?.selected && block.metadata?.correctAnswer && (
                                            <div className={`mt-4 p-3 rounded-md text-xs font-semibold flex items-center gap-2 ${responses[block.id].selected === block.metadata.correctAnswer ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
                                                {responses[block.id].selected === block.metadata.correctAnswer ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                                                {responses[block.id].selected === block.metadata.correctAnswer ? 'Correct answer' : 'Incorrect answer. Please review and try again.'}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {block.type === 'consent_form' && (
                                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm mt-6 overflow-hidden">
                                    <CardHeader className="space-y-1 pb-6">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                                            <Shield className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Policy Commitment</span>
                                        </div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                            {block.title || "Volunteer Commitment Confirmation"}
                                        </CardTitle>
                                        <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                                            Please review and confirm your alignment with our values and policies.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-zinc-900/30 p-4 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                                            <SimpleMarkdown text={block.content || ""} />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`name-${block.id}`} className="text-xs font-medium text-slate-500">
                                                        Full Name
                                                    </Label>
                                                    <Input 
                                                        id={`name-${block.id}`}
                                                        placeholder="Enter your full name" 
                                                        value={responses[block.id]?.name || ''}
                                                        onChange={(e) => setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], name: e.target.value } }))}
                                                        className="h-10 border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500 transition-all bg-transparent"
                                                        disabled={responses[block.id]?.status === 'submitted'}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`date-${block.id}`} className="text-xs font-medium text-slate-500">
                                                        Date of Acknowledgement
                                                    </Label>
                                                    <Input 
                                                        id={`date-${block.id}`}
                                                        type="date"
                                                        value={responses[block.id]?.date || new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], date: e.target.value } }))}
                                                        className="h-10 border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500 transition-all bg-transparent"
                                                        disabled={responses[block.id]?.status === 'submitted'}
                                                    />
                                                </div>
                                            </div>

                                            <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-300 ${responses[block.id]?.agreed ? 'bg-indigo-50/30 border-indigo-200/50 dark:bg-indigo-900/10 dark:border-indigo-900/30' : 'bg-slate-50/50 border-slate-100 dark:bg-zinc-900/30 dark:border-zinc-800'}`}>
                                                <Checkbox 
                                                    id={`agree-${block.id}`}
                                                    checked={responses[block.id]?.agreed || false}
                                                    onCheckedChange={(checked) => {
                                                        if (responses[block.id]?.status !== 'submitted') {
                                                            setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], agreed: !!checked } }));
                                                        }
                                                    }}
                                                    disabled={responses[block.id]?.status === 'submitted'}
                                                    className="mt-0.5"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label 
                                                        htmlFor={`agree-${block.id}`}
                                                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                                                    >
                                                        I Agree to the Commitments
                                                    </Label>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                                                        By checking this box, I confirm that I have read and understood the volunteering commitments and will uphold them faithfully.
                                                    </p>
                                                </div>
                                            </div>

                                            {responses[block.id]?.status !== 'submitted' ? (
                                                <Button 
                                                    className="w-full h-11 text-sm font-bold transition-all shadow-sm" 
                                                    disabled={!responses[block.id]?.agreed || !responses[block.id]?.name}
                                                    onClick={() => saveResponse(block.id, responses[block.id], 'submitted')}
                                                >
                                                    Confirm Acknowledgement
                                                </Button>
                                            ) : (
                                                <div className="w-full flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold rounded-lg border border-emerald-100 dark:border-emerald-900/30 gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Acknowledgement Submitted
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {block.type === 'feedback_form' && (
                                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 shadow-sm mt-8 overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 dark:border-zinc-900/50 pb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                                    {block.title || "Onboarding Experience Survey"}
                                                </CardTitle>
                                                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">Help us improve the onboarding journey for future volunteers.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-10">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-emerald-200 text-emerald-600">1</Badge>
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">Experience Ratings</h3>
                                            </div>
                                            
                                            <div className="rounded-lg border border-slate-100 dark:border-zinc-800/50 overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
                                                        <TableRow className="h-10 hover:bg-transparent border-slate-100 dark:border-zinc-800">
                                                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</TableHead>
                                                            {[1, 2, 3, 4, 5].map(rating => (
                                                                <TableHead key={rating} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{rating}</TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {[
                                                            { id: 'clarity', label: 'Content Clarity' },
                                                            { id: 'readiness', label: 'Role Readiness' },
                                                            { id: 'policy', label: 'Policy Understanding' },
                                                            { id: 'engagement', label: 'Engagement' },
                                                            { id: 'value', label: 'Overall Value' }
                                                        ].map(cat => (
                                                            <TableRow key={cat.id} className="h-12 border-slate-50 dark:border-zinc-900/50">
                                                                <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">{cat.label}</TableCell>
                                                                {[1, 2, 3, 4, 5].map(rating => (
                                                                    <TableCell key={rating} className="text-center p-0">
                                                                        <div 
                                                                            className="flex justify-center items-center h-12 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                                                                            onClick={() => {
                                                                                if (responses[block.id]?.status !== 'submitted') {
                                                                                    setResponses(prev => ({ 
                                                                                        ...prev, 
                                                                                        [block.id]: { 
                                                                                            ...prev[block.id], 
                                                                                            ratings: { ...(prev[block.id]?.ratings || {}), [cat.id]: rating } 
                                                                                        } 
                                                                                    }));
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${responses[block.id]?.ratings?.[cat.id] === rating ? 'bg-emerald-500 border-emerald-500 shadow-sm scale-110' : 'bg-slate-50/50 border-slate-300 dark:bg-zinc-900/50 dark:border-zinc-700 hover:border-slate-400'}`}>
                                                                                {responses[block.id]?.ratings?.[cat.id] === rating && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-emerald-200 text-emerald-600">2</Badge>
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">Recommendation Score</h3>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <p className="text-xs font-medium text-slate-500">How likely are you to recommend this onboarding to others?</p>
                                                <div className="flex flex-wrap gap-1.5 justify-between">
                                                    {[...Array(11)].map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`w-9 h-9 rounded-md flex items-center justify-center cursor-pointer font-bold text-sm transition-all border ${responses[block.id]?.nps === i ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm scale-105' : 'bg-transparent border-slate-200 dark:border-zinc-800 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'}`}
                                                            onClick={() => {
                                                                if (responses[block.id]?.status !== 'submitted') {
                                                                    setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], nps: i } }));
                                                                }
                                                            }}
                                                        >
                                                            {i}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between px-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <span>Not Likely</span>
                                                    <span>Very Likely</span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-6">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-emerald-200 text-emerald-600">3</Badge>
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">Detailed Feedback</h3>
                                            </div>

                                            <div className="space-y-6">
                                                {[
                                                    { id: 'strengths', label: 'What worked best?', placeholder: 'Share highlighting moments...' },
                                                    { id: 'improvements', label: 'What could be improved?', placeholder: 'How can we make this better?' },
                                                    { id: 'comments', label: 'Additional Comments', placeholder: 'Anything else to share?' }
                                                ].map(field => (
                                                    <div key={field.id} className="space-y-2">
                                                        <Label className="text-xs font-semibold text-slate-500">{field.label}</Label>
                                                        <Textarea 
                                                            placeholder={field.placeholder}
                                                            value={responses[block.id]?.[field.id] || ''}
                                                            onChange={(e) => setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], [field.id]: e.target.value } }))}
                                                            className="min-h-[80px] text-[13px] bg-transparent border-slate-200 dark:border-zinc-800 transition-all focus-visible:ring-emerald-500"
                                                            disabled={responses[block.id]?.status === 'submitted'}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {responses[block.id]?.status !== 'submitted' ? (
                                            <Button 
                                                className="w-full h-12 text-sm font-bold rounded-lg shadow-sm" 
                                                onClick={() => saveResponse(block.id, responses[block.id], 'submitted')}
                                            >
                                                Finalize & Submit Feedback
                                            </Button>
                                        ) : (
                                            <div className="w-full flex flex-col items-center justify-center p-8 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800/50 gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <h4 className="font-bold">Thank You!</h4>
                                                    <p className="text-xs opacity-70 font-semibold uppercase tracking-wider">Feedback Submitted Successfully</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
                <div>
                    {currentPageIndex > 0 && (
                        <Button onClick={handlePrevPage} variant="outline" size="lg" className="gap-2">
                           <ArrowLeft className="w-4 h-4" /> Previous
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {pages.length > 1 && (
                        <span className="text-sm font-bold text-slate-400">Page {currentPageIndex + 1} of {pages.length}</span>
                    )}

                    {currentPageIndex < pages.length - 1 ? (
                        <div className="flex flex-col items-end gap-2 max-w-sm">
                            {!completedPages.includes(currentPageIndex) ? (
                                <div className="flex flex-col items-end gap-2">
                                    <Button onClick={markPageRead} disabled={!allSubmittedOnCurrentPage} size="lg" className="h-12 px-10 font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Mark Page as Read
                                    </Button>
                                    {!allSubmittedOnCurrentPage && (
                                        <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider text-right">Please submit answers to continue.</p>
                                    )}
                                </div>
                            ) : (
                                <Button onClick={handleNextPage} size="lg" variant="outline" className="h-12 px-10 font-bold border-2 transition-all hover:bg-slate-50 dark:hover:bg-zinc-900 active:scale-95">
                                    Next Page <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2 max-w-sm">
                            <Button onClick={handleComplete} disabled={!allSubmittedGlobally} size="lg" className="h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Task
                            </Button>
                            {!allSubmittedGlobally && (
                                <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider text-right">Submit all answers to complete.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
