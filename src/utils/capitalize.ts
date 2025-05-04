function capitalize(word: string | null): string | null {
  if (word == null) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default capitalize;
