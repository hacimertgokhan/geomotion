// Readable JSON for specs: objects are expanded, short arrays/points stay on one line.
export function formatSpec(value, indent = '') {
  const next = indent + '  ';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const flat = value.every((v) => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every((x) => typeof x !== 'object')));
    if (flat) {
      const one = `[${value.map((v) => JSON.stringify(v).replace(/,/g, ', ')).join(', ')}]`;
      if (one.length + indent.length <= 100) return one;
    }
    return `[\n${value.map((v) => next + formatSpec(v, next)).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const one = `{ ${keys.map((k) => `${JSON.stringify(k)}: ${JSON.stringify(value[k])}`).join(', ')} }`;
    const simple = keys.every((k) => typeof value[k] !== 'object' || value[k] === null || (Array.isArray(value[k]) && value[k].every((x) => typeof x !== 'object')));
    if (simple && one.length + indent.length <= 110) return one.replace(/,(?=\S)/g, ', ');
    return `{\n${keys.map((k) => `${next}${JSON.stringify(k)}: ${formatSpec(value[k], next)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}
