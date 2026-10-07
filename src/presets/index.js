// Built-in, categorized example animations. Each preset is a plain spec —
// copy one into the studio (or pass `preset: "name"` to the MCP tool) to start.
import ui from './interface.js';
import nature from './nature.js';
import communication from './communication.js';
import ideas from './ideas.js';
import characters from './characters.js';
import abstract from './abstract.js';
import motion from './motion.js';

export const CATEGORIES = [
  { id: 'interface', title: 'Interface', description: 'Loaders, confirmations, toggles and notifications.', presets: ui },
  { id: 'nature', title: 'Nature', description: 'Skies, weather, plants and the sea.', presets: nature },
  { id: 'communication', title: 'Communication', description: 'Messages, sending, likes and connections.', presets: communication },
  { id: 'ideas', title: 'Ideas & Business', description: 'Light-bulb moments, growth, goals and processes.', presets: ideas },
  { id: 'characters', title: 'Characters', description: 'Faces, creatures and little celebrations.', presets: characters },
  { id: 'abstract', title: 'Abstract', description: 'Pure shape compositions and geometry.', presets: abstract },
  { id: 'motion', title: 'Motion', description: 'Squash, stretch, swing — animation principles.', presets: motion },
];

/** Flat map: name → { title, description, tags, category, spec } */
export const PRESETS = Object.fromEntries(
  CATEGORIES.flatMap((c) => Object.entries(c.presets).map(([name, p]) => [name, { ...p, category: c.id }]))
);

export const PRESET_NAMES = Object.keys(PRESETS);
