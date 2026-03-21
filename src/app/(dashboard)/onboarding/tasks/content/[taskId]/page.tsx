"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getGeneralOnboardingModules, getGeneralOnboardingTasks, getContentBlocks, GeneralTask, ContentBlock, getUserResponses, upsertUserResponse, getUserTaskProgress, upsertUserTaskProgress, TaskProgress } from "@/app/actions/general-onboarding-actions";
import { slugify } from "@/lib/utils";

import LoadingView from "@/components/loading-view";

export default function ContentBlockPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId: taskSlug } = use(params);
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
                    getGeneralOnboardingTasks(),
                    getGeneralOnboardingModules()
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
    }, [taskSlug]);

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
            // Add a small threshold (e.g. 5px) to ensure we hit 1 when user scrolls to bottom natively on different zoom levels
            const progress = totalHeight > 5 ? Math.max(0, Math.min(window.scrollY / totalHeight, 1)) : 1;
            setScrollProgress(progress);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        
        // Recalculate accurately if layout shifts
        const observer = new ResizeObserver(() => handleScroll());
        observer.observe(document.body);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [currentPageIndex]);

    const interactiveBlocks = useMemo(() => blocks.filter(b => b.type === 'reflection_question' || b.type === 'quiz_mcq'), [blocks]);
    const allSubmittedGlobally = interactiveBlocks.every(b => responses[b.id]?.status === 'submitted');

    const currentPageInteractiveBlocks = useMemo(() => {
        if (pages.length === 0) return [];
        return pages[currentPageIndex].filter(b => b.type === 'reflection_question' || b.type === 'quiz_mcq');
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
            
            const allModules = await getGeneralOnboardingModules();
            const parentModule = allModules.find(m => m.id === task.module_id);
            const modulePath = parentModule ? `/onboarding/tasks/${slugify(parentModule.title)}` : "/onboarding";
            router.push(modulePath);
        } catch(e) { 
            console.error("Failed saving final completion status", e); 
            router.push("/onboarding");
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
                    onClick={async () => {
                        if (task) {
                            const allModules = await getGeneralOnboardingModules();
                            const parentModule = allModules.find(m => m.id === task.module_id);
                            router.push(parentModule ? `/onboarding/tasks/${slugify(parentModule.title)}` : "/onboarding");
                        } else {
                            router.push("/onboarding");
                        }
                    }}
                    className="h-8 px-2 text-slate-500"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Module
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
                            {/* Insert a separator if this block is marked as a section_break (and it's not the first block visually on the page) */}
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
                            {block.type === 'divider' && (
                                <hr className="border-slate-200 dark:border-zinc-800 my-4" />
                            )}
                            {block.type === 'reflection_question' && (
                                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm relative overflow-hidden">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-2 gap-4">
                                            <h3 className="font-bold text-blue-900 dark:text-blue-100 whitespace-pre-wrap flex-1">{block.content || block.title}</h3>
                                            {responses[block.id]?.status === 'draft' && <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full font-bold shrink-0">Draft</span>}
                                            {responses[block.id]?.status === 'submitted' && <span className="text-[10px] uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded-full font-bold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3"/> Submitted</span>}
                                        </div>
                                        <div className="mt-4">
                                            <Textarea 
                                                placeholder="Type your reflection here..." 
                                                value={responses[block.id]?.text ?? ''} 
                                                onChange={(e) => setResponses(prev => ({ ...prev, [block.id]: { ...prev[block.id], text: e.target.value } }))}
                                                onBlur={(e) => { 
                                                    if (e.target.value && responses[block.id]?.status !== 'submitted') {
                                                        saveResponse(block.id, { text: e.target.value }, 'draft'); 
                                                    }
                                                }}
                                                className="min-h-[120px] bg-white dark:bg-zinc-950 resize-y"
                                                disabled={responses[block.id]?.status === 'submitted'}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 mt-4">
                                            {responses[block.id]?.status !== 'submitted' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => saveResponse(block.id, { text: responses[block.id]?.text || '' }, 'draft')}>Save Draft</Button>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => saveResponse(block.id, { text: responses[block.id]?.text || '' }, 'submitted')} disabled={!responses[block.id]?.text}>Submit Answer</Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {block.type === 'quiz_mcq' && (
                                <Card className="bg-amber-50/20 dark:bg-amber-900/10 border-amber-200 shadow-sm relative overflow-hidden">
                                     <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4 gap-4">
                                            <h3 className="font-bold whitespace-pre-wrap text-lg text-amber-950 dark:text-amber-100 flex-1">{block.content || block.title}</h3>
                                            {responses[block.id]?.status === 'submitted' && <span className="text-[10px] uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded-full font-bold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3"/> Submitted</span>}
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3, 4].map(num => {
                                                const optionText = block.metadata?.[`option${num}`];
                                                if (!optionText) return null;
                                                const selectedOption = responses[block.id]?.selected;
                                                const isSelected = selectedOption === num;
                                                return (
                                                    <label key={num} className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/50' : 'hover:bg-white dark:hover:bg-zinc-900/50 dark:border-zinc-800'}`}>
                                                        <input 
                                                            type="radio" 
                                                            className="w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer" 
                                                            name={`quiz_${block.id}`}
                                                            checked={isSelected} 
                                                            onChange={() => saveResponse(block.id, { selected: num }, 'submitted')} 
                                                        />
                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{optionText}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {responses[block.id]?.selected && block.metadata?.correctAnswer && (
                                            <div className={`mt-5 p-4 rounded-lg text-sm font-bold flex items-center gap-3 ${responses[block.id].selected === block.metadata.correctAnswer ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                <div className={`p-1 rounded-full ${responses[block.id].selected === block.metadata.correctAnswer ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'}`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                {responses[block.id].selected === block.metadata.correctAnswer ? 'Correct! Well done.' : 'Not quite right. Review the material and try again!'}
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
                                    <Button onClick={markPageRead} disabled={!allSubmittedOnCurrentPage} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Mark Page as Read
                                    </Button>
                                    {!allSubmittedOnCurrentPage && (
                                        <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider text-right">Please submit answers to continue.</p>
                                    )}
                                </div>
                            ) : (
                                <Button onClick={handleNextPage} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8">
                                    Continue to Next Page <ArrowLeft className="w-4 h-4 rotate-180" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2 max-w-sm">
                            <Button onClick={handleComplete} disabled={!allSubmittedGlobally} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-5 h-5" /> Mark Task as Complete
                            </Button>
                            {!allSubmittedGlobally && (
                                <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider text-right">Please submit answers to all interactive questions to complete this task.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Very basic custom Markdown parser designed specifically to cleanly format block contents
function SimpleMarkdown({ text }: { text: string }) {
    if (!text) return null;
    
    const lines = text.split('\n');
    let insideList = false;

    return (
        <div className="space-y-4 text-[15.5px] leading-[1.75]">
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
                
                if (line.trim() === '') return <div key={i} className="h-1"></div>;

                return <p key={i} className="text-slate-700 dark:text-slate-300">{formatInline(line)}</p>;
            })}
        </div>
    )
}

function formatInline(text: string) {
    // Handling basic bold `**bold**`
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    if (parts.length === 1) return text;
    
    return (
        <>
            {parts.map((part, index) => {
                if (index % 2 === 1) {
                    return <strong key={index} className="font-semibold text-slate-900 dark:text-slate-100">{part}</strong>
                }
                return part;
            })}
        </>
    );
}
