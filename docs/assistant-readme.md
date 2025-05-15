# Voice Assistant Interface

This component provides a voice-based assistant interface for the Kiosk UI system.

## Features

- **Voice Recognition**: Uses Web Speech API to capture user voice input
- **Voice Synthesis**: Converts text responses to speech
- **Visual Feedback**: Visual indicators for active listening and processing states
- **API Integration**: Connects to backend API for assistance responses

## Components

1. **MicButton.tsx** - Core component handling voice recognition and synthesis
2. **VoiceVisualizer.tsx** - Visual feedback for voice activity
3. **Assistant page** - Main page integrating the assistant components

## Usage

Navigate to the `/assistant` route to access the voice assistant interface.

## Technical Implementation

- Uses Web Speech API for speech recognition and synthesis
- Makes API calls to the backend endpoint for processing voice commands
- Implements responsive UI with visual feedback during voice interaction

## API Endpoint

The assistant connects to the following backend endpoint:

```
/data/get_assistance/<prompt>
```

This endpoint processes the voice prompt and returns the assistant's response.

## Future Enhancements

- Support for offline voice recognition
- Multiple language support
- Improved voice visualization and feedback
- Integration with more specialized assistance services
