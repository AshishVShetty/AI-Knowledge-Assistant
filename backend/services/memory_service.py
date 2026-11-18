# Store conversation history separately for each session
conversation_histories = {}


def add_message(session_id, role, message):
    """
    Add a message to the conversation history
    for a specific session.
    """

    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    conversation_histories[session_id].append({
        "role": role,
        "message": message
    })

    # Keep only the latest 10 messages
    conversation_histories[session_id] = (
        conversation_histories[session_id][-10:]
    )


def get_history(session_id):
    """
    Return conversation history for a specific session.
    """

    return conversation_histories.get(session_id, [])


def clear_history(session_id):
    """
    Clear conversation history for a specific session.
    """

    if session_id in conversation_histories:
        del conversation_histories[session_id]