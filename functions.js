document.addEventListener('DOMContentLoaded', function() {
    const answers = document.querySelectorAll('.answer');
    const currentQuestionElem = document.getElementById('current-question');
    const themeElem = document.querySelector('.theme-box');
    const questionBox = document.querySelector('.question-box');
    
    // データ構造の初期化
    const themeGroups = {};
    let currentThemeId = '';
    let currentQuestionId = '';
    let currentAnswerIndex = 0;
    let totalAnswers = 0;
    let answersInCurrentTheme = 0;

    // 回答をテーマと質問でグループ化
    answers.forEach(answer => {
        const themeId = answer.dataset.themeId;
        const questionId = answer.dataset.questionId;
        
        if (!themeGroups[themeId]) {
            themeGroups[themeId] = {
                theme: answer.dataset.theme,
                questions: {},
                totalAnswers: 0
            };
        }
        
        if (!themeGroups[themeId].questions[questionId]) {
            themeGroups[themeId].questions[questionId] = {
                question: answer.dataset.question,
                answers: [],
                startIndex: themeGroups[themeId].totalAnswers
            };
        }
        
        themeGroups[themeId].questions[questionId].answers.push(answer);
        themeGroups[themeId].totalAnswers++;
        totalAnswers++;
    });

    function calculateCurrentPosition() {
        const scrollPosition = window.scrollY;
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollPosition / totalScroll;
        return Math.min(Math.floor(progress * totalAnswers), totalAnswers - 1);
    }

    function findCurrentPosition(position) {
        let count = 0;
        for (const themeId in themeGroups) {
            const theme = themeGroups[themeId];
            if (count + theme.totalAnswers > position) {
                // テーマ内の位置を特定
                let themePosition = position - count;
                for (const questionId in theme.questions) {
                    const question = theme.questions[questionId];
                    const answersLength = question.answers.length;
                    if (question.startIndex + answersLength > themePosition) {
                        return {
                            themeId,
                            questionId,
                            answerIndex: themePosition - question.startIndex,
                            totalAnswersInTheme: theme.totalAnswers,
                            themePosition: themePosition
                        };
                    }
                }
            }
            count += theme.totalAnswers;
        }
        // 最後の位置を返す
        const lastThemeId = Object.keys(themeGroups).pop();
        const lastTheme = themeGroups[lastThemeId];
        const lastQuestionId = Object.keys(lastTheme.questions).pop();
        return {
            themeId: lastThemeId,
            questionId: lastQuestionId,
            answerIndex: lastTheme.questions[lastQuestionId].answers.length - 1,
            totalAnswersInTheme: lastTheme.totalAnswers,
            themePosition: lastTheme.totalAnswers - 1
        };
    }

    async function updateTheme(newThemeId) {
        if (currentThemeId !== newThemeId) {
            themeElem.classList.add('fade-out');
            await new Promise(resolve => setTimeout(resolve, 300));
            themeElem.textContent = themeGroups[newThemeId].theme;
            themeElem.classList.remove('fade-out');
            themeElem.classList.add('fade-in');
            currentThemeId = newThemeId;

            // 前のテーマの回答をクリーンアップ
            answers.forEach(answer => {
                if (answer.dataset.themeId !== newThemeId) {
                    answer.classList.remove('active', 'stacked');
                    answer.classList.add('hidden');
                }
            });
        }
    }

    async function updateQuestion(themeId, questionId) {
        if (currentQuestionId !== questionId) {
            questionBox.classList.add('fade-out');
            await new Promise(resolve => setTimeout(resolve, 200));
            currentQuestionElem.textContent = themeGroups[themeId].questions[questionId].question;
            questionBox.classList.remove('fade-out');
            questionBox.classList.add('fade-in');
            currentQuestionId = questionId;
        }
    }

    async function updateAnswers() {
        const currentPosition = calculateCurrentPosition();
        const { themeId, questionId, themePosition, totalAnswersInTheme } = findCurrentPosition(currentPosition);

        // テーマとセクションの更新
        await updateTheme(themeId);
        await updateQuestion(themeId, questionId);

        // 現在のテーマのすべての回答を取得
        const currentTheme = themeGroups[themeId];
        const allThemeAnswers = [];
        
        for (const qId in currentTheme.questions) {
            allThemeAnswers.push(...currentTheme.questions[qId].answers);
        }

        // すべての回答の状態をリセット
        answers.forEach(answer => {
            if (answer.dataset.themeId !== themeId) {
                answer.classList.remove('active', 'stacked', 'hidden');
                answer.style.setProperty('--stack-offset', '0px');
                answer.classList.add('hidden');
            }
        });

        // 現在のテーマの回答を更新
        allThemeAnswers.forEach((answer, index) => {
            answer.classList.remove('active', 'stacked', 'hidden');
            
            if (index === themePosition) {
                answer.classList.add('active');
            } else if (index < themePosition) {
                answer.classList.add('stacked');
                const stackOffset = (themePosition - index) * 80;
                answer.style.setProperty('--stack-offset', `${stackOffset}px`);
            } else {
                answer.classList.add('hidden');
            }
        });

        currentAnswerIndex = themePosition;
    }

    // 初期状態の設定
    function initializeAnswers() {
        const firstThemeId = Object.keys(themeGroups)[0];
        const firstTheme = themeGroups[firstThemeId];
        const firstQuestionId = Object.keys(firstTheme.questions)[0];
        
        themeElem.textContent = firstTheme.theme;
        currentQuestionElem.textContent = firstTheme.questions[firstQuestionId].question;

        const firstAnswer = firstTheme.questions[firstQuestionId].answers[0];
        answers.forEach(answer => {
            if (answer === firstAnswer) {
                answer.classList.add('active');
            } else {
                answer.classList.add('hidden');
            }
        });

        currentThemeId = firstThemeId;
        currentQuestionId = firstQuestionId;
    }

    // 初期化
    initializeAnswers();

    // スクロールイベントの最適化
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                updateAnswers();
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // リサイズ対応
    window.addEventListener('resize', updateAnswers);
});