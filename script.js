// URLs dos flashcards
const GITHUB_FLASHCARDS_URL = 'https://raw.githubusercontent.com/afa7789/study_quiz/refs/heads/master/flashcards.json';
const LOCAL_FLASHCARDS_URL = './flashcards.json';

// Carrega flashcards padrão ao inicializar
let exampleFlashcards = [];
let isFlashcardsLoaded = false;

// Função para carregar flashcards de uma URL
async function loadFlashcardsFromURL(url, source = 'URL') {
    try {
        showLoadingStatus(`Carregando flashcards de ${source}...`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || !data.every(isValidFlashcard)) {
            throw new Error('Formato de dados inválido');
        }
        
        exampleFlashcards = data;
        isFlashcardsLoaded = true;
        
        hideLoadingStatus();
        showFlashcardsInfo(data.length);
        enableStartButton();
        
        alert(`✅ ${data.length} flashcards carregados com sucesso de ${source}!`);
        
    } catch (error) {
        hideLoadingStatus();
        console.error('Erro ao carregar flashcards:', error);
        alert(`❌ Erro ao carregar flashcards de ${source}: ${error.message}`);
    }
}

// Carrega flashcards locais por padrão (silenciosamente)
loadFlashcardsFromURL(LOCAL_FLASHCARDS_URL, 'arquivo local')
    .catch(() => {
        console.log('Arquivo local não encontrado, aguardando seleção manual...');
    });


let allFlashcards = []; // Armazenará todos os flashcards disponíveis
let quizFlashcards = []; // Flashcards selecionados para o quiz atual
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let wrongQuestions = [];
let quizStartTime;
let questionStartTime;
let totalQuizTime = 0;
let questionTimes = []; // Armazena o tempo gasto em cada pergunta

// Referências aos elementos HTML
// const setupSection = document.getElementById('setup-section');
// const quizSection = document.getElementById('quiz-section');
// const resultsSection = document.getElementById('results-section');


// const flashcardFileInput = document.getElementById('flashcard-file');
// const numQuestionsInput = document.getElementById('num-questions');
// const startQuizBtn = document.getElementById('start-quiz-btn');
// const nextQuestionBtn = document.getElementById('next-question-btn');
// const restartQuizBtn = document.getElementById('restart-quiz-btn');

// const questionCounterSpan = document.getElementById('question-counter');
// const timerSpan = document.getElementById('timer');
// const flashcardQuestionH3 = document.getElementById('flashcard-question');
// const flashcardOptionsDiv = document.getElementById('flashcard-options');

// const correctAnswersCountSpan = document.getElementById('correct-answers-count');
// const totalTimeSpan = document.getElementById('total-time');
// const averageTimeSpan = document.getElementById('average-time');
// const wrongQuestionsList = document.getElementById('wrong-questions-list');


// **MOVA ESTAS VARIÁVEIS PARA DENTRO DO DOMContentLoaded**
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

// Novos elementos
let loadDefaultBtn;
let loadFromGithubBtn;
let loadFromUrlBtn;
let customUrlInput;
let loadingStatus;
let loadingMessage;
let flashcardsInfo;
let flashcardsCount;
let quizModeSelect;

// Funções de interface
function showLoadingStatus(message) {
    if (loadingStatus && loadingMessage) {
        loadingMessage.textContent = message;
        loadingStatus.classList.remove('hidden');
    }
}

function hideLoadingStatus() {
    if (loadingStatus) {
        loadingStatus.classList.add('hidden');
    }
}

function showFlashcardsInfo(count) {
    if (flashcardsInfo && flashcardsCount) {
        flashcardsCount.textContent = count;
        flashcardsInfo.classList.remove('hidden');
    }
}

function enableStartButton() {
    if (startQuizBtn) {
        startQuizBtn.disabled = false;
    }
}

function disableStartButton() {
    if (startQuizBtn) {
        startQuizBtn.disabled = true;
    }
}


// --- Event Listeners e Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // **COMECE AQUI A SELEÇÃO DOS ELEMENTOS HTML**
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

    // Novos elementos
    loadDefaultBtn = document.getElementById('load-default-btn');
    loadFromGithubBtn = document.getElementById('load-from-github-btn');
    loadFromUrlBtn = document.getElementById('load-from-url-btn');
    customUrlInput = document.getElementById('custom-url');
    loadingStatus = document.getElementById('loading-status');
    loadingMessage = document.getElementById('loading-message');
    flashcardsInfo = document.getElementById('flashcards-info');
    flashcardsCount = document.getElementById('flashcards-count');
    quizModeSelect = document.getElementById('quiz-mode');

    // Event Listeners
    if (loadDefaultBtn) {
        loadDefaultBtn.addEventListener('click', () => {
            loadFlashcardsFromURL(LOCAL_FLASHCARDS_URL, 'flashcards padrão');
        });
    }

    if (loadFromGithubBtn) {
        loadFromGithubBtn.addEventListener('click', () => {
            loadFlashcardsFromURL(GITHUB_FLASHCARDS_URL, 'GitHub');
        });
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

    // Event listener para Enter na URL
    if (customUrlInput) {
        customUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadFromUrlBtn.click();
            }
        });
    }
    // **E OS EVENT LISTENERS TAMBÉM**
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

    // Inicialização
    if (isFlashcardsLoaded) {
        showFlashcardsInfo(exampleFlashcards.length);
        enableStartButton();
    } else {
        disableStartButton();
    }
    
    showSetupSection();
});

// --- Funções de Inicialização e Carregamento ---

/**
 * Carrega os flashcards do arquivo JSON selecionado pelo usuário.
 * @param {Event} event - O evento de mudança do input file.
 */
async function loadFlashcardsFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    try {
        showLoadingStatus(`Carregando arquivo ${file.name}...`);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsedData = JSON.parse(e.target.result);
                if (Array.isArray(parsedData) && parsedData.every(isValidFlashcard)) {
                    exampleFlashcards = parsedData;
                    isFlashcardsLoaded = true;
                    
                    hideLoadingStatus();
                    showFlashcardsInfo(parsedData.length);
                    enableStartButton();
                    
                    alert(`✅ ${parsedData.length} flashcards carregados com sucesso do arquivo: ${file.name}`);
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (parseError) {
                hideLoadingStatus();
                alert('❌ Erro ao analisar o JSON do arquivo. Verifique o formato.');
                console.error('Parse error:', parseError);
            }
        };
        reader.readAsText(file);
    } catch (error) {
        hideLoadingStatus();
        alert('❌ Erro ao carregar o arquivo.');
        console.error('File loading error:', error);
    }
}

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

/**
 * Seleciona um número X de perguntas aleatórias dos flashcards disponíveis.
 * Se X for 0, seleciona todas as perguntas.
 * @param {number} num - O número de perguntas a serem selecionadas.
 * @returns {Array} - Um array de flashcards selecionados aleatoriamente.
 */
/**
 * Seleciona flashcards baseado no modo escolhido
 * @param {number} num - Número de flashcards (0 para todos)
 * @param {string} mode - Modo de seleção: 'random', 'sequential', 'priority'
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
            // Prioriza perguntas que foram erradas antes (se houver histórico)
            // Por agora, implementa como aleatório
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
 * Embaralha um array usando o algoritmo Fisher-Yates
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Manter função antiga para compatibilidade
function selectRandomFlashcards(num) {
    return selectFlashcards(num, 'random');
}
    if (num === 0 || num >= allFlashcards.length) {
        // Se 0 ou mais do que o total, usa todos os flashcards e os embaralha
        return shuffleArray([...allFlashcards]);
    }

    // Caso contrário, seleciona um número específico de flashcards aleatórios
    const shuffled = shuffleArray([...allFlashcards]);
    return shuffled.slice(0, num);
}

/**
 * Embaralha um array usando o algoritmo de Fisher-Yates.
 * @param {Array} array - O array a ser embaralhado.
 * @returns {Array} - O array embaralhado.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Exibe a seção de configuração do quiz e esconde as outras.
 */
function showSetupSection() {
    setupSection.classList.remove('hidden');
    quizSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

/**
 * Inicializa o quiz.
 * Pega o número de perguntas, seleciona os flashcards e exibe a primeira pergunta.
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

    // Seleciona flashcards baseado no modo
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
        endQuiz(); // Se não há mais flashcards, termina o quiz
        return;
    }

    questionStartTime = Date.now(); // Inicia o timer para a pergunta atual

    flashcardQuestionH3.textContent = flashcard.pergunta;
    flashcardOptionsDiv.innerHTML = ''; // Limpa opções anteriores

    // Cria os botões de opção
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
    nextQuestionBtn.disabled = true; // Desabilita o botão "Próxima Pergunta" até uma resposta ser selecionada
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

    // Calcula o tempo gasto na pergunta
    const timeSpent = Date.now() - questionStartTime;
    questionTimes.push(timeSpent);

    // Desabilita todos os botões de opção após uma seleção
    Array.from(flashcardOptionsDiv.children).forEach(btn => {
        btn.disabled = true;
        btn.classList.add('selected'); // Adiciona classe para desativar hover e indicar seleção
    });

    if (userAnswer === correctAnswer) {
        correctAnswersCount++;
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
        // Adiciona a pergunta errada à lista para exibição nos resultados
        wrongQuestions.push({
            question: currentFlashcard.pergunta,
            userAnswer: currentFlashcard.respostas[userAnswer],
            correctAnswer: currentFlashcard.respostas[correctAnswer]
        });

        // Opcional: Destaca a resposta correta mesmo se o usuário errou
        Array.from(flashcardOptionsDiv.children).forEach(btn => {
            if (btn.dataset.answerKey === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }
    nextQuestionBtn.disabled = false; // Habilita o botão "Próxima Pergunta"
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
    totalQuizTime = Date.now() - quizStartTime; // Calcula o tempo total do quiz

    quizSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    correctAnswersCountSpan.textContent = `${correctAnswersCount} de ${quizFlashcards.length}`;
    totalTimeSpan.textContent = formatTime(totalQuizTime);

    const totalTimeSpentOnQuestions = questionTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = questionTimes.length > 0 ? totalTimeSpentOnQuestions / questionTimes.length : 0;
    averageTimeSpan.textContent = formatTime(averageTime);

    // Exibe as perguntas erradas
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

// --- Event Listeners ---
// ... (seus dados exampleFlashcards e outras variáveis globais) ...


// ... (o resto das suas funções como loadFlashcardsFromFile, startQuiz, etc., podem ficar fora,
// desde que as variáveis que elas acessam tenham sido inicializadas dentro do DOMContentLoaded) ...

// Inicialização: carrega os flashcards de exemplo ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    allFlashcards = [...exampleFlashcards];
    numQuestionsInput.value = Math.min(5, allFlashcards.length); // Define um número inicial de perguntas
    showSetupSection();
});

// Timer global do quiz (exibição)
let quizTimerInterval;
function startQuizTimerDisplay() {
    clearInterval(quizTimerInterval); // Limpa qualquer timer anterior
    quizTimerInterval = setInterval(() => {
        const elapsed = Date.now() - quizStartTime;
        timerSpan.textContent = `Tempo: ${formatTime(elapsed)}`;
    }, 1000); // Atualiza a cada segundo
}
// Ajuste para iniciar o timer na função startQuiz
const originalStartQuiz = startQuiz;
startQuiz = () => {
    originalStartQuiz();
    startQuizTimerDisplay(); // Inicia a exibição do timer ao começar o quiz
};
// Ajuste para parar o timer na função endQuiz
const originalEndQuiz = endQuiz;
endQuiz = () => {
    clearInterval(quizTimerInterval); // Para a exibição do timer ao finalizar
    originalEndQuiz();
};