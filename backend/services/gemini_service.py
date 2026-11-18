import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Load Gemini model
model = genai.GenerativeModel("gemini-2.5-flash")


def condense_query(question: str, history: list = None) -> str:
    """
    Reformulate a follow-up question into a standalone search query
    containing necessary context from previous conversation turns.
    """
    if not history or len(history) == 0:
        return question

    history_text = "\n".join(
        f"{chat.get('role', 'User')}: {chat.get('message', '')}"
        for chat in history[-6:]
    )

    prompt = f"""You are a search query optimizer for a document question-answering system.
Given the conversation history and a follow-up user question, rewrite the follow-up question into a clear, standalone search query that contains all necessary entities, document names, subjects, and context.

Rules:
1. Do NOT answer the question.
2. Only return the reformulated search query string.
3. If the user question is already standalone or self-contained, return the question unchanged.
4. Keep the query concise and focused on keywords/concepts to search in the knowledge base.

Conversation History:
{history_text}

Follow-up User Question:
{question}

Standalone Search Query:"""

    try:
        response = model.generate_content(prompt)
        condensed = response.text.strip().strip('"').strip("'")
        return condensed if condensed else question
    except Exception as e:
        print(f"Error condensing query: {e}")
        return question


def generate_answer(question: str, context: str, history: list = None) -> str:

    history_text = ""
    if history:
        history_text = "\n".join(
            f"{chat.get('role', 'User')}: {chat.get('message', '')}"
            for chat in history[-6:]
        )

    prompt = f"""You are an intelligent, highly accurate AI Knowledge Assistant.
Your goal is to provide accurate, comprehensive, and well-structured answers using the retrieved document evidence below, while naturally maintaining the ongoing conversation flow.

-----------------------------------
CONVERSATION HISTORY
-----------------------------------
{history_text if history_text else "No previous conversation."}

-----------------------------------
RETRIEVED DOCUMENT EVIDENCE
-----------------------------------
{context if context else "No document evidence retrieved."}

-----------------------------------
USER QUESTION / INSTRUCTION
-----------------------------------
{question}

-----------------------------------
ACCURACY & FORMATTING GUIDELINES
-----------------------------------
1. Contextual Understanding: Resolve follow-up questions and references (such as "Provide further info", "tell me more", "explain point 2", "what about his education?", etc.) seamlessly using the conversation history.
2. Grounded Factuality: Base every factual claim strictly on the Retrieved Document Evidence. Never hallucinate, assume, or fabricate details not supported by the retrieved text.
3. Elaboration & Completeness: When the user asks for more information, summaries, or details on a topic, synthesize all relevant points from the document chunks into a thorough, coherent answer.
4. Clean Markdown Formatting:
   - Use standard Markdown headings (e.g. `### Main Topics`, `### Key Projects`) for major sections.
   - Use standard unordered bullet points (`- Item` or `* Item`) with proper indentation.
   - Use clean bold text (`**Term:**`) for emphasis with properly balanced asterisks.
   - Do NOT produce malformed or mismatched asterisks (such as `*Title:**` or `**Title:*`).
   - Use code formatting (```code``` or `inline_code`) for code, file names, or commands.
5. Completeness for Specific Categories:
   - Skills / Technologies: Include all skills, frameworks, and tools found in the evidence.
   - Projects: Detail each project's scope, tech stack, and achievements as documented.
   - Experience / Roles: Include companies, roles, responsibilities, and metrics mentioned.
   - Education / Certifications: Include degrees, institutions, years, and certifications.
6. Absence of Evidence: If the answer cannot be found in the retrieved evidence or document context, state clearly:
"I couldn't find enough relevant information in the uploaded documents to answer this question."

-----------------------------------
ANSWER
-----------------------------------
"""

    try:
        response = model.generate_content(prompt)
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        return "I was unable to generate a response from the document evidence."
    except Exception as e:
        print(f"[Warning] Gemini generation error: {e}")
        # Safe fallback if Gemini API experiences errors or rate limits
        if context and len(context.strip()) > 0:
            return (
                "### Relevant Information Found in Document\n\n"
                + context[:1200]
                + "\n\n*(Note: AI synthesis is temporarily unavailable, so direct excerpts from your uploaded document are shown above.)*"
            )
        return "I couldn't find enough relevant information in the uploaded documents to answer this question."