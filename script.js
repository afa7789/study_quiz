// URLs dos flashcards com múltiplos fallbacks
const LOCAL_FLASHCARDS_URL = './flashcards.json';
const GITHUB_PAGES_URL = 'https://afa7789.github.io/study_quiz/flashcards.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/afa7789/study_quiz/refs/heads/master/flashcards.json';

// Flashcards carregados e estado
let exampleFlashcards = [];
let isFlashcardsLoaded = false; // Flag para indicar se os flashcards foram carregados com sucesso

// --- Funções de UI (Gerenciamento de Visibilidade) ---

/**
 * Atualiza a exibição dos elementos de status de carregamento/informação.
 * Esta é a única função responsável por manipular a visibilidade de #loading-status e #flashcards-info.
 * @param {boolean} isLoading - True se o processo de carregamento está ativo.
 * @param {number} flashcardsCount - Número de flashcards carregados (0 se não carregado ou erro).
 * @param {string} [message='Carregando flashcards...'] - Mensagem a ser exibida no status de carregamento.
 */
function updateLoadingDisplay(isLoading, flashcardsCount = 0, message = 'Carregando flashcards...') {
    const loadingStatus = document.getElementById('loading-status');
    const flashcardsInfo = document.getElementById('flashcards-info');
    const flashcardsCountElement = document.getElementById('flashcards-count');
    const loadingMessageElement = document.getElementById('loading-message');
    const startQuizBtn = document.getElementById('start-quiz-btn');

    // 1. Esconde ambos os elementos para garantir um estado limpo
    if (loadingStatus) {
        loadingStatus.classList.add('hidden');
    }
    if (flashcardsInfo) {
        flashcardsInfo.classList.add('hidden');
    }

    // 2. Decide qual elemento mostrar
    if (isLoading) {
        // Se estiver carregando, mostra o status de carregamento
        if (loadingStatus && loadingMessageElement) {
            loadingMessageElement.textContent = message;
            loadingStatus.classList.remove('hidden');
        }
        startQuizBtn.disabled = true; // Desabilita o botão enquanto carrega
        console.log(`🔄 Estado: Carregando... (${message})`);
    } else if (flashcardsCount > 0) {
        // Se não está carregando E há flashcards carregados, mostra as informações
        if (flashcardsInfo && flashcardsCountElement) {
            flashcardsCountElement.textContent = flashcardsCount;
            flashcardsInfo.classList.remove('hidden');
        }
        startQuizBtn.disabled = false; // Habilita o botão se carregado com sucesso
        console.log(`📊 Estado: ${flashcardsCount} flashcards carregados`);
    } else {
        // Se não está carregando E não há flashcards (erro ou nenhum), ambos ficam escondidos
        startQuizBtn.disabled = true; // Mantém o botão desabilitado
        console.log('🚫 Estado: Nenhum flashcard carregado ou erro.');
    }
}

// --- Funções de Carregamento de Dados ---

/**
 * Carrega os flashcards de uma URL específica.
 * @param {string} url - A URL do arquivo JSON dos flashcards.
 * @param {string} source - Uma string descritiva da fonte (ex: 'arquivo local', 'GitHub Pages').
 * @param {boolean} [silent=false] - Se true, não mostra alertas de sucesso/erro.
 * @returns {Promise<boolean>} - Resolve para true se o carregamento foi bem-sucedido, false caso contrário.
 */
async function loadFlashcardsFromURL(url, source = 'URL', silent = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || !data.every(isValidFlashcard)) {
            throw new Error("Formato de dados inválido ou flashcards inválidos.");
        }

        exampleFlashcards = data;
        isFlashcardsLoaded = true; // Define a flag de sucesso

        // Atualiza a UI para o estado de "carregado"
        updateLoadingDisplay(false, data.length);

        if (!silent) {
            alert(`✅ ${data.length} flashcards carregados com sucesso de ${source}!`);
        }
        return true;

    } catch (error) {
        isFlashcardsLoaded = false; // Define a flag de falha
        console.error(`Erro ao carregar flashcards de ${source}:`, error);
        // Não chamamos updateLoadingDisplay(false, 0) aqui diretamente se for silent
        // para permitir que loadFlashcardsSmartly gerencie o estado final de falha de todos os fallbacks.
        throw error; // Re-lança o erro para ser pego por loadFlashcardsSmartly
    }
}

/**
 * Tenta carregar flashcards de múltiplos fallbacks: local, GitHub Pages, GitHub Raw.
 */
async function loadFlashcardsSmartly() {
    const fallbacks = [
        { url: LOCAL_FLASHCARDS_URL, name: 'arquivo local' },
        { url: GITHUB_PAGES_URL, name: 'GitHub Pages' },
        { url: GITHUB_RAW_URL, name: 'GitHub Raw' }
    ];

    // Inicia o display de carregamento
    updateLoadingDisplay(true, 0, 'Iniciando carregamento de flashcards...');

    for (let i = 0; i < fallbacks.length; i++) {
        const { url, name } = fallbacks[i];
        const isLast = i === fallbacks.length - 1;

        // Atualiza a mensagem do spinner para indicar a fonte atual da tentativa
        const loadingMessageElement = document.getElementById('loading-message');
        if (loadingMessageElement) {
            loadingMessageElement.textContent = `Tentando carregar de ${name}...`;
        }

        try {
            // Tenta carregar. Usamos 'silent=true' para que loadFlashcardsFromURL
            // não chame updateLoadingDisplay (escondendo o spinner) em cada tentativa.
            await loadFlashcardsFromURL(url, name, true); 
            
            // Se chegou aqui, o carregamento foi bem-sucedido.
            // loadFlashcardsFromURL já chamou updateLoadingDisplay para o estado final de sucesso.
            console.log(`✅ Flashcards carregados com sucesso de ${name}`);
            return; // Sai da função, pois carregamos com sucesso
            
        } catch (error) {
            console.log(`❌ Falha ao carregar de ${name}:`, error.message);
            if (isLast) {
                // Se o último fallback falhou, atualiza a UI para indicar erro e mostra um alerta
                updateLoadingDisplay(false, 0); // Define como não carregado
                alert(`❌ Não foi possível carregar os flashcards de nenhuma fonte:\n\n📁 Local: Arquivo não encontrado\n🌐 GitHub Pages: ${GITHUB_PAGES_URL}\n📎 GitHub Raw: ${GITHUB_RAW_URL}\n\n💡 Sugestões:\n• Use "Carregar Arquivo Personalizado" para selecionar um arquivo\n• Verifique sua conexão com a internet\n• Use uma URL personalizada`);
            }
            // Se não é o último, o loop continua para a próxima tentativa
        }
    }
}

/**
 * Carrega os flashcards do arquivo JSON selecionado pelo usuário.
 * @param {Event} event - O evento de mudança do input file.
 */
async function loadFlashcardsFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        // Se nenhum arquivo foi selecionado, restaura o display para o estado atual
        updateLoadingDisplay(false, exampleFlashcards.length); // Assumindo que exampleFlashcards já tenha algum valor
        return;
    }

    // Inicia o display de carregamento
    updateLoadingDisplay(true, 0, `Carregando arquivo ${file.name}...`);
        
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            if (Array.isArray(parsedData) && parsedData.every(isValidFlashcard)) {
                exampleFlashcards = parsedData;
                isFlashcardsLoaded = true;
                
                // Atualiza o display para o estado de "carregado"
                updateLoadingDisplay(false, parsedData.length);
                
                alert(`✅ ${parsedData.length} flashcards carregados com sucesso do arquivo: ${file.name}`);
            } else {
                throw new Error('Formato de arquivo inválido ou flashcards inválidos.');
            }
        } catch (parseError) {
            isFlashcardsLoaded = false;
            // Atualiza o display para o estado de "não carregado/erro"
            updateLoadingDisplay(false, 0, 'Erro ao analisar o JSON do arquivo.');
            alert('❌ Erro ao analisar o JSON do arquivo. Verifique o formato.');
            console.error('Parse error:', parseError);
        }
    };
    reader.onerror = () => {
        isFlashcardsLoaded = false;
        // Atualiza o display para o estado de "não carregado/erro"
        updateLoadingDisplay(false, 0, 'Erro ao ler o arquivo.');
        alert('❌ Erro ao carregar o arquivo.');
        console.error('File reading error:', reader.error);
    };
    reader.readAsText(file);
}

// --- Funções de Validação ---

/**
 * Verifica se um objeto tem a estrutura mínima de um flashcard.
 * @param {Object} flashcard - O objeto a ser validado.
 * @returns {boolean} - True se for um flashcard válido, false caso contrário.
 */
function isValidFlashcard(flashcard) {
    return (
        typeof flashcard.pergunta === 'string' &&
        typeof flashcard.resposta_certa === 'string' &&
        typeof flashcard.respostas === 'object' &&
        Object.keys(flashcard.respostas).length > 0
    );
}

// --- Funções do Quiz ---

let quizFlashcards = []; // Flashcards selecionados para o quiz atual
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let wrongQuestions = [];
let quizStartTime;
let questionStartTime;
let totalQuizTime = 0;
let questionTimes = []; // Armazena o tempo gasto em cada pergunta

// Variáveis dos elementos HTML
let setupSection;
let quizSection;
let resultsSection;
let flashcardFileInput;
let numQuestionsInput;
let startQuizBtn;
let nextQuestionBtn;
let restartQuizBtn;
let questionCounterSpan;
let timerSpan;
let flashcardQuestionH3;
let flashcardOptionsDiv;
let correctAnswersCountSpan;
let totalTimeSpan;
let averageTimeSpan;
let wrongQuestionsList;
let loadFromUrlBtn;
let customUrlInput;
let quizModeSelect;

// --- Event Listeners e Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // Seleção dos elementos HTML
    setupSection = document.getElementById('setup-section');
    quizSection = document.getElementById('quiz-section');
    resultsSection = document.getElementById('results-section');

    flashcardFileInput = document.getElementById('flashcard-file');
    numQuestionsInput = document.getElementById('num-questions');
    startQuizBtn = document.getElementById('start-quiz-btn');
    nextQuestionBtn = document.getElementById('next-question-btn');
    restartQuizBtn = document.getElementById('restart-quiz-btn');

    questionCounterSpan = document.getElementById('question-counter');
    timerSpan = document.getElementById('timer');
    flashcardQuestionH3 = document.getElementById('flashcard-question');
    flashcardOptionsDiv = document.getElementById('flashcard-options');

    correctAnswersCountSpan = document.getElementById('correct-answers-count');
    totalTimeSpan = document.getElementById('total-time');
    averageTimeSpan = document.getElementById('average-time');
    wrongQuestionsList = document.getElementById('wrong-questions-list');

    const loadSmartBtn = document.getElementById('load-smart-btn');
    loadFromUrlBtn = document.getElementById('load-from-url-btn');
    customUrlInput = document.getElementById('custom-url');
    quizModeSelect = document.getElementById('quiz-mode');

    // Event Listeners
    if (loadSmartBtn) {
        loadSmartBtn.addEventListener('click', loadFlashcardsSmartly);
    }

    if (loadFromUrlBtn && customUrlInput) {
        loadFromUrlBtn.addEventListener('click', () => {
            const url = customUrlInput.value.trim();
            if (!url) {
                alert('❌ Por favor, insira uma URL válida');
                return;
            }
            loadFlashcardsFromURL(url, 'URL personalizada');
        });
    }

    if (customUrlInput) {
        customUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadFromUrlBtn.click();
            }
        });
    }

    if (flashcardFileInput) {
        flashcardFileInput.addEventListener('change', loadFlashcardsFromFile);
    }
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startQuiz);
    }
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', nextQuestion);
    }
    if (restartQuizBtn) {
        restartQuizBtn.addEventListener('click', showSetupSection);
    }
    
    // Inicializa o estado da UI (todos escondidos por padrão)
    // E inicia o carregamento automático dos flashcards.
    updateLoadingDisplay(false, 0); // Garante que tudo começa escondido
    loadFlashcardsSmartly(); // Inicia o carregamento automático no início
    
    showSetupSection(); // Garante que a seção de configuração esteja visível
});

// --- Funções de Seleção de Flashcards ---

/**
 * Seleciona flashcards baseado no modo escolhido.
 * @param {number} num - Número de flashcards (0 para todas).
 * @param {string} mode - Modo de seleção: 'random', 'sequential', 'priority'.
 * @returns {Array} - Array de flashcards selecionados.
 */
function selectFlashcards(num, mode = 'random') {
    const source = exampleFlashcards;
    const totalQuestions = num === 0 ? source.length : Math.min(num, source.length);
    
    if (totalQuestions === 0) return [];
    
    let selected = [];
    
    switch (mode) {
        case 'sequential':
            selected = source.slice(0, totalQuestions);
            break;
            
        case 'priority':
            // TODO: Implementar lógica de prioridade (ex: baseada em wrongQuestions de sessões anteriores)
            // Por enquanto, implementa como aleatório
            selected = shuffleArray([...source]).slice(0, totalQuestions);
            break;
            
        case 'random':
        default:
            selected = shuffleArray([...source]).slice(0, totalQuestions);
            break;
    }
    
    return selected;
}

/**
 * Embaralha um array usando o algoritmo Fisher-Yates.
 * @param {Array} array - O array a ser embaralhado.
 * @returns {Array} - Um novo array embaralhado.
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Exibe a seção de configuração do quiz e esconde as outras.
 */
function showSetupSection() {
    setupSection.classList.remove('hidden');
    quizSection.classList.add('hidden');
    resultsSection.classList.add('hidden');

    // Ao voltar para a setup section, garanta que o status de carregamento/info seja restaurado
    // com base no estado atual dos flashcards.
    updateLoadingDisplay(false, exampleFlashcards.length); 
}

/**
 * Inicializa o quiz.
 */
function startQuiz() {
    const numQuestions = parseInt(numQuestionsInput.value, 10);
    const quizMode = quizModeSelect ? quizModeSelect.value : 'random';

    if (isNaN(numQuestions) || numQuestions < 0) {
        alert('Por favor, insira um número válido de perguntas (0 para todas).');
        return;
    }
    
    if (!isFlashcardsLoaded || exampleFlashcards.length === 0) {
        alert('❌ Nenhum flashcard carregado. Por favor, carregue flashcards primeiro.');
        return;
    }

    quizFlashcards = selectFlashcards(numQuestions, quizMode);
    if (quizFlashcards.length === 0) {
        alert('Não foi possível selecionar perguntas. Verifique se há flashcards disponíveis.');
        return;
    }

    // Resetar estado do quiz
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    wrongQuestions = [];
    questionTimes = [];
    totalQuizTime = 0;
    quizStartTime = Date.now();

    // Mostrar seção do quiz
    if (setupSection) setupSection.classList.add('hidden');
    if (quizSection) quizSection.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');

    displayCurrentFlashcard();
    startQuizTimerDisplay();
}

/**
 * Exibe o flashcard da pergunta atual.
 */
function displayCurrentFlashcard() {
    const flashcard = quizFlashcards[currentQuestionIndex];
    if (!flashcard) {
        endQuiz();
        return;
    }

    questionStartTime = Date.now();

    flashcardQuestionH3.textContent = flashcard.pergunta;
    flashcardOptionsDiv.innerHTML = '';

    for (const key in flashcard.respostas) {
        const optionText = flashcard.respostas[key];
        const button = document.createElement('button');
        button.classList.add('flashcard-option-btn');
        button.dataset.answerKey = key;
        button.innerHTML = `<span>${key}:</span> ${optionText}`;
        button.addEventListener('click', handleAnswerClick);
        flashcardOptionsDiv.appendChild(button);
    }

    questionCounterSpan.textContent = `Pergunta ${currentQuestionIndex + 1}/${quizFlashcards.length}`;
    nextQuestionBtn.disabled = true;
}

/**
 * Lida com o clique em uma opção de resposta.
 * @param {Event} event - O evento de clique.
 */
function handleAnswerClick(event) {
    const selectedButton = event.currentTarget;
    const userAnswer = selectedButton.dataset.answerKey;
    const currentFlashcard = quizFlashcards[currentQuestionIndex];
    const correctAnswer = currentFlashcard.resposta_certa;

    const timeSpent = Date.now() - questionStartTime;
    questionTimes.push(timeSpent);

    Array.from(flashcardOptionsDiv.children).forEach(btn => {
        btn.disabled = true;
        btn.classList.add('selected');
    });

    if (userAnswer === correctAnswer) {
        correctAnswersCount++;
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
        wrongQuestions.push({
            question: currentFlashcard.pergunta,
            userAnswer: currentFlashcard.respostas[userAnswer],
            correctAnswer: currentFlashcard.respostas[correctAnswer]
        });

        Array.from(flashcardOptionsDiv.children).forEach(btn => {
            if (btn.dataset.answerKey === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }
    nextQuestionBtn.disabled = false;
}

/**
 * Avança para a próxima pergunta ou termina o quiz.
 */
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizFlashcards.length) {
        displayCurrentFlashcard();
    } else {
        endQuiz();
    }
}

/**
 * Finaliza o quiz e exibe os resultados.
 */
function endQuiz() {
    totalQuizTime = Date.now() - quizStartTime;

    quizSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    correctAnswersCountSpan.textContent = `${correctAnswersCount} de ${quizFlashcards.length}`;
    totalTimeSpan.textContent = formatTime(totalQuizTime);

    const totalTimeSpentOnQuestions = questionTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = questionTimes.length > 0 ? totalTimeSpentOnQuestions / questionTimes.length : 0;
    averageTimeSpan.textContent = formatTime(averageTime);

    wrongQuestionsList.innerHTML = '';
    if (wrongQuestions.length === 0) {
        wrongQuestionsList.innerHTML = '<li>Parabéns! Você não errou nenhuma pergunta.</li>';
    } else {
        wrongQuestions.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <p><strong>Pergunta:</strong> ${item.question}</p>
                <p>Sua Resposta: <span>${item.userAnswer}</span></p>
                <p>Resposta Correta: <span>${item.correctAnswer}</span></p>
            `;
            wrongQuestionsList.appendChild(li);
        });
    }
}

/**
 * Formata um tempo em milissegundos para MM:SS.
 * @param {number} ms - Tempo em milissegundos.
 * @returns {string} - Tempo formatado como MM:SS.
 */
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Timer global do quiz (exibição)
let quizTimerInterval;

function startQuizTimerDisplay() {
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(() => {
        const elapsed = Date.now() - quizStartTime;
        const timerSpan = document.getElementById('timer');
        if (timerSpan) {
            timerSpan.textContent = `Tempo: ${formatTime(elapsed)}`;
        }
    }, 1000);
}