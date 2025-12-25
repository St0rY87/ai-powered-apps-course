import fs from 'fs';
import path from 'path';
import axios from 'axios';
import OpenAI from 'openai';
import { conversationRepository } from '../repositories/conversation.repository';
import template from '../prompts/chatbot.txt';
import {getCurrentDateTime} from '../utils/dateFormatter'

// Implementation detail for OpenAI (existing)
import type { ChatMessage } from '../repositories/conversation.repository';
const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

const currentDateTime = getCurrentDateTime();


const libInfo = fs.readFileSync(
   path.join(__dirname, '..', 'prompts', 'brerailib.md'),
   'utf-8'
);

const baseInstructions = template.replace('{{libInfo}}', libInfo);

const instructions = `
${baseInstructions}
ТЕКУЩАЯ ИНФОРМАЦИЯ (обновляется при каждом запросе): ${currentDateTime}
`

type ChatResponse = {
   id: string;
   message: string;
};

// Allow switching provider via env var LLM_PROVIDER.
// If LLM_PROVIDER is not set but a DEEPSEEK_API_KEY is present, prefer Deepseek.
const PROVIDER = (
   process.env.LLM_PROVIDER ||
   (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai')
).toLowerCase();

if (PROVIDER === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
   console.warn(
      'LLM_PROVIDER=deepseek selected but DEEPSEEK_API_KEY is not set.'
   );
}

// Public interface
export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      // If Deepseek is requested, call its chat/completions endpoint directly
      if (PROVIDER === 'deepseek') {
         const base = (
            process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com'
         ).replace(/\/$/, '');
         const url = `${base}/chat/completions`;

         // Build message list from conversation history so Deepseek receives full context
         const history: ChatMessage[] =
            conversationRepository.getConversationMessages(conversationId);

         const messages = [
            { role: 'system', content: instructions },
            // include historical messages (user/assistant)
            ...history.map((m) => ({ role: m.role, content: m.content })),
            // current user message
            { role: 'user', content: prompt },
         ];

         // persist user message locally so next calls include it in history
         conversationRepository.appendMessage(conversationId, {
            role: 'user',
            content: prompt,
         });

         const body: Record<string, any> = {
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages,
            stream: false,
            temperature: 0.2,
            // keep default reasonable to avoid provider rejection; reduce from 5000 to 500
            max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS ?? 500),
         };

         // Include previous_response_id if available and desired
         // Deepseek works better when we send the full messages history; don't rely on previous_response_id here.

         let data: any = {};
         try {
            const resp = await axios.post(url, body, {
               headers: {
                  Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                  'Content-Type': 'application/json',
               },
               timeout: Number(process.env.DEEPSEEK_TIMEOUT_MS ?? 60_000),
            });
            data = resp.data ?? {};
         } catch (err: any) {
            // Log error and rethrow a generic error for the controller to handle
            console.error('Deepseek API request failed', {
               provider: 'deepseek',
               url,
               status: err?.response?.status,
               responseData: err?.response?.data,
               message: err?.message,
            });
            throw new Error('Deepseek API error');
         }

         const messageText =
            data?.choices?.[0]?.message?.content ||
            data?.choices?.[0]?.text ||
            data?.output_text ||
            (Array.isArray(data.output) && data.output[0]?.text) ||
            data?.result ||
            data?.text ||
            '';

         const id = data?.id || data?.response_id || '';

         if (id) conversationRepository.setLastResponseId(conversationId, id);

         // persist assistant reply so future calls include it in history
         conversationRepository.appendMessage(conversationId, {
            role: 'assistant',
            content: String(messageText),
         });

         return { id, message: String(messageText) };
      }

      // Default: existing OpenAI flow (unchanged)
      const response = await client.responses.create({
         model: 'gpt-4o-mini',
         instructions,
         input: prompt,
         temperature: 0.2,
         max_output_tokens: 500,
         previous_response_id:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);

      return {
         id: response.id,
         message: response.output_text,
      };
   },
};
