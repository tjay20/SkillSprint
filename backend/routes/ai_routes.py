import os
import json
import re
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from schemas import AutoQuestionRequest, AutoQuestionResponse

router = APIRouter()

# Initialize Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-pro')
    except Exception:
        model = None
else:
    model = None

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_aura(request: ChatRequest):
    if not model:
        # Fallback response if no API key
        return {"response": "Aura is currently in offline mode (API key missing). Please check your .env file!"}
    
    try:
        # Prompt engineering for Aura personality
        prompt = f"You are Aura, the intelligent AI Mentor for SkillSprint, a competitive coding platform. Be technical, helpful, and encouraging. Answer the student's request: {request.message}"
        response = model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-questions", response_model=list[AutoQuestionResponse])
async def generate_questions(request: AutoQuestionRequest, db: Session = Depends(get_db)):
    """
    Generate MCQ questions dynamically using Gemini API.
    """
    if not model:
        raise HTTPException(
            status_code=500,
            detail="Question generation service is unavailable (API key missing)"
        )

    try:
        # Create a detailed prompt for Gemini to generate MCQ questions
        prompt = f"""Generate {request.count} multiple choice questions for {request.language} at {request.difficulty} level about: {request.topic}

Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Specify which option is correct (A, B, C, or D)
3. Focus on practical and common concepts for {request.language}
4. Make questions suitable for a competitive coding platform

Return the response as a JSON array with this exact structure (no markdown, just raw JSON):
[
  {{
    "text": "Question text here?",
    "option_a": "Option A text",
    "option_b": "Option B text",
    "option_c": "Option C text",
    "option_d": "Option D text",
    "correct_option": "A"
  }}
]

Only return the JSON array, no other text."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Try to extract JSON from response (in case it includes markdown formatting)
        if "```" in response_text:
            start = response_text.find("[")
            end = response_text.rfind("]") + 1
            response_text = response_text[start:end]

        # Parse the JSON response
        questions_data = json.loads(response_text)

        # Convert to AutoQuestionResponse objects
        questions = []
        for q in questions_data:
            question = AutoQuestionResponse(
                text=q.get("text", ""),
                option_a=q.get("option_a", ""),
                option_b=q.get("option_b", ""),
                option_c=q.get("option_c", ""),
                option_d=q.get("option_d", ""),
                correct_option=q.get("correct_option", "A").upper(),
            )
            questions.append(question)

        return questions

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse generated questions: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(e)}"
        )
