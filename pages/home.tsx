import { useState, useRef, useEffect } from 'react';
import styles from '@/styles/Home.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PDF {
  id: string;
  name: string;
}

export default function Home() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      const newPdfs = [...pdfs, { id: data.id, name: data.name }];
      setPdfs(newPdfs);
      if (!selectedPdf) {
        setSelectedPdf(data.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await fetch('/api/pdfs');
        const data = await response.json();
        setPdfs(data);
        if (data.length > 0 && !selectedPdf) {
          setSelectedPdf(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching PDFs:', error);
      }
    };

    fetchPdfs();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedPdf) {
      console.log('Validation failed:', { input: input.trim(), selectedPdf });
      return;
    }

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input },
    ];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          pdfId: selectedPdf,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()}>
          Upload PDF
        </button>
        <div className={styles.pdfList}>
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              onClick={() => setSelectedPdf(pdf.id)}
              className={pdf.id === selectedPdf ? styles.selected : ''}
            >
              {pdf.name}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chat}>
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${styles[message.role]}`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
