const SUPABASE_URL = "https://mempgofrjpetixzcdltv.supabase.co";
const SUPABASE_KEY = "sb_publishable_p8zcHXDOjzWNX8-IoZpPUg_LPfYU_hp";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let questions = [];
let currentQuestion = 0;
let score = 0;
let selectedAnswer = null;
let userAnswers = [];

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const questionNumberElement =
    document.getElementById("question-number");
const scoreElement = document.getElementById("score");
const nextButton = document.getElementById("next-btn");

async function loadQuestions() {

    const { data, error } = await supabaseClient
        .from("questions")
        .select("*")
        .order("id");

    if (error) {
        console.error(error);
        alert("Could not load questions from the cloud.");
        return;
    }

    questions = data;

    if (questions.length === 0) {
        alert("No questions were found.");
        return;
    }

    loadQuestion();
}

function loadQuestion() {

    selectedAnswer = null;

    const current = questions[currentQuestion];

    questionElement.textContent = current.question;

    questionNumberElement.textContent =
        `Question ${currentQuestion + 1} of ${questions.length}`;

    optionsElement.innerHTML = "";

    const options = [
        current.option_a,
        current.option_b,
        current.option_c,
        current.option_d
    ];

    options.forEach(option => {

        const button = document.createElement("button");

        button.textContent = option;
        button.classList.add("option");

        button.onclick = function () {
            selectAnswer(button, option);
        };

        optionsElement.appendChild(button);
    });
}

function selectAnswer(button, answer) {

    document.querySelectorAll(".option").forEach(option => {
        option.classList.remove("selected");
    });

    button.classList.add("selected");

    selectedAnswer = answer;
}

nextButton.addEventListener("click", async function () {

    if (selectedAnswer === null) {
        alert("Please select an answer.");
        return;
    }

    userAnswers.push(selectedAnswer);

    if (selectedAnswer === questions[currentQuestion].correct_answer) {
        score++;
    }

    currentQuestion++;

    if (currentQuestion < questions.length) {

        scoreElement.textContent = `Score: ${score}`;

        loadQuestion();

    } else {

        await showResult();
    }
});

async function showResult() {

    document.getElementById("quiz-container")
        .classList.add("hidden");

    document.getElementById("result-container")
        .classList.remove("hidden");

    document.getElementById("final-score").textContent =
        `Your score is ${score} out of ${questions.length}.`;
    const answersReview = document.getElementById("answers-review");
    answersReview.innerHTML = "<h3>Answer Review</h3>";
    questions.forEach((question, index) => {
        const review = document.createElement("div");
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correct_answer;
        const isCorrect = userAnswer === correctAnswer;
        review.classList.add("answer-review");
        review.innerHTML = `
            <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
            <p>Your answer: <span>${userAnswer}</span></p>
            <p>Correct answer: <strong>${correctAnswer}</strong></p>
            <p class="answer-status">
                ${isCorrect ? "Correct" : "Incorrect"}
            </p>
        `;

        answersReview.appendChild(review);
    });
    const studentName =
        prompt("Enter your name to save your score:");

    if (studentName) {

        const { error } = await supabaseClient
            .from("scores")
            .insert({
                student_name: studentName,
                score: score,
                total_questions: questions.length
            });

        if (error) {

            console.error(error);

            alert("Your score could not be saved.");

        } else {

            alert("Your score has been saved to the cloud.");

            loadLeaderboard();
        }
    }
}

async function loadLeaderboard() {

    const leaderboard = document.getElementById("leaderboard");

    leaderboard.innerHTML = "Loading leaderboard...";

    const { data, error } = await supabaseClient
        .from("scores")
        .select("*")
        .order("score", { ascending: false });

    if (error) {

        console.error(error);

        leaderboard.innerHTML =
            "Could not load leaderboard.";

        return;
    }

    leaderboard.innerHTML = "";

    if (data.length === 0) {

        leaderboard.innerHTML =
            "No scores available yet.";

        return;
    }

    const header = document.createElement("div");

    header.classList.add(
        "leaderboard-row",
        "leaderboard-header"
    );

    header.innerHTML = `
        <span>Student</span>
        <span>Score</span>
    `;

    leaderboard.appendChild(header);

    data.forEach(result => {

        const row = document.createElement("div");

        row.classList.add("leaderboard-row");

        row.innerHTML = `
            <span>${result.student_name}</span>
            <span>${result.score}/${result.total_questions}</span>
        `;

        leaderboard.appendChild(row);
    });
}

function restartQuiz() {

    currentQuestion = 0;
    score = 0;

    document.getElementById("quiz-container")
        .classList.remove("hidden");

    document.getElementById("result-container")
        .classList.add("hidden");

    scoreElement.textContent = "Score: 0";

    loadQuestion();
}

loadQuestions();