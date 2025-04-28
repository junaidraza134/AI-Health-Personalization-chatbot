import pyttsx3
import threading
import requests
import json
import os
from dotenv import load_dotenv

class HealthFitnessChatbot:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyA0mpp2rSGvNAur3Sy4U8mHnXuZoqC7dko"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={self.api_key}"
        self.health_keywords = ['health', 'fitness', 'nutrition', 'diet', 'exercise', 'workout', 'weight', 'loss', 'gain', 'muscle', 'fat', 'calorie', 'protein', 'cardio', 'strength', 'yoga', 'meal', 'recipe', 'vitamin', 'supplement', 'wellness', 'lifestyle', 'train', 'gym', 'body', 'fit', 'healthy']

        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 150)
            self.engine.setProperty('volume', 1.0)
        except Exception as e:
            print(f"Warning: Could not initialize text-to-speech: {e}")
            self.engine = None

    def speak(self, text):
        if not self.engine: return
        threading.Thread(target=lambda: self.engine.say(text) or self.engine.runAndWait()).start()

    def generate_response(self, user_input):
        try:
            prompt = {
                "contents": [{
                    "parts": [{
                        "text": f"""You are a Health and Fitness Expert Assistant specializing in nutrition, exercise, and wellness.
                        Provide concise, science-backed advice. Keep responses under 100 words.

                        Current question: {user_input}"""
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 500,
                    "topP": 0.8
                }
            }

            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=prompt,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if result.get('candidates') and result['candidates'][0].get('content'):
                    return result['candidates'][0]['content']['parts'][0]['text']
                return "I couldn't generate a proper response. Please try asking differently."
            return f"API Error {response.status_code}: {response.text[:200]}..."

        except requests.Timeout:
            return "Request timed out. Please try again."
        except Exception as e:
            return f"Error: {str(e)}"

    def is_health_related(self, text):
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.health_keywords)

    def chat(self):
        print("\n" + "="*50 + "\nHealth & Fitness Assistant".center(50) + "\n" + "="*50)
        print("\nI help with nutrition, workouts, weight management, and wellness.\nType 'quit' to exit\n")

        while True:
            try:
                user_input = input("You: ").strip()
                if user_input.lower() == 'quit':
                    print("\nStay healthy! Goodbye!")
                    break

                if not self.is_health_related(user_input):
                    print("\nI specialize in health/fitness topics. Ask about nutrition, exercise, or wellness.")
                    continue

                response = self.generate_response(user_input)
                print(f"\nAssistant: {response}\n")
                self.speak(response)

            except KeyboardInterrupt:
                print("\nOperation cancelled")
                break
            except Exception as e:
                print(f"\nError: {e}\n")

if __name__ == "__main__":
    try:
        HealthFitnessChatbot().chat()
    except ImportError as e:
        print(f"Missing package: {e}\nInstall with: pip install pyttsx3 requests python-dotenv")
