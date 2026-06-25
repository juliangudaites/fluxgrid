import './MessageAttachment.css';

interface MessageAttachmentProps {
  type: 'image' | 'video';
  url: string;
}

export function MessageAttachment({ type, url }: MessageAttachmentProps) {
  if (type === 'video') {
    return (
      <div className="message-attachment">
        <video className="message-attachment__video" src={url} controls playsInline preload="metadata" />
      </div>
    );
  }
  return (
    <div className="message-attachment">
      <img className="message-attachment__image" src={url} alt="" loading="lazy" />
    </div>
  );
}