# Application scoring and directions

Every existing application in Units 1–6 is worth **15 points**. Use each lesson's current `*_buzz_setup.txt` for its specific question count, scoring split, and delivery instructions. Combined `unit-*-application-directions.txt` files are generated from those guides.

BusyBee may award only multiples of **0.5 points**, from zero through the question maximum. For a 3-point response the allowed scores are **0, 0.5, 1, 1.5, 2, 2.5, 3**. Scores such as **2.85/3 are prohibited**. Select the score supported by the rubric; do not average or scale criteria into hundredths. Existing binary completion items still allow only zero or full credit.

This rule appears in all 64 BusyBee question feedback blocks, the rubric metadata, and the lesson setup directions. JSON metadata includes `scoreIncrement`, `allowedScores`, and `scoringInstructions`. These instructions must be imported into Buzz/BusyBee; changing local files does not update an already-published assessment.

Thin Lens retains all 21 questions: Questions 1–20 are worth **0.5 points each**, and Question 21 is a **5-point conclusion**, totaling 15. Unit 5 totals 105 points across seven applications.

Unit 1 Lesson 1 remains a 15-point completion assignment with no BusyBee questions. Its guide identifies the scored SCORM package. Other applications retain their lesson-specific automatic/BusyBee split, always totaling 15.

After editing a bank or guide, run:

```powershell
node unit-ApplicationFiles/application-scoring-policy.js
node unit-buzz-template-conversion-files/build-buzz-template-previews.js
node unit-ApplicationFiles/validate-application-scoring.js
```

The Unit 1–3 preview build and the Unit 5–6 assessment builders also apply the policy automatically. Unit 4's setup synchronizer uses the same policy. The compatibility directions builder copies current guide text instead of restoring old submission instructions.

Before publishing, import the updated question bank, load the matching rubric metadata if needed, confirm 15 possible points, and test answer saving and grade return in Buzz. For Thin Lens, specifically confirm that Buzz retained the twenty 0.5-point question weights.
