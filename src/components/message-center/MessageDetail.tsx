import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

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

interface MessageDetailProps {
  message: Message | null;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Details</CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{message.subject}</h3>
                <Badge variant="outline" className="text-xs">
                  {message.message_type}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                From: {message.sender_id ? 'User' : 'System'} • {new Date(message.created_at).toLocaleString()}
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {(() => {
              // Parse attachments from JSON if it's a string, or use as array if already parsed
              const attachments = typeof message.attachments === 'string' 
                ? JSON.parse(message.attachments || '[]') 
                : message.attachments || [];
              return attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{attachment.name}</span>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Select a message to view details
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageDetail;