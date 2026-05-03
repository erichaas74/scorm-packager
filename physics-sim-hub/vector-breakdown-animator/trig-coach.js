export const DEFAULT_TRIG_PROMPTS = [
  {
    pair: ['opp', 'hyp'],
    answer: 'sin',
    prompt: 'The highlighted sides are opposite and hypotenuse. Which trig function matches that ratio?',
    rule: 'SOH means sin θ = opp / hyp.'
  },
  {
    pair: ['adj', 'hyp'],
    answer: 'cos',
    prompt: 'The highlighted sides are adjacent and hypotenuse. Which trig function matches that ratio?',
    rule: 'CAH means cos θ = adj / hyp.'
  },
  {
    pair: ['opp', 'adj'],
    answer: 'tan',
    prompt: 'The highlighted sides are opposite and adjacent. Which trig function matches that ratio?',
    rule: 'TOA means tan θ = opp / adj.'
  }
];

export class TrigCoach {
  constructor(prompts = DEFAULT_TRIG_PROMPTS) {
    this.prompts = prompts;
    this.state = {
      promptIndex: 0,
      answerState: 'neutral',
      revealed: false,
      selectedChoice: null
    };
    this.onChange = null;
  }

  getCurrentPrompt() {
    return this.prompts[this.state.promptIndex];
  }

  setPrompt(index) {
    this.state.promptIndex = Math.max(0, Math.min(index, this.prompts.length - 1));
    this.resetAnswerState();
    this._emit();
  }

  randomize() {
    let nextIndex = Math.floor(Math.random() * this.prompts.length);
    if (this.prompts.length > 1 && nextIndex === this.state.promptIndex) {
      nextIndex = (nextIndex + 1) % this.prompts.length;
    }
    this.setPrompt(nextIndex);
  }

  choose(choice) {
    this.state.selectedChoice = choice;
    this.state.revealed = false;
    this.state.answerState = choice === this.getCurrentPrompt().answer ? 'good' : 'bad';
    this._emit();
  }

  reveal() {
    this.state.answerState = 'neutral';
    this.state.revealed = true;
    this.state.selectedChoice = null;
    this._emit();
  }

  resetAnswerState() {
    this.state.answerState = 'neutral';
    this.state.revealed = false;
    this.state.selectedChoice = null;
  }

  _emit() {
    if (typeof this.onChange === 'function') this.onChange(this);
  }
}