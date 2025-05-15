interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface SpeechGrammarList {
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

declare var SpeechGrammarList: {
  prototype: SpeechGrammarList;
  new(): SpeechGrammarList;
};

declare var webkitSpeechGrammarList: {
  prototype: SpeechGrammarList;
  new(): SpeechGrammarList;
};

interface Window {
  SpeechGrammarList: typeof SpeechGrammarList;
  webkitSpeechGrammarList: typeof SpeechGrammarList;
}
