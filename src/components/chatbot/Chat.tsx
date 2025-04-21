import { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi there! How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simple responses based on user input
  const getBotResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return "Hello there! What can I help you with?";
    } else if (input.includes('name')) {
      return "I'm a simple chatbot. You can call me ChattyBot!";
    } else if (input.includes('help')) {
      return "I can answer simple questions. Try asking about my name, how I'm doing, or say hello!";
    } else if (input.includes('how are you')) {
      return "I'm doing well, thanks for asking! How about you?";
    } else if (input.includes('bye') || input.includes('goodbye')) {
      return "Goodbye! Have a great day!";
    } else if (input.includes('thank')) {
      return "You're welcome! Is there anything else I can help with?";
    } else {
      return "I'm not sure how to respond to that. Can you try asking something else?";
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { text: input, isBot: false };
    setMessages([...messages, userMessage]);
    setInput('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate bot typing delay
    setTimeout(() => {
      const botMessage = { text: getBotResponse(input), isBot: true };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
      {/* Chatbot interface */}
      {isOpen && (
        <div className="mb-4 flex flex-col h-96 w-80 border border-gray-300 rounded-lg shadow-lg overflow-hidden bg-white">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-3 font-medium flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
              ChattyBot
            </div>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              ✕
            </button>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex mb-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-xs ${
                  message.isBot 
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-300 p-2 flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 focus:outline-none"
            >
              Send
            </button>
          </form>
        </div>
      )}
      
      {/* Chat toggle button */}
      <button
        onClick={toggleChat}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg focus:outline-none transition-colors duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <span className="text-white text-xl">
          {isOpen ? '✕' : '💬'}
        </span>
      </button>
    </div>
  );
}