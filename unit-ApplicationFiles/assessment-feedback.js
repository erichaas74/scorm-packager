'use strict';
const assert = require('node:assert/strict');
const reviewGuidance = require('./physics-review-guidance');
const getFeedbackPolicy = lesson => reviewGuidance.hasReviewGuidance(lesson) ? reviewGuidance.feedbackPolicy : FEEDBACK_POLICY;
const FEEDBACK_POLICY = 'For questions that lost points, use one short sentence per missed question, at most 25 words excluding its Question N label: name the specific error or missing evidence and one simple correction. Use everyday language; explain a needed physics term briefly. Do not repeat the prompt, rubric, score rules, correct responses, or internal IDs. If any graded question lost points, focus only on missed questions. If every question in the supplied grading scope earned full credit, give one brief topic-specific message using the supplied allCorrectMessage or feedback.whenCorrect; these use varied wording such as "Great work! You showed a solid understanding of [topics covered]." Use the assessment allCorrectMessage only when the whole assessment was graded; for a subset, name only the topics of the questions actually graded, combining at most three topics. If a per-question field is mandatory for a correct answer, use its feedback.whenCorrect. Do not add extra praise, an introduction, or a conclusion. Never invent a mistake or student evidence, or claim ungraded topics were mastered.';

const lessonTopics = {
  U1L2: ['distance and displacement', 'average speed', 'average velocity'],
  U1L3: ['constant acceleration', 'falling-object patterns', 'measurement uncertainty'],
  U1L4: ['reaction time', 'accelerated motion', 'constant-speed motion'],
  U1L5: ['motion graphs', 'air resistance', 'relative motion'],
  U1H: ['rocket motion', 'flight-time calculations', 'landing safety'],
  U2H: ['the Coriolis effect', 'launch direction', 'rotating reference frames'],
  U2L1: ['projectile motion', 'horizontal and vertical motion', 'maximum height'],
  U2L2: ['velocity components', 'launch speed', 'launch angle'],
  U2L3: ['complementary launch angles', 'projectile range', 'model limitations'],
  U2L4: ['velocity components', 'river crossings', 'relative motion'],
  U2L5: ['inertia', 'friction', 'string tension'],
  U3L1: ['net force', 'acceleration', "Newton's laws"],
  U3L2: ['interaction forces', 'impulse', 'contact-time limits'],
  U3L3: ['static and sliding friction', 'normal force', 'friction coefficients'],
  U3L4: ['momentum', 'collision behavior', 'momentum conservation'],
  U3L5: ['force-time graphs', 'impulse', 'jump height']
};
const questionTopics = {
  U1L2: ['distance and displacement', 'average speed', 'travel time', 'waiting time', 'travel time', 'travel time', 'waiting and average speed', 'closed-route displacement', 'average speed and velocity', 'route planning and motion'],
  U1L3: ['falling distance', 'falling distance', 'interval distances', 'odd-number distance patterns', 'square-number distance patterns', 'increasing interval distances', 'constant-acceleration patterns', 'measurement uncertainty', 'evidence of acceleration', 'acceleration models and uncertainty'],
  U1L4: ['falling-distance equations', 'reaction-time calculations', 'falling-distance calculations', 'accelerating travel time', 'accelerating race gaps', 'constant-speed equations', 'constant-speed race gaps', 'false starts', 'visual and auditory reaction times', 'reaction time and race gaps'],
  U1L5: ['velocity-time graphs', 'terminal velocity', 'constant velocity', 'graph slope and acceleration', 'parachute acceleration', 'diving acceleration', 'body position and acceleration', 'relative motion', 'body position and motion evidence', 'formation-diving strategy'],
  U1H: ['powered-flight displacement', 'engine-cutoff velocity', 'coasting displacement', 'coasting time', 'maximum flight height', 'time to maximum height', 'braking displacement', 'braking time', 'parachute timing and landing safety'],
  U2H: ['northbound Coriolis deflection', 'southbound Coriolis deflection', 'eastbound Coriolis deflection', 'westbound Coriolis deflection', 'rotating reference frames', 'reversed launch directions', 'directional Coriolis evidence', 'the Coriolis effect and reference frames'],
  U2L1: ['projectile fall time', 'horizontal range', 'horizontal range', 'horizontal range', 'vertical motion and flight time', 'horizontal velocity', 'independent motion components', 'maximum projectile height', 'vertical launch speed', 'vertical launch speed', 'upward speed and maximum height', 'independent projectile motion'],
  U2L2: ['horizontal velocity measurements', 'horizontal velocity', 'vertical launch velocity', 'total launch speed', 'launch angle', 'speed unit conversions', 'symmetric flight time', 'launch-velocity calculations', 'launch velocity and measurement errors'],
  U2L3: ['complementary angles', 'complementary angles', 'complementary angles', 'equal-range launch angles', 'projectile range at 30 degrees', 'projectile range at 45 degrees', 'projectile range at 60 degrees', 'maximum projectile range', 'complementary-angle evidence', 'ideal and real projectile range'],
  U2L4: ['upstream aiming', 'river-current speed', 'canceling velocity components', 'fastest river crossings', 'crossing time', 'across-river and downstream motion', 'swimmer-baby relative motion', 'relative current velocity', 'rescue speed strategy', 'successful rescue speed', 'crossing strategies and velocity components', 'relative motion and collision risk'],
  U2L5: ['friction during slow pulls', 'inertia during quick pulls', 'friction and inertia', 'slow-pull string tension', 'breaking tension', 'fast-pull string tension', 'breaking tension', 'weight and tension', 'slow and fast pulling forces', 'inertia in both demonstrations'],
  U3L1: ['adding forces', 'force magnitude', 'net-force calculations', 'net-force direction', 'force and changing motion', 'acceleration', "Newton's second law", "Newton's first law", 'balanced and unbalanced forces', "Newton's first and second laws"],
  U3L2: ["Newton's third law", 'force, mass, and acceleration', 'contact-time measurements', 'contact-time measurements', 'contact-time measurements', 'contact-time measurements', 'peak-force measurements', 'peak-force measurements', 'contact-time compliance', 'contact-time compliance', 'force, contact time, and impulse', 'contact-time limits and interaction forces'],
  U3L3: ['static-friction peaks', 'sliding friction', 'friction-coefficient calculations', 'normal force', 'mass and static friction', 'friction coefficients', 'normal force', 'static-friction coefficients', 'material identification', 'static and sliding friction', 'material and mass effects on friction', 'friction evidence and measurement uncertainty'],
  U3L4: [...Array(10).fill('total momentum calculations'), 'momentum conservation in collisions', 'opposite momenta and outside forces'],
  U3L5: ['push duration', 'peak force', 'average force', 'impulse calculations', 'impulse and momentum change', 'takeoff velocity', 'jump height', 'force-time graph area', 'the impulse-to-height calculation', 'force, push time, and jump height']
};
function correctFeedback(topics) {
  const joined = topics.length < 2 ? topics[0] : topics.length === 2 ? topics.join(' and ') : topics.slice(0, -1).join(', ') + ', and ' + topics.at(-1);
  const variants = [
    `Great work! You showed a solid understanding of ${joined}.`,
    `Well done! Your answers show a clear understanding of ${joined}.`,
    `Nice work! You applied ${joined} correctly.`,
    `Good work! You demonstrated a solid grasp of ${joined}.`,
    `Well done! You handled the questions on ${joined} correctly.`
  ];
  const choice = Array.from(joined).reduce((sum, character) => sum + character.charCodeAt(0), 0) % variants.length;
  return variants[choice];
}

// Brief teacher-authored explanations for banks without automatic-answer feedback.
const explanations = {
  U2H: [
    'Earth turns beneath the shell; a northbound shot appears to bend east in this setup.',
    'Earth turns beneath the shell; a southbound shot appears to bend west in this setup.',
    'An eastbound shot appears to bend south in this Northern Hemisphere setup.',
    'A westbound shot appears to bend north in this Northern Hemisphere setup.',
    'The overhead path is straight in this model; the apparent curve comes from watching on a rotating Earth.',
    'Reversing the shot reverses the apparent sideways deflection.'
  ],
  U2L1: [
    'Fall time depends on height: use t = sqrt(2h/g), about 1.56 seconds from 12 meters.',
    'Multiply horizontal speed by fall time: 5 times about 1.56 gives about 7.8 meters.',
    'Multiply horizontal speed by fall time: 10 times about 1.56 gives about 15.6 meters.',
    'Multiply horizontal speed by fall time: 20 times about 1.56 gives about 31.3 meters.',
    'The height and starting vertical speed stay the same, so the fall time stays about the same.',
    'Horizontal speed changes how far the projectile travels sideways during the fall.',
    'Sideways speed does not change fall time; more sideways speed covers more distance in the same time.',
    'Only upward speed sets the rise height: 13 m/s gives about 8.6 meters.',
    'Use upward speed, 15 sin(60 degrees), about 13 m/s; this gives a height of about 8.6 meters.',
    'Use upward speed, 26 sin(30 degrees), or 13 m/s; this gives a height of about 8.6 meters.'
  ],
  U2L2: [
    'Horizontal velocity is horizontal distance divided by total flight time.',
    'Divide 30 meters by 2.50 seconds to get 12 m/s.',
    'The rise lasts half the flight: multiply 9.8 by 1.25 to get 12.25 m/s.',
    'Combine the sideways and upward speeds with sqrt(12 squared + 12.25 squared), about 17.15 m/s.',
    'Use inverse tangent of 12.25 divided by 12 in degree mode, about 45.6 degrees.',
    'Multiply about 17.15 m/s by 2.23694 to get about 38.4 mph.',
    'Returning to the launch height makes the rise and fall times equal in this model.'
  ],
  U2L3: [
    'Subtract your first angle from 90 degrees to find the other angle with the same range.',
    'Subtract your first angle from 90 degrees to find the other angle with the same range.',
    'Subtract your first angle from 90 degrees to find the other angle with the same range.',
    'The two angles add to 90 degrees when speed and launch and landing heights match.',
    'Read the range at 30 degrees: about 28.6 meters; it matches the 60-degree launch.',
    'Read the range at 45 degrees: about 33 meters, the greatest range in this setup.',
    'Read the range at 60 degrees: about 28.6 meters; it matches the 30-degree launch.',
    'Angles of 30 and 60 degrees give equal ranges; 45 degrees gives the greatest range in this model.'
  ],
  U2L4: [
    'Aim upstream enough to cancel the downstream current and land straight across.',
    'Read the fixed river-current setting: 3.0 m/s downstream.',
    'Equal upstream and downstream speeds cancel, leaving only motion across the river.',
    'Aim straight across to use all your swimming speed toward the far bank.',
    'Divide the 50-meter width by 5 m/s to get 10 seconds.',
    'Current moves you downstream; only your across-river speed determines crossing time.',
    'The same current carries both swimmer and baby, so aim at the baby to close their separation.',
    'Subtract their equal current speeds: 3 minus 3 is 0 m/s relative to each other.',
    'Choose enough speed to reach the baby while keeping the path clear of both obstacles.',
    'Record a successful rescue speed between 3.5 and 4.1 m/s; check that the path avoids both obstacles.'
  ],
  U2L5: [
    'During a slow pull, friction has time to move the penny along with the card.',
    'A quick pull removes the card before the penny moves much sideways, so gravity drops it into the cup.',
    'Friction moves the penny during a slow pull; a quick pull leaves it nearly at rest until it falls.',
    'The top string carries both the weight and the slow pulling force, so it breaks first.',
    'Read the top-string tension at the slow-pull break: about 24.8 N.',
    'A quick pull strains the bottom string before the hanging mass moves much.',
    'Read the bottom-string tension at the fast-pull break: about 45 N.',
    'The top string supports the weight as well as the force transmitted by the pull.'
  ],
  U3L1: [
    'Add the two leftward forces: 50 plus 50 is 100 N.',
    'The single rightward puller supplies 150 N.',
    'Opposite forces subtract: 150 minus 100 is a net force of 50 N.',
    'The stronger pull is rightward, so the net-force arrow points right.',
    'A rightward net force makes the cart speed up toward the right.',
    'Acceleration means a change in velocity, including speed or direction.',
    'A continuing net force keeps changing velocity, so the refrigerator speeds up.',
    'With zero net force, the refrigerator keeps its current velocity in this setup.'
  ],
  U3L2: [
    'The club and ball push equally in opposite directions throughout the same collision.',
    'The forces are equal; the smaller mass has more acceleration because acceleration is force divided by mass.',
    'Read the full contact duration of the Soft Polymer trace: about 343 microseconds.',
    'Read the full contact duration of the Alloy trace: about 274 microseconds.',
    'Read the full contact duration of the Thin Titanium trace: about 239 microseconds.',
    'Read the full contact duration of the Thick Titanium trace: about 196 microseconds.',
    'Read the highest point of the Soft Polymer force trace: about 7.4 kN.',
    'Read the highest point of the Thick Titanium force trace: about 12.9 kN.',
    'Read the Rigid Steel contact duration: about 147 microseconds, below the 257-microsecond limit.',
    'Read the Prototype X-7 contact duration: about 266 microseconds, above the 257-microsecond limit.'
  ],
  U3L3: [
    'Read the highest force just before Wood starts sliding: about 20.6 N.',
    'Read the steady force while Rubber slides, not its starting peak: about 32.4 N.',
    'Divide the maximum static-friction force by the normal force; Sandpaper gives about 0.95.',
    'Include the block and added mass: 10 kg times 9.81 gives 98.1 N.',
    'Read the static peak for Wood with 10 kg added: about 61.8 N.',
    'Divide static peak by normal force in each Wood row; the ratio stays about 0.42.',
    'Normal force equals weight here: 5.0 times 9.81 gives about 49.1 N.',
    'Divide 27.0 N by 49.1 N to get about 0.55.',
    'Divide each friction force by normal force; Unknown A gives about 0.55 static and 0.35 sliding.',
    'Starting motion requires the larger static peak; continued sliding requires the lower kinetic force.'
  ],
  U3L4: Array.from({length: 10}, (_, i) => `Add both objects\' mass-times-velocity values, keeping direction signs; Trial ${Math.floor(i / 2) + 1} totals ${[3, 0, 7.5, 4.25, 1.5][Math.floor(i / 2)]} kg*m/s.`),
  U3L5: [
    'Read the time from the start to the end of the force triangle: 0.40 seconds.',
    'Read the highest point of the graph: 1500 N.',
    'For a triangular pulse, average force is half the peak: 750 N.',
    'Triangle area is half times 0.40 seconds times 1500 N, giving 300 N*s of impulse.',
    'Impulse equals change in momentum, so 300 N*s gives a 300 kg*m/s change.',
    'Divide impulse by mass: 300 divided by 75 gives a takeoff speed of 4 m/s.',
    'Use takeoff speed in h = v squared divided by 2g; 4 m/s gives about 0.82 meters.',
    'Impulse is the signed area under the net force-time graph.'
  ]
};

const writtenFeedbackExamples = {
  "U1L2-Q09": "Use your route distance for average speed and displacement for average velocity; divide each by total time.",
  "U1L2-Q10": "Backtracking adds distance, while waiting adds time without adding distance; explain how each changes the average rate.",
  "U1L3-Q09": "Compare distances covered in equal time intervals; increasing distances show that the object is speeding up.",
  "U1L3-Q10": "Explain how increasing interval distances fit steady acceleration, then name a measurement error and its likely effect.",
  "U1L4-Q09": "Include both measured reaction times and their difference to show which signal produced the faster response.",
  "U1L4-Q10": "Explain why the accelerating cars separate more, while equal-speed runners keep the same gap after both start.",
  "U1L5-Q09": "Describe a before-and-after graph change or readout showing how body position changed your speed or gap.",
  "U1L5-Q10": "A partner can appear to rise when you fall faster; use your graphs to explain the changing gap.",
  "U1H-Q09": "Complete Section 5 and check its time, percentage, and landing-safety answers so the application records valid completion evidence.",
  "U2H-Q07": "List all four miss directions and show how reversing the shot reverses the sideways deflection.",
  "U2H-Q08": "Use a missed shot and corrected hit to explain how Earth turning makes the path appear curved.",
  "U2L1-Q11": "Include all three heights and explain that similar upward starting speeds give similar maximum heights.",
  "U2L1-Q12": "Use your measurements to explain that sideways speed changes range while vertical motion determines flight time and height.",
  "U2L2-Q08": "Show how your measured distance and flight time give the sideways speed, upward speed, total speed, and angle.",
  "U2L2-Q09": "For each measurement error, specify too high or too low and trace its effect on the velocity components.",
  "U2L3-Q09": "Cite three measured values and explain why launch angles adding to 90 degrees can have equal ranges.",
  "U2L3-Q10": "Compare all three ranges, then explain how real flight conditions can change the best launch angle.",
  "U2L4-Q11": "Use both crossings to explain how aiming upstream cancels drift, while aiming straight across gives the fastest crossing.",
  "U2L4-Q12": "The current carries swimmer and baby together, but both still drift toward fixed obstacles; connect this to your rescue results.",
  "U2L5-Q09": "Give both breaking tensions and explain why a slow pull breaks the top string but a quick pull breaks the bottom.",
  "U2L5-Q10": "Use both demonstrations to explain that an object resists changing motion and needs time for a force to change its velocity.",
  "U3L1-Q09": "State both force totals and observed motion; equal opposing forces give zero net force, while unequal forces change velocity.",
  "U3L1-Q10": "Use both trials to explain that net force changes velocity, while zero net force keeps velocity steady.",
  "U3L2-Q11": "Use three chart values to show that shorter contact times have larger forces while the force-time areas stay about equal.",
  "U3L2-Q12": "Compare both contact times with 257 microseconds and explain that club and ball push equally in opposite directions.",
  "U3L3-Q11": "Use chart values to separate material effects from mass effects; more weight increases friction without changing the same material pair's coefficient.",
  "U3L3-Q12": "Use the friction ratios to identify Unknown A, then explain one measurement uncertainty and a practical improvement.",
  "U3L4-Q11": "Compare total momentum before and after at least two collisions; changing bounce changes motion but not total momentum in this model.",
  "U3L4-Q12": "Equal opposite momenta can cancel even when both balls move; later outside forces can slow the objects.",
  "U3L5-Q09": "Show the steps from graph area to momentum change, then speed and height, using the required values.",
  "U3L5-Q10": "Compare both graph areas; force and push duration together determine the momentum change and resulting jump height."
};

function prepareFeedbackMetadata(metadata, blocks) {
  metadata.assessmentSettings.feedbackPolicy = {
    instructions: getFeedbackPolicy(metadata.lesson.lesson),
    scope: 'missed_questions_only',
    allCorrectMessage: correctFeedback(lessonTopics[metadata.lesson.lesson]),
    topicsCovered: lessonTopics[metadata.lesson.lesson],
    maxSentencesPerMissedQuestion: 1,
    maxWordsPerMissedQuestion: 25,
    language: 'plain everyday language',
    examples: ['Question 5: Convert centimeters to meters before calculating.', 'Question 9: Include both measured times so you can compare them.']
  };
  if (reviewGuidance.hasReviewGuidance(metadata.lesson.lesson)) {
    metadata.assessmentSettings.feedbackPolicy.scope = 'evidence_based_opening_missed_items_specific_closing';
    metadata.assessmentSettings.gradingCalibration = reviewGuidance.calibration;
  }
  for (const [index, block] of blocks.entries()) {
    const number = Number((block.match(/^(\d+)\)/m) || [])[1]);
    assert.equal(number, index + 1, 'Question bank numbering must be sequential');
    const prop = name => (block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm')) || [, ''])[1].trim();
    const prompt = (block.match(/^\d+\)\s*([\s\S]*?)(?=\n@\[|\n\*?[a-z]\.|$)/m) || [])[1]?.trim();
    let question = metadata.questions.find(q => q.buzzIndex === number);
    if (!question) {
      question = { id: `${metadata.lesson.lesson}-Q${String(number).padStart(2, '0')}`, buzzIndex: number,
        buzzType: prop('Type'), points: Number(prop('Score')), grading: prop('Meta-grading') || 'auto',
        objective: prop('Meta-skill') || null, evidence: prop('Meta-evidence') || null, prompt, rubricText: null };
      metadata.questions.push(question);
    }
    const topic = questionTopics[metadata.lesson.lesson]?.[index];
    // Numeric prompts must stay synchronized too, not just newly created metadata.
    question.prompt = prompt;
    assert(topic, `${question.id}: missing correct-feedback topic`);
    question.topicsCovered = [topic];
    if (question.grading !== 'auto') {
      assert(writtenFeedbackExamples[question.id], `${question.id}: needs a brief written-response example`);
      question.feedback = {
        whenCorrect: correctFeedback(question.topicsCovered),
        missedAnswerExample: writtenFeedbackExamples[question.id],
        usage: 'Example only: use it only if this is the actual omission or error. Otherwise name the actual rubric-based issue in one short sentence; never list every requirement.'
      };
      continue;
    }
    const authored = (block.match(/^@\[When answer is incorrect\]\s*(.+)$/m) || [])[1];
    const explanation = explanations[metadata.lesson.lesson]?.[index] || authored;
    assert(explanation, `${question.id}: needs a brief automatic-answer explanation`);
    question.feedback = {
      whenCorrect: correctFeedback(question.topicsCovered),
      whenIncorrect: explanation,
      source: authored && !explanations[metadata.lesson.lesson]?.[index] ? 'question-bank' : 'teacher-authored explanation based on question-bank answer',
      usage: 'Use only when points were lost; adapt to the actual error and keep the response within the feedback policy.'
    };
    question.answerReference = block.split('\n').filter(line => /^\*?[a-z]\.\s/.test(line)).join('\n');
  }
  metadata.questions.sort((a, b) => a.buzzIndex - b.buzzIndex);
}
module.exports = { FEEDBACK_POLICY, getFeedbackPolicy, prepareFeedbackMetadata, correctFeedback };
