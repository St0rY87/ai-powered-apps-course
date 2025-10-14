import express from 'express';
import type { Response, Request } from 'express';
import { chatController } from './controllers/chat.controller';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('hello');
});

router.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hello' });
});

router.post('/api/chat', chatController.sendMessage);

export default router;
