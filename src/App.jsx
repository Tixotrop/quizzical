import React from 'react'
import { decode } from "html-entities"
import classNames from 'classnames'
import './App.css'

const NR_OF_QUESTIONS = 5

function App() {
  const [quizData, setQuizData] = React.useState({})
  const [answers, setAnswers] = React.useState(Array(NR_OF_QUESTIONS).fill(""))
  // Summary text from Wikipedia.
  const [summaryText, setSummaryText] = React.useState(Array(NR_OF_QUESTIONS).fill(""))
  const [submitted, setSubmitted] = React.useState(false)
  const [startQuiz, setStartQuiz] = React.useState(false)
  // If summary text should be shown.
  const [showSummaryText, setShowSummaryText] = React.useState(false)

  React.useEffect(() => {
    if (!submitted) {
      fetch(`https://opentdb.com/api.php?amount=${NR_OF_QUESTIONS}&category=22&type=multiple`)
        .then(res => res.json())
        .then(data => setQuizData(
          {
            ...data,
            rndArray: Array.from({ length: NR_OF_QUESTIONS }, () => Math.floor(Math.random() * NR_OF_QUESTIONS))
          }
        ))
    }
  }, [submitted])

  React.useEffect(() => {
    if (submitted) {
      Promise.all(quizData.results.map(r => fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${r.correct_answer}`)
        .then(res => res.json())))
        .then(result => setSummaryText(result))
    }
  }, [submitted])

  return (
    <div className="App">
      {!startQuiz &&
        <StartScreen handleNewGame={handleNewGame} />}
      {startQuiz &&
        <form onSubmit={handleSubmit}>
          {Object.keys(quizData).length > 0 && quizData.results.map((question, i) =>
            <Question key={i} id={i}
              question={question} rnd={quizData.rndArray[i]}
              handleAnswers={handleAnswers}
              submitted={submitted} showSummaryText={showSummaryText}
              summaryText={summaryText[i].extract} />
          )}
          {!submitted ?
            <button className="submit-btn" disabled={!allQuestionAnswered()}>Submit</button>
            : (<div className='try-again-div'>
              <p className="result-text-p">
                {`You scored ${nrOfCorrectAnswers()}/${NR_OF_QUESTIONS} correct answers.`}
              </p>
              <button className="try-again-btn" onClick={handleNewGame} type="button">Try again!</button>
              <button className="info-button" onClick={() => setShowSummaryText(prev => !prev)}>&#128712; detailed answers</button>
            </div>)
          }
        </form>}
    </div>
  )

  // Event-handlers

  function handleAnswers(event) {
    const { name, value } = event.target
    setAnswers(prevAnswers => prevAnswers.map((item, i) => name == i ? value : item))
  }

  function handleSubmit(event) {
    event.preventDefault()
    console.dir(answers)
    setSubmitted(true)
  }

  function handleNewGame() {
    setStartQuiz(true)
    setAnswers(Array(NR_OF_QUESTIONS).fill(""))
    setSubmitted(false)
    setShowSummaryText(false)
  }

  // Helper-fuctions

  function allQuestionAnswered() {
    return answers.filter(a => a !== "").length === NR_OF_QUESTIONS
  }

  function nrOfCorrectAnswers() {
    const correctAnswers = quizData.results.map(r => r.correct_answer)
    return correctAnswers.filter((x, i) => x === answers[i]).length
  }

}

// Functional components could be in own files.

function StartScreen({ handleNewGame }) {
  return (<div className='start--screen'>
    <h1>Quizzical</h1>
    <h3>Topic: geography</h3>
    <button onClick={handleNewGame}>Start quiz</button>
  </div>)
}

function Question({ question, rnd, id, handleAnswers, submitted, showSummaryText, summaryText }) {
  const [selected, setSelected] = React.useState("")

  const alternatives = [...question.incorrect_answers]
  // rnd=index to add item, delete 0 elements, and item to add. 
  alternatives.splice(rnd, 0, question.correct_answer)

  return (
    <>
      <fieldset>
        <legend>{decode(question.question)}</legend>
        <div className="alternatives-for-question">
          {alternatives.map((alt, i) =>
            <button key={i} type="button" name={id}
              onClick={handleClick}
              value={alt} // For state in parent component.
              className={classNames({
                "btn-selected": selected === alt,
                "btn-correct-answer": submitted && alt === question.correct_answer,
                "btn-incorrect-answer": submitted && selected === alt && selected !== question.correct_answer
              })}>
              {decode(alt)}
            </button>)}
        </div>
        {showSummaryText && <p>{summaryText}</p>}
      </fieldset>
      <hr />
    </>
  )

  // Event-handler

  function handleClick(event) {
    setSelected(event.target.value)
    // Parent component keeps an state of users answers.
    handleAnswers(event)
  }
}

export default App
