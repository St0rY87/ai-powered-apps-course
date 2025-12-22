import type { Request, Response } from 'express';
import { chatService } from '../services/chat.services';
import z from 'zod';

//implementation detail
const chatSchema = z.object({
   prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(1000, 'Prompt is too long (max 1000 characters)'),
   conversationId: z.string().uuid(),
});

// Public interface
export const chatController = {
   async sendMessage(req: Request, res: Response) {
      const parseResult = chatSchema.safeParse(req.body);
      if (!parseResult.success) {
         res.status(400).json(parseResult.error.format());
         return;
      }

      try {
         const { prompt, conversationId } = req.body;
         const response = await chatService.sendMessage(prompt, conversationId);

         res.json({ message: response.message });
      } catch (error: any) {
         // Log server-side error (do not expose sensitive details to the client)
         console.error(
            'chatController.sendMessage error:',
            error?.message ?? error
         );
         res.status(500).json({ error: 'Failed to generate a response.' });
      }
   },
};
