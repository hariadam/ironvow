// Daily quests: the player's real habits. Quest ids are stored in saves: never rename or delete one.
//
// kind 'amount': the player enters a number until it reaches the goal.
//   unit: 'steps', 'min' or 'ml' (how to show the number, see ui/format.js).
//   chips: the quick "+" buttons. goal: default target, smallest allowed target, input step, and its label on the Hero tab.
//   total: label for the lifetime total on the Hero tab.
// kind 'check': one button. doLabel / undoLabel name the two states.
// text: the quest description; {goal} is replaced by the player's target.
// stat: the stat trained by completing it. icon: a sprite name in ui/art/icons.js.

export const QUESTS = [
  {
    id: 'steps', name: 'The Long Road', text: 'Walk {goal} today.', kind: 'amount', unit: 'steps', chips: [1000, 2500],
    goal: { default: 10000, min: 1000, step: 500, label: 'Steps per day' }, total: 'Steps walked',
    stat: 'agi', xp: 60, copper: 3500, icon: 'boot',
  },
  {
    id: 'exercise', name: 'Trial of Strength', text: 'Train hard for {goal}.', kind: 'amount', unit: 'min', chips: [5, 10, 15],
    goal: { default: 30, min: 5, step: 5, label: 'Training minutes' }, total: 'Minutes trained',
    stat: 'str', xp: 70, copper: 4000, icon: 'dumbbell',
  },
  {
    id: 'meditate', name: 'Stillness of Mind', text: 'Meditate for {goal}.', kind: 'amount', unit: 'min', chips: [5, 10],
    goal: { default: 10, min: 1, step: 1, label: 'Meditation minutes' }, total: 'Minutes meditated',
    stat: 'int', xp: 50, copper: 3000, icon: 'lotus',
  },
  {
    id: 'water', name: 'Waters of the Spring', text: 'Drink {goal} of water.', kind: 'amount', unit: 'ml', chips: [250, 500],
    goal: { default: 2000, min: 250, step: 250, label: 'Water (ml)' }, total: 'Water drunk',
    stat: 'spi', xp: 40, copper: 2500, icon: 'droplet',
  },
  {
    id: 'vitamins', name: "The Alchemist's Tonic", text: 'Take your daily vitamins.', kind: 'check',
    doLabel: 'Taken today', undoLabel: 'Not taken',
    stat: 'sta', xp: 30, copper: 2000, icon: 'flask',
  },
  {
    id: 'nojunk', name: 'Vow of the Clean Hearth', text: 'Eat no junk food or sweets today. Claim it once the day is done and the vow held.', kind: 'check',
    doLabel: 'Vow kept today', undoLabel: 'I broke the vow',
    stat: 'sta', xp: 60, copper: 3000, icon: 'apple',
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(quest => [quest.id, quest]));

export const AMOUNT_QUESTS = QUESTS.filter(quest => quest.kind === 'amount');
