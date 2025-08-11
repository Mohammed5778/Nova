
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAiResponseStream, generateImage as generateImageService, extractUserInfo } from './services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { Part } from '@google/genai';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


// SETUP PDF.js WORKER
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.mjs";

// --- HELPERS ---
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});


// --- ENUMS & TYPES ---
enum View {
    CHAT = 'CHAT',
    IMAGE_STUDIO = 'IMAGE_STUDIO',
    CREATE_TOOL = 'CREATE_TOOL',
    PROFILE = 'PROFILE',
    SETTINGS = 'SETTINGS',
}

interface GlobalSettings {
    aiTone: 'friendly' | 'formal' | 'creative';
    creativityLevel: 'focused' | 'balanced' | 'inventive';
    defaultInternetSearch: boolean;
    defaultDeepThinking: boolean;
    defaultScientificMode: boolean;
    darkMode: boolean;
}

interface ChatSettings {
    useInternetSearch: boolean;
    useDeepThinking: boolean;
    useScientificMode: boolean;
}

// Rich Content Types
interface TableContent { type: 'table'; title: string; data: string[][]; }
interface ChartContent { type: 'chart'; title: string; data: { chartType: string; chartData: any; }; }
interface ReportContent { type: 'report'; title: string; data: { section: string; content: string }[]; }
interface NewsReportContent { type: 'news_report'; title: string; summary: string; articles: { headline: string; source: string; snippet: string; link: string }[]; }

type RichContent = TableContent | ChartContent | ReportContent | NewsReportContent;


interface Message {
  id: string;
  role: 'user' | 'model';
  content: string | RichContent;
  images?: string[]; // object URLs for UI display, or base64 for generated images
  sources?: { uri: string; title: string }[];
  filePreview?: { name: string; type: string; };
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    settings: ChatSettings;
    toolId?: string; // Link to a custom tool
    knowledgeFiles?: { name: string; content: string; }[];
}

interface CustomTool {
    id: string;
    name: string;
    icon: string; // Emoji or FontAwesome icon class
    prompt: string;
    knowledge?: {
        name: string;
        content: string;
    }[];
}

interface FilePreviewState {
    isOpen: boolean;
    isCollapsed: boolean;
    name: string;
    type: 'text' | 'table' | 'unsupported' | 'loading' | 'image' | 'video' | 'audio';
    content: string | string[][] | null;
    url?: string;
}

// --- ICONS ---
const LogoIcon = ({ className = "w-8 h-8", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="logoGradientApp" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8A2BE2"/>
          <stop offset="1" stop-color="#00BFFF"/>
        </linearGradient>
      </defs>
      <path d="M32 0L39.1132 24.8868L64 32L39.1132 39.1132L32 64L24.8868 39.1132L0 32L24.8868 24.8868L32 0Z" fill="url(#logoGradientApp)"/>
      <path d="M32 15L35.5 28.5L49 32L35.5 35.5L32 49L28.5 35.5L15 32L28.5 28.5L32 15Z" fill="#FFFFFF" fill-opacity="0.9"/>
    </svg>
);

const HomeIcon = () => <i className="fas fa-home"></i>;
const ImageIcon = () => <i className="fas fa-image"></i>;
const ToolIcon = () => <i className="fas fa-tools"></i>;
const ProfileIcon = () => <i className="fas fa-user"></i>;
const PaperPlaneIcon = () => <i className="fas fa-paper-plane"></i>;
const UploadIcon = () => <i className="fas fa-paperclip"></i>;
const SettingsIcon = () => <i className="fas fa-cog"></i>;
const PlusIcon = () => <i className="fas fa-plus"></i>;
const TrashIcon = () => <i className="fas fa-trash"></i>;
const CloseIcon = () => <i className="fas fa-times"></i>;
const FilePdfIcon = () => <i className="fas fa-file-pdf text-red-400"></i>;
const FileExcelIcon = () => <i className="fas fa-file-excel text-green-400"></i>;
const FileTextIcon = () => <i className="fas fa-file-alt text-blue-400"></i>;
const BookmarkIcon = () => <i className="fas fa-bookmark"></i>;
const BrainIcon = () => <i className="fas fa-brain"></i>;
const SearchIcon = () => <i className="fas fa-search"></i>;
const EditIcon = () => <i className="fas fa-pencil-alt"></i>;
const DownloadIcon = () => <i className="fas fa-download"></i>;
const ChevronLeftIcon = () => <i className="fas fa-chevron-left"></i>;
const ChevronRightIcon = () => <i className="fas fa-chevron-right"></i>;
const GhostIcon = () => <i className="fas fa-ghost"></i>;
const BookOpenIcon = () => <i className="fas fa-book-open"></i>;


// --- FILE PARSING UTILS ---
const parseTextFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
});

const parsePdfFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(s => (s as any).str).join(' ');
    }
    return textContent;
};

const parseXlsxFile = (file: File) => new Promise<string[][]>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        resolve(json);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
});


// --- RICH CONTENT COMPONENTS ---

const InteractiveTable: React.FC<TableContent> = ({ title, data }) => {
    const handleDownload = () => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${title || 'table'}.xlsx`);
    };

    if (!data || data.length === 0) return <p>لا توجد بيانات لعرضها.</p>;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">{title}</h4>
                <button onClick={handleDownload} className="btn-secondary !text-xs !py-1 !px-3 !rounded-md flex items-center gap-2">
                    <DownloadIcon /> تنزيل Excel
                </button>
            </div>
            <div className="overflow-x-auto table-container max-h-96">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#1e1e3e] sticky top-0">
                        <tr>
                            {data[0]?.map((cell, i) => (
                                <th key={i} className="p-3 font-semibold uppercase text-purple-300 border-b-2 border-purple-500/50 text-right">{cell}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(1).map((row, i) => (
                            <tr key={i} className="border-b border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-3">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InteractiveChart: React.FC<ChartContent> = ({ title, data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (chartRef.current && data) {
            const chartInstance = new Chart(chartRef.current, {
                type: data.chartType as any || 'bar',
                data: data.chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top', labels: { color: '#f0f0ff' } },
                        title: { display: true, text: title, color: '#f0f0ff', font: { size: 16 } }
                    },
                    scales: {
                        y: { ticks: { color: '#c0c0ff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { ticks: { color: '#c0c0ff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });
            return () => chartInstance.destroy();
        }
    }, [data, title]);

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-purple-500/30">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

const CanvasView: React.FC<{
    title: string;
    data: { section: string; content: string }[];
    onUpdate: (newTitle: string, newData: { section: string; content: string }[]) => void;
}> = ({ title, data, onUpdate }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    
    const handleBlur = () => {
        if (!canvasRef.current) return;
        const newTitle = canvasRef.current.querySelector('.canvas-title')?.textContent || title;
        const newSections = Array.from(canvasRef.current.querySelectorAll('.canvas-section')).map(sectionEl => {
            const sectionTitle = sectionEl.querySelector('.canvas-section-title')?.textContent || '';
            const sectionContent = sectionEl.querySelector('.canvas-section-content')?.textContent || '';
            return { section: sectionTitle, content: sectionContent };
        });
        
        if (newTitle !== title || JSON.stringify(newSections) !== JSON.stringify(data)) {
            onUpdate(newTitle, newSections);
        }
    };

    const handleExport = () => {
        if (canvasRef.current) {
            const canvasElement = canvasRef.current;
            html2canvas(canvasElement, { 
                backgroundColor: '#ffffff',
                scale: 2,
                windowWidth: canvasElement.scrollWidth,
                windowHeight: canvasElement.scrollHeight,
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                const imgHeight = canvas.height * pdfWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position -= pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save(`${title.replace(/ /g, '_')}.pdf`);
            });
        }
    };
    
    return (
        <div className="bg-gray-800/50 p-0.5 rounded-lg my-2 border border-purple-500/30">
             <div className="flex justify-between items-center p-2 bg-gray-950/50 rounded-t-lg">
                <span className="text-xs text-purple-300 font-mono">مستند تفاعلي</span>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="text-gray-400 hover:text-white transition-colors text-xs p-1 rounded flex items-center gap-1">
                        <DownloadIcon /> تصدير PDF
                    </button>
                </div>
            </div>
            <div ref={canvasRef} className="canvas-view" onBlur={handleBlur}>
                <h3 contentEditable suppressContentEditableWarning className="canvas-title">{title}</h3>
                {data.map((item, index) => (
                    <div key={index} className="canvas-section">
                        <h4 contentEditable suppressContentEditableWarning className="canvas-section-title">{item.section}</h4>
                        <p contentEditable suppressContentEditableWarning className="canvas-section-content">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NewsReportView: React.FC<NewsReportContent> = ({ title, summary, articles }) => {
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-purple-500/30">
            <h3 className="text-xl font-bold mb-2 text-purple-300">{title}</h3>
            {summary && <p className="text-sm text-gray-300 mb-4 pb-4 border-b border-purple-500/20">{summary}</p>}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {articles.map((article, index) => (
                    <a href={article.link} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors">
                        <h4 className="font-semibold text-white">{article.headline}</h4>
                        <p className="text-xs text-blue-300 mb-1">{article.source}</p>
                        <p className="text-sm text-gray-400">{article.snippet}</p>
                    </a>
                ))}
            </div>
        </div>
    );
};


// --- UI & VIEW COMPONENTS ---

const CodeBlock: React.FC<{ code: string; language: string; onPreview: (code: string, language: string) => void; }> = ({ code, language, onPreview }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isPreviewable = language.toLowerCase() === 'html';

    return (
        <div className="bg-gray-900 rounded-lg my-2 text-start" dir="ltr">
            <div className="flex justify-between items-center bg-gray-950/50 p-2 rounded-t-lg">
                <span className="text-xs text-purple-300 font-mono">{language || 'code'}</span>
                <div className="flex gap-2">
                     {isPreviewable && (
                        <button onClick={() => onPreview(code, language)} className="text-gray-400 hover:text-white transition-colors text-xs p-1 rounded z-10 flex items-center gap-1">
                            <i className="fas fa-eye"></i> Preview
                        </button>
                    )}
                    <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors text-xs p-1 rounded z-10 flex items-center gap-1">
                        {copied ? <><i className="fas fa-check"></i> Copied</> : <><i className="fas fa-copy"></i> Copy</>}
                    </button>
                </div>
            </div>
            <pre className="p-4 text-sm text-white rounded-b-lg whitespace-pre-wrap break-all overflow-x-auto">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const MessageBubble: React.FC<{ message: Message, onSaveMemory: (message: Message) => void, onPreviewCode: (code: string, language: string) => void, onUpdateMessageContent: (messageId: string, newContent: RichContent) => void }> = ({ message, onSaveMemory, onPreviewCode, onUpdateMessageContent }) => {
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'self-end' : 'self-start';
    const bgClass = isUser
        ? 'bg-gradient-to-r from-[#8a2be2] to-[#00bfff] text-white rounded-br-lg'
        : 'bg-[rgba(30,30,60,0.8)] border border-[rgba(138,43,226,0.3)] rounded-bl-lg';

    const renderContent = () => {
        const { content } = message;

        if (typeof content === 'string') {
            const codeBlockRegex = /```(\w*)\n([\s\S]+?)\n```/g;
            const parts = [];
            let lastIndex = 0;
            let match;
    
            while ((match = codeBlockRegex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap">{content.substring(lastIndex, match.index)}</p>);
                }
                const language = match[1] || 'plaintext';
                const code = match[2].trim();
                parts.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} onPreview={onPreviewCode} />);
                lastIndex = codeBlockRegex.lastIndex;
            }
    
            if (lastIndex < content.length) {
                parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap">{content.substring(lastIndex)}</p>);
            }
    
            if (parts.length === 0) {
                return <p className="whitespace-pre-wrap">{content}</p>;
            }
    
            return parts;
        }
        
        if (typeof content === 'object' && content !== null) {
            const richContent = content as RichContent;
            switch (richContent.type) {
                case 'table': return <InteractiveTable {...richContent} />;
                case 'chart': return <InteractiveChart {...richContent} />;
                case 'report': return <CanvasView 
                                        title={richContent.title} 
                                        data={richContent.data}
                                        onUpdate={(newTitle, newData) => {
                                            const updatedContent: ReportContent = { ...richContent, title: newTitle, data: newData };
                                            onUpdateMessageContent(message.id, updatedContent);
                                        }}
                                    />;
                case 'news_report': return <NewsReportView {...richContent} />;
                default: return <p>محتوى غير مدعوم.</p>;
            }
        }
        
        return null; // Fallback
    };

    return (
        <div className={`group relative max-w-[95%] p-4 rounded-2xl leading-relaxed animate-fade-in ${alignClass} ${bgClass}`}>
             {message.role === 'model' && (
                <button onClick={() => onSaveMemory(message)} title="حفظ في الذاكرة" className="absolute -top-2 -right-2 bg-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10">
                    <BookmarkIcon />
                </button>
            )}
            {message.filePreview && (
                <div className="mb-2 p-2 bg-black/20 rounded-lg text-sm flex items-center gap-2">
                    {message.filePreview.type.includes('pdf') ? <FilePdfIcon /> : message.filePreview.type.includes('sheet') ? <FileExcelIcon /> : <FileTextIcon />}
                    <span>ملف مرفق للتحليل: {message.filePreview.name}</span>
                </div>
            )}
            {isUser && message.images && message.images.map((img, index) => (
                <img key={`user-img-${index}`} src={img} alt="Uploaded content" className="mb-2 rounded-lg max-w-sm h-auto"/>
            ))}
            
            {renderContent()}

            {message.role === 'model' && !isUser && message.images && message.images.map((img, index) => (
                <img key={`model-img-${index}`} src={img} alt="Generated image" className="mt-4 rounded-lg max-w-full h-auto"/>
            ))}
            {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                    <h4 className="text-sm font-bold mb-2">المصادر:</h4>
                    <ul className="list-none p-0 text-xs space-y-2">
                        {message.sources.map((source, i) => (
                            <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">{i + 1}. {source.title}</a></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const MainSidebar: React.FC<{
    sessions: Record<string, ChatSession>;
    tools: CustomTool[];
    activeId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: (tool?: CustomTool) => void;
    onNewTempChat: () => void;
    onDeleteSession: (id: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
    currentView: View;
    onSetView: (view: View) => void;
    onLogout: () => void;
}> = ({ sessions, tools, activeId, onSelectSession, onNewChat, onNewTempChat, onDeleteSession, isCollapsed, onToggle, currentView, onSetView, onLogout }) => {
    const sortedSessions = Object.values(sessions).sort((a, b) => {
        const timeA = a.messages[a.messages.length - 1]?.id || '0';
        const timeB = b.messages[b.messages.length - 1]?.id || '0';
        return timeB.localeCompare(timeA);
    });

    const mainNavItems = [
        { id: View.IMAGE_STUDIO, icon: <ImageIcon />, label: 'استوديو الصور' },
        { id: View.CREATE_TOOL, icon: <ToolIcon />, label: 'إدارة الأدوات' },
        { id: View.PROFILE, icon: <ProfileIcon />, label: 'الملف الشخصي' },
        { id: View.SETTINGS, icon: <SettingsIcon />, label: 'الإعدادات' },
    ];

    const handleNewChatClick = () => {
        onSetView(View.CHAT);
        onNewChat();
    }
    
    const handleNewTempChatClick = () => {
        onSetView(View.CHAT);
        onNewTempChat();
    }
    
    const handleToolClick = (tool: CustomTool) => {
        onSetView(View.CHAT);
        onNewChat(tool);
    }
    
    const handleSessionClick = (id: string) => {
        onSetView(View.CHAT);
        onSelectSession(id);
    }

    return (
        <aside className={`bg-[rgba(10,10,26,0.8)] backdrop-blur-md flex flex-col p-3 border-l border-purple-500/20 transition-all duration-300 relative shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
            <button onClick={onToggle} className="absolute top-1/2 -left-3 transform -translate-y-1/2 w-6 h-6 bg-[#0c0c1f] border border-purple-500/30 rounded-full flex items-center justify-center text-gray-400 hover:bg-purple-500/20 z-20">
                {isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button>

            <div className={`flex items-center gap-2 mb-4 p-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2">
                    <LogoIcon className="w-8 h-8" />
                    {!isCollapsed && <span className="text-xl font-bold">Nova AI</span>}
                </div>
                {!isCollapsed && (
                    <div className="flex items-center">
                         <button onClick={handleNewTempChatClick} className="p-2 rounded-md hover:bg-purple-500/20" title="محادثة مؤقتة"><GhostIcon/></button>
                         <button onClick={handleNewChatClick} className="p-2 rounded-md hover:bg-purple-500/20" title="محادثة جديدة"><EditIcon/></button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                 <div>
                    <h3 className={`text-xs font-bold text-gray-400 uppercase pb-1 transition-all ${isCollapsed ? 'text-center' : 'px-3'}`}>الأدوات</h3>
                    <ul className="space-y-1">
                        {tools.map(tool => (
                             <li key={tool.id} title={tool.name}>
                                <a href="#" onClick={e => {e.preventDefault(); handleToolClick(tool)}} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-purple-500/10 ${isCollapsed ? 'justify-center' : ''}`}>
                                    <span className="text-xl">{tool.icon}</span>
                                    {!isCollapsed && <span className="font-semibold text-sm truncate">{tool.name}</span>}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className={`text-xs font-bold text-gray-400 uppercase pb-1 transition-all ${isCollapsed ? 'text-center' : 'px-3 pt-2'}`}>الأخيرة</h3>
                    <ul className="space-y-1">
                        {sortedSessions.map(session => (
                            <li key={session.id} className="group" title={session.title}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSessionClick(session.id); }}
                                    className={`flex justify-between items-center p-2 rounded-lg text-sm truncate w-full ${activeId === session.id && currentView === View.CHAT ? 'bg-purple-500/30' : 'hover:bg-purple-500/10'} ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    {!isCollapsed ? <span className="truncate">{session.title}</span> : <span className="w-2 h-2 bg-gray-400 rounded-full"></span>}
                                    {!isCollapsed && <button onClick={(e) => {e.stopPropagation(); onDeleteSession(session.id);}} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"><TrashIcon /></button>}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-auto w-full flex flex-col gap-2 pt-2 border-t border-purple-500/10">
                 {mainNavItems.map(item => (
                     <button
                        key={item.id}
                        onClick={() => onSetView(item.id)}
                        className={`flex items-center gap-4 w-full p-3 rounded-lg text-sm transition-colors ${currentView === item.id ? 'bg-purple-500/30 text-white' : 'text-gray-400 hover:bg-purple-500/10 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
                        title={item.label}
                    >
                        <span className="w-6 text-center text-lg">{item.icon}</span>
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                 ))}
                <button onClick={onLogout} className={`flex items-center gap-4 w-full p-3 rounded-lg text-sm transition-colors text-gray-400 hover:bg-red-500/10 hover:text-white ${isCollapsed ? 'justify-center' : ''}`} title="تسجيل الخروج">
                    <span className="w-6 text-center text-lg"><i className="fas fa-sign-out-alt"></i></span>
                    {!isCollapsed && <span>الخروج</span>}
                </button>
            </div>
        </aside>
    );
};

const ImageStudioView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }
        setIsLoading(true);
        setError('');
        setImages([]);
        try {
            const generated = await generateImageService(prompt, aspectRatio, 1);
            setImages(generated);
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء توليد الصورة. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-[#0a0a1a] p-6 rounded-xl border border-purple-500/20 space-y-4">
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="مثال: أسد مهيب في غابة نابضة بالحياة، واقعي للغاية..."
                    className="w-full p-3 h-24 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]"
                    disabled={isLoading}
                />
                <div className="flex gap-4">
                    <select
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value as any)}
                        className="flex-1 p-3 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]"
                        disabled={isLoading}
                    >
                        <option value="1:1">مربع (1:1)</option>
                        <option value="16:9">عريض (16:9)</option>
                        <option value="9:16">طولي (9:16)</option>
                        <option value="4:3">منظر طبيعي (4:3)</option>
                        <option value="3:4">بورتريه (3:4)</option>
                    </select>
                    <button onClick={handleGenerate} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isLoading}>
                        {isLoading ? 'جاري التوليد...' : <> <ImageIcon /> توليد الصور</>}
                    </button>
                </div>
            </div>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && <div className="flex items-center justify-center col-span-full"><div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}
                {images.map((img, index) => (
                    <div key={index} className="bg-[#0a0a1a] p-2 rounded-lg border border-purple-500/20">
                        <img src={img} alt={`Generated image ${index + 1}`} className="rounded-md w-full h-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ 
    settings: GlobalSettings, 
    onUpdate: (newSettings: GlobalSettings) => void,
    generalMemories: string[],
    onUpdateGeneralMemories: (memories: string[]) => void
}> = ({ settings, onUpdate, generalMemories, onUpdateGeneralMemories }) => {
    const [newMemory, setNewMemory] = useState('');
    
    const handleAddMemory = () => {
        if (newMemory.trim()) {
            onUpdateGeneralMemories([...generalMemories, newMemory.trim()]);
            setNewMemory('');
        }
    }
    
    const handleDeleteMemory = (index: number) => {
        onUpdateGeneralMemories(generalMemories.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-8">
            <div className="setting-card">
                <h2 className="setting-title">نبرة الذكاء الاصطناعي</h2>
                <div className="flex gap-2">
                    <button className={`setting-btn ${settings.aiTone === 'friendly' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'friendly' })}>ودود</button>
                    <button className={`setting-btn ${settings.aiTone === 'formal' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'formal' })}>رسمي</button>
                    <button className={`setting-btn ${settings.aiTone === 'creative' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'creative' })}>إبداعي</button>
                </div>
            </div>
            <div className="setting-card">
                <h2 className="setting-title">الميزات الافتراضية للمحادثات الجديدة</h2>
                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>تفعيل البحث في الإنترنت</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultInternetSearch} onChange={e => onUpdate({ ...settings, defaultInternetSearch: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>تفعيل التفكير العميق</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultDeepThinking} onChange={e => onUpdate({ ...settings, defaultDeepThinking: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>تفعيل وضع البحث العلمي</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultScientificMode} onChange={e => onUpdate({ ...settings, defaultScientificMode: e.target.checked })} />
                    </label>
                </div>
            </div>
            <div className="setting-card">
                <h2 className="setting-title">الذكريات العامة</h2>
                <p className="text-sm text-gray-400 mb-4">أضف ملاحظات أو حقائق تريد من Nova أن يتذكرها دائمًا في جميع المحادثات.</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMemory} 
                        onChange={e => setNewMemory(e.target.value)} 
                        placeholder="مثال: اسمي هو..." 
                        className="flex-1 modal-input"
                    />
                    <button onClick={handleAddMemory} className="btn-primary !px-6 !rounded-lg">حفظ</button>
                </div>
                 <ul className="mt-4 space-y-2">
                    {generalMemories.map((mem, index) => (
                        <li key={index} className="flex justify-between items-center bg-purple-500/10 p-2 rounded-md text-sm">
                            <span>{mem}</span>
                            <button onClick={() => handleDeleteMemory(index)} className="text-red-400 hover:text-red-600"><TrashIcon /></button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CreateToolView: React.FC<{ 
    tools: CustomTool[], 
    onUpdateTools: (tools: CustomTool[]) => void 
}> = ({ tools, onUpdateTools }) => {
    const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🤖');
    const [promptText, setPromptText] = useState('');
    const [knowledge, setKnowledge] = useState<{name: string, content: string}[]>([]);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingTool) {
            setName(editingTool.name);
            setIcon(editingTool.icon);
            setPromptText(editingTool.prompt);
            setKnowledge(editingTool.knowledge || []);
        } else {
            setName('');
            setIcon('🤖');
            setPromptText('');
            setKnowledge([]);
        }
    }, [editingTool]);

    const handleSaveTool = () => {
        if (!name.trim() || !promptText.trim()) return;

        let updatedTools;
        if (editingTool) {
            const updatedTool = { ...editingTool, name, icon, prompt: promptText, knowledge };
            updatedTools = tools.map(t => t.id === editingTool.id ? updatedTool : t);
        } else {
            const newTool: CustomTool = { id: Date.now().toString(), name, icon, prompt: promptText, knowledge };
            updatedTools = [...tools, newTool];
        }
        onUpdateTools(updatedTools);
        setEditingTool(null);
    };
    
    const handleDeleteTool = (id: string) => {
        onUpdateTools(tools.filter(t => t.id !== id));
        if (editingTool?.id === id) {
            setEditingTool(null);
        }
    };

    const handleKnowledgeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('text/')) {
            try {
                const content = await parseTextFile(file);
                setKnowledge(k => [...k, { name: file.name, content }]);
            } catch (err) {
                console.error("Failed to parse knowledge file", err);
            }
        }
        if(knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = '';
    }
    
    const handleDeleteKnowledge = (index: number) => {
        setKnowledge(k => k.filter((_, i) => i !== index));
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="setting-card space-y-4">
                    <h2 className="setting-title">{editingTool ? 'تعديل الأداة' : 'إنشاء أداة جديدة'}</h2>
                    <div>
                        <label className="block text-sm font-bold mb-2">اسم الأداة</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خبير تلخيص" className="modal-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">الأيقونة (Emoji)</label>
                        <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🤖" className="modal-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">التعليمات (System Prompt)</label>
                        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="أنت خبير في تلخيص رسائل البريد الإلكتروني..." className="w-full p-3 h-32 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">قاعدة المعرفة (ملفات نصية)</label>
                        <input type="file" accept=".txt,.md,.json,.csv" onChange={handleKnowledgeFileChange} ref={knowledgeFileInputRef} className="hidden"/>
                        <button onClick={() => knowledgeFileInputRef.current?.click()} className="btn-secondary !text-sm w-full">إضافة ملف معرفة</button>
                        <ul className="mt-2 space-y-1">
                            {knowledge.map((k, i) => (
                                <li key={i} className="flex justify-between items-center bg-purple-500/10 p-1.5 rounded text-xs">
                                    <span className="truncate">{k.name}</span>
                                    <button onClick={() => handleDeleteKnowledge(i)} className="text-red-400 hover:text-red-600"><TrashIcon /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={handleSaveTool} className="btn-primary w-full">{editingTool ? 'حفظ التغييرات' : 'حفظ الأداة'}</button>
                        {editingTool && <button onClick={() => setEditingTool(null)} className="btn-secondary w-full">إلغاء</button>}
                    </div>
                </div>
                <div className="setting-card">
                    <h2 className="setting-title">الأدوات المحفوظة</h2>
                    <ul className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
                        {tools.length === 0 && <p className="text-gray-400">لم تقم بإنشاء أي أدوات بعد.</p>}
                        {tools.map(tool => (
                            <li key={tool.id} className="flex justify-between items-center bg-purple-500/10 p-3 rounded-md">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{tool.icon}</span>
                                    <span className="font-semibold">{tool.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTool(tool)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                    <button onClick={() => handleDeleteTool(tool.id)} className="text-red-400 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ProfileView: React.FC<{
    userProfile: Record<string, any>,
    savedMemories: Message[],
    onDeleteMemory: (id: string) => void,
}> = ({ userProfile, savedMemories, onDeleteMemory }) => {
    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="setting-card">
                <h2 className="setting-title">المعلومات المكتسبة</h2>
                <p className="text-sm text-gray-400 mb-4">هذه هي الأشياء التي تعلمها Nova عنك من خلال محادثاتكم لتحسين التجربة.</p>
                 {Object.keys(userProfile).length === 0 ? (
                    <p className="text-gray-500">لم يتعلم Nova أي شيء عنك بعد. ابدأ محادثة!</p>
                 ) : (
                    <ul className="space-y-2">
                        {Object.entries(userProfile).map(([key, value]) => (
                            <li key={key} className="text-sm">
                                <strong className="capitalize text-purple-300">{key.replace(/_/g, ' ')}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
            <div className="setting-card">
                <h2 className="setting-title">الذكريات المحفوظة</h2>
                 <p className="text-sm text-gray-400 mb-4">الرسائل التي قمت بحفظها يدويًا للرجوع إليها لاحقًا.</p>
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                     {savedMemories.length === 0 ? (
                        <p className="text-gray-500">لم تقم بحفظ أي ذكريات. اضغط على أيقونة الحفظ بجانب أي رسالة من Nova.</p>
                     ) : (
                        savedMemories.map(mem => (
                            <div key={mem.id} className="relative group/memory">
                                <MessageBubble message={mem} onSaveMemory={() => {}} onPreviewCode={() => {}} onUpdateMessageContent={()=>{}}/>
                                <button onClick={() => onDeleteMemory(mem.id)} title="حذف الذاكرة" className="absolute top-0 left-0 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 opacity-0 group-hover/memory:opacity-100 transition-opacity">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))
                     )}
                 </div>
            </div>
         </div>
    );
};

const SettingsPopover: React.FC<{
    settings: ChatSettings;
    onChange: (newSettings: ChatSettings) => void;
}> = ({ settings, onChange }) => {
    return (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e3e] border border-purple-500/50 rounded-lg shadow-lg p-4 z-20">
            <div className="space-y-4">
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">البحث في الإنترنت</span>
                    <input type="checkbox" className="toggle-switch" checked={settings.useInternetSearch} onChange={e => onChange({...settings, useInternetSearch: e.target.checked})}/>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">التفكير العميق</span>
                     <input type="checkbox" className="toggle-switch" checked={settings.useDeepThinking} onChange={e => onChange({...settings, useDeepThinking: e.target.checked})}/>
                </label>
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">وضع البحث العلمي</span>
                     <input type="checkbox" className="toggle-switch" checked={settings.useScientificMode} onChange={e => onChange({...settings, useScientificMode: e.target.checked})}/>
                </label>
            </div>
        </div>
    );
};

const FilePreviewPanel: React.FC<{
    preview: FilePreviewState;
    onClose: () => void;
}> = ({ preview, onClose }) => {
    if (!preview.isOpen || preview.isCollapsed) return null;

    const renderContent = () => {
        if (preview.type === 'loading') {
            return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (preview.type === 'unsupported') {
            return <p className="text-red-400 p-4">نوع الملف غير مدعوم للمعاينة.</p>
        }
        if (preview.type === 'image') {
            return <img src={preview.url} alt={preview.name} className="max-w-full h-auto p-2 object-contain" />;
        }
        if (preview.type === 'video') {
            return <video src={preview.url} controls className="w-full p-2"></video>;
        }
        if (preview.type === 'audio') {
            return <audio src={preview.url} controls className="w-full p-4"></audio>;
        }
        if (preview.type === 'text') {
            return <pre className="p-4 text-sm whitespace-pre-wrap">{preview.content as string}</pre>
        }
        if (preview.type === 'table') {
            const data = preview.content as string[][];
            return (
                <div className="p-2 table-container overflow-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-[#1e1e3e] sticky top-0">
                            <tr>{data[0]?.map((cell, i) => <th key={i} className="p-2 border border-purple-500/20">{cell}</th>)}</tr>
                        </thead>
                        <tbody>
                            {data.slice(1).map((row, i) => <tr key={i} className="odd:bg-black/20">{row.map((cell, j) => <td key={j} className="p-2 border border-purple-500/20">{cell}</td>)}</tr>)}
                        </tbody>
                    </table>
                </div>
            );
        }
        return null;
    }

    return (
        <aside className="w-96 bg-[rgba(10,10,26,0.8)] backdrop-blur-md flex flex-col border-r border-purple-500/20 shrink-0">
            <div className="p-3 flex justify-between items-center bg-[#1e1e3e]/50 border-b border-purple-500/30">
                <h3 className="font-bold truncate" title={preview.name}>{preview.name}</h3>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-red-500/30"><CloseIcon/></button>
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
                {renderContent()}
            </div>
        </aside>
    )
};

const CodePreviewPanel: React.FC<{
    isOpen: boolean;
    code: string;
    onClose: () => void;
}> = ({ isOpen, code, onClose }) => {
    const [width, setWidth] = useState(window.innerWidth / 3);
    const panelRef = useRef<HTMLElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!panelRef.current) return;
        
        const startWidth = panelRef.current.offsetWidth;
        const startX = e.clientX;

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        const handleMouseMove = (event: MouseEvent) => {
            const dx = event.clientX - startX;
            const newWidth = startWidth - dx; 
            if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

    }, []);
    
    if (!isOpen) return null;

    return (
        <aside ref={panelRef} style={{ width: `${width}px` }} className="bg-[#0a0a1a] flex flex-col border-l border-purple-500/20 shrink-0 relative animate-fade-in-right">
            <div 
                onMouseDown={handleMouseDown}
                className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-30 group" 
            >
                <div className="w-full h-full bg-purple-500/0 group-hover:bg-purple-500/50 transition-colors duration-300"></div>
            </div>

            <div className="p-3 flex justify-between items-center bg-[#1e1e3e] border-b border-purple-500/30 shrink-0">
                <h3 className="font-bold">معاينة الكود</h3>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-red-500/30"><CloseIcon/></button>
            </div>
            <div className="flex-1 bg-white overflow-hidden">
                 <iframe 
                    srcDoc={code} 
                    title="Code Preview" 
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </aside>
    );
};

const WelcomeScreen: React.FC<{ onPromptSelect: (prompt: string) => void }> = ({ onPromptSelect }) => {
    const suggestions = [
        { title: 'كتابة قصة قصيرة', prompt: 'اكتب لي قصة قصيرة عن مستكشف فضاء يجد كوكبًا غريبًا.'},
        { title: 'شرح مفهوم معقد', prompt: 'اشرح لي مفهوم الحوسبة الكمومية بطريقة مبسطة.'},
        { title: 'تخطيط رحلة سفر', prompt: 'خطط لي رحلة سفر لمدة 5 أيام إلى اليابان، مع ذكر الأماكن والأنشطة.'},
        { title: 'كتابة بريد إلكتروني', prompt: 'اكتب بريدًا إلكترونيًا احترافيًا لطلب زيادة في الراتب.'},
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
             <LogoIcon className="w-20 h-20 mb-4"/>
            <h1 className="text-5xl font-bold mb-10 bg-gradient-to-l from-[#8a2be2] to-[#00bfff] text-transparent bg-clip-text">مرحباً في Nova AI</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => onPromptSelect(s.prompt)} className="suggestion-card">
                        <h3 className="font-bold text-lg">{s.title}</h3>
                        <p className="text-sm text-gray-400">{s.prompt}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const MainChatInterface: React.FC<{
    session: ChatSession;
    isLoading: boolean;
    onSettingsChange: (settings: ChatSettings) => void;
    onSaveMemory: (message: Message) => void;
    onPreviewCode: (code: string, language: string) => void;
    onAddKnowledgeFile: (file: File) => void;
    onDeleteKnowledgeFile: (index: number) => void;
    onUpdateMessageContent: (messageId: string, newContent: RichContent) => void;
}> = ({ session, isLoading, onSettingsChange, onSaveMemory, onPreviewCode, onAddKnowledgeFile, onDeleteKnowledgeFile, onUpdateMessageContent }) => {
    const [showSettings, setShowSettings] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session.messages, isLoading]);
    
     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsRef]);

    const handleKnowledgeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            onAddKnowledgeFile(e.target.files[0]);
        }
        if(knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = '';
    }

    return (
        <>
            <header className="p-4 flex justify-between items-center shrink-0 z-10 border-b border-purple-500/10">
                <div className="flex-1">
                    <h2 className="font-bold truncate" title={session.title}>{session.title}</h2>
                    {session.knowledgeFiles && session.knowledgeFiles.length > 0 && (
                        <div className="flex gap-2 mt-1 flex-wrap">
                            {session.knowledgeFiles.map((file, index) => (
                                <div key={index} className="bg-purple-500/20 text-xs px-2 py-1 rounded-full flex items-center gap-1.5">
                                    <FileTextIcon />
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                    <button onClick={() => onDeleteKnowledgeFile(index)} className="text-gray-400 hover:text-white"><CloseIcon/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="relative flex items-center gap-2" ref={settingsRef}>
                    <input type="file" ref={knowledgeFileInputRef} onChange={handleKnowledgeFileChange} className="hidden" accept=".pdf,.txt,.md,.csv,.xlsx,.xls" />
                    <button onClick={() => knowledgeFileInputRef.current?.click()} className="p-2 rounded-full hover:bg-purple-500/20 bg-black/20" title="إضافة ملف معرفة للمحادثة"><BookOpenIcon /></button>
                    <button onClick={() => setShowSettings(s => !s)} className="p-2 rounded-full hover:bg-purple-500/20 bg-black/20" title="إعدادات المحادثة الحالية"><SettingsIcon /></button>
                    {showSettings && <SettingsPopover settings={session.settings} onChange={onSettingsChange} />}
                </div>
            </header>
            <div className="flex-1 h-[1px] p-6 overflow-y-auto flex flex-col gap-6">
                {session.messages.map(msg => <MessageBubble key={msg.id} message={msg} onSaveMemory={onSaveMemory} onPreviewCode={onPreviewCode} onUpdateMessageContent={onUpdateMessageContent} />)}
                {isLoading && (
                    <div className="self-start flex items-center gap-2 p-4">
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-0"></div>
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                    </div>
                )}
                <div ref={chatEndRef}></div>
            </div>
        </>
    );
}

const ChatInputBar: React.FC<{
    isLoading: boolean;
    onSendMessage: (prompt: string) => void;
    onFileUpload: (file: File) => void;
    filePreview: FilePreviewState;
    activeId: string | null;
    onStartTyping: () => void;
}> = ({isLoading, onSendMessage, onFileUpload, filePreview, activeId, onStartTyping}) => {
    const [input, setInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            if (!activeId) {
                onStartTyping();
            }
            onFileUpload(e.target.files[0]);
            e.target.value = ''; // Reset file input
        }
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeId) {
            onStartTyping();
        }
        setInput(e.target.value);
    }

    return (
         <div className="p-4 bg-transparent relative shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-2 p-2 rounded-full bg-[rgba(12,12,31,0.8)] backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-black/50">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="اكتب رسالتك هنا أو ارفع ملفًا..."
                    className="flex-1 p-2 px-4 bg-transparent text-white text-base outline-none disabled:opacity-50"
                    disabled={isLoading}
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.mp4,.mp3,.wav"/>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 w-10 h-10 rounded-full transition-colors duration-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50"
                    disabled={isLoading}
                    title="رفع ملف"
                >
                    <UploadIcon />
                </button>
                <button
                    onClick={handleSend}
                    className="bg-gradient-to-r from-[#8a2be2] to-[#00bfff] text-white w-10 h-10 rounded-full transition-all duration-300 ease-in-out flex items-center justify-center hover:scale-105 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:shadow-none"
                    disabled={isLoading || (!input.trim() && !filePreview.isOpen)}>
                    <PaperPlaneIcon />
                </button>
            </div>
        </div>
    )
}

const ChatView: React.FC<{ 
    globalSettings: GlobalSettings;
    userProfile: Record<string, any>;
    generalMemories: string[];
    savedMemories: Message[];
    customTools: CustomTool[];
    onUpdateUserProfile: (profile: Record<string, any>) => void;
    onSaveMemory: (message: Message) => void;
    sessions: Record<string, ChatSession>;
    setSessions: React.Dispatch<React.SetStateAction<Record<string, ChatSession>>>;
    activeId: string | null;
    setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
    createNewSession: (tool?: CustomTool) => string;
    createTempSession: () => void;
    temporarySession: ChatSession | null;
    setTemporarySession: React.Dispatch<React.SetStateAction<ChatSession | null>>;
}> = ({ 
    globalSettings, userProfile, generalMemories, savedMemories, customTools, onUpdateUserProfile, onSaveMemory, 
    sessions, setSessions, activeId, setActiveId, createNewSession, createTempSession,
    temporarySession, setTemporarySession
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [filePreview, setFilePreview] = useState<FilePreviewState>({ isOpen: false, isCollapsed: false, name: '', type: 'unsupported', content: null });
    const [codePreview, setCodePreview] = useState({ isOpen: false, code: '', language: '' });
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleFileUpload = async (file: File) => {
        setFilePreview({ isOpen: true, isCollapsed: false, name: file.name, type: 'loading', content: null });
        setUploadedFile(file);
        try {
            if (file.type.startsWith('image/')) {
                 setFilePreview(fp => ({ ...fp, type: 'image', url: URL.createObjectURL(file) }));
            } else if (file.type.startsWith('video/')) {
                 setFilePreview(fp => ({ ...fp, type: 'video', url: URL.createObjectURL(file) }));
            } else if (file.type.startsWith('audio/')) {
                 setFilePreview(fp => ({ ...fp, type: 'audio', url: URL.createObjectURL(file) }));
            } else if (file.type === 'application/pdf') {
                const text = await parsePdfFile(file);
                setFilePreview(fp => ({ ...fp, type: 'text', content: text }));
            } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                 const table = await parseXlsxFile(file);
                setFilePreview(fp => ({ ...fp, type: 'table', content: table }));
            } else if (file.type.startsWith('text/')) {
                const text = await parseTextFile(file);
                setFilePreview(fp => ({ ...fp, type: 'text', content: text }));
            } else {
                setFilePreview(fp => ({ ...fp, type: 'unsupported', content: null }));
            }
        } catch (e) {
            console.error("Error parsing file:", e);
            setFilePreview(fp => ({ ...fp, type: 'unsupported', content: 'فشل تحليل الملف.' }));
        }
    };
    
    const closeFilePreview = () => {
        setFilePreview({ isOpen: false, isCollapsed: false, name: '', type: 'unsupported', content: null }); 
        setUploadedFile(null);
    }

    const handlePreviewCode = (code: string, language: string) => {
        if (language.toLowerCase() === 'html') {
            setCodePreview({ isOpen: true, code, language });
        }
    };

    const handleCloseCodePreview = () => {
        setCodePreview({ isOpen: false, code: '', language: '' });
    };
    
    const handleStartNewChatWithPrompt = (prompt: string) => {
        const newSessionId = createNewSession();
        // Use a microtask to ensure state is updated before sending message
        queueMicrotask(() => {
            handleSendMessage(prompt, newSessionId)
        });
    }

    const handleStartTyping = () => {
        if (!activeId) {
            createNewSession();
        }
    };
    
    const isTempChat = activeId === 'temp-chat';

    const handleSendMessage = async (prompt: string, targetSessionId?: string) => {
        const sessionId = targetSessionId || activeId;
        if (!sessionId || isLoading) return;
        
        let activeSession = isTempChat ? temporarySession : sessions[sessionId];
        if (!activeSession) return;
        
        const userMessageParts: Part[] = [];
        let userMessageUI: Partial<Message> = { content: prompt };

        let fullPrompt = prompt;
        if (filePreview.isOpen && (filePreview.type === 'text' || filePreview.type === 'table')) {
            let fileContext = filePreview.type === 'text' 
                ? (filePreview.content as string)
                : (filePreview.content as string[][]).map(row => row.join(',')).join('\n');
            fullPrompt = `بالاعتماد على محتوى الملف التالي:\n\n---\n${fileContext}\n---\n\nأجب على السؤال التالي: ${prompt}`;
            userMessageUI.filePreview = { name: filePreview.name, type: filePreview.type };
        }
        userMessageParts.push({ text: fullPrompt });

        if (uploadedFile && uploadedFile.type.startsWith('image/')) {
            const base64Data = await fileToBase64(uploadedFile);
            userMessageParts.push({ inlineData: { mimeType: uploadedFile.type, data: base64Data } });
            userMessageUI.images = [filePreview.url!];
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', ...userMessageUI, content: prompt };
        
        closeFilePreview();

        const isNewChat = activeSession.messages.length <= 1;

        const updatedMessages = [...activeSession.messages, userMessage];
        const newTitle = isNewChat ? (activeSession.toolId ? customTools.find(t=>t.id === activeSession.toolId)?.name : prompt.substring(0, 30) + '...') : activeSession.title;
        const updatedSession = { ...activeSession, messages: updatedMessages, title: newTitle || activeSession.title };
        
        if (isTempChat) {
            setTemporarySession(updatedSession);
        } else {
            setSessions(s => ({ ...s, [sessionId]: updatedSession }));
        }

        setIsLoading(true);

        const aiResponseId = (Date.now() + 1).toString();
        const aiMessagePlaceholder: Message = { id: aiResponseId, role: 'model', content: '...' };
        
        if (isTempChat) {
            setTemporarySession(s => s ? { ...s, messages: [...s.messages, aiMessagePlaceholder] } : null);
        } else {
            setSessions(s => ({ ...s, [sessionId]: { ...s[sessionId], messages: [...s[sessionId].messages, aiMessagePlaceholder] } }));
        }
        
        const history = updatedMessages;
        const activeTool = customTools.find(t => t.id === activeSession?.toolId);
        
        let fullResponse = '';
        try {
             const stream = await getAiResponseStream(
                userMessageParts, 
                history, 
                activeSession.settings, 
                userProfile, 
                generalMemories, 
                activeTool,
                sessions,
                savedMemories,
                activeSession.knowledgeFiles || []
            );

            let sources: any[] = [];
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                if (chunk.sources) sources = chunk.sources;

                const updater = (s: ChatSession | null) => {
                    if (!s) return null;
                    const currentMessages = s.messages;
                    const updatedMessages = currentMessages.map(m => m.id === aiResponseId ? { ...m, content: fullResponse, sources } : m);
                    return { ...s, messages: updatedMessages };
                };

                if (isTempChat) {
                    setTemporarySession(updater);
                } else {
                    setSessions(s => ({ ...s, [sessionId]: updater(s[sessionId])! }));
                }
            }
            
            let finalContent: string | RichContent = fullResponse;
            try {
                // To prevent parsing malformed JSON during streaming, we parse only at the end.
                const potentialJson = fullResponse.substring(fullResponse.indexOf('{'), fullResponse.lastIndexOf('}') + 1);
                const parsed = JSON.parse(potentialJson);
                if (parsed.type && ['table', 'chart', 'report', 'news_report'].includes(parsed.type)) {
                    finalContent = parsed;
                }
            } catch (e) { /* Not a JSON, treat as text */ }
            
            const finalUpdater = (s: ChatSession | null) => {
                 if (!s) return null;
                const currentMessages = s.messages;
                const updatedMessages = currentMessages.map(m => m.id === aiResponseId ? { ...m, content: finalContent, sources } : m);
                return { ...s, messages: updatedMessages };
            }

            if (isTempChat) {
                setTemporarySession(finalUpdater);
            } else {
                setSessions(s => ({ ...s, [sessionId]: finalUpdater(s[sessionId])! }));
            }


        } catch (error) {
            console.error("Error generating response:", error);
            const errorMessage: Message = { id: aiResponseId, role: 'model', content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' };
            
            const errorUpdater = (s: ChatSession | null) => {
                if (!s) return null;
                const currentMessages = s.messages;
                const updatedMessages = currentMessages.map(m => m.id === aiResponseId ? errorMessage : m);
                return { ...s, messages: updatedMessages };
            }

            if (isTempChat) {
                setTemporarySession(errorUpdater);
            } else {
                setSessions(s => ({ ...s, [sessionId]: errorUpdater(s[sessionId])! }));
            }

        } finally {
            setIsLoading(false);
            if (!activeTool && fullResponse && typeof fullResponse === 'string') {
                const info = await extractUserInfo(prompt, fullResponse);
                 if (Object.values(info).some(v => (Array.isArray(v) ? v.length > 0 : !!v))) {
                    const newProfile = { ...userProfile, ...info };
                    onUpdateUserProfile(newProfile);
                }
            }
        }
    };
    
    const handleSettingsChange = (newSettings: ChatSettings) => {
        if (!activeId) return;
        if (isTempChat) {
            setTemporarySession(s => s ? { ...s, settings: newSettings } : null);
        } else {
            setSessions(s => ({ ...s, [activeId]: { ...s[activeId], settings: newSettings } }));
        }
    };

    const handleAddKnowledgeFile = async (file: File) => {
        if (!activeId) return;
        let content = '';
        try {
            if (file.type === 'application/pdf') {
                content = await parsePdfFile(file);
            } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const table = await parseXlsxFile(file);
                content = table.map(row => row.join(',')).join('\n');
            } else if (file.type.startsWith('text/')) {
                content = await parseTextFile(file);
            } else {
                // Or show an error to the user
                console.warn("Unsupported file type for knowledge base");
                return;
            }

            const newFile = { name: file.name, content };
            
            if(isTempChat) {
                setTemporarySession(s => s ? { ...s, knowledgeFiles: [...(s.knowledgeFiles || []), newFile] } : null);
            } else {
                setSessions(s => ({ ...s, [activeId]: { ...s[activeId], knowledgeFiles: [...(s[activeId].knowledgeFiles || []), newFile] } }));
            }
        } catch (e) {
            console.error("Failed to parse knowledge file:", e);
        }
    }
    
    const handleDeleteKnowledgeFile = (index: number) => {
        if (!activeId) return;
         if(isTempChat) {
            setTemporarySession(s => s ? { ...s, knowledgeFiles: s.knowledgeFiles?.filter((_, i) => i !== index) } : null);
        } else {
            setSessions(s => ({ ...s, [activeId]: { ...s[activeId], knowledgeFiles: s[activeId].knowledgeFiles?.filter((_, i) => i !== index) } }));
        }
    }
    
    const handleUpdateMessageContent = (messageId: string, newContent: RichContent) => {
        if (!activeId) return;

        const updater = (session: ChatSession | null) => {
            if (!session) return null;
            const updatedMessages = session.messages.map(msg => 
                msg.id === messageId ? { ...msg, content: newContent } : msg
            );
            return { ...session, messages: updatedMessages };
        };

        if (isTempChat) {
            setTemporarySession(updater);
        } else {
            setSessions(s => ({ ...s, [activeId]: updater(s[activeId])! }));
        }
    };

    const activeSession = isTempChat ? temporarySession : (activeId ? sessions[activeId] : null);

    return (
        <div className="flex flex-1 h-full overflow-hidden">
             <CodePreviewPanel isOpen={codePreview.isOpen} code={codePreview.code} onClose={handleCloseCodePreview} />
             <FilePreviewPanel preview={filePreview} onClose={closeFilePreview} />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-transparent animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,43,226,0.08)_0%,transparent_60%)]"></div>
                
                 {!activeSession ? (
                    <WelcomeScreen onPromptSelect={handleStartNewChatWithPrompt}/>
                 ) : (
                    <MainChatInterface 
                        session={activeSession}
                        isLoading={isLoading}
                        onSettingsChange={handleSettingsChange}
                        onSaveMemory={onSaveMemory}
                        onPreviewCode={handlePreviewCode}
                        onAddKnowledgeFile={handleAddKnowledgeFile}
                        onDeleteKnowledgeFile={handleDeleteKnowledgeFile}
                        onUpdateMessageContent={handleUpdateMessageContent}
                    />
                 )}
                 <ChatInputBar 
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    filePreview={filePreview}
                    activeId={activeId}
                    onStartTyping={handleStartTyping}
                 />
            </div>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode, title: string, onClose: () => void, size?: 'md' | 'lg' | 'xl' | '3xl' | '5xl' }> = ({ children, title, onClose, size = 'md' }) => {
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '3xl': 'max-w-3xl',
        '5xl': 'max-w-5xl',
    };
    
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`bg-[#0c0c1f] border border-purple-500/30 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`} onClick={stopPropagation}>
                <div className="flex justify-between items-center p-4 border-b border-purple-500/30 shrink-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ApplicationShell: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [currentView, setCurrentView] = useState<View>(View.CHAT);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        aiTone: 'friendly', creativityLevel: 'balanced', defaultInternetSearch: true, defaultDeepThinking: false, defaultScientificMode: false, darkMode: true,
    });
    const [customTools, setCustomTools] = useState<CustomTool[]>([]);
    const [userProfile, setUserProfile] = useState<Record<string, any>>({});
    const [savedMemories, setSavedMemories] = useState<Message[]>([]);
    const [generalMemories, setGeneralMemories] = useState<string[]>([]);
    
    const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [temporarySession, setTemporarySession] = useState<ChatSession | null>(null);
    
    // Load data from local storage on mount
    useEffect(() => {
        const loadData = () => {
            try {
                const savedSettings = localStorage.getItem('nova-global-settings');
                if (savedSettings) setGlobalSettings(JSON.parse(savedSettings));

                const savedTools = localStorage.getItem('nova-custom-tools');
                if (savedTools) setCustomTools(JSON.parse(savedTools));

                const savedProfile = localStorage.getItem('nova-user-profile');
                if (savedProfile) setUserProfile(JSON.parse(savedProfile));

                const savedMems = localStorage.getItem('nova-saved-memories');
                if (savedMems) setSavedMemories(JSON.parse(savedMems));

                const savedGeneralMems = localStorage.getItem('nova-general-memories');
                if (savedGeneralMems) setGeneralMemories(JSON.parse(savedGeneralMems));
                
                const savedSessions = localStorage.getItem('nova-chat-sessions');
                const savedActiveId = localStorage.getItem('nova-active-chat-id');
                if (savedSessions) {
                    const parsedSessions = JSON.parse(savedSessions);
                    if (Object.keys(parsedSessions).length > 0) {
                        setSessions(parsedSessions);
                        if (savedActiveId && parsedSessions[savedActiveId]) {
                            setActiveId(savedActiveId);
                        } else {
                           const latestSessionId = Object.keys(parsedSessions).sort((a,b) => b.localeCompare(a))[0];
                           setActiveId(latestSessionId);
                        }
                    }
                }

            } catch (e) {
                console.error("Failed to load data from storage", e);
            }
        };
        loadData();
    }, []);

    // Save chat sessions to local storage
    useEffect(() => {
        try {
            if (Object.keys(sessions).length > 0) {
                 localStorage.setItem('nova-chat-sessions', JSON.stringify(sessions));
            } else {
                 localStorage.removeItem('nova-chat-sessions');
            }
            if(activeId && activeId !== 'temp-chat') {
                localStorage.setItem('nova-active-chat-id', activeId);
            } else if (!activeId) {
                localStorage.removeItem('nova-active-chat-id');
            }
        } catch (e) {
            console.error("Failed to save sessions to storage", e);
        }
    }, [sessions, activeId]);

    // Handlers to update state and local storage
    const handleUpdateSettings = (newSettings: GlobalSettings) => {
        setGlobalSettings(newSettings);
        localStorage.setItem('nova-global-settings', JSON.stringify(newSettings));
    };

    const handleUpdateTools = (newTools: CustomTool[]) => {
        setCustomTools(newTools);
        localStorage.setItem('nova-custom-tools', JSON.stringify(newTools));
    };
    
    const handleUpdateProfile = (newProfile: Record<string, any>) => {
        const fullProfile = {...userProfile, ...newProfile};
        setUserProfile(fullProfile);
        localStorage.setItem('nova-user-profile', JSON.stringify(fullProfile));
    };
    
    const handleSaveMemory = (message: Message) => {
        const newMemories = [...savedMemories.filter(m => m.id !== message.id), message];
        setSavedMemories(newMemories);
        localStorage.setItem('nova-saved-memories', JSON.stringify(newMemories));
    };
    
    const handleDeleteMemory = (id: string) => {
        const newMemories = savedMemories.filter(m => m.id !== id);
        setSavedMemories(newMemories);
        localStorage.setItem('nova-saved-memories', JSON.stringify(newMemories));
    }
    
     const handleUpdateGeneralMemories = (memories: string[]) => {
        setGeneralMemories(memories);
        localStorage.setItem('nova-general-memories', JSON.stringify(memories));
    };

    const handleDeleteSession = (id: string) => {
        const newSessions = { ...sessions };
        delete newSessions[id];
        setSessions(newSessions);

        if (activeId === id) {
             const remainingIds = Object.keys(newSessions).sort((a,b) => b.localeCompare(a));
             if (remainingIds.length > 0) {
                 setActiveId(remainingIds[0]);
             } else {
                 setActiveId(null);
             }
        }
    };
    
    const handleSetActiveSession = (id: string) => {
        setTemporarySession(null);
        setActiveId(id);
    }

    const createNewSession = useCallback((tool?: CustomTool) => {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: tool ? tool.name : "محادثة جديدة",
            messages: tool ? [{
                id: 'init',
                role: 'model',
                content: `مرحباً! أنا الآن أعمل كـ "${tool.name}". كيف أساعدك؟` 
            }] : [],
            settings: { 
                useInternetSearch: globalSettings.defaultInternetSearch, 
                useDeepThinking: globalSettings.defaultDeepThinking,
                useScientificMode: globalSettings.defaultScientificMode,
            },
            toolId: tool?.id,
            knowledgeFiles: [],
        };
        setSessions(s => ({ ...s, [newId]: newSession }));
        setTemporarySession(null);
        setActiveId(newId);
        setCurrentView(View.CHAT);
        return newId;
    }, [globalSettings]);

    const createTempSession = useCallback(() => {
        const newId = 'temp-chat';
        const newSession: ChatSession = {
            id: newId,
            title: "محادثة مؤقتة",
            messages: [{
                id: 'init-temp',
                role: 'model',
                content: 'أنت الآن في محادثة مؤقتة. لن يتم حفظ هذا الحوار.'
            }],
             settings: { 
                useInternetSearch: globalSettings.defaultInternetSearch, 
                useDeepThinking: globalSettings.defaultDeepThinking,
                useScientificMode: globalSettings.defaultScientificMode,
            },
            knowledgeFiles: [],
        };
        setTemporarySession(newSession);
        setActiveId(newId);
        setCurrentView(View.CHAT);
    }, [globalSettings]);

    const renderActiveModal = () => {
        switch (currentView) {
            case View.IMAGE_STUDIO:
                return <Modal title="استوديو الصور" onClose={() => setCurrentView(View.CHAT)} size="3xl"><ImageStudioView /></Modal>;
            case View.SETTINGS:
                return <Modal title="الإعدادات" onClose={() => setCurrentView(View.CHAT)} size="3xl">
                    <SettingsView 
                        settings={globalSettings} 
                        onUpdate={handleUpdateSettings} 
                        generalMemories={generalMemories}
                        onUpdateGeneralMemories={handleUpdateGeneralMemories}
                    />
                </Modal>;
            case View.CREATE_TOOL:
                return <Modal title="إدارة الأدوات" onClose={() => setCurrentView(View.CHAT)} size="5xl">
                    <CreateToolView tools={customTools} onUpdateTools={handleUpdateTools} />
                </Modal>;
            case View.PROFILE:
                return <Modal title="الملف الشخصي والذاكرة" onClose={() => setCurrentView(View.CHAT)} size="5xl">
                    <ProfileView userProfile={userProfile} savedMemories={savedMemories} onDeleteMemory={handleDeleteMemory} />
                </Modal>;
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-screen flex flex-row">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <button onClick={() => setIsSidebarCollapsed(p => !p)} className="absolute top-4 right-4 w-10 h-10 bg-[#0c0c1f]/50 border border-purple-500/30 rounded-full flex items-center justify-center text-gray-400 hover:bg-purple-500/20 z-20 lg:hidden">
                    <i className="fas fa-bars"></i>
                </button>
                <ChatView 
                    globalSettings={globalSettings} 
                    userProfile={userProfile} 
                    generalMemories={generalMemories} 
                    savedMemories={savedMemories}
                    customTools={customTools}
                    onUpdateUserProfile={handleUpdateProfile}
                    onSaveMemory={handleSaveMemory}
                    sessions={sessions}
                    setSessions={setSessions}
                    activeId={activeId}
                    setActiveId={setActiveId}
                    createNewSession={createNewSession}
                    createTempSession={createTempSession}
                    temporarySession={temporarySession}
                    setTemporarySession={setTemporarySession}
                />
                {renderActiveModal()}
            </div>
            <div className={`${isSidebarCollapsed ? 'hidden' : 'flex'} lg:flex`}>
                <MainSidebar
                    sessions={sessions}
                    tools={customTools}
                    activeId={activeId}
                    onSelectSession={handleSetActiveSession}
                    onNewChat={createNewSession}
                    onNewTempChat={createTempSession}
                    onDeleteSession={handleDeleteSession}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(p => !p)}
                    currentView={currentView}
                    onSetView={setCurrentView}
                    onLogout={onLogout}
                />
            </div>
        </div>
    );
};

const LandingPageHeader: React.FC<{ onAuthClick: (page: 'login' | 'signup') => void; onNavClick: (id: string) => void }> = ({ onAuthClick, onNavClick }) => (
    <header className="bg-[#050510]/80 backdrop-blur-md px-[5%] py-4 fixed w-full top-0 z-50 flex justify-between items-center border-b border-[rgba(138,43,226,0.2)]">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavClick('home')}>
             <LogoIcon className="w-10 h-10"/>
             <span className="text-2xl font-bold text-white">Nova AI</span>
         </div>
        <nav className="hidden md:flex list-none gap-8">
            <a href="#home" onClick={(e) => {e.preventDefault(); onNavClick('home');}} className="nav-link">الرئيسية</a>
            <a href="#features" onClick={(e) => {e.preventDefault(); onNavClick('features');}} className="nav-link">الميزات</a>
            <a href="#start" onClick={(e) => {e.preventDefault(); onAuthClick('signup');}} className="nav-link">ابدأ المحادثة</a>
        </nav>
        <div className="flex gap-4">
            <button onClick={() => onAuthClick('login')} className="btn-secondary">تسجيل الدخول</button>
            <button onClick={() => onAuthClick('signup')} className="btn-primary">ابدأ مجاناً</button>
        </div>
    </header>
);

const Hero: React.FC<{ onCTAClick: () => void }> = ({ onCTAClick }) => (
     <section className="min-h-screen flex items-center justify-center pt-24 pb-12 px-[5%] relative overflow-hidden" id="home">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(138,43,226,0.15)_0%,transparent_50%)] -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,191,255,0.1)_0%,transparent_50%)] -z-10"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-right">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-l from-[#8a2be2] to-[#00bfff] text-transparent bg-clip-text">
                    قوة الذكاء الاصطناعي في متناول يدك
                </h1>
                <p className="text-lg md:text-xl mb-8 text-[#c0c0ff] leading-relaxed">
                    استكشف قوة Nova AI، وكيل الذكاء الاصطناعي المتقدم الذي يمكنه التفكير والتحليل والإبداع مثل البشر. احصل على حلول ذكية لجميع احتياجاتك من البحث في الإنترنت إلى توليد الصور وكتابة الأكواد.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button onClick={onCTAClick} className="btn-primary">ابدأ الآن مجانًا</button>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="btn-secondary">اكتشف الميزات</button>
                </div>
            </div>
            <div className="flex items-center justify-center">
                 <LogoIcon className="w-64 h-64 lg:w-96 lg:h-96 animate-pulse" style={{animationDuration: '5s'}} />
            </div>
        </div>
    </section>
);

const Features: React.FC = () => {
    const featureList = [
        { icon: <SearchIcon />, title: "البحث في الإنترنت", description: "احصل على إجابات محدثة من الويب مع ذكر المصادر لضمان الشفافية." },
        { icon: <BrainIcon />, title: "التفكير العميق", description: "احصل على تحليلات معمقة ووجهات نظر متعددة للمواضيع المعقدة." },
        { icon: <ImageIcon />, title: "توليد الصور", description: "حوّل أفكارك إلى صور فنية مذهلة باستخدام نماذج توليد الصور المتقدمة." },
        { icon: <ToolIcon />, title: "أدوات مخصصة", description: "أنشئ وكلاء ذكاء اصطناعي متخصصين لمهام محددة مثل الترجمة أو كتابة الأكواد." },
    ];
    return (
        <section className="py-20 px-[5%] bg-[#050510]" id="features">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-4">كل ما تحتاجه في مكان واحد</h2>
                <p className="text-lg text-gray-400 mb-12">Nova AI ليس مجرد مساعد، بل هو شريكك الإبداعي والتحليلي.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featureList.map((feature, i) => (
                         <div key={i} className="feature-card">
                            <div className="text-4xl text-purple-400 mb-4">{feature.icon}</div>
                            <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-300">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AuthModal: React.FC<{ children: React.ReactNode, title: string, onClose: () => void }> = ({ children, title, onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-[#0c0c1f] border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white"><CloseIcon /></button>
            <h2 className="text-2xl font-bold text-center mb-6">{title}</h2>
            {children}
        </div>
    </div>
);

const LoginPage: React.FC<{ onLogin: () => void; onSwitch: () => void }> = ({ onLogin, onSwitch }) => (
    <form onSubmit={e => {e.preventDefault(); onLogin();}} className="space-y-6">
        <div>
            <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
            <input type="email" placeholder="you@example.com" className="modal-input" required />
        </div>
        <div>
            <label className="block text-sm font-bold mb-2">كلمة المرور</label>
            <input type="password" placeholder="********" className="modal-input" required />
        </div>
        <button type="submit" className="btn-primary w-full !py-3">تسجيل الدخول</button>
        <p className="text-center text-sm">
            ليس لديك حساب؟ <button type="button" onClick={onSwitch} className="text-purple-400 hover:underline">أنشئ حسابًا</button>
        </p>
    </form>
);
const SignUpPage: React.FC<{ onSignUp: () => void; onSwitch: () => void }> = ({ onSignUp, onSwitch }) => (
     <form onSubmit={e => {e.preventDefault(); onSignUp();}} className="space-y-6">
        <div>
            <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
            <input type="email" placeholder="you@example.com" className="modal-input" required />
        </div>
        <div>
            <label className="block text-sm font-bold mb-2">كلمة المرور</label>
            <input type="password" placeholder="********" className="modal-input" required />
        </div>
        <button type="submit" className="btn-primary w-full !py-3">إنشاء حساب</button>
        <p className="text-center text-sm">
            لديك حساب بالفعل؟ <button type="button" onClick={onSwitch} className="text-purple-400 hover:underline">سجل الدخول</button>
        </p>
    </form>
);
const Footer: React.FC = () => (
    <footer className="bg-[#050510] border-t border-[rgba(138,43,226,0.2)] py-8 px-[5%]">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Nova AI. جميع الحقوق محفوظة.</p>
        </div>
    </footer>
);

const LandingPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    
    const handleAuthNav = (page: 'login' | 'signup') => {
        setShowLoginModal(page === 'login');
        setShowSignupModal(page === 'signup');
    };
    
    const handleNavClick = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="h-screen overflow-y-auto bg-[#050510]">
            <LandingPageHeader onAuthClick={handleAuthNav} onNavClick={handleNavClick} />
            <main>
                <Hero onCTAClick={() => handleAuthNav('signup')} />
                <Features />
            </main>
            <Footer />
            {showLoginModal && <AuthModal title="تسجيل الدخول" onClose={() => setShowLoginModal(false)}>
                <LoginPage onLogin={onLoginSuccess} onSwitch={() => { setShowLoginModal(false); setShowSignupModal(true); }} />
            </AuthModal>}
             {showSignupModal && <AuthModal title="إنشاء حساب جديد" onClose={() => setShowSignupModal(false)}>
                <SignUpPage onSignUp={onLoginSuccess} onSwitch={() => { setShowSignupModal(false); setShowLoginModal(true); }} />
            </AuthModal>}
        </div>
    );
};

// MAIN APP COMPONENT
const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if(localStorage.getItem('nova-is-logged-in') === 'true') {
            setIsLoggedIn(true);
        }
    }, [])

    const handleLogin = () => {
        localStorage.setItem('nova-is-logged-in', 'true');
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        window.location.reload();
    };

    return (
        <>
            {isLoggedIn ? <ApplicationShell onLogout={handleLogout} /> : <LandingPage onLoginSuccess={handleLogin} />}
            <style>{`
                :root { --custom-scroll-track: #0a0a1a; --custom-scroll-thumb: #8a2be2; }
                .prose { color: #f0f0ff; }
                .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: #f0f0ff; }
                .btn-primary {
                    padding: 0.7rem 1.5rem; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; font-size: 1rem;
                    background: linear-gradient(135deg, #8a2be2, #00bfff); color: white; box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
                }
                .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4); }
                .btn-secondary {
                    padding: 0.7rem 1.5rem; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 1rem;
                    background: transparent; color: #f0f0ff; border: 1px solid #8a2be2;
                }
                .btn-secondary:hover { transform: translateY(-3px); background-color: rgba(138, 43, 226, 0.2); }
                .nav-link { color: #f0f0ff; text-decoration: none; font-weight: 500; transition: all 0.3s ease; position: relative; padding: 0.5rem 0; }
                .nav-link:hover { color: #00bfff; }
                .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: linear-gradient(135deg, #8a2be2, #00bfff); transition: width 0.3s ease; }
                .nav-link:hover::after { width: 100%; }
                .feature-card { background: rgba(20, 20, 40, 0.6); border-radius: 1rem; padding: 2rem; text-align: center; transition: all 0.3s ease; border: 1px solid rgba(138, 43, 226, 0.2); }
                .feature-card:hover { transform: translateY(-10px); box-shadow: 0 10px 30px rgba(138, 43, 226, 0.3); border-color: rgba(138, 43, 226, 0.5); }
                .modal-input { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #8a2be2; background: #050510; color: white; outline: none; transition: all 0.2s; }
                .modal-input:focus { box-shadow: 0 0 0 2px #00bfff; }
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-in-right { animation: fade-in-right 0.3s ease-out forwards; }
                .setting-card { background: #0a0a1a; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid rgba(138,43,226,0.2); }
                .setting-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; }
                .setting-btn { flex: 1; padding: 0.75rem; border: 1px solid rgba(138,43,226,0.5); background: transparent; color: white; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
                .setting-btn.active { background-color: #8a2be2; border-color: #8a2be2; }
                .setting-btn:hover:not(.active) { background-color: rgba(138,43,226,0.2); }
                .toggle-switch { appearance: none; width: 44px; height: 24px; background-color: rgb(75 85 99); border-radius: 9999px; position: relative; cursor: pointer; transition: background-color 0.2s; }
                .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background-color: white; border-radius: 9999px; transition: transform 0.2s; }
                .toggle-switch:checked { background-color: #8a2be2; }
                .toggle-switch:checked::after { transform: translateX(20px); }
                .suggestion-card { text-align: right; background-color: rgba(30, 30, 62, 0.5); border: 1px solid rgba(138, 43, 226, 0.2); padding: 1rem; border-radius: 0.75rem; transition: all 0.2s ease-in-out; }
                .suggestion-card:hover { background-color: rgba(45, 45, 80, 0.8); border-color: #8a2be2; transform: translateY(-4px); }

                /* Canvas View Styles */
                .canvas-view {
                    background-color: #ffffff;
                    color: #1f2937;
                    padding: 2rem;
                    border-radius: 0 0 0.5rem 0.5rem;
                    direction: rtl;
                    text-align: right;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .canvas-view [contenteditable]:focus {
                    outline: 2px solid #8a2be2;
                    box-shadow: 0 0 5px rgba(138, 43, 226, 0.5);
                    border-radius: 4px;
                }
                .canvas-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: #111827;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 0.75rem;
                    margin-bottom: 1.5rem;
                }
                .canvas-section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #8a2be2;
                    margin-top: 1.75rem;
                    margin-bottom: 0.5rem;
                }
                .canvas-section-content {
                    font-size: 1rem;
                    line-height: 1.75;
                    color: #374151;
                    white-space: pre-wrap;
                }
            `}</style>
        </>
    );
};

export default App;
