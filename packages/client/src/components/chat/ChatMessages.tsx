import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

export type Message = {
   content: string;
   role: 'user' | 'bot';
};

type Props = {
   messages: Message[];
};

const ChatMessages = ({ messages }: Props) => {
   const lastMessageRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   const onCopyMessage = (e: React.ClipboardEvent) => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
         e.preventDefault();
         e.clipboardData.setData('text/plain', selection);
      }
   };

   const markdownComponents: Components = {
      a: ({ ...props }) => (
         <a 
            target="_blank"
            rel="noopener noreferrer"
            {...props}
         />
      ),
   };

   return (
      <div className="flex flex-col gap-3">
         {messages.map((message, index) => (
            <div
               key={index}
               onCopy={onCopyMessage}
               ref={index === messages.length - 1 ? lastMessageRef : null}
               className={`px-3 py-1 max-w-4xl rounded-xl answer ${
                  message.role === 'user'
                     ? 'bg-blue-600 text-white self-end mb-3 mr-2'
                     : 'bg-gray-100 text-black self-start mb-8'
               }`}
            >
               <ReactMarkdown components={markdownComponents}>
                  {message.content}
               </ReactMarkdown>
            </div>
         ))}
      </div>
   );
};

export default ChatMessages;