import React, { useState, useCallback } from 'react';
import { analyzeStoryboard } from './services/geminiService';

// SVG Icon Component
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25H9A2.25 2.25 0 016.75 4.5v0a2.25 2.25 0 012.25-2.25h3.879a2.25 2.25 0 012.121.75l.315.315A2.25 2.25 0 0116.5 4.5v6.75a2.25 2.25 0 01-2.25 2.25H9a2.25 2.25 0 01-2.25-2.25V4.5A2.25 2.25 0 019 2.25h3.549a2.25 2.25 0 011.591.659l.315.315z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5c0-.612-.03-1.213-.084-1.814A2.25 2.25 0 0013.5 2.25H9c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25H9A2.25 2.25 0 016.75 4.5v0a2.25 2.25 0 012.25-2.25h3.879a2.25 2.25 0 012.121.75l.315.315A2.25 2.25 0 0116.5 4.5z" />
    </svg>
);

const Loader: React.FC = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-sky-400" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2">프롬프트 생성 중...</span>
    </div>
);

const AppHeader: React.FC = () => (
    <header className="text-center p-6">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
            스토리보드 VEO 프롬프트 생성기
        </h1>
        <p className="text-slate-400 mt-2">스토리보드 텍스트 또는 이미지를 분석하여 VEO 영상 제작용 프롬프트를 생성합니다.</p>
    </header>
);

interface PromptDisplayProps {
    prompts: string[] | null;
    error: string | null;
    onPromptChange: (index: number, newText: string) => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompts, error, onPromptChange }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!prompts && !error) return null;

    const handleCopy = (textToCopy: string, index: number) => {
        navigator.clipboard.writeText(textToCopy);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };
    
    return (
        <div className="bg-slate-800 p-6 mt-6 rounded-lg border border-slate-700">
             <h3 className="text-lg font-semibold text-slate-300 mb-4">생성된 VEO 프롬프트 (수정 가능)</h3>
            {error && <p className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>}
            {prompts && prompts.map((prompt, index) => (
                <div key={index} className="mb-6 last:mb-0">
                    <h4 className="text-md font-semibold text-sky-400 mb-2">생성된 VEO 프롬프트 {index + 1}씬</h4>
                    <div className="relative">
                         <textarea
                            value={prompt}
                            onChange={(e) => onPromptChange(index, e.target.value)}
                            className="w-full h-32 bg-slate-900/50 p-4 pr-12 rounded-md text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono"
                            aria-label={`Generated VEO Prompt for Scene ${index + 1}`}
                        />
                        <button
                            onClick={() => handleCopy(prompt, index)}
                            className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                            aria-label={`Copy prompt for Scene ${index + 1}`}
                        >
                            {copiedIndex === index ? '복사됨!' : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const promptOptionsMap = new Map([
    ['한국어로 더빙', 'Dubbed in Korean.'],
    ['자막이나 그래픽은 없다.', 'No subtitles or graphics.'],
]);

interface PromptOptionsChecklistProps {
    selectedOptions: string[];
    onChange: (options: string[]) => void;
}

const PromptOptionsChecklist: React.FC<PromptOptionsChecklistProps> = ({ selectedOptions, onChange }) => {
    const handleCheckboxChange = (optionValue: string) => {
        const newSelectedOptions = selectedOptions.includes(optionValue)
            ? selectedOptions.filter(o => o !== optionValue)
            : [...selectedOptions, optionValue];
        onChange(newSelectedOptions);
    };

    return (
        <div className="bg-slate-800 p-6 mt-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">자주 쓰는 프롬프트 옵션</h3>
            <div className="space-y-3">
                {Array.from(promptOptionsMap.entries()).map(([label, value]) => (
                    <label key={value} className="flex items-center space-x-3 text-slate-300 cursor-pointer hover:text-sky-400 transition">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800"
                            checked={selectedOptions.includes(value)}
                            onChange={() => handleCheckboxChange(value)}
                        />
                        <span>{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

const aspectRatioOptions = {
    '1:1': '1:1',
    '16:9 (가로)': '16:9',
    '9:16 (세로)': '9:16',
};

interface AspectRatioSelectorProps {
    selectedRatio: string;
    onChange: (ratio: string) => void;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onChange }) => (
    <div className="bg-slate-800 p-6 mt-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">영상 비율</h3>
        <div className="flex flex-col sm:flex-row gap-4">
            {Object.entries(aspectRatioOptions).map(([label, value]) => (
                <label key={value} className="flex items-center space-x-3 text-slate-300 cursor-pointer hover:text-sky-400 transition bg-slate-700/50 p-3 rounded-md flex-1 justify-center">
                    <input
                        type="radio"
                        name="aspect-ratio"
                        className="h-5 w-5 bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800"
                        checked={selectedRatio === value}
                        onChange={() => onChange(value)}
                    />
                    <span>{label}</span>
                </label>
            ))}
        </div>
    </div>
);


export default function App() {
    const [storyboardText, setStoryboardText] = useState<string>('');
    const [pastedImage, setPastedImage] = useState<{ base64: string; mimeType: string; } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatedPrompts, setGeneratedPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [promptOptions, setPromptOptions] = useState<string[]>([]);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('16:9');


    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        if (result) {
                            const [header, data] = result.split(',');
                            const mimeType = header.match(/:(.*?);/)?.[1];
                            if (data && mimeType) {
                                setPastedImage({ base64: data, mimeType });
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                    event.preventDefault(); // Prevent text representation from being pasted
                }
                break; // Handle only the first image
            }
        }
    };
    
    const handlePromptChange = (index: number, newText: string) => {
        if (generatedPrompts) {
            const newPrompts = [...generatedPrompts];
            newPrompts[index] = newText;
            setGeneratedPrompts(newPrompts);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!storyboardText.trim() && !pastedImage) {
            setError('스토리보드 내용이나 이미지를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedPrompts(null);

        try {
            const imageBase64 = pastedImage ? pastedImage.base64 : null;
            const mimeType = pastedImage ? pastedImage.mimeType : null;
            const prompts = await analyzeStoryboard(imageBase64, mimeType, storyboardText);

            const finalPrompts = prompts.map(p => {
                let currentPrompt = p;
                if (promptOptions.length > 0) {
                    const optionsText = promptOptions.join(' ');
                    currentPrompt = currentPrompt.trim().endsWith('.') ? currentPrompt.trim() : currentPrompt.trim() + '.';
                    currentPrompt = `${currentPrompt} ${optionsText}`;
                }

                if (selectedAspectRatio) {
                     currentPrompt = currentPrompt.trim().endsWith('.') ? currentPrompt.trim() : currentPrompt.trim() + '.';
                     currentPrompt = `${currentPrompt} Aspect ratio ${selectedAspectRatio}.`;
                }
                return currentPrompt.trim();
            });


            setGeneratedPrompts(finalPrompts);
        } catch (e) {
            console.error(e);
            setError('프롬프트 생성에 실패했습니다. API 키를 확인하거나 나중에 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    }, [storyboardText, pastedImage, promptOptions, selectedAspectRatio]);
    
    const hasContent = storyboardText.trim() !== '' || pastedImage !== null;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <AppHeader />
                <main>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-300 mb-4">스토리보드 내용 붙여넣기</h3>
                        <p className="text-sm text-slate-400 mb-2">텍스트를 입력하거나, 스토리보드 이미지를 복사하여 붙여넣으세요.</p>
                        <textarea
                            value={storyboardText}
                            onChange={(e) => setStoryboardText(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="여기에 표, 텍스트, 또는 이미지를 붙여넣으세요..."
                            className="w-full h-48 bg-slate-900/50 p-4 rounded-md text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                            aria-label="Storyboard content input"
                        />
                        {pastedImage && (
                            <div className="mt-4 relative w-48 group">
                                <p className="text-sm text-slate-400 mb-2">붙여넣은 이미지:</p>
                                <img src={`data:${pastedImage.mimeType};base64,${pastedImage.base64}`} alt="Pasted storyboard" className="rounded-md border border-slate-600" />
                                <button
                                    onClick={() => setPastedImage(null)}
                                    className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold transition opacity-0 group-hover:opacity-100"
                                    aria-label="Remove image"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <PromptOptionsChecklist 
                        selectedOptions={promptOptions}
                        onChange={setPromptOptions}
                    />
                    
                    <AspectRatioSelector
                        selectedRatio={selectedAspectRatio}
                        onChange={setSelectedAspectRatio}
                    />

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !hasContent}
                            className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-sky-900/50 hover:shadow-xl hover:shadow-sky-800/50 transform hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader /> : '프롬프트 생성하기'}
                        </button>
                    </div>

                    <PromptDisplay 
                        prompts={generatedPrompts} 
                        error={error} 
                        onPromptChange={handlePromptChange}
                    />
                </main>
            </div>
        </div>
    );
}