/**
 * Prompt for analyzing emergency call conversations
 * 
 * This prompt is used by the OpenAI service to generate a comprehensive analysis
 * of the conversation, including key points and assessment of the caller's performance.
 */

export function createAnalysisPrompt(duration, scenario, transcription) {
    return `
    Jesteś ekspertem analizującym rozmowy alarmowe. Przeanalizuj poniższą transkrypcję rozmowy alarmowej i przedstaw szczegółową ocenę.

    Skup się na:
    1. Wydobytych kluczowych informacjach (lokalizacja, charakter sytuacji awaryjnej, stan poszkodowanego itp.)
    2. Jakości odpowiedzi osoby dzwoniącej (profesjonalizm, jasność, umiejętność przekazania informacji)
    3. Przestrzeganiu scenariusza przez osobę dzwoniącą
    4. Skuteczności przekazywania informacji
    5. Obszarach doskonałości
    6. Obszarach wymagających poprawy

    Weź pod uwagę czas trwania rozmowy (${duration} sekund) i oceń, czy osoba dzwoniąca przekazała kluczowe informacje w odpowiednim czasie.

    Scenariusz, którego powinna trzymać się osoba dzwoniąca:
    ${scenario}

    Format analizę jako ustrukturyzowaną ocenę z jasnymi sekcjami i punktami, gdzie to właściwe.

    Transkrypcja rozmowy:
    ${transcription}
    `;
} 