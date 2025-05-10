/**
 * Prompt for automatically generating a title for a conversation
 * 
 * This prompt is used by the OpenAI service to generate a descriptive title
 * based on the conversation content.
 */



export function createAutoTitlePrompt(transcription) {
    return `
    Jesteś asystentem, który tworzy zwięzłe, opisowe tytuły dla rozmów alarmowych.

    Na podstawie transkrypcji rozmowy alarmowej między operatorem a dzwoniącym:
    1. Utwórz krótki, informacyjny tytuł (maksymalnie 4 słowa)
    2. Tytuł powinien ujmować główną sytuację awaryjną lub problem
    3. Uwzględnij istotne szczegóły, takie jak lokalizacja lub powaga sytuacji, tylko jeśli są kluczowe
    4. Format powinien być jasny i profesjonalny

    Przykładowy format: "Zawał w Biurowcu" lub "Dziecko w Zamkniętym Samochodzie"

    Transkrypcja rozmowy:
    ${transcription}
    `;
} 