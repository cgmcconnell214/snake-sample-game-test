import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, FileText, User, Shield } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  attachments: any;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MessageListProps {
  messages: Message[];
  onMessageSelect: (message: Message) => void;
  onMarkAsRead: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onMessageSelect, 
  onMarkAsRead 
}) => {
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'report': return <FileText className="h-4 w-4 text-green-500" />;
      case 'compliance': return <Shield className="h-4 w-4 text-yellow-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                !message.is_read 
                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                  : 'hover:shadow-sm'
              }`}
              onClick={() => {
                onMessageSelect(message);
                if (!message.is_read) {
                  onMarkAsRead(message.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getMessageIcon(message.message_type)}
                  <span className="font-medium text-sm">
                    {message.sender_id ? 'User' : 'System'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!message.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="mt-1">
                <div className="font-medium text-sm">{message.subject}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageList;