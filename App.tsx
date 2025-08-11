
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { getAiResponseStream, generateImage as generateImageService, extractUserInfo, enhancePromptForImage } from './services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { Part } from '@google/genai';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { translations, TranslationKey } from './translations';


// SETUP PDF.js WORKER
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.mjs";


// --- LANGUAGE PROVIDER & HOOK ---
type Language = 'ar' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('nova-language') as Language) || 'ar';
    });

    const setLanguage = (lang: Language) => {
        localStorage.setItem('nova-language', lang);
        setLanguageState(lang);
        // Set HTML lang attribute for accessibility
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);


    const t = (key: TranslationKey, ...args: any[]): string => {
        let translation = translations[language][key] || translations['en'][key] || key;
        if (args.length > 0) {
            args.forEach((arg, index) => {
                translation = translation.replace(`{${index}}`, arg);
            });
        }
        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};



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
    creativityLevel: 'balanced' | 'focused' | 'inventive';
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
interface ResumeContent {
    type: 'resume';
    name: string;
    title: string;
    contact: { email?: string; phone?: string; linkedin?: string; github?: string; website?: string; };
    summary: string;
    experience: { title:string; company:string; location:string; dates:string; responsibilities:string[]; }[];
    education: { degree:string; institution:string; dates:string; details?: string; }[];
    skills: { category: string; items: string[]; }[];
    projects?: { name: string; description: string; link?: string; }[];
}
interface CodeProjectContent {
    type: 'code_project';
    title: string;
    files: { filename: string; language: string; code: string; }[];
    review: { overview: string; strengths: string[]; improvements: string[]; nextSteps: string[]; };
}
interface StudyExplanationContent { type: 'study_explanation'; topic: string; explanation: string; }
interface StudyReviewContent { type: 'study_review'; topic: string; review: { title: string; points: string[] }; }
interface StudyQuizContent {
    type: 'study_quiz';
    topic: string;
    quiz: {
        type: 'multiple_choice' | 'short_answer';
        question: string;
        options?: string[];
        correctAnswer: string | number;
    }[];
}


type RichContent = TableContent | ChartContent | ReportContent | NewsReportContent | ResumeContent | CodeProjectContent | StudyExplanationContent | StudyReviewContent | StudyQuizContent;


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

interface ImageHistoryItem {
    id: string;
    urls: string[];
    prompt: string;
    enhancedPrompt: string;
    model: 'gemini' | 'pollinations';
    style: string;
    aspectRatio: string;
    timestamp: number;
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

const ImageIcon = () => <i className="fas fa-image"></i>;
const ToolIcon = () => <i className="fas fa-tools"></i>;
const ProfileIcon = () => <i className="fas fa-user"></i>;
const PaperPlaneIcon = () => <i className="fas fa-paper-plane"></i>;
const UploadIcon = () => <i className="fas fa-paperclip"></i>;
const SettingsIcon = () => <i className="fas fa-cog"></i>;
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
    const { t } = useLanguage();
    const handleDownload = () => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${title || 'table'}.xlsx`);
    };

    if (!data || data.length === 0) return <p>{t('no_data_to_display')}</p>;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">{title}</h4>
                <button onClick={handleDownload} className="btn-secondary !text-xs !py-1 !px-3 !rounded-md flex items-center gap-2">
                    <DownloadIcon /> {t('download_excel')}
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
    const { t } = useLanguage();
    
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
                <span className="text-xs text-purple-300 font-mono">{t('interactive_document')}</span>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="text-gray-400 hover:text-white transition-colors text-xs p-1 rounded flex items-center gap-1">
                        <DownloadIcon /> {t('export_pdf')}
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

const CodeProjectView: React.FC<{ project: CodeProjectContent, onPreviewCode: (code: string, language: string) => void }> = ({ project, onPreviewCode }) => {
    const [activeTab, setActiveTab] = useState(0);
    const { title, files, review } = project;
    const { t } = useLanguage();

    const reviewIcons = {
        overview: 'fas fa-binoculars',
        strengths: 'fas fa-check-circle',
        improvements: 'fas fa-wrench',
        nextSteps: 'fas fa-arrow-right'
    };

    return (
        <div className="code-project-view">
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            
            {/* Code Files Section */}
            <div className="bg-gray-950/70 rounded-lg border border-purple-500/30">
                <div className="flex border-b border-purple-500/30 overflow-x-auto">
                    {files.map((file, index) => (
                        <button 
                            key={index} 
                            onClick={() => setActiveTab(index)}
                            className={`px-4 py-2 text-sm font-semibold shrink-0 ${activeTab === index ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-800/50'}`}
                        >
                            {file.filename}
                        </button>
                    ))}
                </div>
                <div>
                    {files.map((file, index) => (
                        <div key={index} className={activeTab === index ? 'block' : 'hidden'}>
                            <CodeBlock language={file.language} code={file.code} onPreview={onPreviewCode} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Review Section */}
            <div className="mt-6">
                <h4 className="text-lg font-bold mb-3 text-purple-300">{t('project_review')}</h4>
                <div className="space-y-4">
                    <div className="review-section">
                        <h5 className="review-title"><i className={`${reviewIcons.overview} mr-2`}></i> {t('overview')}</h5>
                        <p>{review.overview}</p>
                    </div>
                    <div className="review-section">
                         <h5 className="review-title"><i className={`${reviewIcons.strengths} mr-2 text-green-400`}></i> {t('strengths')}</h5>
                        <ul className="list-disc pl-5 space-y-1">
                            {review.strengths.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div className="review-section">
                         <h5 className="review-title"><i className={`${reviewIcons.improvements} mr-2 text-yellow-400`}></i> {t('improvement_suggestions')}</h5>
                        <ul className="list-disc pl-5 space-y-1">
                            {review.improvements.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                     <div className="review-section">
                         <h5 className="review-title"><i className={`${reviewIcons.nextSteps} mr-2 text-blue-400`}></i> {t('next_steps')}</h5>
                        <ul className="list-disc pl-5 space-y-1">
                            {review.nextSteps.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResumeView: React.FC<{ resume: ResumeContent }> = ({ resume }) => {
    const resumeRef = useRef<HTMLDivElement>(null);
    const { name, title, contact, summary, experience, education, skills, projects } = resume;
    const { t } = useLanguage();

    const handleExport = () => {
        if (resumeRef.current) {
            html2canvas(resumeRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                windowWidth: resumeRef.current.scrollWidth,
                windowHeight: resumeRef.current.scrollHeight,
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgHeight / imgWidth;
                const canvasHeightOnPdf = pdfWidth * ratio;

                let heightLeft = canvasHeightOnPdf;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightOnPdf);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = position - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightOnPdf);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`${name.replace(/ /g, '_')}_Resume.pdf`);
            });
        }
    };
    
    return (
        <div className="bg-gray-800/50 p-0.5 rounded-lg my-2 border border-purple-500/30">
            <div className="flex justify-between items-center p-2 bg-gray-950/50 rounded-t-lg">
                <span className="text-xs text-purple-300 font-mono">{t('resume_ats')}</span>
                <button onClick={handleExport} className="text-gray-400 hover:text-white transition-colors text-xs p-1 rounded flex items-center gap-1">
                    <DownloadIcon /> {t('export_pdf')}
                </button>
            </div>
            <div ref={resumeRef} className="resume-view">
                <header className="resume-header">
                    <h1>{name}</h1>
                    <h2>{title}</h2>
                    <div className="resume-contact">
                        {contact.email && <span><i className="fas fa-envelope"></i> {contact.email}</span>}
                        {contact.phone && <span><i className="fas fa-phone"></i> {contact.phone}</span>}
                        {contact.linkedin && <span><i className="fab fa-linkedin"></i> {contact.linkedin}</span>}
                        {contact.github && <span><i className="fab fa-github"></i> {contact.github}</span>}
                        {contact.website && <span><i className="fas fa-globe"></i> {contact.website}</span>}
                    </div>
                </header>
                <main className="resume-body">
                    <section className="resume-main-content">
                        <div className="resume-section">
                            <h3><i className="fas fa-user-tie"></i> {t('professional_summary')}</h3>
                            <p>{summary}</p>
                        </div>
                        <div className="resume-section">
                            <h3><i className="fas fa-briefcase"></i> {t('work_experience')}</h3>
                            {experience.map((exp, i) => (
                                <div key={i} className="resume-item">
                                    <h4>{exp.title}</h4>
                                    <h5>{exp.company} | {exp.location}</h5>
                                    <h6>{exp.dates}</h6>
                                    <ul>{exp.responsibilities.map((r, j) => <li key={j}>{r}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                         {projects && projects.length > 0 && (
                            <div className="resume-section">
                                <h3><i className="fas fa-tasks"></i> {t('projects')}</h3>
                                {projects.map((proj, i) => (
                                    <div key={i} className="resume-item">
                                        <h4>{proj.name}</h4>
                                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.link}</a>}
                                        <p>{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                    <aside className="resume-sidebar">
                        <div className="resume-section">
                            <h3><i className="fas fa-graduation-cap"></i> {t('education')}</h3>
                             {education.map((edu, i) => (
                                <div key={i} className="resume-item">
                                    <h4>{edu.degree}</h4>
                                    <h5>{edu.institution}</h5>
                                    <h6>{edu.dates}</h6>
                                    {edu.details && <p>{edu.details}</p>}
                                </div>
                            ))}
                        </div>
                        <div className="resume-section">
                            <h3><i className="fas fa-cogs"></i> {t('skills')}</h3>
                             {skills.map((skillCat, i) => (
                                <div key={i} className="mb-2">
                                    <h4>{skillCat.category}</h4>
                                    <p>{skillCat.items.join(', ')}</p>
                                </div>
                            ))}
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
};

// --- STUDY MODE COMPONENTS ---

const RichMarkdownRenderer: React.FC<{ markdown: string, onPreviewCode: (code: string, language: string) => void }> = ({ markdown, onPreviewCode }) => {
    const parts = markdown.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\|(?:[^|\r\n]*\|)+)/g).filter(Boolean);

    return (
        <div>
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeMatch = part.match(/```(\w*)\n([\s\S]+)\n```/);
                    if (codeMatch) {
                        const language = codeMatch[1] || 'plaintext';
                        const code = codeMatch[2].trim();
                        return <CodeBlock key={index} language={language} code={code} onPreview={onPreviewCode} />;
                    }
                }
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    const math = part.substring(2, part.length - 2).trim();
                    return (
                        <div key={index} className="p-4 my-2 bg-black/30 rounded-lg text-center text-lg font-mono text-purple-300 overflow-x-auto" dir="ltr">
                            {math}
                        </div>
                    );
                }
                if (part.startsWith('|')) {
                    const rows = part.split('\n').filter(row => row.includes('|'));
                    const tableData = rows.map(row => row.split('|').map(cell => cell.trim()).slice(1, -1));
                    if (tableData.length < 2) return <p key={index}>{part}</p>; // Not a valid table

                    const header = tableData[0];
                    const body = tableData.slice(2); // Skip header and separator line
                    return (
                        <div key={index} className="overflow-x-auto my-4">
                            <table className="w-full text-sm text-left border-collapse markdown-table">
                                <thead>
                                    <tr>
                                        {header.map((cell, i) => <th key={i}>{cell}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {body.map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                // Handle simple text, headings, and lists
                return part.split('\n').map((line, lineIndex) => {
                    if (line.startsWith('### ')) return <h4 key={`${index}-${lineIndex}`} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h4>;
                    if (line.startsWith('## ')) return <h3 key={`${index}-${lineIndex}`} className="text-xl font-bold mt-5 mb-3 text-purple-300">{line.substring(3)}</h3>;
                    if (line.startsWith('# ')) return <h2 key={`${index}-${lineIndex}`} className="text-2xl font-bold mt-6 mb-4 text-purple-200">{line.substring(2)}</h2>;
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={`${index}-${lineIndex}`} className="ml-5">{line.substring(2)}</li>
                    if (line.trim() === '') return null;
                    return <p key={`${index}-${lineIndex}`} className="my-2 leading-relaxed">{line}</p>;
                });
            })}
        </div>
    );
};

const StudyExplanationView: React.FC<{
    data: StudyExplanationContent;
    onFollowUp: (type: 'review' | 'quiz', topic: string) => void;
    onPreviewCode: (code: string, language: string) => void;
}> = ({ data, onFollowUp, onPreviewCode }) => {
    const { t } = useLanguage();
    return (
        <div className="study-session-view">
            <h2 className="study-topic-title"><i className="fas fa-graduation-cap mr-3"></i> {t('study_session_topic', data.topic)}</h2>
            <div className="study-section">
                <h3 className="study-section-title">{t('explanation')}</h3>
                <div className="explanation-block">
                    <RichMarkdownRenderer markdown={data.explanation} onPreviewCode={onPreviewCode} />
                </div>
            </div>
            <div className="mt-6 p-4 bg-purple-900/50 rounded-lg flex flex-col md:flex-row items-center justify-center gap-4">
                <p className="font-bold">{t('ready_for_next_step')}</p>
                <div className="flex gap-4">
                    <button onClick={() => onFollowUp('review', data.topic)} className="btn-secondary">{t('create_review')}</button>
                    <button onClick={() => onFollowUp('quiz', data.topic)} className="btn-primary">{t('create_quiz')}</button>
                </div>
            </div>
        </div>
    );
};

const StudyReviewView: React.FC<{ data: StudyReviewContent }> = ({ data }) => {
    const { t } = useLanguage();
    return (
        <div className="study-session-view mt-4">
             <div className="study-section">
                <h3 className="study-section-title">{t('review')}</h3>
                <div className="review-block">
                    <h4>{data.review.title}</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        {data.review.points.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const StudyQuizView: React.FC<{ data: StudyQuizContent }> = ({ data }) => {
    const { quiz } = data;
    const { t } = useLanguage();
    const [userAnswers, setUserAnswers] = useState<Record<number, string | number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswerChange = (quizIndex: number, answer: string | number) => {
        setUserAnswers(prev => ({ ...prev, [quizIndex]: answer }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        quiz.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            if (q.type === 'multiple_choice') {
                const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.options?.findIndex(opt => opt === q.correctAnswer);
                if (userAnswer !== undefined && parseInt(userAnswer as string) === correctIndex) {
                    correctCount++;
                }
            } else { // short_answer
                if (userAnswer && (userAnswer as string).trim().toLowerCase() === (q.correctAnswer as string).toLowerCase()) {
                    correctCount++;
                }
            }
        });
        setScore(correctCount);
        setSubmitted(true);
    };

    const getAnswerClasses = (q: any, optionIndex: number, quizIndex: number) => {
        const isSelectedByUser = userAnswers[quizIndex] !== undefined && parseInt(userAnswers[quizIndex] as string) === optionIndex;

        if (submitted) {
            const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.options?.findIndex(opt => opt === q.correctAnswer);
            const isCorrectOption = optionIndex === correctIndex;

            if (isCorrectOption) return 'bg-green-500/70 text-white';
            if (isSelectedByUser && !isCorrectOption) return 'bg-red-500/70 text-white';
            return 'bg-gray-800/80';
        }
        return isSelectedByUser ? 'bg-purple-600 text-white' : 'hover:bg-purple-700/50 bg-gray-800/80';
    };

    return (
        <div className="study-session-view mt-4">
             <div className="study-section">
                <h3 className="study-section-title">{t('quiz_topic', data.topic)}</h3>
                <div className="quiz-block">
                    {quiz.map((q, i) => (
                        <div key={i} className="quiz-question">
                            <p className="font-bold">{i + 1}. {q.question}</p>
                            {q.type === 'multiple_choice' && q.options && (
                                <div className="space-y-2 mt-2">
                                    {q.options.map((option, j) => (
                                        <label key={j} className={`block p-3 rounded-lg cursor-pointer transition-colors ${getAnswerClasses(q, j, i)}`}>
                                            <input type="radio" name={`quiz-${i}`} value={j} onChange={() => handleAnswerChange(i, j)} className="hidden" disabled={submitted} />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {q.type === 'short_answer' && (
                                <div className="mt-2">
                                     <input type="text" onChange={(e) => handleAnswerChange(i, e.target.value)} className={`w-full p-2 rounded bg-gray-900/80 border border-purple-500/30 focus:ring-purple-500 focus:border-purple-500 ${ submitted ? ((userAnswers[i] as string || '').trim().toLowerCase() === (q.correctAnswer as string).toLowerCase() ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500') : '' }`} disabled={submitted} />
                                    {submitted && ((userAnswers[i] as string || '').trim().toLowerCase() !== (q.correctAnswer as string).toLowerCase()) && <p className="text-xs text-green-400 mt-1">{t('correct_answer')}: {q.correctAnswer}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                    {!submitted ? (
                        <button onClick={handleSubmit} className="btn-primary mt-6 w-full">{t('show_result')}</button>
                    ) : (
                        <div className="mt-6 p-4 bg-purple-900/50 rounded-lg text-center">
                            <h4 className="text-xl font-bold">{t('your_result')}</h4>
                            <p className="text-3xl font-bold my-2">{score} / {quiz.length}</p>
                            <button onClick={() => { setSubmitted(false); setUserAnswers({})}} className="btn-secondary !text-sm mt-2">{t('retake_quiz')}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- UI & VIEW COMPONENTS ---

const CodeBlock: React.FC<{ code: string; language: string; onPreview: (code: string, language: string) => void; }> = ({ code, language, onPreview }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();

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
                        {copied ? <><i className="fas fa-check"></i> {t('copied')}</> : <><i className="fas fa-copy"></i> Copy</>}
                    </button>
                </div>
            </div>
            <pre className="p-4 text-sm text-white rounded-b-lg whitespace-pre-wrap break-all overflow-x-auto">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const MessageBubble: React.FC<{ 
    message: Message, 
    onSaveMemory: (message: Message) => void, 
    onPreviewCode: (code: string, language: string) => void, 
    onUpdateMessageContent: (messageId: string, newContent: RichContent) => void,
    onStudyFollowUp: (type: 'review' | 'quiz', topic: string) => void 
}> = ({ message, onSaveMemory, onPreviewCode, onUpdateMessageContent, onStudyFollowUp }) => {
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'self-end' : 'self-start';
    const bgClass = isUser
        ? 'bg-gradient-to-r from-[#8a2be2] to-[#00bfff] text-white rounded-br-lg'
        : 'bg-[rgba(30,30,60,0.8)] border border-[rgba(138,43,226,0.3)] rounded-bl-lg';
    const { t } = useLanguage();

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
                case 'resume': return <ResumeView resume={richContent} />;
                case 'code_project': return <CodeProjectView project={richContent} onPreviewCode={onPreviewCode} />;
                case 'study_explanation': return <StudyExplanationView data={richContent} onFollowUp={onStudyFollowUp} onPreviewCode={onPreviewCode} />;
                case 'study_review': return <StudyReviewView data={richContent} />;
                case 'study_quiz': return <StudyQuizView data={richContent} />;
                default: return <p>{t('unsupported_content')}</p>;
            }
        }
        
        return null; // Fallback
    };
    
    const handleDownload = (url: string, index: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `nova-ai-${message.id}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`group relative max-w-[95%] p-4 rounded-2xl leading-relaxed animate-fade-in ${alignClass} ${bgClass}`}>
             {message.role === 'model' && (
                <button onClick={() => onSaveMemory(message)} title={t('save_to_memory')} className="absolute -top-2 -right-2 bg-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10">
                    <BookmarkIcon />
                </button>
            )}
            {message.filePreview && (
                <div className="mb-2 p-2 bg-black/20 rounded-lg text-sm flex items-center gap-2">
                    {message.filePreview.type.includes('pdf') ? <FilePdfIcon /> : message.filePreview.type.includes('sheet') ? <FileExcelIcon /> : <FileTextIcon />}
                    <span>{t('attached_file_for_analysis', message.filePreview.name)}</span>
                </div>
            )}
            {isUser && message.images && message.images.map((img, index) => (
                <img key={`user-img-${index}`} src={img} alt="Uploaded content" className="mb-2 rounded-lg max-w-sm h-auto"/>
            ))}
            
            {renderContent()}

            {message.role === 'model' && message.images && (
                 <div className={`mt-4 grid grid-cols-1 ${message.images.length > 1 ? 'sm:grid-cols-2' : ''} gap-2`}>
                    {message.images.map((img, index) => (
                        <div key={`model-img-${index}`} className="relative group/img">
                            <img src={img} alt="Generated image" className="rounded-lg w-full h-auto"/>
                            <button 
                                onClick={() => handleDownload(img, index)}
                                className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                                title={t('download_image')}
                            >
                                <DownloadIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                    <h4 className="text-sm font-bold mb-2">{t('sources')}:</h4>
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
    currentView: View;
    onSetView: (view: View) => void;
    onLogout: () => void;
    isDrawerOpen: boolean;
    onCloseDrawer: () => void;
}> = ({ sessions, tools, activeId, onSelectSession, onNewChat, onNewTempChat, onDeleteSession, isCollapsed, currentView, onSetView, onLogout, isDrawerOpen, onCloseDrawer }) => {
    const { t } = useLanguage();
    const sortedSessions = Object.values(sessions).sort((a, b) => {
        const timeA = a.messages[a.messages.length - 1]?.id || '0';
        const timeB = b.messages[b.messages.length - 1]?.id || '0';
        return timeB.localeCompare(timeA);
    });

    const mainNavItems = [
        { id: View.IMAGE_STUDIO, icon: <ImageIcon />, label: t('image_studio') },
        { id: View.CREATE_TOOL, icon: <ToolIcon />, label: t('manage_tools') },
        { id: View.PROFILE, icon: <ProfileIcon />, label: t('profile') },
        { id: View.SETTINGS, icon: <SettingsIcon />, label: t('settings') },
    ];
    
    const handleAction = (action: () => void) => {
        action();
        onCloseDrawer();
    };

    const handleNewChatClick = () => handleAction(() => {
        onSetView(View.CHAT);
        onNewChat();
    });
    
    const handleNewTempChatClick = () => handleAction(() => {
        onSetView(View.CHAT);
        onNewTempChat();
    });
    
    const handleToolClick = (tool: CustomTool) => handleAction(() => {
        onSetView(View.CHAT);
        onNewChat(tool);
    });
    
    const handleSessionClick = (id: string) => handleAction(() => {
        onSetView(View.CHAT);
        onSelectSession(id);
    });
    
    const handleViewClick = (view: View) => handleAction(() => onSetView(view));
    const handleLogoutClick = () => handleAction(onLogout);

    const sidebarContent = (isMobile: boolean) => (
         <>
            {isMobile && (
                 <button onClick={onCloseDrawer} className="absolute top-4 left-4 text-gray-400 hover:text-white">
                    <CloseIcon />
                 </button>
            )}

            <div className={`flex items-center gap-2 mb-4 p-2 ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2">
                    <LogoIcon className="w-8 h-8" />
                    {(!isCollapsed || isMobile) && <span className="text-xl font-bold">Nova AI</span>}
                </div>
                {(!isCollapsed || isMobile) && (
                    <div className="flex items-center">
                         <button onClick={handleNewTempChatClick} className="p-2 rounded-md hover:bg-purple-500/20" title={t('temp_chat')}><GhostIcon/></button>
                         <button onClick={handleNewChatClick} className="p-2 rounded-md hover:bg-purple-500/20" title={t('new_chat')}><EditIcon/></button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                 <div>
                    <h3 className={`text-xs font-bold text-gray-400 uppercase pb-1 transition-all ${isCollapsed && !isMobile ? 'text-center' : 'px-3'}`}>{t('tools')}</h3>
                    <ul className="space-y-1">
                        {tools.map(tool => (
                             <li key={tool.id} title={tool.name}>
                                <a href="#" onClick={e => {e.preventDefault(); handleToolClick(tool)}} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-purple-500/10 ${isCollapsed && !isMobile ? 'justify-start' : 'justify-center'}`}>
                                    <span className="text-xl">{tool.icon}</span>
                                    {(!isCollapsed || isMobile) && <span className="font-semibold text-sm truncate">{tool.name}</span>}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className={`text-xs font-bold text-gray-400 uppercase pb-1 transition-all ${isCollapsed && !isMobile ? 'text-center' : 'px-3 pt-2'}`}>{t('recent')}</h3>
                    <ul className="space-y-1">
                        {sortedSessions.map(session => (
                            <li key={session.id} className="group" title={session.title}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSessionClick(session.id); }}
                                    className={`flex justify-between items-center p-2 rounded-lg text-sm truncate w-full ${activeId === session.id && currentView === View.CHAT ? 'bg-purple-500/30' : 'hover:bg-purple-500/10'} ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                                >
                                    {(!isCollapsed || isMobile) ? <span className="truncate">{session.title}</span> : <span className="w-2 h-2 bg-gray-400 rounded-full"></span>}
                                    {(!isCollapsed || isMobile) && <button onClick={(e) => {e.stopPropagation(); onDeleteSession(session.id);}} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"><TrashIcon /></button>}
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
                        onClick={() => handleViewClick(item.id)}
                        className={`flex items-center gap-4 w-full p-3 rounded-lg text-sm transition-colors ${currentView === item.id ? 'bg-purple-500/30 text-white' : 'text-gray-400 hover:bg-purple-500/10 hover:text-white'} ${isCollapsed && !isMobile ? 'justify-start' : 'justify-center'}`}
                        title={item.label}
                    >
                        <span className="w-6 text-center text-lg">{item.icon}</span>
                        {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                    </button>
                 ))}
                <button onClick={handleLogoutClick} className={`flex items-center gap-4 w-full p-3 rounded-lg text-sm transition-colors text-gray-400 hover:bg-red-500/10 hover:text-white ${isCollapsed && !isMobile ? 'justify-start' : 'justify-center'}`} title={t('logout')}>
                    <span className="w-6 text-center text-lg"><i className="fas fa-sign-out-alt"></i></span>
                    {(!isCollapsed || isMobile) && <span>{t('logout')}</span>}
                </button>
            </div>
         </>
    );

    return (
        <>
            {/* Mobile Drawer */}
            <aside className={`lg:hidden fixed top-0 bottom-0 right-0 h-full z-50 bg-[rgba(10,10,26,0.95)] backdrop-blur-md flex flex-col p-3 border-l border-purple-500/20 transition-transform duration-300 w-72 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
               {sidebarContent(true)}
            </aside>
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex bg-[rgba(10,10,26,0.8)] backdrop-blur-md flex-col p-3 border-l border-purple-500/20 transition-all duration-300 relative shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
                {sidebarContent(false)}
            </aside>
        </>
    );
};

const ImageHistoryCard: React.FC<{
    item: ImageHistoryItem;
    onDownload: (url: string, filename: string) => void;
    onCopy: (text: string) => void;
}> = ({ item, onDownload, onCopy }) => {
    const { t } = useLanguage();
    return (
        <div className="aspect-square bg-[#0a0a1a] p-1.5 rounded-lg border border-purple-500/20 group relative overflow-hidden animate-fade-in">
            <img src={item.urls[0]} alt={item.prompt} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                <p className="text-xs font-mono line-clamp-4">{item.enhancedPrompt}</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => onDownload(item.urls[0], `nova-ai-${item.id}.png`)} className="bg-purple-600/80 hover:bg-purple-500 text-white p-2 rounded-full text-xs flex-shrink-0" title={t('download')}>
                        <DownloadIcon />
                    </button>
                    <button onClick={() => onCopy(item.enhancedPrompt)} className="bg-purple-600/80 hover:bg-purple-500 text-white p-2 rounded-full text-xs flex-shrink-0" title={t('copy_prompt')}>
                        <i className="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};


const ImageStudioView: React.FC<{
    imageHistory: ImageHistoryItem[],
    onImagesGenerated: (items: ImageHistoryItem) => void
}> = ({ imageHistory, onImagesGenerated }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<'gemini' | 'pollinations'>('gemini');
    const [style, setStyle] = useState('photorealistic');
    const [numImages, setNumImages] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentImages, setCurrentImages] = useState<string[]>([]);
    const [error, setError] = useState('');
    
    const sortedHistory = [...imageHistory].sort((a,b) => b.timestamp - a.timestamp);

    const imageStyles = [
        { value: 'photorealistic', label: t('style_photorealistic') },
        { value: 'cinematic', label: t('style_cinematic') },
        { value: 'fantasy', label: t('style_fantasy') },
        { value: 'anime', label: t('style_anime') },
        { value: 'digital_art', label: t('style_digital_art') },
        { value: '3d_model', label: t('style_3d_model') },
    ];

    const handleGenerate = async () => {
        if (!prompt) {
            setError(t('error_prompt_required'));
            return;
        }
        setIsLoading(true);
        setError('');
        setCurrentImages([]);
        setLoadingMessage(t('loading_enhancing_prompt'));

        let finalPrompt = '';
        try {
            finalPrompt = await enhancePromptForImage(prompt, style);
            setLoadingMessage(t('loading_generating_images'));
        } catch (e) {
            console.error("Prompt enhancement failed:", e);
            setError(t('error_prompt_enhancement_failed'));
            finalPrompt = prompt; // Fallback to original prompt
        }
        
        let generatedUrls: string[] = [];

        try {
            if (model === 'gemini') {
                generatedUrls = await generateImageService(finalPrompt, aspectRatio, numImages);
            } else { // Pollinations model
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`;
                // We need to fetch and convert to base64 to store it like Gemini images for consistency
                 const response = await fetch(imageUrl);
                 if (!response.ok) throw new Error("Network response was not ok from Pollinations.");
                 const blob = await response.blob();
                 generatedUrls = [await new Promise((resolve, reject) => {
                     const reader = new FileReader();
                     reader.onloadend = () => resolve(reader.result as string);
                     reader.onerror = reject;
                     reader.readAsDataURL(blob);
                 })];
            }
            
            setCurrentImages(generatedUrls);
            const newHistoryItem: ImageHistoryItem = {
                id: Date.now().toString(),
                urls: generatedUrls,
                prompt: prompt,
                enhancedPrompt: finalPrompt,
                model: model,
                style: style,
                aspectRatio: aspectRatio,
                timestamp: Date.now(),
            };
            onImagesGenerated(newHistoryItem);

        } catch (e) {
            console.error(e);
            const modelName = model === 'gemini' ? 'Gemini' : 'Nova gen 1';
            setError(t('error_image_generation_failed', modelName));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
            {/* Controls Panel */}
            <div className="w-full md:w-96 p-4 md:p-6 bg-[rgba(10,10,26,0.8)] border-l border-purple-500/20 shrink-0 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-6">{t('image_studio')}</h1>
                 <div className="bg-[#0a0a1a] p-4 rounded-xl border border-purple-500/20 space-y-4">
                     <div className="flex justify-center gap-2 p-1 bg-[rgba(30,30,60,0.8)] rounded-full">
                        <button onClick={() => setModel('gemini')} className={`w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors ${model === 'gemini' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-800/50'}`}>Gemini (Imagen 3)</button>
                        <button onClick={() => setModel('pollinations')} className={`w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors ${model === 'pollinations' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-800/50'}`}>Nova gen 1</button>
                    </div>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('image_prompt_placeholder')} className="w-full p-3 h-24 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]" disabled={isLoading}/>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-400">{t('style')}</label>
                            <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-3 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]" disabled={isLoading}>
                                {imageStyles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-400">{t('aspect_ratio')}</label>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className={`w-full p-3 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2] ${model !== 'gemini' ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoading || model !== 'gemini'}>
                                    <option value="1:1">1:1</option>
                                    <option value="16:9">16:9</option>
                                    <option value="9:16">9:16</option>
                                    <option value="4:3">4:3</option>
                                    <option value="3:4">3:4</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-400">{t('number_of_images')}</label>
                                <input type="number" value={numImages} onChange={e => setNumImages(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} min="1" max="4" className={`w-full p-3 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2] ${model !== 'gemini' ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoading || model !== 'gemini'} />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="btn-primary w-full flex items-center justify-center gap-2 !py-3 !text-base" disabled={isLoading}>
                        {isLoading ? loadingMessage : <> <ImageIcon /> {t('generate_images')}</>}
                    </button>
                    {model === 'pollinations' && <p className="text-xs text-center text-gray-400">{t('pollinations_disclaimer')}</p>}
                </div>
                 {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </div>

            {/* Gallery */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t('current_results')}</h2>
                 {isLoading && !currentImages.length && (
                    <div className="flex items-center justify-center h-48"><div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>
                 )}
                 {currentImages.length > 0 && (
                     <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8`}>
                        {currentImages.map((img, index) => (
                            <div key={`current-${index}`} className="relative group/img bg-[#0a0a1a] p-1.5 rounded-lg border border-purple-500/20">
                                <img src={img} alt={`${t('generated_image')} ${index + 1}`} className="rounded-md w-full h-auto" />
                                 <button onClick={() => handleDownload(img, `nova-ai-${Date.now()}-${index}.png`)} className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center" title={t('download_image')}>
                                    <DownloadIcon />
                                 </button>
                            </div>
                        ))}
                    </div>
                 )}
                
                <h2 className="text-xl font-bold mb-4 border-t border-purple-500/20 pt-6">{t('history')}</h2>
                {sortedHistory.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">{t('no_images_generated')}</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sortedHistory.flatMap(item =>
                             item.urls.map((url, index) => (
                                 <ImageHistoryCard
                                     key={`${item.id}-${index}`}
                                     item={{...item, urls: [url]}} // Pass single url to card
                                     onDownload={handleDownload}
                                     onCopy={handleCopy}
                                 />
                             ))
                        )}
                    </div>
                )}
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
    const { t, language, setLanguage } = useLanguage();
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
                <h2 className="setting-title">{t('language')}</h2>
                <div className="flex gap-2">
                    <button className={`setting-btn ${language === 'ar' && 'active'}`} onClick={() => setLanguage('ar')}>العربية</button>
                    <button className={`setting-btn ${language === 'en' && 'active'}`} onClick={() => setLanguage('en')}>English</button>
                </div>
            </div>
            <div className="setting-card">
                <h2 className="setting-title">{t('ai_tone')}</h2>
                <div className="flex gap-2">
                    <button className={`setting-btn ${settings.aiTone === 'friendly' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'friendly' })}>{t('tone_friendly')}</button>
                    <button className={`setting-btn ${settings.aiTone === 'formal' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'formal' })}>{t('tone_formal')}</button>
                    <button className={`setting-btn ${settings.aiTone === 'creative' && 'active'}`} onClick={() => onUpdate({ ...settings, aiTone: 'creative' })}>{t('tone_creative')}</button>
                </div>
            </div>
            <div className="setting-card">
                <h2 className="setting-title">{t('default_features_new_chats')}</h2>
                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>{t('enable_internet_search')}</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultInternetSearch} onChange={e => onUpdate({ ...settings, defaultInternetSearch: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>{t('enable_deep_thinking')}</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultDeepThinking} onChange={e => onUpdate({ ...settings, defaultDeepThinking: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span>{t('enable_scientific_mode')}</span>
                        <input type="checkbox" className="toggle-switch" checked={settings.defaultScientificMode} onChange={e => onUpdate({ ...settings, defaultScientificMode: e.target.checked })} />
                    </label>
                </div>
            </div>
            <div className="setting-card">
                <h2 className="setting-title">{t('general_memories')}</h2>
                <p className="text-sm text-gray-400 mb-4">{t('general_memories_desc')}</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMemory} 
                        onChange={e => setNewMemory(e.target.value)} 
                        placeholder={t('general_memories_placeholder')}
                        className="modal-input"
                    />
                    <button onClick={handleAddMemory} className="btn-primary !px-6 !rounded-lg">{t('save')}</button>
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
    const { t } = useLanguage();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="setting-card space-y-4">
                    <h2 className="setting-title">{editingTool ? t('edit_tool') : t('create_new_tool')}</h2>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('tool_name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('tool_name_placeholder')} className="modal-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('tool_icon')}</label>
                        <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🤖" className="modal-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('tool_prompt')}</label>
                        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder={t('tool_prompt_placeholder')} className="w-full p-3 h-32 rounded-lg border-none bg-[rgba(30,30,60,0.8)] text-white outline-none focus:ring-2 focus:ring-[#8a2be2]"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('tool_knowledge_base')}</label>
                        <input type="file" accept=".txt,.md,.json,.csv" onChange={handleKnowledgeFileChange} ref={knowledgeFileInputRef} className="hidden"/>
                        <button onClick={() => knowledgeFileInputRef.current?.click()} className="btn-secondary !text-sm w-full">{t('add_knowledge_file')}</button>
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
                        <button onClick={handleSaveTool} className="btn-primary w-full">{editingTool ? t('save_changes') : t('save_tool')}</button>
                        {editingTool && <button onClick={() => setEditingTool(null)} className="btn-secondary w-full">{t('cancel')}</button>}
                    </div>
                </div>
                <div className="setting-card">
                    <h2 className="setting-title">{t('saved_tools')}</h2>
                    <ul className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
                        {tools.length === 0 && <p className="text-gray-400">{t('no_tools_created')}</p>}
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
    const { t } = useLanguage();
    return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="setting-card">
                <h2 className="setting-title">{t('acquired_knowledge')}</h2>
                <p className="text-sm text-gray-400 mb-4">{t('acquired_knowledge_desc')}</p>
                 {Object.keys(userProfile).length === 0 ? (
                    <p className="text-gray-500">{t('no_acquired_knowledge')}</p>
                 ) : (
                    <ul className="space-y-2">
                        {Object.entries(userProfile).map(([key, value]) => (
                            <li key={key} className="text-sm">
                                <strong className="capitalize text-purple-300">{t(`user_profile_${key}` as TranslationKey, key.replace(/_/g, ' '))}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                            </li>
                        ))}
                    </ul>
                 )}
            </div>
            <div className="setting-card">
                <h2 className="setting-title">{t('saved_memories')}</h2>
                 <p className="text-sm text-gray-400 mb-4">{t('saved_memories_desc')}</p>
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                     {savedMemories.length === 0 ? (
                        <p className="text-gray-500">{t('no_saved_memories')}</p>
                     ) : (
                        savedMemories.map(mem => (
                            <div key={mem.id} className="relative group/memory">
                                <MessageBubble message={mem} onSaveMemory={() => {}} onPreviewCode={() => {}} onUpdateMessageContent={()=>{}} onStudyFollowUp={() => {}}/>
                                <button onClick={() => onDeleteMemory(mem.id)} title={t('delete_memory')} className="absolute top-0 left-0 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 opacity-0 group-hover/memory:opacity-100 transition-opacity">
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
    const { t } = useLanguage();
    return (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e3e] border border-purple-500/50 rounded-lg shadow-lg p-4 z-20">
            <div className="space-y-4">
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">{t('internet_search')}</span>
                    <input type="checkbox" className="toggle-switch" checked={settings.useInternetSearch} onChange={e => onChange({...settings, useInternetSearch: e.target.checked})}/>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">{t('deep_thinking')}</span>
                     <input type="checkbox" className="toggle-switch" checked={settings.useDeepThinking} onChange={e => onChange({...settings, useDeepThinking: e.target.checked})}/>
                </label>
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold">{t('scientific_mode')}</span>
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
    const { t } = useLanguage();
    if (!preview.isOpen || preview.isCollapsed) return null;

    const renderContent = () => {
        if (preview.type === 'loading') {
            return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (preview.type === 'unsupported') {
            return <p className="text-red-400 p-4">{t('unsupported_file_type')}</p>
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
    const { t } = useLanguage();
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
        <>
            {/* Desktop Resizable Panel */}
            <aside ref={panelRef} style={{ width: `${width}px` }} className="bg-[#0a0a1a] flex-col border-l border-purple-500/20 shrink-0 relative animate-fade-in-right hidden md:flex">
                <div 
                    onMouseDown={handleMouseDown}
                    className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-30 group" 
                >
                    <div className="w-full h-full bg-purple-500/0 group-hover:bg-purple-500/50 transition-colors duration-300"></div>
                </div>

                <div className="p-3 flex justify-between items-center bg-[#1e1e3e] border-b border-purple-500/30 shrink-0">
                    <h3 className="font-bold">{t('code_preview')}</h3>
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
            
            {/* Mobile Modal View */}
            <div className="md:hidden">
                <Modal title={t('code_preview')} onClose={onClose} size="3xl">
                     <div className="w-full h-[75vh] bg-white rounded-lg overflow-hidden">
                        <iframe 
                            srcDoc={code} 
                            title="Mobile Code Preview" 
                            className="w-full h-full border-0"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                </Modal>
            </div>
        </>
    );
};

const WelcomeScreen: React.FC<{ onPromptSelect: (prompt: string) => void }> = ({ onPromptSelect }) => {
    const { t } = useLanguage();
    const suggestions = [
        { title: t('welcome_suggestion1_title'), prompt: t('welcome_suggestion1_prompt')},
        { title: t('welcome_suggestion2_title'), prompt: t('welcome_suggestion2_prompt')},
        { title: t('welcome_suggestion3_title'), prompt: t('welcome_suggestion3_prompt')},
        { title: t('welcome_suggestion4_title'), prompt: t('welcome_suggestion4_prompt')},
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center">
             <LogoIcon className="w-16 h-16 md:w-20 md:h-20 mb-4"/>
            <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-10 bg-gradient-to-l from-[#8a2be2] to-[#00bfff] text-transparent bg-clip-text">{t('welcome_to_nova')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => onPromptSelect(s.prompt)} className="suggestion-card">
                        <h3 className="font-bold text-md md:text-lg">{s.title}</h3>
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
    onToggleDrawer: () => void;
    onStudyFollowUp: (type: 'review' | 'quiz', topic: string) => void;
}> = ({ session, isLoading, onSettingsChange, onSaveMemory, onPreviewCode, onAddKnowledgeFile, onDeleteKnowledgeFile, onUpdateMessageContent, onToggleDrawer, onStudyFollowUp }) => {
    const { t } = useLanguage();
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
                 <div className="flex items-center gap-2">
                    <button onClick={onToggleDrawer} className="p-2 rounded-full hover:bg-purple-500/20 lg:hidden">
                        <i className="fas fa-bars"></i>
                    </button>
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
                </div>
                <div className="relative flex items-center gap-2" ref={settingsRef}>
                    <input type="file" ref={knowledgeFileInputRef} onChange={handleKnowledgeFileChange} className="hidden" accept=".pdf,.txt,.md,.csv,.xlsx,.xls" />
                    <button onClick={() => knowledgeFileInputRef.current?.click()} className="p-2 rounded-full hover:bg-purple-500/20 bg-black/20" title={t('add_knowledge_file_chat')}><BookOpenIcon /></button>
                    <button onClick={() => setShowSettings(s => !s)} className="p-2 rounded-full hover:bg-purple-500/20 bg-black/20" title={t('current_chat_settings')}><SettingsIcon /></button>
                    {showSettings && <SettingsPopover settings={session.settings} onChange={onSettingsChange} />}
                </div>
            </header>
            <div className="flex-1 h-[1px] p-2 md:p-6 overflow-y-auto flex flex-col gap-6">
                {session.messages.map(msg => <MessageBubble key={msg.id} message={msg} onSaveMemory={onSaveMemory} onPreviewCode={onPreviewCode} onUpdateMessageContent={onUpdateMessageContent} onStudyFollowUp={onStudyFollowUp} />)}
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
    const { t } = useLanguage();

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
                    placeholder={t('chat_placeholder')}
                    className="flex-1 p-2 px-4 bg-transparent text-white text-base outline-none disabled:opacity-50"
                    disabled={isLoading}
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.mp4,.mp3,.wav"/>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 w-10 h-10 rounded-full transition-colors duration-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50"
                    disabled={isLoading}
                    title={t('upload_file')}
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
    onImagesGenerated: (item: ImageHistoryItem) => void;
    sessions: Record<string, ChatSession>;
    setSessions: React.Dispatch<React.SetStateAction<Record<string, ChatSession>>>;
    activeId: string | null;
    setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
    createNewSession: (tool?: CustomTool) => string;
    createTempSession: () => void;
    temporarySession: ChatSession | null;
    setTemporarySession: React.Dispatch<React.SetStateAction<ChatSession | null>>;
    onToggleDrawer: () => void;
}> = ({ 
    globalSettings, userProfile, generalMemories, savedMemories, customTools, onUpdateUserProfile, onSaveMemory, onImagesGenerated,
    sessions, setSessions, activeId, setActiveId, createNewSession, createTempSession,
    temporarySession, setTemporarySession, onToggleDrawer
}) => {
    const { language, t } = useLanguage();
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
            setFilePreview(fp => ({ ...fp, type: 'unsupported', content: t('error_file_parse_failed') }));
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
        if (!sessionId) return;
        if (isLoading) return;

        let activeSession = isTempChat ? temporarySession : sessions[sessionId];
        if (!activeSession) return;
        
        // --- Image Generation Command ---
        if (prompt.trim().toLowerCase().startsWith('/image ')) {
            const imagePrompt = prompt.replace(/\/image\s+/i, '').trim();
            if (!imagePrompt) return;

            const userMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt };
            const updatedMessages = [...activeSession.messages, userMessage];
            const updatedSession = { ...activeSession, messages: updatedMessages };

            if (isTempChat) setTemporarySession(updatedSession);
            else setSessions(s => ({ ...s, [sessionId]: updatedSession }));

            setIsLoading(true);
            const aiResponseId = (Date.now() + 1).toString();
            const aiPlaceholder: Message = { id: aiResponseId, role: 'model', content: t('generating_image_for', imagePrompt) };
            
            if (isTempChat) setTemporarySession(s => s ? { ...s, messages: [...s.messages, aiPlaceholder] } : null);
            else setSessions(s => ({ ...s, [sessionId]: { ...s[sessionId], messages: [...s[sessionId].messages, aiPlaceholder] } }));

            try {
                const enhancedPrompt = await enhancePromptForImage(imagePrompt, 'cinematic');
                const generatedUrls = await generateImageService(enhancedPrompt, '1:1', 1);

                const newHistoryItem: ImageHistoryItem = {
                    id: Date.now().toString(),
                    urls: generatedUrls,
                    prompt: imagePrompt,
                    enhancedPrompt: enhancedPrompt,
                    model: 'gemini',
                    style: 'cinematic',
                    aspectRatio: '1:1',
                    timestamp: Date.now()
                };
                onImagesGenerated(newHistoryItem);

                const aiFinalMessage: Message = { id: aiResponseId, role: 'model', content: t('image_generated_for', imagePrompt), images: generatedUrls };
                
                const updater = (s: ChatSession | null) => s ? { ...s, messages: s.messages.map(m => m.id === aiResponseId ? aiFinalMessage : m) } : null;

                if (isTempChat) setTemporarySession(updater);
                else setSessions(s => ({ ...s, [sessionId]: updater(s[sessionId])! }));

            } catch (error) {
                 const aiErrorMessage: Message = { id: aiResponseId, role: 'model', content: t('error_image_generation_failed_short') };
                 const updater = (s: ChatSession | null) => s ? { ...s, messages: s.messages.map(m => m.id === aiResponseId ? aiErrorMessage : m) } : null;
                 if (isTempChat) setTemporarySession(updater);
                 else setSessions(s => ({ ...s, [sessionId]: updater(s[sessionId])! }));
            } finally {
                setIsLoading(false);
            }
            return;
        }


        // --- Regular Chat Message ---
        const userMessageParts: Part[] = [];
        let userMessageUI: Partial<Message> = { content: prompt };

        let fullPrompt = prompt;
        if (filePreview.isOpen && (filePreview.type === 'text' || filePreview.type === 'table')) {
            let fileContext = filePreview.type === 'text' 
                ? (filePreview.content as string)
                : (filePreview.content as string[][]).map(row => row.join(',')).join('\n');
            fullPrompt = t('prompt_with_file_context', fileContext, prompt);
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
                activeSession.knowledgeFiles || [],
                language
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
                if (parsed.type && ['table', 'chart', 'report', 'news_report', 'resume', 'code_project', 'study_explanation', 'study_review', 'study_quiz'].includes(parsed.type)) {
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
            const errorMessage: Message = { id: aiResponseId, role: 'model', content: t('error_general_response') };
            
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
    
    const handleStudyFollowUp = (type: 'review' | 'quiz', topic: string) => {
        const prompt = type === 'review' 
            ? t('prompt_create_review', topic)
            : t('prompt_create_quiz', topic);
        handleSendMessage(prompt);
    };

    const activeSession = isTempChat ? temporarySession : (activeId ? sessions[activeId] : null);

    return (
        <div className="flex flex-1 h-full overflow-hidden">
             <CodePreviewPanel isOpen={codePreview.isOpen} code={codePreview.code} onClose={handleCloseCodePreview} />
             <FilePreviewPanel preview={filePreview} onClose={closeFilePreview} />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-transparent animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,43,226,0.04)_0%,transparent_60%)]"></div>
                
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
                        onToggleDrawer={onToggleDrawer}
                        onStudyFollowUp={handleStudyFollowUp}
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
        md: 'md:max-w-md',
        lg: 'md:max-w-lg',
        xl: 'md:max-w-xl',
        '3xl': 'md:max-w-3xl',
        '5xl': 'md:max-w-5xl',
    };
    
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`bg-[#0c0c1f] border-purple-500/30 w-full h-full md:w-full md:h-auto md:border md:rounded-2xl shadow-2xl ${sizeClasses[size]} flex flex-col md:max-h-[90vh]`} onClick={stopPropagation}>
                <div className="flex justify-between items-center p-4 border-b border-purple-500/30 shrink-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ApplicationShell: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { t } = useLanguage();
    const [currentView, setCurrentView] = useState<View>(View.CHAT);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        aiTone: 'friendly', creativityLevel: 'balanced', defaultInternetSearch: true, defaultDeepThinking: false, defaultScientificMode: false, darkMode: true,
    });
    const [customTools, setCustomTools] = useState<CustomTool[]>([]);
    const [userProfile, setUserProfile] = useState<Record<string, any>>({});
    const [savedMemories, setSavedMemories] = useState<Message[]>([]);
    const [generalMemories, setGeneralMemories] = useState<string[]>([]);
    const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
    
    const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [temporarySession, setTemporarySession] = useState<ChatSession | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Load data from local storage on mount
    useEffect(() => {
        const loadData = () => {
            try {
                const savedSettings = localStorage.getItem('nova-global-settings');
                if (savedSettings) setGlobalSettings(JSON.parse(savedSettings));

                const savedTools = localStorage.getItem('nova-custom-tools');
                if (savedTools) {
                    setCustomTools(JSON.parse(savedTools));
                } else {
                    // Create a default tool if none exist
                    const defaultTool: CustomTool = {
                        id: 'default-study-buddy',
                        name: t('study_buddy_tool_name'),
                        icon: '🎓',
                        prompt: t('study_buddy_tool_prompt'),
                    };
                    setCustomTools([defaultTool]);
                    localStorage.setItem('nova-custom-tools', JSON.stringify([defaultTool]));
                }

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
                
                const savedImageHistory = localStorage.getItem('nova-image-history');
                if(savedImageHistory) setImageHistory(JSON.parse(savedImageHistory));

            } catch (e) {
                console.error("Failed to load data from storage", e);
            }
        };
        loadData();
    }, [t]);

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
    
    // Save image history to local storage
    useEffect(() => {
        try {
            localStorage.setItem('nova-image-history', JSON.stringify(imageHistory));
        } catch(e) {
            console.error("Failed to save image history to storage", e);
        }
    }, [imageHistory]);

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
    
    const handleImagesGenerated = (item: ImageHistoryItem) => {
        setImageHistory(prev => [item, ...prev]);
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
            title: tool ? tool.name : t('new_chat_title'),
            messages: tool ? [{
                id: 'init',
                role: 'model',
                content: t('tool_welcome_message', tool.name)
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
    }, [globalSettings, t]);

    const createTempSession = useCallback(() => {
        const newId = 'temp-chat';
        const newSession: ChatSession = {
            id: newId,
            title: t('temp_chat_title'),
            messages: [{
                id: 'init-temp',
                role: 'model',
                content: t('temp_chat_welcome_message')
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
    }, [globalSettings, t]);

    const renderMainView = () => {
        switch(currentView) {
            case View.CHAT:
                 return (
                    <ChatView 
                        globalSettings={globalSettings} 
                        userProfile={userProfile} 
                        generalMemories={generalMemories} 
                        savedMemories={savedMemories}
                        customTools={customTools}
                        onUpdateUserProfile={handleUpdateProfile}
                        onSaveMemory={handleSaveMemory}
                        onImagesGenerated={handleImagesGenerated}
                        sessions={sessions}
                        setSessions={setSessions}
                        activeId={activeId}
                        setActiveId={setActiveId}
                        createNewSession={createNewSession}
                        createTempSession={createTempSession}
                        temporarySession={temporarySession}
                        setTemporarySession={setTemporarySession}
                        onToggleDrawer={() => setIsDrawerOpen(p => !p)}
                    />
                 );
            case View.IMAGE_STUDIO:
                return (
                    <ImageStudioView 
                        imageHistory={imageHistory}
                        onImagesGenerated={handleImagesGenerated}
                    />
                );
            default:
                // Fallback to chat view if current view is a modal type
                return (
                     <ChatView 
                        globalSettings={globalSettings} 
                        userProfile={userProfile} 
                        generalMemories={generalMemories} 
                        savedMemories={savedMemories}
                        customTools={customTools}
                        onUpdateUserProfile={handleUpdateProfile}
                        onSaveMemory={handleSaveMemory}
                        onImagesGenerated={handleImagesGenerated}
                        sessions={sessions}
                        setSessions={setSessions}
                        activeId={activeId}
                        setActiveId={setActiveId}
                        createNewSession={createNewSession}
                        createTempSession={createTempSession}
                        temporarySession={temporarySession}
                        setTemporarySession={setTemporarySession}
                        onToggleDrawer={() => setIsDrawerOpen(p => !p)}
                    />
                );
        }
    };

    const renderActiveModal = () => {
        const handleClose = () => setCurrentView(View.CHAT);

        switch (currentView) {
            case View.SETTINGS:
                return <Modal title={t('settings')} onClose={handleClose} size="3xl">
                    <SettingsView 
                        settings={globalSettings} 
                        onUpdate={handleUpdateSettings} 
                        generalMemories={generalMemories}
                        onUpdateGeneralMemories={handleUpdateGeneralMemories}
                    />
                </Modal>;
            case View.CREATE_TOOL:
                return <Modal title={t('manage_tools')} onClose={handleClose} size="5xl">
                    <CreateToolView tools={customTools} onUpdateTools={handleUpdateTools} />
                </Modal>;
            case View.PROFILE:
                return <Modal title={t('profile_and_memory')} onClose={handleClose} size="5xl">
                    <ProfileView userProfile={userProfile} savedMemories={savedMemories} onDeleteMemory={handleDeleteMemory} />
                </Modal>;
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-row">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <button onClick={() => setIsSidebarCollapsed(p => !p)} className="absolute top-1/2 -translate-y-1/2 left-4 w-7 h-7 bg-[#0c0c1f] border border-purple-500/30 rounded-full hidden lg:flex items-center justify-center text-gray-400 hover:bg-purple-500/20 z-20">
                    {isSidebarCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>
                {renderMainView()}
                {renderActiveModal()}
            </div>
            {isDrawerOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsDrawerOpen(false)} />}
            <MainSidebar
                sessions={sessions}
                tools={customTools}
                activeId={activeId}
                onSelectSession={handleSetActiveSession}
                onNewChat={createNewSession}
                onNewTempChat={createTempSession}
                onDeleteSession={handleDeleteSession}
                isCollapsed={isSidebarCollapsed}
                currentView={currentView}
                onSetView={setCurrentView}
                onLogout={onLogout}
                isDrawerOpen={isDrawerOpen}
                onCloseDrawer={() => setIsDrawerOpen(false)}
            />
        </div>
    );
};

const LandingPageHeader: React.FC<{ onAuthClick: (page: 'login' | 'signup') => void; onNavClick: (id: string) => void }> = ({ onAuthClick, onNavClick }) => {
    const { t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navItems = [
        { id: 'home', label: t('nav_home') },
        { id: 'features', label: t('nav_features') },
        { id: 'about', label: t('nav_about') },
        { id: 'start', label: t('nav_start') },
    ];
    
    const handleLinkClick = (id: string, isAuth: boolean = false) => {
        setIsMenuOpen(false);
        if (isAuth) {
             onAuthClick('signup');
        } else {
            onNavClick(id);
        }
    }
    
    return (
        <header className="bg-[#050510]/80 backdrop-blur-md px-[5%] py-4 fixed w-full top-0 z-50 flex justify-between items-center border-b border-[rgba(138,43,226,0.2)]">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavClick('home')}>
                 <LogoIcon className="w-10 h-10"/>
                 <span className="text-2xl font-bold text-white">Nova AI</span>
             </div>
            <nav className="hidden md:flex list-none gap-8">
                {navItems.map(item => (
                    <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); handleLinkClick(item.id, item.id === 'start'); }} className="nav-link">{item.label}</a>
                ))}
            </nav>
            <div className="hidden md:flex gap-4">
                <button onClick={() => onAuthClick('login')} className="btn-secondary">{t('login')}</button>
                <button onClick={() => onAuthClick('signup')} className="btn-primary">{t('signup_free')}</button>
            </div>
             <div className="md:hidden">
                 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl">
                     <i className="fas fa-bars"></i>
                 </button>
                 {isMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-full bg-[#0c0c1f] border-t border-purple-500/20 p-5 space-y-4">
                         {navItems.map(item => (
                            <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); handleLinkClick(item.id, item.id === 'start'); }} className="block text-center nav-link">{item.label}</a>
                         ))}
                         <div className="flex flex-col gap-4 pt-4 border-t border-purple-500/10">
                             <button onClick={() => { setIsMenuOpen(false); onAuthClick('login'); }} className="btn-secondary w-full">{t('login')}</button>
                             <button onClick={() => { setIsMenuOpen(false); onAuthClick('signup'); }} className="btn-primary w-full">{t('signup_free')}</button>
                         </div>
                     </div>
                 )}
            </div>
        </header>
    );
};


const Hero: React.FC<{ onCTAClick: () => void }> = ({ onCTAClick }) => {
    const { t } = useLanguage();
    return (
        <section className="min-h-screen flex items-center justify-center pt-24 pb-12 px-[5%] relative overflow-hidden" id="home">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(138,43,226,0.15)_0%,transparent_50%)] -z-10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,191,255,0.1)_0%,transparent_50%)] -z-10"></div>
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-l from-[#8a2be2] to-[#00bfff] text-transparent bg-clip-text">
                    {t('hero_title')}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-[#c0c0ff] leading-relaxed">
                    {t('hero_subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={onCTAClick} className="btn-primary">{t('hero_cta_main')}</button>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="btn-secondary">{t('hero_cta_secondary')}</button>
                </div>
            </div>
        </section>
    );
};

const DetailedFeatures: React.FC = () => {
    const { t } = useLanguage();
    const featureGroups = {
        [t('features_group1_title')]: [
            { icon: <i className="fas fa-file-import"></i>, title: t('feature1_title'), description: t('feature1_desc') },
            { icon: <i className="fas fa-id-card"></i>, title: t('feature2_title'), description: t('feature2_desc') },
            { icon: <i className="fas fa-chart-pie"></i>, title: t('feature3_title'), description: t('feature3_desc') },
            { icon: <i className="fas fa-code"></i>, title: t('feature4_title'), description: t('feature4_desc') },
            { icon: <i className="fas fa-graduation-cap"></i>, title: t('feature5_title'), description: t('feature5_desc') },
        ],
        [t('features_group2_title')]: [
            { icon: <i className="fas fa-palette"></i>, title: t('feature6_title'), description: t('feature6_desc') },
            { icon: <i className="fas fa-comments"></i>, title: t('feature7_title'), description: t('feature7_desc') },
            { icon: <i className="fas fa-magic"></i>, title: t('feature8_title'), description: t('feature8_desc') },
            { icon: <i className="fas fa-feather-alt"></i>, title: t('feature9_title'), description: t('feature9_desc') },
        ],
        [t('features_group3_title')]: [
            { icon: <SearchIcon />, title: t('feature10_title'), description: t('feature10_desc') },
            { icon: <BrainIcon />, title: t('feature11_title'), description: t('feature11_desc') },
            { icon: <ToolIcon />, title: t('feature12_title'), description: t('feature12_desc') },
        ],
    };

    return (
        <section className="py-20 px-[5%] bg-[#050510]" id="features">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features_main_title')}</h2>
                <p className="text-lg text-gray-400 mb-12">{t('features_main_subtitle')}</p>
                {Object.entries(featureGroups).map(([groupTitle, features]) => (
                    <div key={groupTitle} className="mb-16">
                        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">{groupTitle}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {features.map((feature, i) => (
                                <div key={i} className="feature-card h-full">
                                    <div className="text-4xl text-purple-400 mb-4">{feature.icon}</div>
                                    <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                                    <p className="text-gray-300 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const AboutSection: React.FC = () => {
    const { t } = useLanguage();
    return (
        <section className="py-20 px-[5%]" id="about">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about_title')}</h2>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                    {t('about_p1')} <strong className="text-white">محمد إبراهيم عبدالله</strong>, {t('about_p2')}
                    <br/><br/>
                    {t('about_p3')}
                </p>
                <div className="flex justify-center items-center gap-6">
                    <a href="https://github.com/Mohammed5778" target="_blank" rel="noopener noreferrer" className="social-link"><i className="fab fa-github"></i></a>
                    <a href="https://www.linkedin.com/in/mohammed-ibrahim-abdullah-a56066269/" target="_blank" rel="noopener noreferrer" className="social-link"><i className="fab fa-linkedin"></i></a>
                    <a href="https://craft-my-flow.vercel.app/" target="_blank" rel="noopener noreferrer" className="social-link"><i className="fas fa-globe"></i></a>
                </div>
            </div>
        </section>
    );
}

const AuthModal: React.FC<{ children: React.ReactNode, title: string, onClose: () => void }> = ({ children, title, onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-[#0c0c1f] border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white"><CloseIcon /></button>
            <h2 className="text-2xl font-bold text-center mb-6">{title}</h2>
            {children}
        </div>
    </div>
);

const LoginPage: React.FC<{ onLogin: () => void; onSwitch: () => void }> = ({ onLogin, onSwitch }) => {
    const { t } = useLanguage();
    return (
        <form onSubmit={e => {e.preventDefault(); onLogin();}} className="space-y-6">
            <div>
                <label className="block text-sm font-bold mb-2">{t('email_label')}</label>
                <input type="email" placeholder="you@example.com" className="modal-input" required />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">{t('password_label')}</label>
                <input type="password" placeholder="********" className="modal-input" required />
            </div>
            <button type="submit" className="btn-primary w-full !py-3">{t('login')}</button>
            <p className="text-center text-sm">
                {t('no_account')} <button type="button" onClick={onSwitch} className="text-purple-400 hover:underline">{t('create_one')}</button>
            </p>
        </form>
    );
};
const SignUpPage: React.FC<{ onSignUp: () => void; onSwitch: () => void }> = ({ onSignUp, onSwitch }) => {
    const { t } = useLanguage();
    return (
        <form onSubmit={e => {e.preventDefault(); onSignUp();}} className="space-y-6">
            <div>
                <label className="block text-sm font-bold mb-2">{t('email_label')}</label>
                <input type="email" placeholder="you@example.com" className="modal-input" required />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">{t('password_label')}</label>
                <input type="password" placeholder="********" className="modal-input" required />
            </div>
            <button type="submit" className="btn-primary w-full !py-3">{t('create_account')}</button>
            <p className="text-center text-sm">
                {t('already_have_account')} <button type="button" onClick={onSwitch} className="text-purple-400 hover:underline">{t('login')}</button>
            </p>
        </form>
    );
};
const Footer: React.FC = () => {
    const { t } = useLanguage();
    return (
        <footer className="bg-[#050510] border-t border-[rgba(138,43,226,0.2)] py-10 px-[5%]">
            <div className="max-w-7xl mx-auto text-center text-gray-400">
                <h3 className="text-lg font-bold text-white mb-4">Mohammed Ibrahim Abdullah</h3>
                <div className="flex justify-center items-center gap-6 mb-6">
                    <a href="https://github.com/Mohammed5778" target="_blank" rel="noopener noreferrer" className="social-link-footer"><i className="fab fa-github"></i></a>
                    <a href="https://www.linkedin.com/in/mohammed-ibrahim-abdullah-a56066269/" target="_blank" rel="noopener noreferrer" className="social-link-footer"><i className="fab fa-linkedin"></i></a>
                    <a href="https://craft-my-flow.vercel.app/" target="_blank" rel="noopener noreferrer" className="social-link-footer"><i className="fas fa-globe"></i></a>
                    <a href="https://wa.me/201099113383" target="_blank" rel="noopener noreferrer" className="social-link-footer"><i className="fab fa-whatsapp"></i></a>
                </div>
                <p>&copy; {new Date().getFullYear()} Nova AI. {t('all_rights_reserved')}</p>
            </div>
        </footer>
    );
};

const LandingPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const { t } = useLanguage();
    
    const handleAuthNav = (page: 'login' | 'signup') => {
        setShowLoginModal(page === 'login');
        setShowSignupModal(page === 'signup');
    };
    
    const handleNavClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-[#050510]">
            <LandingPageHeader onAuthClick={handleAuthNav} onNavClick={handleNavClick} />
            <main>
                <Hero onCTAClick={() => handleAuthNav('signup')} />
                <DetailedFeatures />
                <AboutSection />
            </main>
            <Footer />
            {showLoginModal && <AuthModal title={t('login_modal_title')} onClose={() => setShowLoginModal(false)}>
                <LoginPage onLogin={onLoginSuccess} onSwitch={() => { setShowLoginModal(false); setShowSignupModal(true); }} />
            </AuthModal>}
             {showSignupModal && <AuthModal title={t('signup_modal_title')} onClose={() => setShowSignupModal(false)}>
                <SignUpPage onSignUp={onLoginSuccess} onSwitch={() => { setShowSignupModal(false); setShowLoginModal(true); }} />
            </AuthModal>}
        </div>
    );
};

// Wrapper for the main app logic to use the language context
const AppContent: React.FC = () => {
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
        </>
    );
};


// MAIN APP COMPONENT
const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
            <style>{`
                :root { --custom-scroll-track: #0a0a1a; --custom-scroll-thumb: #8a2be2; }
                html { scroll-behavior: smooth; }
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
                .feature-card { display: flex; flex-direction: column; background: rgba(20, 20, 40, 0.6); border-radius: 1rem; padding: 2rem; text-align: center; transition: all 0.3s ease; border: 1px solid rgba(138, 43, 226, 0.2); }
                .feature-card:hover { transform: translateY(-10px); box-shadow: 0 10px 30px rgba(138, 43, 226, 0.3); border-color: rgba(138, 43, 226, 0.5); }
                .social-link { font-size: 1.75rem; color: #a3a3c2; transition: all 0.3s ease; }
                .social-link:hover { color: #00bfff; transform: scale(1.1); }
                .social-link-footer { font-size: 1.5rem; color: #a3a3c2; transition: all 0.3s ease; }
                .social-link-footer:hover { color: #00bfff; transform: scale(1.1); }
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
                /* Resume View Styles */
                .resume-view { background-color: #fff; color: #333; font-family: 'Segoe UI', sans-serif; padding: 1rem; md:padding: 2rem; direction: rtl; text-align: right; }
                .resume-header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                .resume-header h1 { font-size: 2rem; md:font-size: 2.5rem; font-weight: 700; color: #8a2be2; margin: 0; }
                .resume-header h2 { font-size: 1.1rem; md:font-size: 1.25rem; font-weight: 400; color: #555; margin: 0.25rem 0; }
                .resume-contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1.5rem; font-size: 0.8rem; md:font-size: 0.9rem; color: #444; margin-top: 0.75rem; }
                .resume-contact span { display: flex; align-items: center; gap: 0.5rem; }
                .resume-body { display: grid; grid-template-columns: 1fr; md:grid-template-columns: 2fr 1fr; gap: 1.5rem; md:gap: 2rem; }
                .resume-section h3 { font-size: 1.2rem; md:font-size: 1.4rem; font-weight: 600; color: #333; border-bottom: 2px solid #8a2be2; padding-bottom: 0.5rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
                .resume-item { margin-bottom: 1.25rem; }
                .resume-item h4 { font-size: 1rem; md:font-size: 1.1rem; font-weight: 600; margin-bottom: 0.1rem; }
                .resume-item h5 { font-size: 0.9rem; md:font-size: 1rem; font-weight: 500; color: #555; margin-bottom: 0.2rem; }
                .resume-item h6 { font-size: 0.8rem; md:font-size: 0.9rem; font-style: italic; color: #777; margin-bottom: 0.5rem; }
                .resume-item ul { list-style-position: outside; padding-right: 1.2rem; margin: 0; font-size: 0.9rem; md:font-size: 0.95rem; line-height: 1.6; }
                .resume-item p, .resume-section p { font-size: 0.9rem; md:font-size: 0.95rem; line-height: 1.6; color: #444; }
                .resume-sidebar { border-right: none; md:border-right: 1px solid #eee; padding-right: 0; md:padding-right: 2rem; border-top: 1px solid #eee; md:border-top: none; padding-top: 1rem; md:padding-top: 0; }
                
                /* Code Project View Styles */
                .code-project-view { padding: 0.5rem; }
                .review-section { background: rgba(10, 10, 26, 0.7); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #8a2be2; }
                .review-title { font-size: 1.1rem; font-weight: 700; color: #c0c0ff; margin-bottom: 0.5rem; display: flex; align-items: center;}
                .review-section p, .review-section li { font-size: 0.9rem; color: #e0e0ff; }

                /* Study Session View Styles */
                .study-session-view { background: rgba(10, 10, 26, 0.7); border: 1px solid rgba(138, 43, 226, 0.2); border-radius: 0.75rem; padding: 1rem 1.5rem; }
                .study-topic-title { font-size: 1.75rem; font-weight: 700; color: #d8b4fe; border-bottom: 2px solid rgba(138, 43, 226, 0.3); padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
                .study-section { margin-bottom: 2rem; }
                .study-section-title { font-size: 1.25rem; font-weight: 600; color: #c084fc; margin-bottom: 1rem; }
                .explanation-block, .review-block, .quiz-block { background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 0.5rem; }
                .explanation-block p { color: #e0e0ff; line-height: 1.7; }
                .quiz-question { background: rgba(30,30,62,0.6); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
                .markdown-table { border-collapse: collapse; width: 100%; margin-top: 1em; margin-bottom: 1em; border: 1px solid #4a044e; }
                .markdown-table th, .markdown-table td { border: 1px solid #4a044e; padding: 0.5rem 0.75rem; }
                .markdown-table th { background-color: #2c1a42; font-weight: bold; color: #d8b4fe; }
                .markdown-table tr:nth-child(even) { background-color: rgba(30,30,62,0.4); }

            `}</style>
        </LanguageProvider>
    );
};

export default App;
