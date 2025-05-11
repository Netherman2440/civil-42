/**
 * Prompt for generating emergency reports from conversations
 * 
 * This function creates a prompt for the OpenAI service to generate
 * a structured JSON report based on the conversation content.
 * 
 * @param {string} transcript - The conversation transcript to analyze
 * @param {object} currentReport - The existing report data (if any)
 * @returns {string} The complete prompt with the transcript
 */

export function createReportPrompt(transcript, currentReport = null) {
  const currentReportJSON = currentReport ? JSON.stringify(currentReport, null, 2) : '{}';
  
  return `
Jesteś analizatorem zgłoszeń alarmowych. Utwórz obiekt JSON na podstawie poniższej transkrypcji rozmowy.

Obiekt JSON powinien zawierać następujące pola:
- reason: Krótki opis powodu zgłoszenia alarmowego (max kilka słów)
- place: Lokalizacja zdarzenia (jak najdokładniejszy adres)
- victims: Krótka informacja o poszkodowanych osobach i ich stanach
- important_level: Liczba całkowita od 1 do 5 określająca ważność zgłoszenia

Skala ważności:
1: Nie jest to sytuacja alarmowa, żart lub pomyłka
2-3: Sytuacje nie zagrażające życiu lub sprawy dla innych służb
4-5: Krytyczne sytuacje wymagające natychmiastowej uwagi operatora

WAŻNE: Otrzymujesz aktualny raport w formacie JSON. Jeśli jakiekolwiek pole w tym raporcie nie jest puste, NIE generuj nowej wartości dla tego pola, tylko ZACHOWAJ istniejącą wartość lub uzupełnij ją o dodatkowe informacje, jeśli to konieczne.

Aktualny raport:
${currentReportJSON}

Zwróć TYLKO poprawny obiekt JSON z tymi polami, bez dodatkowego tekstu.

Transkrypcja:
${transcript}
`;
} 