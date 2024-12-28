export interface PhotoType {
    id: number;
    src: string;
    width: number;
    height: number;
    prompt: string;
    negativePrompt: string | null;
    filename: string;
    createdAt: string;
}

export interface SavedConfig {
    prompt: string;
    negativePrompt: string;
    width: number;
    height: number;
    aspectLocked: boolean;
    isVertical: boolean;
} 