"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Action {
  text: string;
  link: string;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  action?: Action;
  loading?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  type: string;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  time_period?: string | null;
}

interface ContactInfo {
  address: string;
  phone?: string | null;
  email: string;
  opening_hours?: string | null;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      // Fetch Menu Items
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, type")
        .limit(5); // Fetch a few items for suggestions
      if (menuError) console.error("Error fetching menu items for chatbot:", menuError);
      else setMenuItems(menuData || []);

      // Fetch Special Offers
      const { data: offersData, error: offersError } = await supabase
        .from("special_offers")
        .select("id, title, description, time_period")
        .limit(3); // Fetch a few offers for suggestions
      if (offersError) console.error("Error fetching special offers for chatbot:", offersError);
      else setSpecialOffers(offersData || []);

      // Fetch Contact Info
      const { data: contactData, error: contactError } = await supabase
        .from("contact_info")
        .select("address, phone, email, opening_hours")
        .eq("id", 1)
        .single();
      if (contactError && contactError.code !== 'PGRST116') console.error("Error fetching contact info for chatbot:", contactError);
      else if (contactData) setContactInfo(contactData);

      setDataLoading(false);
    };

    fetchData();
  }, []);

  const handleSendMessage = (text: string, sender: "user" | "bot", action?: Action) => {
    if (text.trim() === "") return;
    setMessages((prev) => [...prev, { id: prev.length + 1, text, sender, action }]);
    setInput("");

    if (sender === "user") {
      setMessages((prev) => [...prev, { id: prev.length + 2, text: "...", sender: "bot", loading: true }]);
      setTimeout(() => {
        setMessages((prev) => prev.filter(msg => !msg.loading)); // Remove loading message

        const lowerCaseInput = text.toLowerCase();
        let botResponse = "I'm sorry, I don't have information on that. You can try asking about our menu, reservations, special offers, or contact details.";
        let botAction: Action | undefined = undefined;

        if (lowerCaseInput.includes("menu") || lowerCaseInput.includes("food") || lowerCaseInput.includes("dishes")) {
          if (menuItems.length > 0) {
            const sampleItems = menuItems.slice(0, 2).map(item => `${item.name} (${item.price})`).join(", ");
            botResponse = `We have a diverse menu! For example, you might enjoy ${sampleItems}. You can view our full menu here:`;
            botAction = { text: "View Full Menu", link: "/menu" };
          } else {
            botResponse = "Our menu is currently being updated, but you can check it out on our Menu page!";
            botAction = { text: "View Menu", link: "/menu" };
          }
        } else if (lowerCaseInput.includes("book") || lowerCaseInput.includes("table") || lowerCaseInput.includes("reservation")) {
          botResponse = "Booking a table is easy! You can make a reservation on our Reservations page.";
          botAction = { text: "Book a Table", link: "/reservations" };
        } else if (lowerCaseInput.includes("offers") || lowerCaseInput.includes("deals") || lowerCaseInput.includes("specials") || lowerCaseInput.includes("promotions")) {
          if (specialOffers.length > 0) {
            const sampleOffers = specialOffers.slice(0, 2).map(offer => offer.title).join(", ");
            botResponse = `Yes, we do! We currently have offers like ${sampleOffers}. See all our special offers here:`;
            botAction = { text: "See Offers", link: "/#offers" };
          } else {
            botResponse = "We don't have any special offers running at the moment, but keep an eye on our homepage for updates!";
            botAction = { text: "See Offers", link: "/#offers" };
          }
        } else if (lowerCaseInput.includes("hours") || lowerCaseInput.includes("open") || lowerCaseInput.includes("close")) {
          if (contactInfo?.opening_hours) {
            botResponse = `Our opening hours are: ${contactInfo.opening_hours.replace(/<br>/g, ' ')}`;
          } else {
            botResponse = "Our opening hours are generally from 11:00 AM to 10:00 PM, Tuesday to Sunday. We are closed on Mondays.";
          }
          botAction = { text: "View Contact Info", link: "/#contact" };
        } else if (lowerCaseInput.includes("location") || lowerCaseInput.includes("address") || lowerCaseInput.includes("where")) {
          if (contactInfo?.address) {
            botResponse = `You can find us at: ${contactInfo.address}.`;
          } else {
            botResponse = "We are located at 123 Royal Street, Grand City.";
          }
          botAction = { text: "View Map", link: "/#contact" };
        } else if (lowerCaseInput.includes("newsletter") || lowerCaseInput.includes("subscribe")) {
          botResponse = "Absolutely! You can subscribe to our newsletter at the bottom of our homepage to stay updated with our latest offers and events.";
          botAction = { text: "Subscribe Now", link: "/#newsletter" };
        }

        setMessages((prev) => [...prev, { id: prev.length + 1, text: botResponse, sender: "bot", action: botAction }]);
      }, 1000); // Simulate network delay
    }
  };

  const handleFaqClick = (question: string) => {
    handleSendMessage(question, "user");
  };

  const initialFaqSuggestions = [
    { question: "What's on the menu?", keywords: ["menu", "food"] },
    { question: "How do I book a table?", keywords: ["book", "reservation"] },
    { question: "Do you have any special offers?", keywords: ["offers", "deals"] },
    { question: "What are your opening hours?", keywords: ["hours", "open"] },
    { question: "Where are you located?", keywords: ["location", "address"] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 z-[100]"
        >
          <MessageCircle className="h-7 w-7" />
          <span className="sr-only">Open chat bot</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md h-[70vh] flex flex-col bg-pastel-cream border-royal-gold shadow-xl">
        <DialogHeader className="border-b border-royal-gold pb-4">
          <DialogTitle className="text-royal-red text-2xl">Watee Baroesa Chat</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-royal-red/80 italic">
              <p className="mb-4">Hello! How can I assist you today?</p>
              <p className="font-semibold mb-2">Popular Questions:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {dataLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-royal-gold" />
                ) : (
                  initialFaqSuggestions.map((faq, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFaqClick(faq.question)}
                      className="border-royal-gold text-royal-gold hover:bg-royal-gold hover:text-royal-red"
                    >
                      {faq.question}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col",
                msg.sender === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-lg shadow-md",
                  msg.sender === "user"
                    ? "bg-royal-red text-pastel-cream rounded-br-none"
                    : "bg-pastel-blue text-royal-red rounded-bl-none",
                  msg.loading && "animate-pulse"
                )}
              >
                {msg.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : msg.text}
              </div>
              {msg.action && !msg.loading && (
                <Button asChild size="sm" className="mt-2 bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream">
                  <Link to={msg.action.link}>{msg.action.text}</Link>
                </Button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="flex p-4 border-t border-royal-gold">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage(input, "user");
              }
            }}
            className="flex-grow mr-2 border-royal-red focus:border-royal-gold text-royal-red placeholder:text-royal-red/60"
          />
          <Button
            onClick={() => handleSendMessage(input, "user")}
            className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBot;