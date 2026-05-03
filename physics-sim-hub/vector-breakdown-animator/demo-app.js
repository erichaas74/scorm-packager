import { VectorBreakdownAnimator } from './vector-breakdown-animator.js';
import { TrigCoach, DEFAULT_TRIG_PROMPTS } from './trig-coach.js';

const canvas = document.getElementById('simCanvas');
const magnitudeSlider = document.getElementById('magnitude');
const angleSlider = document.getElementById('angle');
const magnitudeValue = document.getElementById('magnitudeValue');
const angleValue = document.getElementById('angleValue');
const playBtn = document.getElementById('playBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const stepList = document.getElementById('stepList');
const mathBox = document.getElementById('mathBox');
const showTrig = document.getElementById('showTrig');
const showComponents = document.getElementById('showComponents');
const showAxes = document.getElementById('showAxes');
const showGrid = document.getElementById('showGrid');
const showAngle = document.getElementById('showAngle');
const showSideLabels = document.getElementById('showSideLabels');
const trigPrompt = document.getElementById('trigPrompt');
const trigFeedback = document.getElementById('trigFeedback');
const newPromptBtn = document.getElementById('newPromptBtn');
const revealBtn = document.getElementById('revealBtn');
const choiceButtons = Array.from(document.querySelectorAll('[data-choice]'));

const vectorModule = new VectorBreakdownAnimator(canvas, {
  vector: { magnitude: 10, angleDeg: 35 },
  display: {
    showTrig: true,
    showComponents: true,
    showAxes: true,
    showGrid: true,
    showAngle: true,
    showInstructionBar: true,
    showValueCards: true,
    showSideLabels: true
  }
});

const trigCoach = new TrigCoach(DEFAULT_TRIG_PROMPTS);

window.VectorBreakdownAnimator = VectorBreakdownAnimator;
window.TrigCoach = TrigCoach;
window.vectorModule = vectorModule;
window.trigCoach = trigCoach;

function syncCoachToAnimator() {
  const prompt = trigCoach.getCurrentPrompt();
  vectorModule.setTrigGuide({
    activePair: prompt.pair,
    activeFunction: prompt.answer,
    showHighlight: true,
    showLabels: showSideLabels.checked
  });
}

function renderTrigCoach() {
  const prompt = trigCoach.getCurrentPrompt();
  trigPrompt.innerHTML = `<strong>Prompt:</strong> ${prompt.prompt}`;

  trigFeedback.className = `feedback-box ${trigCoach.state.answerState}`;
  if (trigCoach.state.answerState === 'good') {
    trigFeedback.innerHTML = `<strong>Correct.</strong> ${prompt.rule}`;
  } else if (trigCoach.state.answerState === 'bad') {
    trigFeedback.innerHTML = `<strong>Not this one.</strong> Think about which sides are highlighted relative to θ, then match them to SOH, CAH, or TOA.`;
  } else if (trigCoach.state.revealed) {
    trigFeedback.innerHTML = `<strong>Rule:</strong> ${prompt.rule}`;
  } else {
    trigFeedback.innerHTML = `Use the highlighted sides on the triangle. The yellow labels show which ratio the prompt is asking about.`;
  }

  choiceButtons.forEach(button => {
    button.classList.remove('correct', 'incorrect', 'revealed');
    const choice = button.dataset.choice;
    if (trigCoach.state.selectedChoice === choice && trigCoach.state.answerState === 'good') {
      button.classList.add('correct');
    } else if (trigCoach.state.selectedChoice === choice && trigCoach.state.answerState === 'bad') {
      button.classList.add('incorrect');
    }
    if (trigCoach.state.revealed && choice === prompt.answer) {
      button.classList.add('revealed');
    }
  });
}

function renderUI() {
  const components = vectorModule.getComponents();

  magnitudeValue.textContent = components.magnitude.toFixed(1).replace('.0', '');
  angleValue.textContent = `${components.angleDeg.toFixed(0)}°`;

  magnitudeSlider.value = components.magnitude;
  angleSlider.value = components.angleDeg;
  showTrig.checked = vectorModule.options.display.showTrig;
  showComponents.checked = vectorModule.options.display.showComponents;
  showAxes.checked = vectorModule.options.display.showAxes;
  showGrid.checked = vectorModule.options.display.showGrid;
  showAngle.checked = vectorModule.options.display.showAngle;
  showSideLabels.checked = vectorModule.options.display.showSideLabels;

  stepList.innerHTML = '';
  vectorModule.stages.forEach((stage, index) => {
    const div = document.createElement('div');
    div.className = `step${index === vectorModule.state.stepIndex ? ' active' : ''}`;
    div.textContent = `${index + 1}. ${stage.label}`;
    stepList.appendChild(div);
  });

  if (vectorModule.options.display.showTrig) {
    mathBox.innerHTML = `
      <div><span class="h">sin θ</span> = opp / hyp = <span class="y">Vy</span> / <span class="v">V</span> = ${components.y.toFixed(2)} / ${components.magnitude.toFixed(2)} = <span class="h">${(components.magnitude === 0 ? 0 : components.y / components.magnitude).toFixed(2)}</span></div>
      <div><span class="h">cos θ</span> = adj / hyp = <span class="x">Vx</span> / <span class="v">V</span> = ${components.x.toFixed(2)} / ${components.magnitude.toFixed(2)} = <span class="h">${(components.magnitude === 0 ? 0 : components.x / components.magnitude).toFixed(2)}</span></div>
      <div><span class="h">tan θ</span> = opp / adj = <span class="y">Vy</span> / <span class="x">Vx</span> = ${components.y.toFixed(2)} / ${components.x.toFixed(2)} = <span class="h">${(Math.abs(components.x) < 0.0001 ? 'undefined' : (components.y / components.x).toFixed(2))}</span></div>
      <div style="margin-top:8px;"><span class="x">Vx</span> = <span class="v">V</span> cos(<span class="a">θ</span>) = ${components.magnitude.toFixed(1)} cos(${components.angleDeg.toFixed(0)}°) = <span class="x">${components.x.toFixed(2)}</span></div>
      <div><span class="y">Vy</span> = <span class="v">V</span> sin(<span class="a">θ</span>) = ${components.magnitude.toFixed(1)} sin(${components.angleDeg.toFixed(0)}°) = <span class="y">${components.y.toFixed(2)}</span></div>
    `;
  } else if (vectorModule.options.display.showComponents) {
    mathBox.innerHTML = `
      <div><span class="x">Vx</span> = <span class="x">${components.x.toFixed(2)}</span></div>
      <div><span class="y">Vy</span> = <span class="y">${components.y.toFixed(2)}</span></div>
      <div><span class="v">|V|</span> = ${components.magnitude.toFixed(1)} at ${components.angleDeg.toFixed(0)}°</div>
    `;
  } else {
    mathBox.innerHTML = 'Trig and components are hidden. Turn on one of those options to show the math readout.';
  }

  playBtn.textContent =
    vectorModule.state.playing
      ? 'Playing...'
      : (vectorModule.state.stepIndex >= vectorModule.stages.length - 1 && vectorModule.state.stepProgress >= 1
          ? 'Play Again'
          : 'Play');
}

function applyVectorInputs() {
  vectorModule.setVectorPolar({
    magnitude: Number(magnitudeSlider.value),
    angleDeg: Number(angleSlider.value)
  });
}

function applyDisplayOptions() {
  vectorModule.setOptions({
    display: {
      showTrig: showTrig.checked,
      showComponents: showComponents.checked,
      showAxes: showAxes.checked,
      showGrid: showGrid.checked,
      showAngle: showAngle.checked,
      showSideLabels: showSideLabels.checked
    }
  });
  syncCoachToAnimator();
}

vectorModule.onStateChange = renderUI;
trigCoach.onChange = () => {
  syncCoachToAnimator();
  renderTrigCoach();
};

magnitudeSlider.addEventListener('input', applyVectorInputs);
angleSlider.addEventListener('input', applyVectorInputs);
showTrig.addEventListener('change', applyDisplayOptions);
showComponents.addEventListener('change', applyDisplayOptions);
showAxes.addEventListener('change', applyDisplayOptions);
showGrid.addEventListener('change', applyDisplayOptions);
showAngle.addEventListener('change', applyDisplayOptions);
showSideLabels.addEventListener('change', applyDisplayOptions);

playBtn.addEventListener('click', () => vectorModule.play());
stepBtn.addEventListener('click', () => vectorModule.nextStep());
resetBtn.addEventListener('click', () => vectorModule.reset());
newPromptBtn.addEventListener('click', () => trigCoach.randomize());
revealBtn.addEventListener('click', () => trigCoach.reveal());
choiceButtons.forEach(button => {
  button.addEventListener('click', () => trigCoach.choose(button.dataset.choice));
});

window.addEventListener('resize', () => {
  vectorModule.resize();
  renderUI();
  renderTrigCoach();
});

trigCoach.randomize();
vectorModule.resize();
renderUI();
renderTrigCoach();