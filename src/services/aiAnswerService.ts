/**
 * AIAnswerService - Sử dụng AI để tổng hợp và trả lời chuyên nghiệp
 * từ nội dung đã lưu trong knowledge base và RAG documents
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface AIAnswerRequest {
    question: string;
    context: string;
    courseCode?: string;
}

export interface AIAnswerResult {
    success: boolean;
    answer?: string;
    error?: string;
}

export class AIAnswerService {
    /**
     * Tạo câu trả lời chuyên nghiệp từ context đã có
     */
    static async generateAnswer(request: AIAnswerRequest): Promise<AIAnswerResult> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = this.buildPrompt(request);
            const result = await model.generateContent(prompt);
            const answer = result.response.text();

            return {
                success: true,
                answer: answer.trim()
            };
        } catch (error: any) {
            console.error('AI answer generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Xây dựng prompt cho AI
     */
    private static buildPrompt(request: AIAnswerRequest): string {
        const { question, context, courseCode } = request;

        return `Bạn là trợ lý giảng dạy chuyên nghiệp. Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên dựa trên thông tin đã có sẵn.

**QUY TẮC QUAN TRỌNG:**
1. CHỈ sử dụng thông tin từ CONTEXT bên dưới để trả lời
2. KHÔNG tự bịa đặt hoặc thêm thông tin không có trong context
3. Nếu context không đủ thông tin, hãy nói rõ "Dựa trên thông tin hiện có..."
4. Trả lời bằng tiếng Việt, chuyên nghiệp và dễ hiểu
5. Cấu trúc câu trả lời rõ ràng, có thể dùng bullet points nếu cần
6. Nếu có nhiều phần thông tin, hãy tổng hợp thành câu trả lời mạch lạc

${courseCode ? `**MÔN HỌC:** ${courseCode}\n` : ''}
**CÂU HỎI:** ${question}

**CONTEXT (Thông tin đã lưu):**
${context}

**CÂU TRẢ LỜI:**`;
    }

    /**
     * Kiểm tra xem câu trả lời có đủ chất lượng không
     */
    static isQualityAnswer(answer: string): boolean {
        // Câu trả lời phải có ít nhất 50 ký tự
        if (answer.length < 50) return false;

        // Không chứa các cụm từ "không biết", "không có thông tin"
        const lowQualityPhrases = [
            'không biết',
            'không có thông tin',
            'không thể trả lời',
            'xin lỗi'
        ];

        const lowerAnswer = answer.toLowerCase();
        return !lowQualityPhrases.some(phrase => lowerAnswer.includes(phrase));
    }
}
