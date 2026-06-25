(function () {
  'use strict';

  var globalScope = typeof window !== 'undefined' ? window : globalThis;

  globalScope.LessonCatalog = {
    grades: {
      '4': {
        label: '4th Grade',
        subjects: {
          math: [
            { title: 'Explorer Route Math Quest', summary: 'Students plan a safe expedition using place value, multi-step operations, and remainders.', status: 'planned' },
            { title: 'Energy Arcade Data Lab', summary: 'Students collect measurements, compare runs, and revise a marble challenge using data.', status: 'planned' },
            { title: 'Fraction Trade Expedition', summary: 'Students compare cargo loads and use equivalent fractions to make balanced trades.', status: 'planned' },
            { title: 'Hazard City Geometry Command', summary: 'Students redesign a city map with angle, area, perimeter, and shape reasoning.', status: 'planned' }
          ],
          science: [
            { title: 'Weather Watch Rescue Lab', summary: 'Students interpret cloud, temperature, and wind data to prepare a rescue forecast.', status: 'planned' },
            { title: 'Forces and Motion Fairground', summary: 'Students test pushes, pulls, and ramp designs to improve a fairground ride.', status: 'planned' },
            { title: 'Ecosystem Balance Build', summary: 'Students model producers, consumers, and environmental changes in a living system.', status: 'planned' },
            { title: 'Light and Sound Signal Studio', summary: 'Students design communication tools using reflections, vibrations, and coded signals.', status: 'planned' }
          ],
          ela: [
            { title: 'Character Courtroom', summary: 'Students defend a character decision using text evidence and formal speaking.', status: 'planned' },
            { title: 'Myth Makers Workshop', summary: 'Students write original myths that explain natural events with rich narration.', status: 'planned' },
            { title: 'Poetry in Motion', summary: 'Students analyze poetic devices and publish a performance anthology.', status: 'planned' },
            { title: 'Research Reporter Desk', summary: 'Students investigate a topic, organize notes, and publish a short feature article.', status: 'planned' }
          ],
          socialStudies: [
            { title: 'Regions Road Trip', summary: 'Students compare U.S. regions and build a travel case with maps and climate evidence.', status: 'planned' },
            { title: 'Community Change Makers', summary: 'Students study local government roles and pitch a plan to improve a community issue.', status: 'planned' },
            { title: 'Early America Trade Day', summary: 'Students simulate colonial trade networks and compare goods, routes, and choices.', status: 'planned' },
            { title: 'Landmark Newsroom', summary: 'Students report on key historical landmarks and explain why each mattered.', status: 'planned' }
          ]
        }
      },
      '5': {
        label: '5th Grade',
        subjects: {
          math: [
            { title: 'Fraction Lock Escape', summary: 'Students solve fraction challenges to unlock the next stage of the mission.', status: 'live' },
            { title: 'Frontier Trading Company', summary: 'Student teams run a frontier trading company and maximize profit through math decisions.', status: 'live' },
            { title: 'Decimal Market Planner', summary: 'Students compare price lists, discounts, and inventory choices in a market planning challenge.', status: 'planned' },
            { title: 'Coordinate Rescue Grid', summary: 'Students plot mission checkpoints and analyze patterns to guide a rescue route.', status: 'planned' }
          ],
          science: [
            { title: 'Material Properties Lab', summary: 'A six-station lab where students test materials and use evidence to solve a design challenge.', status: 'live' },
            { title: 'Chemical Properties Lab', summary: 'Students investigate flammability, oxidation, toxicity, reactivity, and pH across five stations.', status: 'live' },
            { title: 'Globe Sun Shadow Lab', summary: 'Students model shadows, Sun paths, and seasonal changes using a global viewpoint.', status: 'live' },
            { title: 'Robot Rumble: Materials Mayhem', summary: 'Students select robot parts based on material properties and revise after surprise attacks.', status: 'live' }
          ],
          ela: [
            { title: 'Mission Briefing Close Read', summary: 'Students analyze the mission brief for key details, constraints, and clues.', status: 'live' },
            { title: 'Spy Portfolio Writing Lab', summary: 'Students build a portfolio of mission evidence and reflect on strategic choices.', status: 'live' },
            { title: 'Evidence Report Builder', summary: 'Students organize notes and write a clear report backed by mission evidence.', status: 'live' },
            { title: 'Invisible Ink Revision Studio', summary: 'Students revise and reveal hidden messages while refining clarity and purpose.', status: 'live' }
          ],
          socialStudies: [
            { title: 'Operation Liberty Quill', summary: 'A Revolutionary War mission that blends geography, strategy, and historical reasoning.', status: 'live' },
            { title: 'Route Map Strategy Desk', summary: 'Students plan safe travel routes and compare terrain, distance, and risk.', status: 'live' },
            { title: 'Battle Command Council', summary: 'Students weigh battlefield choices and defend a leadership plan under pressure.', status: 'live' },
            { title: 'Town Eco Challenge', summary: 'Students act as civic teams and respond to shared community decisions across multiple rounds.', status: 'live' }
          ]
        }
      },
      '6': {
        label: '6th Grade',
        subjects: {
          math: [
            { title: 'Ratio Kitchen Lab', summary: 'Students scale recipes and compare equivalent ratios to feed a larger audience.', status: 'planned' },
            { title: 'Integer Mountain Rescue', summary: 'Students use integers to track elevation, gain, and loss during a rescue mission.', status: 'planned' },
            { title: 'Percent Pop-Up Shop', summary: 'Students run a small shop and analyze markup, discount, and tax decisions.', status: 'planned' },
            { title: 'Geometry Design Sprint', summary: 'Students design a pop-up space using area, surface area, and angle constraints.', status: 'planned' }
          ],
          science: [
            { title: 'Cell City Systems', summary: 'Students model organelles as a working city and explain the role of each system.', status: 'planned' },
            { title: 'Thermal Energy Challenge', summary: 'Students test materials and transfer methods to build better temperature control.', status: 'planned' },
            { title: 'Moon Phase Observatory', summary: 'Students observe patterns and explain Moon phases through an astronomy journal.', status: 'planned' },
            { title: 'Water Cycle Response Team', summary: 'Students track water through systems and prepare a drought response plan.', status: 'planned' }
          ],
          ela: [
            { title: 'Novel Theme Studio', summary: 'Students trace theme development across a novel and present an evidence board.', status: 'planned' },
            { title: 'Argument Podcast Room', summary: 'Students script and record a claim-driven podcast with evidence and rebuttal.', status: 'planned' },
            { title: 'Narrative Shift Lab', summary: 'Students retell a scene from multiple viewpoints and study voice choices.', status: 'planned' },
            { title: 'Research Citation Desk', summary: 'Students gather sources, annotate evidence, and build a citation-ready report.', status: 'planned' }
          ],
          socialStudies: [
            { title: 'Ancient Civilizations Museum', summary: 'Students curate artifacts and explain how ancient societies solved daily problems.', status: 'planned' },
            { title: 'Geography and Trade Routes', summary: 'Students analyze landforms and trade networks to explain movement and exchange.', status: 'planned' },
            { title: 'World Religions Dialogue', summary: 'Students compare belief systems and present a respectful synthesis of key ideas.', status: 'planned' },
            { title: 'Government Simulation Council', summary: 'Students role-play a council and debate solutions to a civic challenge.', status: 'planned' }
          ]
        }
      },
      '7': {
        label: '7th Grade',
        subjects: {
          math: [
            { title: 'Proportional Design Agency', summary: 'Students use proportional relationships to build scalable design plans for clients.', status: 'planned' },
            { title: 'Probability Game Studio', summary: 'Students invent games, compute theoretical odds, and revise for fairness.', status: 'planned' },
            { title: 'Expressions Escape Lab', summary: 'Students simplify expressions and solve equations to unlock a sequence of clues.', status: 'planned' },
            { title: 'Surface Area Build Challenge', summary: 'Students optimize packaging designs using area, volume, and constraints.', status: 'planned' }
          ],
          science: [
            { title: 'Ecosystem Field Station', summary: 'Students monitor ecosystem change and propose interventions backed by evidence.', status: 'planned' },
            { title: 'Chemical Reactions Lab', summary: 'Students test reaction clues and explain how new substances form.', status: 'planned' },
            { title: 'Solar System Mission Control', summary: 'Students compare planetary systems and plan a viable exploration route.', status: 'planned' },
            { title: 'Body Systems Diagnostics', summary: 'Students trace interactions among body systems through patient-style cases.', status: 'planned' }
          ],
          ela: [
            { title: 'Claims and Counterclaims Forum', summary: 'Students build formal arguments with claims, counterclaims, and rebuttals.', status: 'planned' },
            { title: "Historical Fiction Writer's Room", summary: 'Students combine research and narrative craft to write historically grounded scenes.', status: 'planned' },
            { title: 'Poetry Performance Lab', summary: 'Students analyze sound, structure, and meaning, then stage a live reading.', status: 'planned' },
            { title: 'Media Literacy Investigation', summary: 'Students evaluate sources and credibility across modern media examples.', status: 'planned' }
          ],
          socialStudies: [
            { title: 'Medieval World Networks', summary: 'Students connect trade, religion, and power across medieval societies.', status: 'planned' },
            { title: 'Early American Debate Hall', summary: 'Students analyze competing colonial viewpoints and defend a policy decision.', status: 'planned' },
            { title: 'Civic Action Campaign', summary: 'Students identify a local issue and build a campaign with evidence and outreach.', status: 'planned' },
            { title: 'Global Cultures Exchange', summary: 'Students compare cultures, traditions, and migration stories across regions.', status: 'planned' }
          ]
        }
      },
      '8': {
        label: '8th Grade',
        subjects: {
          math: [
            { title: 'Linear City Planner', summary: 'Students model city costs with linear relationships and defend a final plan.', status: 'planned' },
            { title: 'Transformations Art Lab', summary: 'Students apply transformations to produce a gallery-ready geometric design.', status: 'planned' },
            { title: 'Systems of Equations Cup Cafe', summary: 'Students compare pricing combinations and solve systems to manage a school cafe.', status: 'planned' },
            { title: 'Statistics Sports Desk', summary: 'Students analyze player data and publish a sports analytics feature.', status: 'planned' }
          ],
          science: [
            { title: 'Genetics Investigation Unit', summary: 'Students track inherited traits and explain probability patterns in genetics.', status: 'planned' },
            { title: 'Force and Motion Engineering', summary: 'Students test motion variables and redesign a vehicle for performance.', status: 'planned' },
            { title: 'Climate Systems Watch', summary: 'Students interpret climate data and propose evidence-based local responses.', status: 'planned' },
            { title: 'Waves and Communication Lab', summary: 'Students model wave behavior and design a reliable communication system.', status: 'planned' }
          ],
          ela: [
            { title: 'Rhetoric and Speech Studio', summary: 'Students analyze persuasive techniques and deliver a polished speech.', status: 'planned' },
            { title: 'Literary Lens Seminar', summary: 'Students interpret a text through multiple critical lenses and defend a reading.', status: 'planned' },
            { title: 'Investigative Journalism Desk', summary: 'Students research a public issue and publish a structured investigative article.', status: 'planned' },
            { title: 'Memoir Revision Room', summary: 'Students revise memoir scenes for voice, focus, and reflective depth.', status: 'planned' }
          ],
          socialStudies: [
            { title: 'Constitution Convention Lab', summary: 'Students debate constitutional principles and negotiate competing interests.', status: 'planned' },
            { title: 'Industrialization Design Review', summary: 'Students examine industrial growth and weigh gains against social costs.', status: 'planned' },
            { title: 'Civil Rights Archive', summary: 'Students curate primary sources and explain turning points in the civil rights movement.', status: 'planned' },
            { title: 'Global Issues Policy Room', summary: 'Students research a modern world issue and draft a policy proposal.', status: 'planned' }
          ]
        }
      }
    }
  };
})();