"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import axios from "axios";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import SERVER_ADDRESS, { SPEAK_ADDRESS } from "config";
import { useRef } from "react";

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

type SpeechRecognition = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
};

export default function MicButton() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          setIsListening(false);
          getAssistantResponse(transcript);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognition);
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        // Check if speech synthesis is supported and properly working
        console.log("Speech synthesis available:", !!window.speechSynthesis);
        console.log("Speech synthesis voices:", window.speechSynthesis.getVoices().length);
        
        // Force load voices as some browsers need this
        window.speechSynthesis.onvoiceschanged = () => {
          console.log("Voices loaded:", window.speechSynthesis.getVoices().length);
          setSpeechSynthesis(window.speechSynthesis);
        };
        
        // Set the speech synthesis object anyway in case onvoiceschanged doesn't fire
        setSpeechSynthesis(window.speechSynthesis);
        
        // Test speech synthesis with a silent utterance to initialize the engine
        try {
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0; // Silent
          testUtterance.onend = () => console.log("Speech synthesis initialized");
          window.speechSynthesis.speak(testUtterance);
        } catch (e) {
          console.error("Error initializing speech synthesis:", e);
        }
      } else {
        console.error("Speech synthesis not supported in this browser");
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setResponse("");
      recognition?.start();
      setIsListening(true);
    }
  };

  const getAssistantResponse = async (prompt: string) => {
    setIsProcessing(true);
    try {
      const result = await axios.get(`${SERVER_ADDRESS}/data/get_assistance/${encodeURIComponent(prompt)}`);
      const responseText = result.data;
      setResponse(responseText);
      // setSpeechSynthesis(True);
      speakResponse(responseText);
    } catch (error) {
      console.error("Error getting assistant response:", error);
      setResponse("Sorry, I couldn't process your request at this time.");
      speakResponse("Sorry, I couldn't process your request at this time.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
      // Play the audio response
      console.log(SPEAK_ADDRESS);
      const result = axios.get(`${SPEAK_ADDRESS}/data/speak/${encodeURIComponent(text)}`);
      console.log(result);
  }
  
  // Helper to play audio from a URL
  const playAudio = (url: string) => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    
    const audioPlayer = audioPlayerRef.current;
    audioPlayer.src = url;
    audioPlayer.onplay = () => setIsSpeaking(true);
    audioPlayer.onended = () => setIsSpeaking(false);
    audioPlayer.onerror = () => {
      console.error("Audio playback error");
      setIsSpeaking(false);
    };
    
    audioPlayer.play().catch(error => {
      console.error("Error playing audio:", error);
      setIsSpeaking(false);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Button
          onClick={toggleListening}
          className={`rounded-full w-16 h-16 p-0 ${
            isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          } transition-all shadow-lg z-10 relative`}
          disabled={isProcessing}
        >
          <Image
            src="/mic.svg"
            alt="Microphone"
            width={28}
            height={28}
            className={`${isListening ? "animate-pulse" : ""}`}
          />
        </Button>
        {/* Visualizer ring around the button */}
        <div className="absolute -top-8 -left-8 w-32 h-32 z-0">
          <VoiceVisualizer isActive={isListening} />
        </div>
      </div>
      
      <div className="text-center mt-4">
        {isListening && <p className="text-sm animate-pulse">Listening...</p>}
        {isProcessing && <p className="text-sm animate-pulse">Processing...</p>}
      </div>
      
      {transcript && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-w-xl w-full mt-2">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">You said:</h3>
          <p className="text-lg">{transcript}</p>
        </div>
      )}
      
      {response && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md max-w-xl w-full mt-2">
          <h3 className="font-medium text-sm text-blue-500">Assistant:</h3>
          <p className="text-lg">{response}</p>
          <div className="mt-3">
            <button 
              onClick={() => speakResponse(response)}
              className={`px-3 py-1.5 ${isSpeaking ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md flex items-center gap-1.5 transition-colors`}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Playing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  Play audio
                </>
              )}
            </button>
            {!window.speechSynthesis && (
              <div className="mt-2 text-xs text-red-500">
                Speech synthesis is not supported in your browser. Please try a different browser.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
