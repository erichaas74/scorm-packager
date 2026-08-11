# Unit 2 application audit and cleanup

Unit 2 now contains six lesson-specific application folders and no loose application ZIPs.
Application ZIP/SCORM packaging is removed because ZIP delivery is reserved for problem
walkthroughs.

Each Buzz assessment is worth 15 points: 10 auto-graded points followed by two BusyBee
evidence responses worth 2 and 3 points. Required uploads were removed. The copy/paste,
cut, keyboard clipboard-shortcut, and context-menu integrity guard is intentionally retained
in all six templates at the course author's direction.

The Unit 2 builder generates six `_buzz_setup.txt` guides. Each begins with an engaging
student mission, learning goals, and completion steps before the teacher Buzz setup. Legacy
HTML setup files are removed by the builder.

| Lesson | Questions | Assessment correction |
| --- | ---: | --- |
| U2L1 | 12 | Preserved the intentional PhET dependency; rebalanced to 10 auto + 5 BusyBee. |
| U2L2 | 9 | Replaced the 17-point all-essay bank with fixed auto-graded reference calculations and student-evidence rubrics. |
| U2L3 | 10 | Rebalanced complementary-angle and maximum-range evidence to 15 points. |
| U2L4 | 12 | Preserved the self-contained four-level password fix and consolidated evidence grading. |
| U2L5 | 10 | Rebalanced inertia/tension observations and numeric evidence to 15 points. |
| U2H | 9 | Removed the required upload and obsolete hosted-globe template; retained the self-contained assessment. |

Removed artifacts include six Rise direction files, two application ZIPs, two SCORM manifests,
two SCORM wrappers, five legacy setup HTML files, the duplicate Lesson 2 `index.html`, and the
two-file Honors hosted-template alternative.

Build and validate:

```text
node unit-ApplicationFiles/unit-2/build-unit2-buzz-assessments.js
node unit-ApplicationFiles/unit-2/validate-unit2-buzz-assessments.js
```
