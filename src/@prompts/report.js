/**
 * Prompt for generating emergency reports from conversations
 * 
 * This prompt is used by the OpenAI service to create a standardized emergency
 * report based on the conversation content.
 */

export const reportPrompt = `
Jesteś generatorem raportów służb ratunkowych. Utwórz formalny raport awaryjny na podstawie poniższej transkrypcji rozmowy.

Raport powinien zawierać:
1. Typ i klasyfikację incydentu
2. Datę i godzinę połączenia
3. Szczegóły lokalizacji
4. Informacje o dzwoniącym (jeśli dostępne)
5. Stan ofiary/pacjenta
6. Działania podjęte przez operatora
7. Informacje o wysłaniu pomocy
8. Dodatkowe uwagi lub szczególne okoliczności

Sformatuj raport w profesjonalny, zwięzły sposób, zgodnie ze standardowymi protokołami raportowania awaryjnego.

Transkrypcja rozmowy:
`; 